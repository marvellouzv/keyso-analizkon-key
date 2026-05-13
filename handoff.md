# РСЃС‚РѕСЂРёСЏ РёР·РјРµРЅРµРЅРёР№ (handoff.md)

## [2026-04-21] - РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ РїСЂРѕРµРєС‚Р°

### Р”РѕР±Р°РІР»РµРЅРѕ:
- **Backend:**
    - Р‘Р°Р·РѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° РЅР° FastAPI.
    - РРЅС‚РµРіСЂР°С†РёСЏ СЃ SQLite С‡РµСЂРµР· SQLAlchemy.
    - РљР»РёРµРЅС‚ `KeysSoClient` СЃ РїРѕРґРґРµСЂР¶РєРѕР№ Р°СЃРёРЅС…СЂРѕРЅРЅРѕРіРѕ Rate Limiting.
    - РЎРµСЂРІРёСЃ `SEOAnalyzer` РґР»СЏ РѕР±СЉРµРґРёРЅРµРЅРёСЏ РґР°РЅРЅС‹С… С‡РµСЂРµР· Pandas.
    - Р­РЅРґРїРѕРёРЅС‚С‹ `/api/analyze` Рё `/api/history`.
- **Frontend:**
    - РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Vite + React + TS.
    - РќР°СЃС‚СЂРѕР№РєР° Zustand РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ СЃРѕСЃС‚РѕСЏРЅРёРµРј С„РѕСЂРјС‹.
    - РљРѕРјРїРѕРЅРµРЅС‚ `ResultTable` СЃ С†РІРµС‚РѕРІРѕР№ РёРЅРґРёРєР°С†РёРµР№ РїРѕР·РёС†РёР№ (1-3, 4-10, 10+).
    - Р’РёР·СѓР°Р»РёР·Р°С†РёСЏ РїРµСЂРµСЃРµС‡РµРЅРёСЏ Р·Р°РїСЂРѕСЃРѕРІ С‡РµСЂРµР· Recharts (BarChart).
    - РђРЅРёРјР°С†РёРё Р·Р°РіСЂСѓР·РєРё С‡РµСЂРµР· Framer Motion.
- **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ:**
    - `README.md` СЃ РёРЅСЃС‚СЂСѓРєС†РёСЏРјРё РїРѕ Р·Р°РїСѓСЃРєСѓ.
    - `agent.md` СЃ РїСЂР°РІРёР»Р°РјРё СЂР°Р·СЂР°Р±РѕС‚РєРё.
    - `handoff.md` РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ РїСЂРѕРіСЂРµСЃСЃР°.

### РўРµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ:
РџСЂРѕРµРєС‚ РЅР°С…РѕРґРёС‚СЃСЏ РІ СЃРѕСЃС‚РѕСЏРЅРёРё MVP. РћСЃРЅРѕРІРЅРѕР№ С†РёРєР» "Р—Р°РїСЂРѕСЃ -> РђРЅР°Р»РёР· -> РћС‚РѕР±СЂР°Р¶РµРЅРёРµ" СЂРµР°Р»РёР·РѕРІР°РЅ.

### РЎР»РµРґСѓСЋС‰РёРµ С€Р°РіРё:
1. Р РµР°Р»РёР·РѕРІР°С‚СЊ СЌРЅРґРїРѕРёРЅС‚ `/api/export/{task_id}` РґР»СЏ СЃРєР°С‡РёРІР°РЅРёСЏ Excel.
2. Р”РѕР±Р°РІРёС‚СЊ РІР°Р»РёРґР°С†РёСЋ РґРѕРјРµРЅРѕРІ РЅР° С„СЂРѕРЅС‚РµРЅРґРµ.
3. РЈР»СѓС‡С€РёС‚СЊ РѕР±СЂР°Р±РѕС‚РєСѓ РѕС€РёР±РѕРє API (РЅР°РїСЂРёРјРµСЂ, РµСЃР»Рё РґРѕРјРµРЅ РЅРµ РЅР°Р№РґРµРЅ).

## [2026-04-21] - Stabilization pass after initial QA

### Fixed
- Backend `main.py` syntax and routing issues were fixed.
- API endpoints are now aligned under `/api/*` (`/api/analyze`, `/api/history`, `/api/export/{analysis_id}`).
- Added Excel export endpoint implementation and wired DB `excel_path` persistence.
- Error handling now preserves `HTTPException` and avoids masking API status codes.
- SQLite path is now stable and independent from current working directory (`backend/storage/sql_app.db`).

### Frontend improvements
- Added missing TypeScript config (`tsconfig.json`, `tsconfig.node.json`) so `npm run build` works.
- Fixed undefined `chartData` runtime/build issue.
- Added domain format validation before sending analyze request.
- Switched API calls to relative path (`/api/analyze`) to work with Vite proxy and same-origin deployment.
- Connected "Download Excel" button to `/api/export/{analysis_id}`.

### Validation performed
- Backend syntax check: passed.
- Backend import and app startup (TestClient `/api/status`): passed.
- Frontend production build (`npm run build`): passed.

### Remaining risks / next tasks
1. Add automated tests (backend unit/integration + frontend component tests).
2. Add pagination/virtualization for large tables and split large JS chunks.
3. Improve API error mapping for Keys.so specific statuses (rate limit, auth, missing domain).

## [2026-04-21] - Process rule update
- Added workflow rule: always keep `agent.md` and `handoff.md` up to date on each implementation/test session.

## [2026-04-21] - Runtime session
- Project launched successfully.
- Backend: `http://127.0.0.1:8000` (`/api/status` -> 200).
- Frontend: `http://127.0.0.1:5173` (HTTP 200).
- Logs:
  - `backend/backend.log`
  - `frontend/frontend.log`
- Run mode: background processes via `Start-Process`.

## [2026-04-21] - Fixed 405 on analyze
- Root cause: Vite proxy rewrote `/api/*` to `/*`, so frontend `POST /api/analyze` became `POST /analyze`.
- Backend expected `POST /api/analyze`, which caused `405 Method Not Allowed`.
- Fixes:
  - Removed proxy rewrite in `frontend/vite.config.ts`.
  - Added backward-compatible backend alias `POST /analyze` in `backend/main.py`.
- Services restarted in hidden mode.
- Verification:
  - `POST http://127.0.0.1:5173/api/analyze` now reaches backend (status is no longer 405).

## [2026-04-21] - Analyze endpoint and Keys.so diagnostics
- Fixed `405 Method Not Allowed` for analyze flow.
  - Cause: Vite proxy rewrite removed `/api` prefix.
  - Changes:
    - `frontend/vite.config.ts`: removed `/api` rewrite.
    - `backend/main.py`: added compatibility alias `POST /analyze`.
- Improved Keys.so API error diagnostics:
  - `backend/services/keys_so.py` now raises explicit errors for network/auth/rate-limit/domain-not-found cases.
  - `backend/main.py` now returns non-empty error detail for unexpected exceptions.
- Verification:
  - `POST /api/analyze` no longer returns 405.
  - Current environment now returns:
    - `500 {"detail":"Cannot connect to Keys.so API: ConnectError('All connection attempts failed')"}`

## [2026-04-21] - Keys.so integration fix based on API docs
- Applied fix for frontend `Method Not Allowed` during analyze request:
  - Removed `/api` rewrite in `frontend/vite.config.ts`.
  - Added backend compatibility route `POST /analyze` (alongside `POST /api/analyze`).
- Added robust Keys.so client handling in `backend/services/keys_so.py`:
  - Ignore broken environment proxy vars via `httpx.AsyncClient(..., trust_env=False)`.
  - Added explicit error mapping for Keys.so statuses `401`, `404`, `429`.
  - Added retry logic for `202` (report preparation state) with polling.
- Improved backend exception detail formatting in `backend/main.py`.
- Validation:
  - `POST /api/analyze` now works end-to-end.
  - Real request for `istra-paracels.ru` returned `200` with data.

## [2026-04-21] - Competitor limit increased
- Increased competitors request limit from 5 to 10 in `backend/services/keys_so.py` (`get_competitors` default argument).

## [2026-04-21] - Table logic updated for opportunity queries
- Updated backend data processing (`backend/services/analyzer.py`):
  - Added normalization by keyword per domain (`min(pos)`), to avoid duplicates.
  - Added strict filter for output table:
    - analyzed domain position `> 10`
    - at least one competitor position `<= 10`
  - Added `[!Wordstat]` column to result rows.
    - source priority: `superwsk` -> `wsk` -> `ws`
  - Sorted output by `[!Wordstat]` desc, then `word`.
- Updated frontend table rendering (`frontend/src/components/ResultTable.tsx`):
  - Added dedicated `[!Wordstat]` column in UI.
- Validation:
  - `POST /api/analyze` returns 200 with filtered rows and `[!Wordstat]`.
  - Sample filter check passed (`main > 10` and competitor in top-10).
  - Frontend build passed.

## [2026-04-21] - Table UX + top-10 count + sampling fix
- UI table:
  - Enforced horizontal scroll in `frontend/src/components/ResultTable.tsx` (`overflow-x-scroll`, `w-max`).
  - Added new column: `Top-10 competitors` (`competitors_top10_count`).
- Data processing:
  - Added `competitors_top10_count` metric in `backend/services/analyzer.py`.
  - Kept filter logic: main domain position `>10` AND any competitor `<=10`.
- Competitor sampling update:
  - Reworked competitor keyword fetch to top positions with pagination in `backend/services/keys_so.py`.
  - Added Keys.so filter `pos<=10` and page cap (`max_pages=5`) to avoid oversized long-running scans.
  - Added rate-limit guard for each paginated request to prevent 429 bursts.
- Validation (live run):
  - analyze status: 200
  - rows returned: 500
  - `competitors_top10_count` column present
  - competitor position distribution now includes 1..10 (not only 1)

## [2026-04-21] - Weighted opportunity ranking
- Updated ranking logic in `backend/services/analyzer.py`.
- Added `opportunity_score` column:
  - `opportunity_score = [!Wordstat] * (1 + competitors_top10_count * 0.35)`
- New sorting order:
  1) `opportunity_score` desc
  2) `competitors_top10_count` desc
  3) `[!Wordstat]` desc
  4) `word` asc
- Backend restarted and verified on live analyze request (`200`, 500 rows, `opportunity_score` present).

## [2026-04-21] - Sampling strategy corrected for analyzed site positions
- Root cause of "mostly first places": analyzed site keywords were sampled with `sort=pos|asc`, so early pages were dominated by position 1.
- Fix:
  - `backend/main.py`: analyzed site query fetch now uses `sort=ws|desc` with `pos<=100`.
  - `backend/services/keys_so.py`: `get_keywords_top_positions` now accepts `sort` and only uses early-stop optimization for `pos|asc` mode.
- Result:
  - analyzed site positions in output are now diverse (not only 1).
  - live validation sample: 100 rows, 41 unique analyzed-site positions, only 5 rows with position 1.

## [2026-04-21] - Full-width horizontal scroll for results table
- Fixed missing horizontal scrollbar visibility.
- Changes:
  - `frontend/src/App.tsx`: removed `overflow-hidden` from results card wrapper.
  - `frontend/src/components/ResultTable.tsx`: table scroll container now spans full viewport width (`w-screen` + centered offset).
- Result: horizontal scroll is available across full screen width.
- Validation: frontend production build passed.

## [2026-04-21] - Fixed table overflow alignment in Position comparison block
- Issue: table container was full-screen, but the white card remained constrained, causing left side clipping.
- Fix:
  - `frontend/src/App.tsx`: expanded the white `Position comparison table` card itself to full viewport width.
  - `frontend/src/components/ResultTable.tsx`: returned table wrapper to normal in-card horizontal scrolling.
- Result: table and white background block are aligned; left side is visible again.
- Validation: frontend build passed.

## [2026-04-21] - Strict filter restored by request
- Restored strict output conditions in `backend/services/analyzer.py`:
  - analyzed site position must be `>10` and `<=100`
  - at least one competitor must be in top-10 (`competitors_top10_count > 0`)
- Validation:
  - no rows with analyzed site `<=10`
  - no rows without competitor top-10 presence
- Note: with strict conditions, resulting row count may be small for a specific domain/base dataset.

## [2026-04-21] - Layout fix: table left edge visibility
- Fixed issue where results table shifted left out of viewport.
- `frontend/src/App.tsx`: removed viewport shift classes from Position comparison block and restored stable `w-full` container.
- Horizontal scrolling remains inside the table block.
- Validation: frontend build passed.

## [2026-04-21] - Expanded base selector (Yandex + Google)
- Updated frontend region/base selector in `frontend/src/App.tsx`.
- Added full enum coverage from Keys.so `base` parameter currently used by the app:
  - Yandex group: `msk, spb, ekb, rnd, ufa, sar, krr, prm, sam, kry, oms, kzn, che, nsk, nnv, vlg, vrn, mns, tmn, tom`
  - Google group: `gru, gkv, gmns, gny`
  - Other group: `zen`
- Selector now includes Google bases in UI.

## [2026-04-21] - Added parsing-depth selectors (UI + API)
- Implemented configurable parsing depth with current behavior as defaults.
- Backend:
  - `backend/schemas.py`: `AnalyzeRequest` now supports depth controls:
    - `competitors_limit` (default 10)
    - `competitors_top_pos` (default 10)
    - `main_min_pos` (default 10)
    - `main_max_pos` (default 100)
    - `main_max_pages` (default 10)
    - `competitors_max_pages` (default 5)
    - `result_limit` (default 500)
  - `backend/main.py`: uses new request fields for Keys.so fetch and filtering.
  - `backend/services/analyzer.py`: filtering and output limit are now parameterized.
- Frontend:
  - `frontend/src/App.tsx`: added "Parsing depth" selectors and sends selected values to `/api/analyze`.
- Validation:
  - backend syntax ok
  - frontend build ok
  - analyze endpoint works with defaults (200)

## [2026-04-21] - UI localization + hover hints
- Translated form fields and key UI texts in `frontend/src/App.tsx` to Russian.
- Added hover tooltips for each form field label via reusable `FieldLabel` with `?` hint icon.
- Kept behavior unchanged; defaults and API payload remain the same.
- Validation: frontend build passed.

## [2026-04-21] - Field localization, hints, and table competitor visibility
- `frontend/src/App.tsx`:
  - Translated form labels and key interface texts to Russian.
  - Added hover hints (`?`) for each form field label.
  - Fixed duplicate table render and kept a single table output.
  - Table now receives filtered competitors list (`visibleCompetitors`) so competitors with no positions in shown rows are hidden.
- Validation: frontend build passed.

## [2026-04-21] - Performance optimization pass
- Goal: reduce long "processing" waits (actual bottleneck mostly API collection, not Pandas).
- Changes:
  - `backend/main.py`: competitor collection switched to limited parallel mode (`Semaphore(2)`) instead of fully sequential.
  - `backend/services/keys_so.py`:
    - `_get_with_report_wait` now retries on `429` with backoff.
    - increased attempts to improve stability under rate limits.
  - `backend/services/analyzer.py`: replaced repeated `merge` chain with index `join` strategy for faster DataFrame assembly.
- Validation:
  - analyze request completes successfully (`200`) after changes.

## [2026-04-21] - Parsing depth presets added
- Added quick presets in UI (`frontend/src/App.tsx`):
  - `Р‘С‹СЃС‚СЂС‹Р№`
  - `Р‘Р°Р»Р°РЅСЃ`
  - `Р“Р»СѓР±РѕРєРёР№`
- Presets instantly apply full parsing-depth settings to the form.
- Default active preset: `Р‘Р°Р»Р°РЅСЃ`.
- Validation: frontend build passed.

## [2026-04-21] - Diagnostics block in UX
- Added per-stage diagnostics to analyze flow.
- Backend:
  - `backend/services/analyzer.py`: now returns `(DataFrame, diagnostics)` with stage counters:
    - `main_keywords_raw`
    - `main_keywords_unique`
    - `after_join`
    - `after_main_position_filter`
    - `after_competitor_filter`
    - `final_output`
  - `backend/main.py`: includes `diagnostics` in `/api/analyze` response.
  - `backend/schemas.py`: `AnalyzeResponse` updated with `diagnostics` field.
- Frontend:
  - `frontend/src/App.tsx`: added UX card "Р”РёР°РіРЅРѕСЃС‚РёРєР° СЌС‚Р°РїРѕРІ" showing counters for each filtering stage.
- Validation:
  - backend syntax ok
  - frontend build ok
  - live `/api/analyze` response contains `diagnostics`

## [2026-04-21] - Tooltips for diagnostics fields
- Added detailed hover explanations to each metric in "Р”РёР°РіРЅРѕСЃС‚РёРєР° СЌС‚Р°РїРѕРІ" block (`frontend/src/App.tsx`).
- Reused existing `FieldLabel` tooltip pattern for consistency.
- Validation: frontend build passed.

## [2026-04-21] - Expandable stage results in UX
- Added per-stage result datasets to API response:
  - `stage_results.main_keywords_unique`
  - `stage_results.after_join`
  - `stage_results.after_main_position_filter`
  - `stage_results.after_competitor_filter`
  - `stage_results.final_output`
- Backend updates:
  - `backend/services/analyzer.py`: returns stage preview rows (up to 50 rows per stage).
  - `backend/main.py`: includes `stage_results` in `/api/analyze` response.
  - `backend/schemas.py`: `AnalyzeResponse` extended with `stage_results`.
- Frontend updates:
  - `frontend/src/App.tsx`: added accordion-style block "Р РµР·СѓР»СЊС‚Р°С‚С‹ РїРѕ СЃС‚Р°РґРёСЏРј".
  - Clicking a stage expands/collapses and shows tabular rows for that stage.
- Validation:
  - backend syntax ok
  - frontend build ok
  - live `/api/analyze` returns `stage_results` with expected keys.

## [2026-04-21] - Added stage block: "РЎС‹СЂС‹Рµ РєР»СЋС‡Рё СЃР°Р№С‚Р°"
- Backend `stage_results` now includes `main_keywords_raw` (first 50 raw Keys.so rows before deduplication).
- Frontend accordion "Р РµР·СѓР»СЊС‚Р°С‚С‹ РїРѕ СЃС‚Р°РґРёСЏРј" now includes stage "РЎС‹СЂС‹Рµ РєР»СЋС‡Рё СЃР°Р№С‚Р°".
- Validation:
  - backend returns `stage_results.main_keywords_raw`
  - frontend build passed

## [2026-04-21] - Stage preview limit fix
- Removed hardcoded `50` rows cap for stage previews.
- `stage_results` preview size is now driven by `result_limit` with a safety cap (`min(result_limit, 3000)`).
- Verified with `result_limit=3000`: `main_keywords_raw` stage now returns 1000 rows (equal to collected raw count), not 50.

## [2026-04-21] - Fixed duplicate raw rows due to pagination param
- Investigated Keys.so docs and found endpoint-level pagination uses `page` (not `current_page`) for organic reports.
- Updated `backend/services/keys_so.py` in paginated fetch to send `page`.
- Result: raw stage no longer repeats identical first-page data across pages.
- Validation sample (`main_max_pages=5`): `raw_len=500`, `unique_raw_rows=500`, `max_duplicate_times=1`.

## [2026-04-21] - Top horizontal scrollbar in position table
- Added an extra horizontal scrollbar above `РўР°Р±Р»РёС†Р° СЃСЂР°РІРЅРµРЅРёСЏ РїРѕР·РёС†РёР№`.
- Implemented synchronized scrolling between top and bottom scroll areas in `frontend/src/components/ResultTable.tsx`.
- Validation: frontend build passed.

## [2026-04-21] - Click sorting for all columns in result table
- Implemented client-side sorting in `frontend/src/components/ResultTable.tsx`.
- Added clickable headers with asc/desc toggle indicators for:
  - `Keyword`
  - `[!Wordstat]`
  - `Top-10 competitors`
  - each domain position column
- Sorting behavior:
  - text sort for `Keyword`
  - numeric sort for metrics and positions
- Validation: frontend build passed.

## [2026-04-21] - Removed "Max site position" setting
- Removed `Макс. позиция сайта` from UI controls and presets in `frontend/src/App.tsx`.
- Request payload no longer sends `main_max_pos`.
- Backend request schema `backend/schemas.py` no longer includes `main_max_pos`.
- Main-domain collection now requests pages without upper position filter (`max_pos=None`) in `backend/main.py` and `backend/services/keys_so.py`.
- Analyzer filter now keeps only `site_position > main_min_pos` (upper bound removed) in `backend/services/analyzer.py`.
- Updated diagnostics tooltip text to reflect min-only filtering.

## [2026-04-21] - Competitors ordered by found keys in final table
- Updated competitor column ordering in `frontend/src/App.tsx`.
- In final table, competitors are now sorted by number of found keywords in current output rows (descending, left to right).
- Competitors with zero found rows are still excluded.
- Tie-breaker: alphabetical by domain.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Resizable columns in final table UX
- Added manual column resize (drag right edge of header) in `frontend/src/components/ResultTable.tsx`.
- Implemented per-column width state with min-width limits.
- Works for `Keyword`, `[!Wordstat]`, `Top-10 competitors`, and all competitor domain columns.
- Preserved existing sorting and dual horizontal scroll synchronization.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Updated selector values for parsing depth
- Updated UI options in `frontend/src/App.tsx`:
  - `Количество конкурентов`: 5, 10, 15, 20 (already aligned)
  - `Страниц для сайта`: 10, 15, 20, 30, 40, 50
  - `Страниц для конкурентов`: 5, 10, 15, 20, 30
- Updated backend validation limits in `backend/schemas.py`:
  - `main_max_pages` max increased to 50
  - `competitors_max_pages` max increased to 30
- Validation: `npx tsc --noEmit` passed, Python syntax check passed.
## [2026-04-21] - Improved API error rendering in status log
- Fixed `[object Object]` error output in analyzer status logs.
- Added `extractApiErrorMessage` in `frontend/src/App.tsx` to normalize API errors:
  - string `detail`
  - array validation details (FastAPI 422) with `loc: msg`
  - object details via `message` or JSON fallback
  - raw response text and Axios message fallback
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Rolled back page selector expansions
- UI rollback in `frontend/src/App.tsx`:
  - `Страниц для сайта`: removed 40 and 50 (now 10, 15, 20, 30)
  - `Страниц для конкурентов`: removed 30 (now 5, 10, 15, 20)
- Backend rollback in `backend/schemas.py`:
  - `main_max_pages` max reverted to 30
  - `competitors_max_pages` max reverted to 20
- Validation: `npx tsc --noEmit` passed, Python syntax check passed.
## [2026-04-21] - Local table filters without API requests
- Added local UX filters before final position table in `frontend/src/App.tsx`:
  - `Топ позиций конкурентов`
  - `Мин. позиция сайта`
- Filters are applied to already loaded `table_data` on the client side (no extra API calls).
- Filtered rows are used for:
  - table content
  - visible competitors list/order in table columns
  - summary counter `Проанализировано фраз`
- On each new analysis run, table filters initialize from run settings (`competitorsTopPos`, `mainMinPos`).
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Fixed local table filters with true recalculation
- Root cause: table filters were applied to already pre-filtered `table_data`, so changes often had no visible effect.
- Backend:
  - `backend/services/analyzer.py`: now returns `table_pool_data` (rows before main/competitor position filters) with `[!Wordstat]` and positions.
  - `backend/main.py`: includes `table_pool_data` in `/api/analyze` response.
  - `backend/schemas.py`: `AnalyzeResponse` extended with `table_pool_data`.
- Frontend (`frontend/src/App.tsx`):
  - Local filters now recalculate from `table_pool_data` (fallback to `table_data` if needed).
  - On each filter change:
    - re-filter rows by `Мин. позиция сайта` and `Топ позиций конкурентов`
    - recompute `competitors_top10_count`
    - recompute `opportunity_score`
    - re-sort by score/count/wordstat/word
    - apply saved `result_limit` from the run
    - rebuild visible competitor columns and row count.
- Validation: Python syntax checks passed; `npx tsc --noEmit` passed.
## [2026-04-21] - Fixed local filter behavior and min-site options
- UI: removed `> 50` option from both `Мин. позиция сайта` selectors in `frontend/src/App.tsx`:
  - analysis settings block
  - local table filter block
- Backend: fixed data collection scope for local competitor-top filter in `backend/main.py`:
  - competitor keywords are now fetched up to top 50 (`max_pos=50`) regardless of run filter value.
  - This allows local `Топ позиций конкурентов` filter to truly recalculate/rebuild table for 10/20/30/50 without extra API calls.
- Validation: `npx tsc --noEmit` passed; Python syntax check passed.
## [2026-04-21] - Verified competitor-top local filter dependency and added UX warning
- Checked full data path:
  - backend now fetches competitors up to top 50 (`backend/main.py`, `max_pos=50`)
  - API returns `table_pool_data`
  - frontend local recalculation uses `table_pool_data` first, fallback to `table_data`
- Added UX warning in `frontend/src/App.tsx` near local `Топ позиций конкурентов` filter:
  - if `table_pool_data` is missing, show that filter works in limited mode and requires a new run on updated backend.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Added >40 option for min site position
- Updated `Мин. позиция сайта` options in `frontend/src/App.tsx` to include `> 40` in both places:
  - analysis settings block
  - local filter block above final table
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Presets updated and default switched to Fast
- Updated preset values in `frontend/src/App.tsx`:
  - `Быстрый`: competitors=10, site pages=10, competitor pages=10, result limit=500
  - `Баланс`: competitors=15, site pages=20, competitor pages=15, result limit=1000
  - `Глубокий`: competitors=20, site pages=30, competitor pages=20, result limit=2000
- Set default active preset to `Быстрый`.
- Synced initial form settings with `Быстрый` values.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Reordered analysis form fields
- In startup form (`frontend/src/App.tsx`), moved these fields to the end of settings list:
  - `Топ позиций конкурентов`
  - `Мин. позиция сайта`
- They now appear after `Макс. строк в таблице`.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Removed backend hard competitor-top filter for table_data
- Updated `backend/services/analyzer.py` to stop dropping rows by `competitors_top10_count > 0` on backend.
- Now positions `11-50` are not hard-cut from backend `table_data`.
- Intended behavior: filtering by competitor top range is handled in interactive local table filters in UX.
- Validation: Python syntax check passed; `npx tsc --noEmit` passed.
## [2026-04-21] - Root cause check for competitor-top local filter
- Investigated why `Топ позиций конкурентов` seemed not to change table.
- Found active backend instance was effectively serving old response shape (no `table_pool_data`) due SQLite `disk I/O error` in project path.
- Fix:
  - switched DB storage path to temp dir in `backend/database.py` (`%TEMP%/keyso-analiz-key-storage/sql_app.db`).
  - restarted backend successfully.
- Verification (`/api/analyze`): response now includes `table_pool_data` and local top-range counts differ:
  - top10: 26
  - top20: 38
  - top30: 44
  - top50: 55
- Conclusion: local filter recalculation now has full source pool and can change table as expected after a new analysis run.
## [2026-04-21] - Highlighted analyzed domain column in final table
- Updated `frontend/src/components/ResultTable.tsx`:
  - analyzed site column (first domain in `domains`) is now highlighted with pale blue background
  - applies to both header and body cells
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Renamed depth fields in startup form
- In `frontend/src/App.tsx` renamed labels:
  - `Страниц для сайта` -> `Глубина для сайта`
  - `Страниц для конкурентов` -> `Глубина для конкурентов`
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Fixed table competitor positions visibility by local top filter
- Updated local table recalculation in `frontend/src/App.tsx`.
- When `Топ позиций конкурентов` changes, competitor positions above selected top are now masked to `101` (displayed as `-` in table).
- Result: table now hides non-matching competitor positions, not only rows.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Reordered startup form: site depth first
- In `frontend/src/App.tsx`, moved `Глубина для сайта` to the first position in the analysis settings grid.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Removed start-form top/min filters and set table defaults
- In `frontend/src/App.tsx` removed from startup form:
  - `Топ позиций конкурентов`
  - `Мин. позиция сайта`
- Removed these fields from startup settings/presets and from `/api/analyze` payload.
- Control remains only in local filters near final table.
- Default local filter values are now reset on each analysis run to:
  - `Топ позиций конкурентов`: `1-10`
  - `Мин. позиция сайта`: `> 10`
- Validation: `npx tsc --noEmit` passed.
## [2026-04-21] - Expanded Pandas processing status details
- Updated pending status steps in `frontend/src/App.tsx`.
- Replaced single generic `Обрабатываем данные в Pandas...` with detailed sub-steps:
  - normalize positions + dedup
  - join site and competitor phrases
  - calculate `[!Wordstat]` and competition metrics
  - build and sort final table
- Validation: `npx tsc --noEmit` passed.
## [2026-04-22] - Added TOP50 competitors threshold logic and 'All' min-site option
- Startup form (`frontend/src/App.tsx`): added field `Запросы за ТОП50, конкуренты` with values `3, 5, 7, 10, 12` (default `3`).
- Table filter block: `Мин. позиция сайта` now includes `Все` option.
- Local recalculation logic updated:
  - standard rows: main site has position and passes min-site filter + at least one competitor in selected top range.
  - additional rows: main site has no position, but competitors in top-10 count is >= `Запросы за ТОП50, конкуренты` threshold.
- Implementation is done as separate local computation in existing table rebuild flow (no extra API request).
- Validation: `npx tsc --noEmit` passed.
## [2026-04-22] - Included competitor-only keywords in table pool
- Fixed backend pool assembly in `backend/services/analyzer.py`.
- `table_pool_data` now uses outer join of site + competitors, so rows with no analyzed-site position are included.
- This enables local table logic to show additional rows where site has no position but competitors satisfy TOP-10 threshold (`Запросы за ТОП50, конкуренты`).
- Validation: Python syntax check passed.
## [2026-04-22] - Adjusted TOP50 no-site logic in local table filters
- Updated `frontend/src/App.tsx` local filtering semantics:
  - "site has position" for main filter now means position in TOP50 (`<= 50`)
  - "no site position in TOP50" now means position `> 50` or missing
- Additional inclusion rule now applies to TOP50-out rows:
  - include if competitors in TOP10 count >= `Запросы за ТОП50, конкуренты`
- For such rows, analyzed-site column is masked to `101` (displayed as `-`) to match "no TOP50 position" behavior in table.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-22] - Added dedicated competitor-only merge stage in backend pipeline
- Implemented separate competitor-only processing stage in `backend/services/analyzer.py`:
  - Builds `competitor_only_selected` from combined competitor exports.
  - Condition: no TOP50 position for analyzed site (`site_pos > 50`) and competitors in TOP10 >= `top50_competitors_min`.
- Then merges competitor-only rows with dataset after main competitor filter.
  - New stage: `after_competitor_merge`.
  - Deduplicates by `word` after merge (keeps highest-priority row).
- Restored backend `after_competitor_filter` as explicit filter (`competitors_top10_count > 0`) for main-site branch before merge.
- Extended request schema:
  - `top50_competitors_min` added to `AnalyzeRequest` (`backend/schemas.py`).
- Frontend integration (`frontend/src/App.tsx`):
  - Sends `top50_competitors_min` from startup field.
  - Added new stage labels in `Результаты по стадиям`:
    - `Конкурентные ключи без ТОП50 сайта`
    - `После объединения с конкурентными ключами`
- Validation: Python syntax checks passed; `npx tsc --noEmit` passed.
## [2026-04-22] - Added competitors count option 3
- Updated startup form in `frontend/src/App.tsx`:
  - `Количество конкурентов` now includes `3` (options: `3, 5, 10, 15, 20`).
- Backend already supports this value (`competitors_limit` is `ge=1, le=20` in `backend/schemas.py`), so processing works without additional backend changes.
- Validation: `npx tsc --noEmit` passed.
## [2026-04-22] - Default final table sorting updated
- Updated `frontend/src/components/ResultTable.tsx` default sorting:
  - key: `Top-10 competitors` (`competitors_top10_count`)
  - direction: descending
- Validation: `npx tsc --noEmit` passed.
## [2026-04-22] - Added manual competitors input in startup form
- Frontend (`frontend/src/App.tsx`):
  - Added multi-line field `Конкуренты вручную` (5 rows + scroll, resizable).
  - One domain per line.
  - Values are parsed and deduplicated before request (`manual_competitors`).
- Backend:
  - `backend/schemas.py`: added `manual_competitors: List[str]` to `AnalyzeRequest`.
  - `backend/main.py`:
    - added domain normalizer helper.
    - manual competitors are normalized and merged on top of API competitors.
    - deduplication applied; analyzed domain excluded.
    - competitor data fetch now runs for combined list.
- Validation: Python syntax checks passed; `npx tsc --noEmit` passed.
## [2026-04-22] - Domain input now accepts full URLs and auto-normalizes
- Frontend (`frontend/src/App.tsx`):
  - Added `normalizeDomainInput` helper.
  - Domain field now accepts values like `https://www.scp-garant.ru/`.
  - On blur, value is auto-normalized to clean domain (e.g. `scp-garant.ru`).
  - Validation now uses normalized value.
  - Updated field hint and placeholder accordingly.
- Backend (`backend/main.py`):
  - Normalizes request domain via `_normalize_domain` before processing.
  - Uses normalized domain for Keys.so calls, dedup/exclusion checks, history save, and response.
  - Returns `400 Invalid domain` if normalized domain is empty.
- Validation: Python syntax check passed; `npx tsc --noEmit` passed.
## [2026-04-22] - Added competitors count option 0 with manual-only mode
- Startup form (`frontend/src/App.tsx`):
  - `Количество конкурентов` now includes `0`.
  - Added UX validation: when value is `0`, at least one domain must be set in `Конкуренты вручную`.
  - Run button is disabled until this condition is satisfied.
- Frontend payload now sends parsed `manual_competitors` array from textarea.
- Backend:
  - `backend/schemas.py`: `competitors_limit` lower bound changed to `0`.
  - `backend/main.py`:
    - if `competitors_limit == 0`, API competitors are not requested.
    - only manual competitors are used.
    - if `competitors_limit == 0` and manual list is empty, API returns `400` with explicit message.
- Validation: Python syntax checks passed; `npx tsc --noEmit` passed.
## [2026-04-22] - Excel export formatting + Copy action in table header
- Backend (`backend/main.py`) export improvements:
  - In exported Excel, position values `> 100` are replaced with `-`.
  - Renamed export columns:
    - `word` -> `Запросы`
    - `[!Wordstat]` -> `частотность`
    - `competitors_top10_count` -> `Конкурентов в ТОП`
    - `opportunity_score` -> `Приоритет`
- Frontend (`frontend/src/App.tsx`):
  - Added `Скопировать` action before `Скачать Excel`.
  - Copies current filtered table (with same column naming for main metrics) to clipboard as tab-separated text.
  - Position values `> 100` are copied as `-`.
- Validation: Python syntax check passed; `npx tsc --noEmit` passed.
## [2026-04-22] - Capitalized frequency label
- Updated export/copy label from `частотность` to `Частотность`.
- Files:
  - `backend/main.py` (Excel column rename)
  - `frontend/src/App.tsx` (copy-to-clipboard header label)
## [2026-04-22] - Added 3 visual UI themes (Clean / Executive / Data-Dense)
- Frontend visual theming implemented in `frontend/src/App.tsx`, `frontend/src/components/ResultTable.tsx`, `frontend/src/index.css`.
- Added theme switcher in the top block with 3 options:
  - `Чистый Analytics`
  - `Analytics + Executive`
  - `Analytics + Data-Dense`
- Theme selection now updates UI without re-running analysis.
- Added style tokens and reusable semantic classes for cards, inputs, buttons, links, chips.
- Added table-level variant support:
  - `executive`: stronger contrast and premium accents
  - `dense`: reduced paddings and tighter typography for large datasets
- Updated base typography for UI themes via Google Fonts imports.
- Validation: `npm run build` passed.
## [2026-04-22] - Excel export frequency header normalization
- Backend export (`/api/export/{analysis_id}`) hardened to always normalize frequency header to `Частотность`.
- Added fallback column rename mapping: `частотность` -> `Частотность` in `backend/main.py`.
## [2026-04-22] - Clipboard export: rounded priority
- Frontend copy-to-clipboard logic updated in `frontend/src/App.tsx`.
- Column `Приоритет` (`opportunity_score`) is now rounded to integer when copying table data.
## [2026-04-22] - Copy success indicator in table header
- Frontend (`frontend/src/App.tsx`): after successful `Скопировать`, a green check mark appears near the link and auto-hides after 3 seconds.
- Added timeout cleanup on unmount to avoid stale timers.
## [2026-04-22] - Status log decomposition for final table stage
- Frontend status flow in `frontend/src/App.tsx` updated: final generic step was decomposed into detailed actions.
- Added explicit steps for wordstat calculation, priority metrics, pool creation, site/competitor filters, sorting, and result limiting.
## [2026-04-22] - Fixed copy checkmark behavior and LAN clipboard fallback
- Frontend (`frontend/src/App.tsx`): copy success checkmark is now reset at new analyze start, so it no longer appears after loading results from previous copy action.
- Added robust clipboard fallback via hidden textarea + `document.execCommand("copy")` for contexts where `navigator.clipboard` is unavailable (e.g. some LAN/non-secure access cases).
- Success checkmark now reflects real copy success and hides after 3 seconds as expected.
- Validation: `npm run build` passed.
## [2026-04-23] - Domain headers in final table no longer hard-truncated
- Updated `frontend/src/components/ResultTable.tsx`.
- Removed hardcoded `substring(...)+...` truncation for domain columns.
- Domain headers now use CSS ellipsis based on actual column width (`overflow-hidden text-ellipsis whitespace-nowrap`), so expanding a column reveals the full domain.
## [2026-04-23] - Competitor exclusion form and API refill logic
- Added new request field `excluded_competitors` in `backend/schemas.py`.
- Backend (`backend/main.py`) now supports exclusion algorithm for API competitors:
  - fetches competitors from API,
  - removes excluded domains,
  - if not enough competitors remain, re-requests with larger limit,
  - keeps API order and takes first N according to `competitors_limit`.
- Excluded domains are also applied to final merged competitor list (including manual competitors).
- Frontend (`frontend/src/App.tsx`):
  - Added new textarea `Исключить конкуренты` to the right of `Конкуренты вручную`.
  - Default exclusion list prefilled with marketplaces/classified domains requested by user.
  - Sends `excluded_competitors` in `/api/analyze` payload.
- Validation:
  - Backend syntax parse check passed.
  - Frontend `npm run build` passed.
- Runtime:
  - Backend restarted in hidden mode on port `8000` with updated logic.
- Note: Exclusion list now supports default marketplace domains and API refill selection order.
## [2026-04-23] - History modal with saved analyses restore
- Added persistent analysis snapshot storage in backend history records (`analysis_history.data` now stores full payload for new analyses).
- Backend updates (`backend/main.py`, `backend/schemas.py`):
  - `GET /api/history` now returns compact list items (`id`, `domain`, `base`, `created_at`, `rows_count`).
  - Added `GET /api/history/{analysis_id}` to restore full analysis payload for UI.
  - Added backward compatibility for old history rows where `data` contains only table rows list.
  - Export endpoint now supports both old and new history data formats.
- Frontend updates (`frontend/src/App.tsx`):
  - Added `История` link in header, aligned right on `h1` line.
  - Added history modal with domain filter field and list of saved checks.
  - Added restore action per row to load saved analysis back into interface.
  - Restored item updates domain/base in form and renders saved tables/diagnostics/stages.
- Validation:
  - Backend syntax parse passed.
  - Frontend build passed.
  - Runtime check: `/api/status`, `/api/history`, and frontend route respond successfully.
## [2026-04-23] - History restore fallback for legacy backend
- Frontend (`frontend/src/App.tsx`) now supports restoring history even when backend does not expose `/api/history/{id}`.
- On restore 404, UI falls back to data from `/api/history` item payload (`data`) and reconstructs analysis in-browser.
- Added normalization for mixed history formats (new compact rows + legacy full rows).
- Frontend rebuilt and restarted in hidden mode.
## [2026-04-23] - History control styled as button
- Updated header control `История` in `frontend/src/App.tsx` from text-link style to button style consistent with other UI controls.

## Date
2026-04-30

## Summary of Changes
- Added production-ready Docker deployment files for server launch via Docker Compose.
- Added backend container build that also compiles frontend and serves it through FastAPI static files.
- Documented server deployment flow for STUDENT environment and GitHub-to-server setup.

## Files Changed
- `docker-compose.yml`
- `backend/Dockerfile`
- `backend/.env.example`
- `.env.example`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- `backend/.env` must be created manually on server and contain a valid `KEYSO_TOKEN`; without it `/api/analyze` returns `500`.
- Current backend uses SQLite in temp directory (`/tmp` inside container), so history data is not durable across container recreation.
- `APP_PORT` must match the student's assigned port from server instructions.

## Validation Performed
- Verified added Docker files and compose mapping format: `127.0.0.1:${APP_PORT:-8101}:8000`.
- Verified README now includes deployment and verification commands for server workflow.

## Next Steps
- On server, clone repo in `/srv/seovibe/<user>/app`, create `.env` files, run `docker compose up -d --build`.
- Run smoke checks: `docker compose ps`, `curl -i http://127.0.0.1:<port>/api/status`, then open external student URL.
- Optionally add a persistent volume and stable DB path for long-term history retention.

## Date
2026-05-13

## Summary of Changes
- Added an isolated authorization module under `backend/auth_module` with plug-in style integration to FastAPI via middleware and dedicated auth routes.
- Implemented secure 30-day session cookies and login page flow without modifying existing business endpoints/controllers.
- Added security controls: brute-force protection (rate limiting on login attempts), CSRF token generation/validation, output escaping in HTML template, and password hashing with bcrypt.
- Added default funny seed user for test login.

## Files Changed
- `backend/main.py`
- `backend/requirements.txt`
- `backend/auth_module/__init__.py`
- `backend/auth_module/config.py`
- `backend/auth_module/integration.py`
- `backend/auth_module/middleware.py`
- `backend/auth_module/models.py`
- `backend/auth_module/routes.py`
- `backend/auth_module/security.py`
- `backend/auth_module/service.py`
- `backend/auth_module/templates.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Auth middleware currently protects `/` and `/api*` paths; if public API endpoints are needed, add them to `excluded_paths` in auth config.
- Cookie `Secure` is enabled only when request is HTTPS (or `X-Forwarded-Proto: https`), so local HTTP development keeps cookie usable but less strict.
- Seed user credentials are static and for demo only; they must be replaced in production.

## Validation Performed
- Backend syntax check: `python -m compileall backend` passed.
- App import smoke test from backend: `from main import app` succeeded.

## Next Steps
- Run backend and verify full login flow in browser: `/auth/login` -> submit -> access `/` and `/api/*`.
- Replace seed credentials with environment-driven provisioning for production.
- Optionally add role/permission support if selective endpoint protection is required.

## Date
2026-05-13

## Summary of Changes
- Updated default seed credentials in auth module per request (values intentionally not documented in handoff).

## Files Changed
- `backend/auth_module/service.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Credentials are hardcoded for local/test bootstrap and must not be documented in plaintext.
- Existing previously created seed user in DB is not auto-renamed; for immediate effect on old DB, clear `auth_users` table or rotate user manually.

## Validation Performed
- Verified credential constants updated in source and removed plaintext credentials from docs.

## Next Steps
- Restart backend to apply updated seed logic.
- If old seed user already exists in DB, delete it and let module recreate user on startup.

## Date
2026-05-13

## Summary of Changes
- Sanitized documentation by removing explicit auth login/password from `README.md`.
- Kept authorization system documentation (architecture, protections, cookie policy) without exposing credentials.

## Files Changed
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Seed credentials still exist in source code for bootstrap and should be moved to env-based provisioning for production.

## Validation Performed
- Checked `README.md` now documents auth module behavior without plaintext credentials.

## Next Steps
- Move seed user provisioning to environment variables and remove hardcoded defaults from code.

## Date
2026-05-13

## Summary of Changes
- Switched auth seed provisioning to environment-driven mode with support for bcrypt hash input.
- Added `AUTH_SEED_USERNAME`, `AUTH_SEED_PASSWORD_HASH`, and optional `AUTH_SEED_PASSWORD` to backend env example.
- Updated README with explicit secure setup flow and hash generation command.

## Files Changed
- `backend/auth_module/service.py`
- `backend/.env.example`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- If `auth_users` already contains the seed user, changing env credentials does not overwrite existing DB row automatically.
- Plaintext `AUTH_SEED_PASSWORD` is still supported as fallback; production should use hash only.

## Validation Performed
- Python compile check passed for backend after changes.
- Verified docs now describe env-based secure credential setup.

## Next Steps
- Set `AUTH_SEED_USERNAME` and `AUTH_SEED_PASSWORD_HASH` in `backend/.env`.
- Remove or rotate existing `auth_users` seed entry if credential change should take effect immediately.

## Date
2026-05-13

## Summary of Changes
- Removed utility script `set_auth_user.py` per request.
- Removed script references from project documentation.
- Wrote actual auth seed credentials configuration to `backend/.env` using login + bcrypt hash.

## Files Changed
- `backend/.env`
- `README.md`
- `handoff.md`
- `scripts/set_auth_user.py` (deleted)

## Risks / Known Issues
- Existing DB user rows are not automatically overwritten just by changing `.env`; if user already exists in `auth_users`, rotate/update DB row manually.
- `backend/.env` contains sensitive auth settings and must never be committed.

## Validation Performed
- Verified no `set_auth_user.py` mentions remain in markdown docs.
- Verified `backend/.env` now includes `AUTH_SEED_USERNAME` and `AUTH_SEED_PASSWORD_HASH`.

## Next Steps
- Restart backend so env changes are applied to new bootstrap runs.
- If old auth user exists, remove/update corresponding row in `auth_users`.

## Date
2026-05-13

## Summary of Changes
- Reworked auth flow to remove seed credentials from env/bootstrap.
- Added env-based password pepper hash (`AUTH_PASSWORD_PEPPER_HASH`) used during password hashing/verification.
- Implemented first-login bootstrap behavior: when `auth_users` is empty, credentials submitted in login form create the first user.
- Cleared auth tables (`auth_users`, `auth_sessions`, `auth_login_attempts`) and restarted backend.

## Files Changed
- `backend/auth_module/security.py`
- `backend/auth_module/service.py`
- `backend/auth_module/routes.py`
- `backend/auth_module/integration.py`
- `backend/.env.example`
- `backend/.env`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Rotating `AUTH_PASSWORD_PEPPER_HASH` invalidates password verification for existing user hashes.
- First submitted login credentials become the canonical first account when DB is empty.

## Validation Performed
- Cleared auth tables and confirmed `auth_users` count is `0`.
- Restarted backend and verified `/api/status` and `/auth/login` return `200`.

## Next Steps
- Open `/auth/login` and submit desired login/password once to initialize first account.
- Store `AUTH_PASSWORD_PEPPER_HASH` securely and do not rotate without planned credential reset.

## Date
2026-05-13

## Summary of Changes
- Added a dedicated deployment runbook for the actual working flow: local push to GitHub, SSH login, server-side update, and service restart.
- Linked the new runbook from `README.md` so it is discoverable from the main docs.

## Files Changed
- `DEPLOY_GUIDE.md`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- The guide assumes deployment path `/srv/seovibe/vb/repos/keyso-analizkon-key` and alias `ssh seovb`; if paths/alias change, commands must be adjusted.
- Deploy script health-check can briefly fail during immediate container restart; a short retry is usually enough.

## Validation Performed
- Verified the deployment guide file is present with end-to-end commands.
- Verified `README.md` references `DEPLOY_GUIDE.md`.

## Next Steps
- Optionally mirror the same deploy guide in a `docs/` directory if team documentation expands.
- Keep commands in `DEPLOY_GUIDE.md` aligned with any future infra/path changes.

## Date
2026-05-13

## Summary of Changes
- Fixed auth runtime 500 on first login when `AUTH_PASSWORD_PEPPER_HASH` is long.
- Updated password payload logic to SHA-256 pre-hash `password + pepper` before bcrypt, keeping bcrypt input length safe.

## Files Changed
- `backend/auth_module/security.py`
- `handoff.md`

## Risks / Known Issues
- Existing password hashes from the previous pre-hash strategy become incompatible; with empty `auth_users` this is acceptable and expected.
- If auth users already existed before the fix, password reset/re-init may be required.

## Validation Performed
- Reviewed server logs: previous error was `ValueError: password cannot be longer than 72 bytes`.
- Applied fixed-length pre-hash mitigation in auth security module.

## Next Steps
- Deploy latest commit to server and retry first login flow via `/auth/login`.
- If needed, clear auth tables once more and initialize first account again.

## Date
2026-05-13

## Summary of Changes
- Reduced vertical padding in the final results table cells by 2x to make rows more compact.
- Kept horizontal padding unchanged so readability and column alignment remain stable.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Denser row height may feel tighter on smaller screens; if needed, can be adjusted separately per `variant`.

## Validation Performed
- Verified table padding classes now use separate `px`/`py` values and halve `py` compared to previous values.
- Confirmed change is scoped to the final results table component only.

## Next Steps
- Open the results page and visually confirm reduced top/bottom spacing in both normal and dense table variants.

## Date
2026-05-13

## Summary of Changes
- Further compacted final results table row height after visual feedback.
- Reduced vertical paddings one step more: normal variant `py-2 -> py-1.5`, dense variant `py-1.5 -> py-1`.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- On some displays, very dense rows can reduce perceived readability for long sessions.

## Validation Performed
- Verified updated Tailwind utility classes in table cell/header padding constants.
- Confirmed change remains local to the final results table component.

## Next Steps
- Rebuild/restart the serving frontend path (Docker/app) and hard-refresh browser cache to apply the new classes.

## Date
2026-05-13

## Summary of Changes
- Added new first column `N` to the final results table with inline editable inputs (up to 3 digits).
- Implemented autosave on every typed symbol for `N` values via `localStorage`.
- Added sorting support by `N` column and included `N` in table copy-to-clipboard export.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- `N` values are stored per `analysis_id` in browser `localStorage` only (device/browser-specific, not server-synced).
- Rows are identified by `word`; duplicate words in one table share the same `N` value key.

## Validation Performed
- Checked TypeScript/lint diagnostics for modified frontend files: no errors.
- Ran frontend production build (`npm run build`): passed.
- Verified `N` is included in `ResultTable` props, render path, sorting, and clipboard export formatter.

## Next Steps
- Verify in UI: type values in `N`, refresh page, confirm values persist and sorting by `N` works both directions.
- If cross-device persistence is needed, add backend API fields/storage for `N` values.

## Date
2026-05-13

## Summary of Changes
- Renamed the service display name in UI header to `Поиск конкурентов и запросов для КП`.
- Updated page browser title (`frontend/index.html`) to the same new name.
- Synced backend FastAPI app title to keep API docs/service naming consistent.

## Files Changed
- `frontend/src/App.tsx`
- `frontend/index.html`
- `backend/main.py`
- `handoff.md`

## Risks / Known Issues
- Browser tab title may remain stale until hard refresh if old assets are cached.

## Validation Performed
- Verified string replacements in frontend header and HTML `<title>`.
- Verified FastAPI app title update in backend initialization.

## Next Steps
- Rebuild/restart app (or dev server) and hard-refresh browser to confirm the new name is visible in both header and tab title.

## Date
2026-05-13

## Summary of Changes
- Fixed sticky alignment mismatch between `Keyword` header cell and keyword data cells in final results table.
- Set `Keyword` header sticky offset to start after the `N` column width, eliminating bleed-through of hidden header text during horizontal scroll.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- If `N` column width is manually resized very small/large, sticky layering still depends on current z-index order (`N` over `Keyword`).

## Validation Performed
- Verified `Keyword` `<th>` now uses the same computed left offset basis (`nColWidth`) as keyword `<td>`.
- Checked lints for modified table component: no errors.

## Next Steps
- Confirm in UI: horizontal scroll no longer reveals hidden `Keyword` header edge and column borders remain visually aligned.

## Date
2026-05-13

## Summary of Changes
- Renamed final table column header from `Keyword` to `Запросы` for Russian UI consistency.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- No functional risk; text label only.

## Validation Performed
- Verified header label text replacement in final results table component.

## Next Steps
- Refresh UI and confirm first text column header is displayed as `Запросы`.

## Date
2026-05-13

## Summary of Changes
- Switched local dev backend port from `8000` to free port `8002` due to conflict on `8000`.
- Updated Vite proxy target to `http://127.0.0.1:8002` so frontend `/api/*` continues to work without code changes in API calls.
- Started local backend and frontend dev servers with working proxy route.

## Files Changed
- `frontend/vite.config.ts`
- `handoff.md`

## Risks / Known Issues
- Frontend default port `5173` is occupied by another process, so Vite runs on `5174` in this session.
- If `8002` becomes busy later, proxy target/launch port must be adjusted again.

## Validation Performed
- Verified backend startup on `http://127.0.0.1:8002`.
- Verified frontend startup on `http://127.0.0.1:5174`.
- Verified proxied health check `http://127.0.0.1:5174/api/status` returns `200` with status payload.

## Next Steps
- Open `http://127.0.0.1:5174` and hard refresh page to validate latest UI labels/table changes.

## Date
2026-05-13

## Summary of Changes
- Updated auth login HTML page title to match new service naming.
- Login page `<title>` is now `Поиск конкурентов и запросов для КП — Авторизация`.

## Files Changed
- `backend/auth_module/templates.py`
- `handoff.md`

## Risks / Known Issues
- No functional impact; title-only change.

## Validation Performed
- Verified title replacement in auth template source.

## Next Steps
- Refresh `http://127.0.0.1:8002/auth/login` and confirm browser tab title shows the new text.

## Date
2026-05-13

## Summary of Changes
- Added drag-and-drop reordering for competitor columns in the final results table.
- Reordering is limited to competitor headers; fixed/system columns remain unchanged.
- Added persistence of competitor column order in `localStorage` per `analysis_id`.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- Drag behavior uses native HTML5 DnD; UX can vary slightly between browsers.
- Saved order is browser-local and tied to a specific analysis id.

## Validation Performed
- Verified no linter errors in modified frontend files.
- Ran frontend build (`npm run build`): passed.
- Confirmed reorder callback flow and localStorage keys for persisted order.

## Next Steps
- In UI, drag competitor headers to a new position and refresh page to confirm order is retained.

## Date
2026-05-13

## Summary of Changes
- Restored default competitor ordering behavior: by found-count descending (best match to worst) from left to right.
- Kept manual drag-and-drop ordering as an override that applies only after user reorders columns.
- Added explicit custom-order flag state to distinguish default auto-sorting from user-defined order.

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- If an older saved custom order exists in localStorage for the same analysis id, it will still be applied as intended.

## Validation Performed
- Checked lints for updated app file: no errors.
- Ran frontend build (`npm run build`): passed.
- Verified order logic path: default sort by count, custom order only when user has reordered.

## Next Steps
- Open results table: confirm initial competitor order is by descending found-count; drag a column and ensure custom order persists after refresh.

## Date
2026-05-13

## Summary of Changes
- Enabled wrapping for domain names in competitor column headers to improve manual column resizing with long domain strings.
- Removed single-line truncation behavior for domain header text in final results table.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Header row height can increase for very long domain names due to wrapping.

## Validation Performed
- Checked lints for updated table component: no errors.
- Verified domain header span now allows multiline wrapping (`whitespace-normal` + `break-all`).

## Next Steps
- In UI, resize a competitor column with a long domain name and confirm header text wraps instead of blocking further narrowing.

## Date
2026-05-13

## Summary of Changes
- Reduced left/right padding in domain-name header cells by 2x to make competitor columns more compact.
- Applied this only to domain headers, keeping other table header paddings unchanged.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Narrower side paddings can make drag handle proximity feel tighter on very small column widths.

## Validation Performed
- Lint check for modified table component: no errors.
- Verified dedicated domain header padding class now uses half horizontal spacing.

## Next Steps
- In UI, confirm domain header cells have visibly smaller side paddings and still allow resize/drag actions comfortably.

## Date
2026-05-13

## Summary of Changes
- Added a new "Хотелки" feature with backend persistence and frontend modal management UI.
- Added `service_wishes` DB model and API endpoints for list/create/edit/toggle actions.
- Added header button `Хотелки` (left of `История`) opening modal `Список предложений по сервису`.
- Implemented row visuals by status: checked rows have greenish background, unchecked rows yellowish.
- Added per-row edit action/icon, checkbox toggle (reversible), and 5-line input with `Отправить` for new wishes.
- Implemented backend-driven ordering where checked items are returned below unchecked after refresh.

## Files Changed
- `backend/models.py`
- `backend/schemas.py`
- `backend/main.py`
- `frontend/src/App.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Current wish ordering inside each status group uses `sort_order` and insertion sequence; no drag-reorder for wishes yet.
- Existing running backend process must be restarted to pick up new API/model changes.

## Validation Performed
- Backend syntax validation: `python -m compileall .` passed.
- Frontend lints: no errors in changed files.
- Frontend production build (`npm run build`) passed.

## Next Steps
- Restart backend process and verify `/api/wishes` endpoints with UI modal.
- Open `Хотелки` modal: add/edit/toggle items and confirm persistence + checked items move below unchecked after reload.

## Date
2026-05-13

## Summary of Changes
- Fixed wishes submission issue in dev mode by proxying `/auth` to backend in Vite config, so auth/session flow stays on the same host path.
- Updated wishes modal layout: moved `Отправить` button below the 5-line input and kept it right-aligned.

## Files Changed
- `frontend/vite.config.ts`
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- Dev server restart is required for updated Vite proxy rules to take effect.

## Validation Performed
- Verified lints for modified frontend files: no errors.
- Ran frontend build (`npm run build`): passed.
- Confirmed `/api/wishes` endpoint is reachable and responds from backend session context after proxy alignment.

## Next Steps
- Restart frontend dev server and re-login if needed.
- Open `Хотелки` and verify `Отправить` no longer returns Method Not Allowed.

## Date
2026-05-13

## Summary of Changes
- Added support for collecting competitors from live Yandex SERP by user-provided queries.
- Added new frontend block `Из выдачи Яндекса` under manual competitors:
  - textarea for up to 10 queries (one per line),
  - duplicate/empty query cleanup before submit,
  - Yandex region selector with city-name search (default Moscow 213).
- Implemented backend SERP flow:
  - task creation (`POST /serp`),
  - status polling (`GET /serp/{id}/status`, timeout 60s),
  - result fetch (`GET /serp/{id}?organic=true`),
  - domain normalization, dedupe, stop-list exclusion, own-domain exclusion,
  - merge into competitors list with source marker `serp`.
- Extended analyze response and history payload with:
  - `competitor_sources`,
  - `serp_summary`,
  - `serp_progress`.
- Added UI progress integration:
  - log lines for SERP stage,
  - progress bar under run button,
  - summary card `Найдено конкурентов из SERP`,
  - `SERP` badge in competitor column headers for domains sourced from SERP.

## Files Changed
- `backend/services/keys_so.py`
- `backend/schemas.py`
- `backend/main.py`
- `frontend/src/App.tsx`
- `frontend/src/components/ResultTable.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Exact payload structure of Keys.so SERP endpoints can vary by account/version; fallback parsing was added but may require adjustment on real responses.
- Region list currently uses predefined popular IDs; for full Yandex regions coverage a dedicated regions source endpoint/file should be integrated.

## Validation Performed
- Backend syntax check: `python -m compileall .` passed.
- Frontend lints on changed files: no errors.
- Frontend production build (`npm run build`) passed.

## Next Steps
- Run end-to-end test with real KEYSO token and several SERP queries (including duplicates and >10 validation).
- Verify SERP progress messages and resulting added competitors count in UI.
- If needed, expand region dataset to full Yandex regions list and add dedicated API/cache for it.

## Date
2026-05-13

## Summary of Changes
- Replaced limited hardcoded SERP region options with a full local Yandex regions catalog for region selection.
- Added generated static data file `frontend/src/data/yandexRegions.ts` (738 unique region entries with id+label).
- Connected the analyzer form region search/select to the full catalog while keeping default region behavior (Moscow `213`).

## Files Changed
- `frontend/src/data/yandexRegions.ts`
- `frontend/src/App.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Source list is local/static and may lag behind future Yandex region updates unless periodically refreshed.
- Larger static catalog increases frontend bundle size.

## Validation Performed
- Frontend lint checks: no errors.
- Frontend production build (`npm run build`) passed after integration.
- Verified full catalog import is used by region filter/select in the SERP block.

## Next Steps
- Restart dev frontend and validate region search across multiple entries from different countries/levels.
- Optionally add a maintenance script to refresh `yandexRegions.ts` from a trusted source snapshot.

## Date
2026-05-13

## Summary of Changes
- Updated validation for `Количество конкурентов = 0` in analyzer form.
- Now submission is allowed when either:
  - at least one manual competitor domain is provided, or
  - at least one SERP query is provided in `Из выдачи Яндекса`.
- Updated helper error text to reflect both accepted input paths.

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- No backend risk; frontend validation-only change.

## Validation Performed
- Lint check for updated frontend file: no errors.
- Verified `requiresManualCompetitors` condition now includes `serpQueries.length === 0`.

## Next Steps
- UI check: set competitors count to 0 and confirm validation clears when SERP queries are filled (without manual domains).

## Date
2026-05-13

## Summary of Changes
- Synchronized backend `competitors_limit=0` validation with updated frontend behavior.
- Backend now allows analyze requests with zero API competitors when either manual competitors or SERP queries are provided.
- Updated backend error detail text to describe both valid input paths.

## Files Changed
- `backend/main.py`
- `handoff.md`

## Risks / Known Issues
- Requires backend process restart to apply updated validation logic.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for backend file: no issues.

## Next Steps
- Restart backend and rerun analyze with `competitors_limit=0` + filled SERP queries only.

## Date
2026-05-13

## Summary of Changes
- Removed emoji symbols from SERP progress log messages shown in `Статус выполнения`.
- Kept the same informational text and sequencing without visual emoji markers.

## Files Changed
- `backend/main.py`
- `handoff.md`

## Risks / Known Issues
- Requires backend restart to apply updated log text in runtime output.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for modified backend file: no issues.

## Next Steps
- Restart backend and verify status logs no longer include emoji characters.

## Date
2026-05-13

## Summary of Changes
- Diagnosed why SERP integration returned `0` domains for valid queries.
- Root cause: incorrect assumptions about Keys.so SERP API flow.
  - `POST /serp` returns empty array (`[]`) instead of task id.
  - readiness status is based on `batches`/`batches_total`, not string status only.
- Fixed SERP client flow:
  - create task with documented payload wrapper `{"data": {...}}`,
  - assign unique task name and resolve created task id via `GET /serp` list,
  - poll readiness using `batches >= batches_total`,
  - keep fallback status parsing for compatibility.

## Files Changed
- `backend/services/keys_so.py`
- `handoff.md`

## Risks / Known Issues
- Task id resolution currently relies on matching unique generated task name in recent task list.
- Real SERP result volume still depends on API response quality and query/region combination.

## Validation Performed
- Live probe confirmed docs behavior: create response is `[]`.
- Backend compile check (`python -m compileall .`) passed.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Run end-to-end analyze with sample SERP query and verify non-zero domains on relevant high-frequency query.
- If needed, add debug mode to log SERP task id and batch progression per query.

## Date
2026-05-13

## Summary of Changes
- Fixed status-log step ordering in frontend analyze progress.
- Moved `Собираем данные конкурентов с учетом лимитов API...` to run after SERP stages, so displayed sequence matches actual pipeline dependencies.

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- This is UI progress-ordering only; backend execution flow unchanged.

## Validation Performed
- Lint check for updated frontend file: no errors.
- Verified step array now appends competitor data collection after optional SERP steps.

## Next Steps
- Run analysis with SERP queries and confirm status messages follow logical execution order.

## Date
2026-05-13

## Summary of Changes
- Added SERP result parser fallback for grouped response format (`{"<query>": [...]}`) in addition to list/data formats.
- Improved extraction of domains from SERP payload variants and kept top-20 filtering by position when present.
- This addresses cases where status showed `Получено 0 доменов...` due to format mismatch, not actual lack of results.

## Files Changed
- `backend/services/keys_so.py`
- `handoff.md`

## Risks / Known Issues
- If Keys.so returns another undocumented payload shape, additional parser branch may still be required.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for modified file: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Re-run the same query (`камеры видеонаблюдения`) and compare `Получено N доменов...` before/after.

## Date
2026-05-13

## Summary of Changes
- Reordered status-log timeline in frontend to match intended user-facing execution flow.
- Pre-response interval logs now cover only:
  - key collection,
  - competitor discovery,
  - SERP task stages,
  - competitor data collection.
- Post-processing pipeline logs (`Нормализуем...` through `Ограничиваем...`) are now appended after response together with SERP diagnostics, keeping visual sequence coherent.

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- Status log is representational (UX timeline), not exact backend event timestamps.

## Validation Performed
- Lint diagnostics for updated frontend file: no errors.
- Verified log-step split into pre-response and post-response blocks in mutation handlers/effect.

## Next Steps
- Run one analyze session and confirm status ordering matches expected scenario.

## Date
2026-05-13

## Summary of Changes
- Added temporary end-to-end SERP debug output to diagnose `0 domains` cases from `Из выдачи Яндекса`.
- Backend now returns per-query debug payload in `serp_debug` with:
  - query text,
  - task id,
  - readiness flag,
  - extracted domains count,
  - raw response metadata/sample (`payload_type`, keys, counts, and sample fragment).
- Frontend now renders a dedicated debug panel `DEBUG: сырые данные SERP API` with JSON output of `serp_debug`.
- Added exception detail capture to debug payload (`raw.error`) to simplify failure diagnostics.

## Files Changed
- `backend/services/keys_so.py`
- `backend/main.py`
- `backend/schemas.py`
- `frontend/src/App.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Debug output may contain large payload fragments, increasing response size and UI noise.
- This is a temporary diagnostic feature and should be removed after SERP parsing is validated.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed files: no issues.
- Backend health check: `GET /api/status` returned 200.

## Next Steps
- Run analyze with one or more SERP queries and inspect `serp_debug` block:
  - verify `ready=true`,
  - verify payload structure,
  - compare `domains_count` vs expected.
- After root cause confirmation, remove temporary `serp_debug` from backend schema/response and frontend panel.

## Date
2026-05-13

## Summary of Changes
- Investigated new debug output showing `ready=false` with `timeout_or_not_ready` for SERP task.
- Extended SERP status diagnostics and increased wait timeout:
  - added detailed status debug in polling (`reason`, `polls`, `elapsed_seconds`, last status snapshot),
  - included `batches/batches_total`, `status/state`, nested `data.status` in debug snapshot,
  - increased SERP wait timeout from 60s to 120s for real-world batch completion.
- Backend now returns this `status_debug` inside `serp_debug.raw` for both ready and not-ready cases.

## Files Changed
- `backend/services/keys_so.py`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Longer timeout increases per-query waiting time in slow SERP scenarios.
- If Keys.so status endpoint lags beyond 120s, query may still end with timeout.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for modified files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Re-run the same query and inspect `serp_debug.raw.status_debug`:
  - if `reason=timeout`, check last `batches/batches_total` progression,
  - if `reason=failed_status`, inspect status fields for terminal failure.
- Decide whether to raise timeout further or fetch partial results before full completion.

## Date
2026-05-13

## Summary of Changes
- Parsed user-provided debug output and identified Keys.so status endpoint behavior:
  - task is created, but `/status` remains non-informative (`batches=0`, `batches_total=0`, null statuses) until timeout.
- Implemented resilient fallback strategy for SERP readiness:
  - if `wait_serp_ready_with_debug` fails to reach ready state, backend now polls result endpoint (`/serp/{id}`),
  - as soon as result endpoint returns parseable payload (HTTP 200), extracted domains are accepted and used.
- Added fallback diagnostics in response:
  - `result_wait_debug` with reason/polls/elapsed and last result debug snapshot.

## Files Changed
- `backend/services/keys_so.py`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Fallback extends per-query runtime in worst-case scenarios (status timeout + result polling window).
- If both status and result endpoints stay stale, query still ends as failed.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Re-run the same SERP query and inspect debug:
  - expect `raw.status = fallback_result_used` when status is stale but result appears,
  - otherwise inspect `result_wait_debug.last_result_debug` payload shape for additional parser branch.

## Date
2026-05-13

## Summary of Changes
- Analyzed new debug payload:
  - status endpoint remained mostly unusable (`batches_total`/status fields not reaching a clear ready state),
  - result endpoint became available quickly but returned empty list for `organic=true`.
- Implemented deeper SERP result probing and parsing:
  - multi-variant result fetch attempts (`organic=true`, no params, `organic=false`),
  - per-variant debug collection in `variants`,
  - fallback domain extraction from `url`/`link` when `domain` field is missing.
- Updated fallback waiting logic:
  - ready by result only when domains are extracted,
  - separate terminal diagnostic reason when payload is structurally non-empty but yields zero domains.

## Files Changed
- `backend/services/keys_so.py`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Additional result variants increase API request count per SERP query.
- If Keys.so truly has no rows for the query/region/task, domains may still remain zero.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Re-run the same query and inspect `variants` in debug:
  - confirm whether any variant returns non-empty candidates,
  - if all variants are empty, likely upstream Keys.so returned no result rows for this task/query/region combination.

## Date
2026-05-13

## Summary of Changes
- Updated default values for `Исключить конкуренты`:
  - added `yabs.yandex.ru`
  - added `yandex.ru`
- Moved default excluded competitors list out of `App.tsx` into dedicated text file.
- Frontend now loads this list from `frontend/src/data/defaultExcludedCompetitors.txt` via Vite raw import.
- Added TS declaration for `*.txt?raw` imports.

## Files Changed
- `frontend/src/data/defaultExcludedCompetitors.txt`
- `frontend/src/App.tsx`
- `frontend/src/vite-env.d.ts`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Changing this txt file directly affects default form values for new sessions; verify domains before editing.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed frontend files: no issues.

## Next Steps
- Open UI and confirm the `Исключить конкуренты` field includes both new domains by default.

## Date
2026-05-13

## Summary of Changes
- Implemented unified default stop-list behavior between frontend and backend.
- Backend now loads default excluded domains from:
  - `frontend/src/data/defaultExcludedCompetitors.txt`
- These default domains are now always enforced on backend for all competitor sources:
  - API auto-competitors,
  - manual competitors input,
  - SERP-derived competitors.
- Updated manual competitors preprocessing so domains from enforced stop-list are ignored before validation/analysis.

## Files Changed
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Backend now depends on shared txt file path in frontend source tree; if file is moved/removed, backend falls back to hardcoded safe defaults.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend file: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Run an analysis with `yandex.ru` / `yabs.yandex.ru` present in manual or SERP sources and verify they do not appear in final competitors.

## Date
2026-05-13

## Summary of Changes
- Reverted forced backend default stop-list behavior per user clarification.
- Current behavior:
  - defaults from `defaultExcludedCompetitors.txt` are used only as initial UI prefill,
  - actual exclusion in analysis uses only domains currently present in form field `Исключить конкуренты` for this run.
- Kept txt-based defaults in frontend (no rollback there).

## Files Changed
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- If user deletes default domains from form before run, they will no longer be excluded (this is now intended behavior).

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend file: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Validate UI scenario:
  - run once with defaults untouched (domains excluded),
  - run once after deleting one default domain from field (that domain should be allowed in output).

## Date
2026-05-13

## Summary of Changes
- Added graceful error handling for invalid/unavailable competitor domains.
- Previous behavior: one broken competitor domain could stop entire analysis with error.
- New behavior:
  - each competitor domain fetch is wrapped in try/except,
  - failed competitor is skipped,
  - analysis continues for remaining competitors,
  - skipped domain list is added to progress log (`Пропущены недоступные конкуренты: ...`).

## Files Changed
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- If many competitors fail, output may contain fewer comparison columns than expected.
- Root causes of skipped domains are truncated in-memory (for stability) and currently not exposed in UI as separate structured diagnostics.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend file: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Validate with one intentionally invalid manual competitor domain and confirm analysis returns 200 with progress note about skipped domain.

## Date
2026-05-13

## Summary of Changes
- Removed temporary debug panel `DEBUG: сырые данные SERP API` from frontend interface.
- Removed `serp_debug` usage from frontend response typing and history payload hydration.
- Backend debug fields remain available in API payload for development diagnostics, but are no longer rendered in UI.

## Files Changed
- `frontend/src/App.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- No UI access to raw SERP debug now; for future diagnostics, debug must be viewed via API/network tools or re-enable panel temporarily.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed frontend file: no issues.

## Next Steps
- Verify analyze UI no longer contains debug block while core SERP summary/progress remains visible.

## Date
2026-05-13

## Summary of Changes
- Updated visual theme switcher in UI:
  - replaced 3 separate style buttons with a single dropdown (`select`),
  - renamed style labels to:
    - `Чистый`
    - `Executive`
    - `Data-Dense`
- Kept theme ids and behavior unchanged (`clean`, `executive`, `dense`), only changed UI control and labels.

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- None significant; this is a presentation-level UI control change.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed frontend file: no issues.

## Next Steps
- Validate in UI that style dropdown applies themes immediately and labels match requested naming.

## Date
2026-05-13

## Summary of Changes
- Added quick-fill behavior for column `N` in results table:
  - double-click on empty `N` cell now sets value to `1`.
- Existing autosave flow is reused (`onNChange`), so value persists same way as manual typing.
- Behavior is non-destructive:
  - if `N` cell already has a value, double-click does not overwrite it.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Double-click may trigger text selection in some browsers, but value change is still deterministic for empty fields.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Validate in UI:
  - empty `N` cell + double-click -> `1`,
  - non-empty `N` cell + double-click -> unchanged.

## Date
2026-05-13

## Summary of Changes
- Added new SERP setting in UI: number of domains to collect per query from Yandex SERP.
- UI:
  - new selector placed to the left of `Поиск региона`,
  - default value `10`,
  - available options: `10, 20, 30, 50, 100`.
- API/Backend:
  - added request field `serp_top_number`,
  - validation enforces allowed values (`10, 20, 30, 50, 100`),
  - `serp_top_number` is now passed to Keys.so `create_serp_task(topNumber=...)`.

## Files Changed
- `frontend/src/App.tsx`
- `backend/schemas.py`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Higher `serp_top_number` values can increase runtime and response volume for each query.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Validate manually with same query and different selector values (10 vs 50/100) to confirm impact on collected domains.

## Date
2026-05-13

## Summary of Changes
- Completed full API cleanup for temporary SERP debug field.
- Removed `serp_debug` from backend:
  - response schema (`AnalyzeResponse`),
  - history response builder (`_build_response_from_history_entry`),
  - runtime analyze payload/response.
- Preserved operational diagnostics via `serp_progress` text messages (without exposing raw debug structure).

## Files Changed
- `backend/schemas.py`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Raw structured SERP debug data is no longer available through API responses.
- Deep diagnostics now require temporary instrumentation or server-side logs.

## Validation Performed
- Search check: no `serp_debug` references remain under `backend/`.
- Backend compile check (`python -m compileall .`) passed.
- Lint diagnostics for changed backend files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Run one end-to-end analyze request and verify response contract contains `serp_summary` and `serp_progress` only (no `serp_debug`).

## Date
2026-05-13

## Summary of Changes
- Fixed domain validation bug for Cyrillic (IDN) domains such as `постройдом.рф`.
- Frontend:
  - updated domain regex to allow punycode-compatible labels,
  - improved normalization to use URL hostname parsing, which converts unicode domains to punycode in browser runtime.
- Backend:
  - added IDNA conversion in `_normalize_domain` to normalize unicode domain input to ASCII before Keys.so requests.

## Files Changed
- `frontend/src/App.tsx`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Some malformed unicode hostnames may still be rejected by browser URL parser (expected behavior).

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Validate manually with `постройдом.рф` in domain field and confirm analyze run starts without frontend domain-format error.

## Date
2026-05-13

## Summary of Changes
- Adjusted IDN UX behavior per request:
  - UI keeps Cyrillic domain display (human-readable),
  - conversion to ASCII/IDNA now happens only for API payload and validation.
- Implemented split normalization in frontend:
  - `normalizeDomainInput` -> UI-friendly normalization (keeps unicode),
  - `toApiDomain` -> API-safe hostname conversion to punycode.
- Applied API conversion consistently for:
  - main domain field,
  - manual competitors list,
  - excluded competitors list.

## Files Changed
- `frontend/src/App.tsx`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Log line "Запуск анализа для ..." now shows UI-normalized value (possibly unicode), while request uses punycode internally.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed frontend file: no issues.

## Next Steps
- Validate manually:
  - input `постройдом.рф` stays Cyrillic in form,
  - request proceeds successfully without domain-format error.

## Date
2026-05-13

## Summary of Changes
- Updated Yandex regions source to use `Yandex_regions.txt` as the single source of truth.
- Reworked `yandexRegions.ts`:
  - removed static hardcoded array,
  - added parser for lines in format `Название (ID)`,
  - exports `YANDEX_REGION_OPTIONS` generated directly from txt file at runtime.
- This ensures region selector always reflects current contents of `frontend/src/data/Yandex_regions.txt`.

## Files Changed
- `frontend/src/data/yandexRegions.ts`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Parser expects each valid line to match `... (number)`; malformed lines are ignored.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed frontend files: no issues.

## Next Steps
- Open region selector and verify expected entries from `Yandex_regions.txt` appear correctly.

## Date
2026-05-13

## Summary of Changes
- Fixed empty region selector issue after switching to txt-driven region source.
- Root cause: parser line splitting was too strict for current line separator format.
- Updated parser in `yandexRegions.ts`:
  - universal line splitting (`\r\n|\n|\r`),
  - fallback to `{ id: 213, label: "Москва" }` if parsing yields zero entries.
- Confirmed API request behavior remains unchanged:
  - selected UI region still maps to `serp_region_id` in `/api/analyze` payload.

## Files Changed
- `frontend/src/data/yandexRegions.ts`
- `handoff.md`

## Risks / Known Issues
- If txt lines are malformed and do not match `Название (ID)`, they are skipped by parser.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Validate in UI that region list is visible and selecting a region changes `serp_region_id` sent in analyze request.

## Date
2026-05-13

## Summary of Changes
- Regenerated `frontend/src/data/yandexRegions.ts` as a static region array from saved `Yandex_regions.txt`.
- Removed dependency on runtime txt parsing for regions.
- Generated entries count: 570 (`id` + `label`).
- Region selector now uses only static `YANDEX_REGION_OPTIONS` array for stable behavior.

## Files Changed
- `frontend/src/data/yandexRegions.ts`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- If `Yandex_regions.txt` is updated later, `yandexRegions.ts` must be regenerated to sync changes.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed files: no issues.

## Next Steps
- Open UI and verify region dropdown is populated.
- If source txt changes, rerun generator script `scripts/generate_yandex_regions_ts.py`.

## Date
2026-05-13

## Summary of Changes
- Updated competitor column headers in result table to two-line layout:
  - top line: source badge with separating bottom border,
  - next line: domain name.
- Added source badges for all relevant origins:
  - `SERP` (amber),
  - `API` (blue),
  - `РУЧ` for manual (green, short label).
- Source line is shown only when source metadata is present; otherwise header remains domain-only.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Header height increases slightly for columns with source badges.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Verify in UI that source row renders above domain with clear separator and distinct colors for `SERP/API/РУЧ`.

## Date
2026-05-13

## Summary of Changes
- Refined competitor header layout for visual alignment:
  - source row is now a dedicated fixed-height top line in every domain column header,
  - domain name is always rendered on the second line.
- For columns without source, a transparent placeholder is used in source row to preserve equal header height and baseline alignment.
- This keeps all header content visually aligned on one level across columns.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- Slightly taller headers by design due to fixed two-line structure.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Visual check in UI for consistent header baseline across all columns.

## Date
2026-05-13

## Summary of Changes
- Renamed result table column header:
  - from `Top-10 competitors`
  - to `Кол-во совпадений`.
- Sorting behavior and underlying field (`competitors_top10_count`) remain unchanged.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- None; text-only UI rename.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Verify new header text appears in result table UI.

## Date
2026-05-13

## Summary of Changes
- Unified all result-table headers to strict two-line layout.
- Removed visual separator line between top and bottom header rows.
- Applied same two-line structure to non-domain columns (`N`, `Запросы`, `[!Wordstat]`, `Кол-во совпадений`) and domain columns for consistent baseline alignment.

## Files Changed
- `frontend/src/components/ResultTable.tsx`
- `handoff.md`

## Risks / Known Issues
- None functionally; layout-only refinement.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Visual check in UI that all headers have exactly two lines and no separator.

## Date
2026-05-13

## Summary of Changes
- Added new `Помощь` button in header, placed to the left of `Хотелки`.
- Implemented help modal with structured explanation of key UI elements:
  - input fields and selectors,
  - parsing depth settings and impact,
  - SERP block and controls,
  - status/progress area,
  - summary/diagnostics,
  - result table features,
  - history and wishes modules.
- Help content focuses on "what it is", "why needed", and "how it affects results".

## Files Changed
- `frontend/src/App.tsx`
- `handoff.md`

## Risks / Known Issues
- Help text is static; if UI behavior changes in future, this modal should be updated accordingly.

## Validation Performed
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed file: no issues.

## Next Steps
- Open `Помощь` modal in UI and validate readability/content completeness on typical screen sizes.

## Date
2026-05-13

## Summary of Changes
- Rolled back forced IDNA/punycode conversion for API requests by user request.
- Current behavior:
  - UI still accepts and displays Cyrillic domains,
  - frontend sends normalized unicode domain to backend,
  - backend no longer forcibly converts domains to punycode before Keys.so requests.
- Kept validation support that allows IDN-style input.

## Files Changed
- `frontend/src/App.tsx`
- `backend/main.py`
- `README.md`
- `handoff.md`

## Risks / Known Issues
- Some APIs can still require punycode; if Keys.so behavior differs by endpoint/domain, fallback strategy may be needed later.

## Validation Performed
- Backend compile check (`python -m compileall .`) passed.
- Frontend build (`npm run build`) passed.
- Lint diagnostics for changed files: no issues.
- Backend restarted and health endpoint verified (`/api/status` -> 200).

## Next Steps
- Re-run analysis with `постройдом.рф` and compare response against previous punycode-based attempt.

