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
from auth_module import AuthConfig, init_auth_module
from services.analyzer import SEOAnalyzer
from services.competitor_keyword_filters import (
    build_competitor_filter_string,
    merge_keyword_rows_by_word,
    parse_exclude_fragments,
    parse_include_lines,
)
from services.keys_so import KeysSoClient

load_dotenv()

app = FastAPI(title="Поиск конкурентов и запросов для КП")
models.Base.metadata.create_all(bind=database.engine)
init_auth_module(app, database.engine, AuthConfig())

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
BASE_TO_YANDEX_REGION_ID = {
    "msk": 213,
    "spb": 2,
    "ekb": 54,
    "rnd": 39,
    "ufa": 172,
    "sar": 194,
    "krr": 35,
    "prm": 50,
    "sam": 51,
    "kry": 62,
    "oms": 66,
    "kzn": 43,
    "che": 56,
    "nsk": 65,
    "nnv": 47,
    "vlg": 38,
    "vrn": 193,
    "mns": 157,
    "tmn": 55,
    "tom": 67,
}
SERP_TOP_NUMBER_OPTIONS = {10, 20, 30, 50, 100}
COMPETITOR_KEYWORDS_MAX_POS = 50


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
        competitor_sources = payload.get("competitor_sources", {})
        serp_summary = payload.get("serp_summary", {})
        serp_progress = payload.get("serp_progress", [])
        domain = payload.get("domain", entry.domain)
    elif isinstance(payload, list):
        table_data = payload
        table_pool_data = payload
        diagnostics = {"final_output": len(payload)}
        stage_results = {}
        domain = entry.domain
        competitors = []
        competitor_sources = {}
        serp_summary = {}
        serp_progress = []
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
        competitor_sources = {}
        serp_summary = {}
        serp_progress = []
        domain = entry.domain

    return {
        "analysis_id": entry.id,
        "domain": domain,
        "competitors": competitors,
        "competitor_sources": competitor_sources,
        "table_data": table_data,
        "table_pool_data": table_pool_data,
        "diagnostics": diagnostics,
        "stage_results": stage_results,
        "serp_summary": serp_summary,
        "serp_progress": serp_progress,
    }


def _extract_table_data(payload):
    if isinstance(payload, dict):
        data = payload.get("table_data", [])
        return data if isinstance(data, list) else []
    if isinstance(payload, list):
        return payload
    return []


def _wish_to_dict(wish: models.ServiceWish) -> dict:
    return {
        "id": wish.id,
        "text": wish.text,
        "is_done": bool(wish.is_done),
        "created_at": wish.created_at.isoformat() if wish.created_at else "",
        "updated_at": wish.updated_at.isoformat() if wish.updated_at else "",
    }


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
        serp_queries = []
        serp_seen = set()
        for raw_query in request.serp_queries:
            query = str(raw_query or "").strip()
            if not query:
                continue
            key = query.lower()
            if key in serp_seen:
                continue
            serp_seen.add(key)
            serp_queries.append(query)

        if len(serp_queries) > 10:
            raise HTTPException(status_code=400, detail="Не более 10 запросов")

        excluded_competitors = set()
        for item in request.excluded_competitors:
            normalized = _normalize_domain(item)
            if normalized and normalized != request_domain:
                excluded_competitors.add(normalized)

        manual_competitors = []
        for item in request.manual_competitors:
            normalized = _normalize_domain(item)
            if not normalized or normalized == request_domain:
                continue
            if normalized in excluded_competitors:
                continue
            manual_competitors.append(normalized)

        if request.competitors_limit == 0 and not manual_competitors and not serp_queries:
            raise HTTPException(
                status_code=400,
                detail="When competitors_limit is 0, add at least one domain in manual_competitors or at least one query in serp_queries",
            )

        main_keys = await keys_client.get_keywords_top_positions(
            request_domain,
            request.base,
            max_pos=None,
            per_page=100,
            max_pages=request.main_max_pages,
            sort=request.keywords_sort,
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

        competitor_sources: dict[str, str] = {}

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

        for comp in competitors:
            competitor_sources[comp] = "api"
        for comp in manual_competitors:
            competitor_sources[comp] = "manual"

        serp_progress: list[str] = []
        serp_domains_raw: list[str] = []
        successful_serp_queries = 0
        failed_serp_queries = 0
        added_from_serp = 0
        excluded_serp_by_stoplist = 0
        serp_region_id = request.serp_region_id or BASE_TO_YANDEX_REGION_ID.get(request.base, 213)
        serp_top_number = request.serp_top_number or 10
        if serp_top_number not in SERP_TOP_NUMBER_OPTIONS:
            raise HTTPException(
                status_code=400,
                detail=f"serp_top_number must be one of: {sorted(SERP_TOP_NUMBER_OPTIONS)}",
            )

        if serp_queries:
            for idx, query in enumerate(serp_queries, start=1):
                serp_progress.append(f'Запрос {idx} из {len(serp_queries)}: "{query}"...')
                try:
                    task_id = await keys_client.create_serp_task(
                        words=[query],
                        region_id=serp_region_id,
                        top_number=serp_top_number,
                    )
                    is_ready, status_debug = await keys_client.wait_serp_ready_with_debug(
                        task_id=task_id,
                        timeout_seconds=120,
                        poll_interval_seconds=3,
                    )
                    if not is_ready:
                        domains_fallback, result_wait_debug = await keys_client.wait_serp_result_with_debug(
                            task_id=task_id,
                            timeout_seconds=90,
                            poll_interval_seconds=3,
                        )
                        if domains_fallback:
                            serp_domains_raw.extend(domains_fallback)
                            successful_serp_queries += 1
                            serp_progress.append(
                                f'Запрос "{query}": использован fallback-результат SERP.'
                            )
                            continue

                        if result_wait_debug.get("reason") == "result_endpoint_nonempty_but_zero_domains":
                            failed_serp_queries += 1
                            serp_progress.append(
                                f'Запрос "{query}": SERP вернул результат без доменов.'
                            )
                            continue

                        failed_serp_queries += 1
                        serp_progress.append(
                            f'Запрос "{query}": SERP задача не готова в отведенное время.'
                        )
                        continue
                    domains, raw_debug = await keys_client.get_serp_domains_with_debug(task_id)
                    serp_domains_raw.extend(domains)
                    successful_serp_queries += 1
                    if not domains:
                        serp_progress.append(
                            f'Запрос "{query}": из SERP не получено доменов.'
                        )
                except Exception as exc:
                    failed_serp_queries += 1
                    serp_progress.append(
                        f'Запрос "{query}": ошибка SERP ({str(exc)[:140]}).'
                    )
                    continue

            serp_progress.append(
                f"Получено {len({d.lower().strip() for d in serp_domains_raw if str(d).strip()})} доменов из {len(serp_queries)} запросов."
            )

        serp_domains_normalized = []
        seen_serp_domains = set()
        for domain_raw in serp_domains_raw:
            normalized = _normalize_domain(domain_raw)
            if not normalized:
                continue
            if normalized in seen_serp_domains:
                continue
            seen_serp_domains.add(normalized)
            serp_domains_normalized.append(normalized)

        filtered_serp_domains = []
        for comp in serp_domains_normalized:
            if comp == request_domain:
                continue
            if comp in excluded_competitors:
                excluded_serp_by_stoplist += 1
                continue
            filtered_serp_domains.append(comp)

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

        for comp in filtered_serp_domains:
            if comp in competitors_set:
                continue
            competitors_set.add(comp)
            combined_competitors.append(comp)
            competitor_sources[comp] = "serp"
            added_from_serp += 1

        if serp_queries:
            serp_progress.append(
                f"Исключено: {excluded_serp_by_stoplist} (в стоп-листе). Добавлено новых: {added_from_serp}."
            )

        sem = asyncio.Semaphore(2)
        skipped_competitors: list[dict[str, str]] = []

        async def fetch_competitor(comp: str):
            async with sem:
                try:
                    exclude_frags = parse_exclude_fragments(request.competitor_exclude_words)
                    include_frags = parse_include_lines(request.competitor_words_filter)

                    if include_frags:
                        filter_rounds = [
                            build_competitor_filter_string(COMPETITOR_KEYWORDS_MAX_POS, inc, exclude_frags)
                            for inc in include_frags
                        ]
                    else:
                        filter_rounds = [
                            build_competitor_filter_string(COMPETITOR_KEYWORDS_MAX_POS, None, exclude_frags)
                        ]

                    merged_batches: list[dict] = []
                    for filt in filter_rounds:
                        batch = await keys_client.get_keywords_top_positions(
                            comp,
                            request.base,
                            max_pos=COMPETITOR_KEYWORDS_MAX_POS,
                            per_page=100,
                            max_pages=request.competitors_max_pages,
                            sort=request.keywords_sort,
                            filter_string=filt,
                        )
                        merged_batches.extend(batch)

                    data = merge_keyword_rows_by_word(merged_batches)
                    return comp, data
                except Exception as exc:
                    skipped_competitors.append({"domain": comp, "error": str(exc)[:300]})
                    return None

        comp_pairs = await asyncio.gather(*(fetch_competitor(comp) for comp in combined_competitors))
        comp_results = {comp: data for pair in comp_pairs if pair is not None for comp, data in [pair]}
        if skipped_competitors:
            skipped_domains = ", ".join(item["domain"] for item in skipped_competitors)
            serp_progress.append(f"Пропущены недоступные конкуренты: {skipped_domains}")

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
            "competitor_sources": competitor_sources,
            "table_data": result_data,
            "table_pool_data": table_pool_data,
            "diagnostics": diagnostics,
            "stage_results": stage_results,
            "serp_summary": {
                "queries_total": len(serp_queries),
                "successful_queries": successful_serp_queries,
                "failed_queries": failed_serp_queries,
                "domains_collected": len(serp_domains_normalized),
                "excluded_stoplist": excluded_serp_by_stoplist,
                "added_new": added_from_serp,
            },
            "serp_progress": serp_progress,
            "request": {
                "base": request.base,
                "competitors_limit": request.competitors_limit,
                "manual_competitors": manual_competitors,
                "excluded_competitors": sorted(excluded_competitors),
                "serp_queries": serp_queries,
                "serp_region_id": serp_region_id,
                "serp_top_number": serp_top_number,
                "top50_competitors_min": request.top50_competitors_min,
                "main_max_pages": request.main_max_pages,
                "keywords_sort": request.keywords_sort,
                "competitors_max_pages": request.competitors_max_pages,
                "result_limit": request.result_limit,
                "competitor_words_filter": request.competitor_words_filter,
                "competitor_exclude_words": request.competitor_exclude_words,
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
            "competitor_sources": competitor_sources,
            "table_data": result_data,
            "table_pool_data": table_pool_data,
            "diagnostics": diagnostics,
            "stage_results": stage_results,
            "serp_summary": {
                "queries_total": len(serp_queries),
                "successful_queries": successful_serp_queries,
                "failed_queries": failed_serp_queries,
                "domains_collected": len(serp_domains_normalized),
                "excluded_stoplist": excluded_serp_by_stoplist,
                "added_new": added_from_serp,
            },
            "serp_progress": serp_progress,
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


@app.get("/api/wishes", response_model=list[schemas.ServiceWishOut])
async def get_wishes(db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.ServiceWish)
        .order_by(models.ServiceWish.is_done.asc(), models.ServiceWish.sort_order.asc(), models.ServiceWish.id.asc())
        .all()
    )
    return [_wish_to_dict(row) for row in rows]


@app.post("/api/wishes", response_model=schemas.ServiceWishOut)
async def create_wish(request: schemas.ServiceWishCreate, db: Session = Depends(database.get_db)):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Wish text must not be empty")
    max_order = db.query(models.ServiceWish.sort_order).order_by(models.ServiceWish.sort_order.desc()).first()
    next_order = (max_order[0] + 1) if max_order and max_order[0] is not None else 1
    wish = models.ServiceWish(text=text, is_done=False, sort_order=next_order)
    db.add(wish)
    db.commit()
    db.refresh(wish)
    return _wish_to_dict(wish)


@app.patch("/api/wishes/{wish_id}", response_model=schemas.ServiceWishOut)
async def update_wish_text(wish_id: int, request: schemas.ServiceWishUpdate, db: Session = Depends(database.get_db)):
    wish = db.query(models.ServiceWish).filter(models.ServiceWish.id == wish_id).first()
    if wish is None:
        raise HTTPException(status_code=404, detail="Wish not found")
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Wish text must not be empty")
    wish.text = text
    db.commit()
    db.refresh(wish)
    return _wish_to_dict(wish)


@app.patch("/api/wishes/{wish_id}/toggle", response_model=schemas.ServiceWishOut)
async def toggle_wish(wish_id: int, request: schemas.ServiceWishToggle, db: Session = Depends(database.get_db)):
    wish = db.query(models.ServiceWish).filter(models.ServiceWish.id == wish_id).first()
    if wish is None:
        raise HTTPException(status_code=404, detail="Wish not found")
    wish.is_done = bool(request.is_done)
    db.commit()
    db.refresh(wish)
    return _wish_to_dict(wish)


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
