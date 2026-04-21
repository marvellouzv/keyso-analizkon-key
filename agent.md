# Правила работы агента (agent.md)

Этот файл содержит инструкции для ИИ-ассистентов, работающих с данным проектом.

## Основные принципы
1. **Актуальность документации:** При любом изменении функционала или структуры проекта необходимо обновлять `README.md` и `handoff.md`.
2. **Соблюдение лимитов API:** Любые изменения в `backend/services/keys_so.py` должны сохранять логику Rate Limiting (10 запросов / 10 секунд).
3. **Типизация:** Весь новый код на фронтенде должен быть строго типизирован (TypeScript).
4. **Стилизация:** Используйте Tailwind CSS и компоненты Shadcn UI (или их аналоги на базе Radix UI).

## Работа с данными
- **Pandas:** Вся тяжелая обработка данных (merge, pivot, фильтрация) должна происходить на бэкенде в `services/analyzer.py`.
- **Состояние:** Глобальное состояние клиента хранится в Zustand (`frontend/src/store/useStore.ts`).
- **Серверное состояние:** Для запросов к API используйте TanStack Query.

## Безопасность
- Никогда не коммитьте `.env` файлы.
- API ключи должны передаваться только через переменные окружения.

## Operational rule
- Always update `README.md` and `handoff.md` when changing functionality.
- Always keep `agent.md` and `handoff.md` актуальными during every active implementation/testing session.
