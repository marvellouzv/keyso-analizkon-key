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

## Docker Compose (серверный запуск)

Проект можно поднять одной командой через Docker Compose:

1. Скопируйте переменные окружения:
   - `cp .env.example .env` (или создайте `.env` с `APP_PORT`)
   - `cp backend/.env.example backend/.env` (и заполните `KEYSO_TOKEN`)
2. Запустите:
   - `docker compose up -d --build`
3. Проверьте:
   - `docker compose ps`
   - `curl -i http://127.0.0.1:<APP_PORT>/api/status`

Важно для серверной инструкции STUDENT:
- Публикуйте только `127.0.0.1:<your-port>:8000` (не `0.0.0.0`).
- Используйте только свой порт (например `8101` для VB, `8102` для NB и т.д.).
- Не коммитьте `backend/.env` с реальным токеном.

## Привязка GitHub -> сервер (кратко)

На сервере в своей директории `/srv/seovibe/<user>/app`:

1. Клонирование:
   - `git clone <your-github-repo-url> .`
2. Подготовка окружения:
   - `cp .env.example .env`
   - `cp backend/.env.example backend/.env`
3. Запуск:
   - `docker compose up -d --build`

После деплоя проверьте:
- локально на сервере: `curl -i http://127.0.0.1:<your-port>/api/status`
- снаружи: `https://<your-domain>`

Подробная пошаговая инструкция (push -> сервер -> обновление -> перезапуск):
- `DEPLOY_GUIDE.md`

## Структура проекта
- `backend/services/keys_so.py` — логика взаимодействия с API и контроль лимитов.
- `backend/services/analyzer.py` — обработка данных через Pandas (сведение таблиц).
- `frontend/src/components/ResultTable.tsx` — компонент отображения данных с цветовой индикацией.
- `backend/auth_module/` — изолированный модуль авторизации (middleware + роуты + сессии + CSRF/rate-limit).

## Модуль авторизации (изолированный)

- Точка входа: `backend/auth_module/integration.py`.
- Подключение в приложение: `init_auth_module(app, database.engine, AuthConfig())`.
- Защиты: CSRF-токен, ограничение попыток входа, bcrypt-хеши, ORM-запросы, HttpOnly/SameSite=Strict cookie.
- Срок сессии: 30 дней (`Max-Age=2592000`).
- Учётные данные по умолчанию не публикуются в документации. Для продакшена задавайте их через переменные окружения и ротацию.

### Настройка логина/пароля через `.env` (рекомендуется)

В `backend/.env`:

```env
AUTH_PASSWORD_PEPPER_HASH=your_random_secret_hash
```

Механика:
- Если таблица `auth_users` пуста, первые введенные в форме логин/пароль создают первого пользователя.
- Пароль сохраняется в БД как bcrypt-хеш от связки `password + AUTH_PASSWORD_PEPPER_HASH`.
- Если пользователь уже есть в БД, форма работает как обычный login.

Генерация значения для `AUTH_PASSWORD_PEPPER_HASH` (PowerShell):

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Важно:
- `AUTH_PASSWORD_PEPPER_HASH` должен быть длинным и случайным, хранить только в `backend/.env`.
- После смены pepper-значения старые пароли в БД перестанут проходить проверку (потребуется сброс пользователя).

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

## Diagnostics UX (2026-04-21)
The results screen now includes a "Диагностика этапов" block with row counts at each processing step:
- raw main keywords
- unique main keywords
- after join with competitors
- after main-site position filter
- after competitor filter
- final output rows
