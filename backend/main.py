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

        if request.competitors_limit > 0:
            competitors = await keys_client.get_competitors(
                request_domain,
                request.base,
                limit=request.competitors_limit,
            )
        else:
            competitors = []

        competitors_set = set()
        combined_competitors = []
        for comp in [*competitors, *manual_competitors]:
            normalized = _normalize_domain(comp)
            if not normalized or normalized == request_domain:
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

        history_entry = models.AnalysisHistory(
            domain=request_domain,
            base=request.base,
            data=result_data,
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


@app.get("/api/history")
async def get_history(db: Session = Depends(database.get_db)):
    return db.query(models.AnalysisHistory).order_by(models.AnalysisHistory.created_at.desc()).all()


@app.get("/api/export/{analysis_id}")
async def export_analysis(analysis_id: int, db: Session = Depends(database.get_db)):
    entry = db.query(models.AnalysisHistory).filter(models.AnalysisHistory.id == analysis_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Analysis entry not found")
    if not entry.data:
        raise HTTPException(status_code=400, detail="Analysis entry has no data")

    df = pd.DataFrame(entry.data)
    if df.empty:
        raise HTTPException(status_code=400, detail="Analysis entry has no rows to export")

    # Replace technical "101" position marker with "-" in exported position columns.
    metric_columns = {"word", "[!Wordstat]", "competitors_top10_count", "opportunity_score"}
    position_columns = [col for col in df.columns if col not in metric_columns]
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
