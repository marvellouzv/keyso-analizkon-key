# SEO Keys.so Analyzer

Веб-приложение для глубокого анализа SEO-запросов и сравнения позиций сайта с конкурентами через API Keys.so.

## Технологический стек

- **Backend:** FastAPI, SQLAlchemy (SQLite), Pandas, httpx.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, TanStack Query, Zustand.

## Основные возможности

- **Автоматический поиск конкурентов:** Система находит топ-5 ближайших конкурентов для введенного домена.
- **Сводная таблица позиций:** Сравнение позиций вашего сайта и конкурентов по ключевым словам в одной таблице.
- **Умный Rate Limiting:** Соблюдение лимитов API Keys.so (10 запросов в 10 секунд) через асинхронную очередь.
- **Визуализация:** График пересечения семантических ядер с конкурентами.
- **История запросов:** Сохранение результатов анализов в локальную БД SQLite.

## Установка и запуск

### Бэкенд
1. Перейдите в папку `backend`.
2. Установите зависимости: `pip install -r requirements.txt`.
3. Создайте файл `.env` в корне папки `backend` и добавьте ваш токен:
   ```env
   KEYSO_TOKEN=ваш_api_ключ
   ```
4. Запустите сервер: `python main.py`. Сервер будет доступен по адресу `http://localhost:8000`.

### Фронтенд
1. Перейдите в папку `frontend`.
2. Установите зависимости: `npm install`.
3. Запустите проект: `npm run dev`. Приложение откроется по адресу `http://localhost:5173`.

## Структура проекта
- `backend/services/keys_so.py` — логика взаимодействия с API и контроль лимитов.
- `backend/services/analyzer.py` — обработка данных через Pandas (сведение таблиц).
- `frontend/src/components/ResultTable.tsx` — компонент отображения данных с цветовой индикацией.

## Current Technical Status (2026-04-21)

- Backend API stabilized:
  - `POST /api/analyze`
  - `GET /api/history`
  - `GET /api/export/{analysis_id}`
- Frontend build pipeline fixed with TypeScript config.
- Domain input validation added on frontend before API call.
- Excel export is available from the results block.

### Quick verification commands
- Backend smoke test: `python -c "import sys; sys.path.append('backend'); from main import app; from fastapi.testclient import TestClient; c=TestClient(app); print(c.get('/api/status').status_code)"`
- Frontend build: `cd frontend && npm run build`

## UI update (2026-04-21)
- Base selector now includes extended Keys.so bases, including Google (`gru`, `gkv`, `gmns`, `gny`) and additional Yandex regions.

## Parsing Depth Controls (2026-04-21)
The analyze form now has configurable depth controls (defaults match previous behavior):
- competitors count
- competitor top position threshold
- analyzed site position range
- main/competitor page depth
- result row limit

These settings are sent to backend and applied during Keys.so collection and final filtering.
