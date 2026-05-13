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
- **Хотелки по сервису:** Модальное окно со списком предложений, чекбоксами статуса, редактированием и сохранением в БД.
- **Домены из живой SERP:** Поддержка добавления конкурентов из выдачи Яндекса по списку запросов.
- **Поддержка IDN-доменов:** Можно вводить домены на кириллице (например, `постройдом.рф`).
  - в интерфейсе домен отображается в исходном (человекочитаемом) виде;
  - в API-запросы домены отправляются в нормализованном виде без принудительной IDNA-конвертации.

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

Персистентность данных:
- Для SQLite используется постоянный Docker volume `keyso_data`, смонтированный в `/app/backend/storage`.
- Поэтому после `docker compose up -d --build` сохраняются:
  - `История анализов` (`analysis_history`),
  - `Список предложений` / `Хотелки` (`service_wishes`).
- Внимание: `docker compose down -v` удаляет volume и очищает эти данные.

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
- `backend/storage/sql_app.db` — постоянная SQLite БД истории анализов и хотелок.

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

## API: Хотелки (2026-05-13)

Добавлены endpoints для предложений по сервису:
- `GET /api/wishes` — список предложений (сначала неотмеченные, затем отмеченные).
- `POST /api/wishes` — добавить предложение (`{ "text": "..." }`).
- `PATCH /api/wishes/{wish_id}` — отредактировать текст предложения.
- `PATCH /api/wishes/{wish_id}/toggle` — изменить статус чекбокса (`{ "is_done": true|false }`).

UI-логика:
- Кнопка `Хотелки` находится в хедере слева от кнопки `История`.
- В окне `Список предложений по сервису`:
  - строки с отмеченным чекбоксом подсвечиваются зеленоватым,
  - неотмеченные — желтоватым,
  - есть кнопка редактирования у каждой строки,
  - добавление нового предложения выполняется через поле ввода (5 строк) + `Отправить`.

## SERP: домены из выдачи Яндекса (2026-05-13)

На форме анализа добавлен блок `Из выдачи Яндекса`:
- список запросов (1 строка = 1 запрос, максимум 10),
- селектор количества доменов из выдачи на каждый запрос (`topNumber`) с вариантами `10, 20, 30, 50, 100` (по умолчанию `10`),
- регион Яндекса (`regionId`) со строкой поиска по названию города,
- по умолчанию регион Москва (`213`).

Backend логика:
- для каждого запроса создается задача `POST /serp` (по очереди),
- далее выполняется polling `GET /serp/{id}/status` (таймаут 60 сек),
- после готовности забирается результат `GET /serp/{id}?organic=true`,
- домены нормализуются, дедуплицируются, фильтруются по стоп-листу и собственному домену,
- оставшиеся добавляются в итоговый список конкурентов с источником `serp`.
- если отдельный конкурентный домен (в т.ч. из ручного списка) недоступен/не найден в Keys.so, он пропускается без остановки всего анализа.

Дополнительно:
- в ответ `POST /api/analyze` добавлены поля:
  - `competitor_sources` (map домен -> источник `api|manual|serp`)
  - `serp_summary` (агрегированная статистика)
  - `serp_progress` (строки прогресса для UI).
- временный UI-блок `DEBUG: сырые данные SERP API` удален из интерфейса.
- временное API-поле `serp_debug` также удалено из backend-схем и ответа.
- в UI добавлен индикатор `Найдено конкурентов из SERP` и метка `SERP` в заголовках соответствующих конкурентных колонок.

Справочник регионов:
- в проект добавлен локальный полный каталог регионов Яндекса для селекта региона;
- источник: `frontend/src/data/Yandex_regions.txt`;
- список для UI хранится статическим массивом в `frontend/src/data/yandexRegions.ts` (генерируется из `Yandex_regions.txt`);
- в UI используется поиск по названию региона без учета регистра.

Дефолтный стоп-лист конкурентов:
- список доменов для поля `Исключить конкуренты` вынесен в отдельный файл:
  - `frontend/src/data/defaultExcludedCompetitors.txt`
- файл читается на фронтенде при старте формы (через Vite raw import).
- исключение доменов в анализе выполняется по фактическому значению поля формы `Исключить конкуренты` в текущем запуске анализа.

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
