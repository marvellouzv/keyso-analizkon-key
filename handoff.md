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
