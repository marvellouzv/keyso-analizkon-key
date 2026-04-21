# История изменений (handoff.md)

## [2026-04-21] - Инициализация проекта

### Добавлено:
- **Backend:**
    - Базовая структура на FastAPI.
    - Интеграция с SQLite через SQLAlchemy.
    - Клиент `KeysSoClient` с поддержкой асинхронного Rate Limiting.
    - Сервис `SEOAnalyzer` для объединения данных через Pandas.
    - Эндпоинты `/api/analyze` и `/api/history`.
- **Frontend:**
    - Инициализация Vite + React + TS.
    - Настройка Zustand для управления состоянием формы.
    - Компонент `ResultTable` с цветовой индикацией позиций (1-3, 4-10, 10+).
    - Визуализация пересечения запросов через Recharts (BarChart).
    - Анимации загрузки через Framer Motion.
- **Документация:**
    - `README.md` с инструкциями по запуску.
    - `agent.md` с правилами разработки.
    - `handoff.md` для отслеживания прогресса.

### Текущий статус:
Проект находится в состоянии MVP. Основной цикл "Запрос -> Анализ -> Отображение" реализован.

### Следующие шаги:
1. Реализовать эндпоинт `/api/export/{task_id}` для скачивания Excel.
2. Добавить валидацию доменов на фронтенде.
3. Улучшить обработку ошибок API (например, если домен не найден).

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
