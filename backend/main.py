import asyncio
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import database
import models
import schemas
from services.analyzer import SEOAnalyzer
from services.keys_so import KeysSoClient

load_dotenv()

app = FastAPI(title="SEO Keys.so Analyzer")
models.Base.metadata.create_all(bind=database.engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

KEYSO_TOKEN = os.getenv("KEYSO_TOKEN", "")
keys_client = KeysSoClient(api_key=KEYSO_TOKEN)

BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"

METRIC_COLUMNS = {"word", "[!Wordstat]", "competitors_top10_count", "opportunity_score"}


def _normalize_domain(value: str) -> str:
    domain = (value or "").strip().lower()
    if not domain:
        return ""
    if "://" in domain:
        domain = domain.split("://", 1)[1]
    domain = domain.split("/", 1)[0]
    domain = domain.split(":", 1)[0]
    if domain.startswith("www."):
        domain = domain[4:]
    return domain


def _build_response_from_history_entry(entry: models.AnalysisHistory) -> dict:
    payload = entry.data

    if isinstance(payload, dict):
        table_data = payload.get("table_data", [])
        table_pool_data = payload.get("table_pool_data", table_data)
        diagnostics = payload.get("diagnostics", {})
        stage_results = payload.get("stage_results", {})
        competitors = payload.get("competitors", [])
        domain = payload.get("domain", entry.domain)
    elif isinstance(payload, list):
        table_data = payload
        table_pool_data = payload
        diagnostics = {"final_output": len(payload)}
        stage_results = {}
        domain = entry.domain
        competitors = []
        if payload:
            first_row = payload[0]
            if isinstance(first_row, dict):
                competitors = [
                    key
                    for key in first_row.keys()
                    if key not in METRIC_COLUMNS and key != domain
                ]
    else:
        table_data = []
        table_pool_data = []
        diagnostics = {}
        stage_results = {}
        competitors = []
        domain = entry.domain

    return {
        "analysis_id": entry.id,
        "domain": domain,
        "competitors": competitors,
        "table_data": table_data,
        "table_pool_data": table_pool_data,
        "diagnostics": diagnostics,
        "stage_results": stage_results,
    }


def _extract_table_data(payload):
    if isinstance(payload, dict):
        data = payload.get("table_data", [])
        return data if isinstance(data, list) else []
    if isinstance(payload, list):
        return payload
    return []


@app.get("/api/status")
async def status():
    return {"status": "ok", "message": "SEO Analyzer API is running"}


@app.post("/api/analyze", response_model=schemas.AnalyzeResponse)
@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze(
    request: schemas.AnalyzeRequest,
    db: Session = Depends(database.get_db),
):
    if not KEYSO_TOKEN:
        raise HTTPException(status_code=500, detail="KEYSO_TOKEN is not configured")
    request_domain = _normalize_domain(request.domain)
    if not request_domain:
        raise HTTPException(status_code=400, detail="Invalid domain")

    try:
        manual_competitors = []
        for item in request.manual_competitors:
            normalized = _normalize_domain(item)
            if normalized:
                manual_competitors.append(normalized)

        excluded_competitors = set()
        for item in request.excluded_competitors:
            normalized = _normalize_domain(item)
            if normalized and normalized != request_domain:
                excluded_competitors.add(normalized)

        if request.competitors_limit == 0 and not manual_competitors:
            raise HTTPException(
                status_code=400,
                detail="When competitors_limit is 0, add at least one domain in manual_competitors",
            )

        main_keys = await keys_client.get_keywords_top_positions(
            request_domain,
            request.base,
            max_pos=None,
            per_page=100,
            max_pages=request.main_max_pages,
            sort="ws|desc",
        )
        if not main_keys:
            raise HTTPException(status_code=404, detail="Keywords not found for domain")

        def _filter_api_competitors(candidates):
            seen = set()
            result = []
            for comp in candidates:
                normalized = _normalize_domain(comp)
                if not normalized or normalized == request_domain:
                    continue
                if normalized in excluded_competitors:
                    continue
                if normalized in seen:
                    continue
                seen.add(normalized)
                result.append(normalized)
            return result

        if request.competitors_limit > 0:
            max_api_limit = 100
            fetch_limit = min(max(1, request.competitors_limit), max_api_limit)
            filtered_api_competitors = []

            while True:
                api_competitors = await keys_client.get_competitors(
                    request_domain,
                    request.base,
                    limit=fetch_limit,
                )
                filtered_api_competitors = _filter_api_competitors(api_competitors)
                if len(filtered_api_competitors) >= request.competitors_limit:
                    break
                if fetch_limit >= max_api_limit:
                    break

                next_limit = min(max_api_limit, fetch_limit * 2)
                if next_limit == fetch_limit:
                    break
                fetch_limit = next_limit

            competitors = filtered_api_competitors[: request.competitors_limit]
        else:
            competitors = []

        competitors_set = set()
        combined_competitors = []
        for comp in [*competitors, *manual_competitors]:
            normalized = _normalize_domain(comp)
            if not normalized or normalized == request_domain:
                continue
            if normalized in excluded_competitors:
                continue
            if normalized in competitors_set:
                continue
            competitors_set.add(normalized)
            combined_competitors.append(normalized)

        sem = asyncio.Semaphore(2)

        async def fetch_competitor(comp: str):
            async with sem:
                data = await keys_client.get_keywords_top_positions(
                    comp,
                    request.base,
                    max_pos=50,
                    per_page=100,
                    max_pages=request.competitors_max_pages,
                )
                return comp, data

        comp_pairs = await asyncio.gather(*(fetch_competitor(comp) for comp in combined_competitors))
        comp_results = {comp: data for comp, data in comp_pairs}

        df, diagnostics, stage_results, table_pool_data = await SEOAnalyzer.process_data(
            request_domain,
            main_keys,
            comp_results,
            competitors_top_pos=request.competitors_top_pos,
            top50_competitors_min=request.top50_competitors_min,
            main_min_pos=request.main_min_pos,
            result_limit=request.result_limit,
            stage_preview_limit=min(request.result_limit, 3000),
        )
        result_data = df.to_dict(orient="records")

        response_payload = {
            "domain": request_domain,
            "competitors": combined_competitors,
            "table_data": result_data,
            "table_pool_data": table_pool_data,
            "diagnostics": diagnostics,
            "stage_results": stage_results,
            "request": {
                "base": request.base,
                "competitors_limit": request.competitors_limit,
                "manual_competitors": manual_competitors,
                "excluded_competitors": sorted(excluded_competitors),
                "top50_competitors_min": request.top50_competitors_min,
                "main_max_pages": request.main_max_pages,
                "competitors_max_pages": request.competitors_max_pages,
                "result_limit": request.result_limit,
            },
        }

        history_entry = models.AnalysisHistory(
            domain=request_domain,
            base=request.base,
            data=response_payload,
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)

        return {
            "analysis_id": history_entry.id,
            "domain": request_domain,
            "competitors": combined_competitors,
            "table_data": result_data,
            "table_pool_data": table_pool_data,
            "diagnostics": diagnostics,
            "stage_results": stage_results,
        }
    except HTTPException:
        raise
    except Exception as exc:
        detail = str(exc) or repr(exc)
        raise HTTPException(status_code=500, detail=detail) from exc


@app.get("/api/history", response_model=list[schemas.HistoryItem])
async def get_history(db: Session = Depends(database.get_db)):
    entries = db.query(models.AnalysisHistory).order_by(models.AnalysisHistory.created_at.desc()).all()
    response = []
    for entry in entries:
        table_data = _extract_table_data(entry.data)
        response.append(
            {
                "id": entry.id,
                "domain": entry.domain,
                "base": entry.base,
                "created_at": entry.created_at.isoformat() if entry.created_at else "",
                "rows_count": len(table_data),
            }
        )
    return response


@app.get("/api/history/{analysis_id}", response_model=schemas.AnalyzeResponse)
async def get_history_item(analysis_id: int, db: Session = Depends(database.get_db)):
    entry = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.id == analysis_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Analysis entry not found")
    return _build_response_from_history_entry(entry)


@app.get("/api/export/{analysis_id}")
async def export_analysis(analysis_id: int, db: Session = Depends(database.get_db)):
    entry = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.id == analysis_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Analysis entry not found")
    table_data = _extract_table_data(entry.data)
    if not table_data:
        raise HTTPException(status_code=400, detail="Analysis entry has no data")

    df = pd.DataFrame(table_data)
    if df.empty:
        raise HTTPException(status_code=400, detail="Analysis entry has no rows to export")

    # Replace technical "101" position marker with "-" in exported position columns.
    position_columns = [col for col in df.columns if col not in METRIC_COLUMNS]
    for col in position_columns:
        numeric_series = pd.to_numeric(df[col], errors="coerce")
        df[col] = numeric_series.apply(
            lambda value: "-" if pd.isna(value) or value > 100 else int(value) if float(value).is_integer() else value
        )

    # User-friendly export headers.
    df = df.rename(
        columns={
            "word": "Запросы",
            "[!Wordstat]": "Частотность",
            "частотность": "Частотность",
            "competitors_top10_count": "Конкурентов в ТОП",
            "opportunity_score": "Приоритет",
        }
    )
    filename = f"{entry.domain.replace('.', '_')}_{entry.id}"
    excel_path = SEOAnalyzer.save_to_excel(df, filename)
    entry.excel_path = excel_path
    db.commit()

    return FileResponse(
        excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"{filename}.xlsx",
    )


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(str(FRONTEND_DIST / "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
