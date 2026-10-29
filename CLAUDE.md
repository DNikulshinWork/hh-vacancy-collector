# hh-vacancy-collector

Сбор вакансий hh.ru через Playwright, хранение в Postgres, REST API (Fastify), UI (Next.js).

## Структура

- `apps/api` — Fastify REST API
- `apps/worker` — BullMQ worker и Playwright scraper
- `apps/web` — Next.js UI
- `packages/config` — env/config
- `packages/contracts` — DTO и shared schemas
- `packages/db` — Prisma schema/client
- `packages/queue` — BullMQ wrapper
- `infrastructure/compose` — docker-compose для dev
- `specs/` — спецификации спринтов

## Сделано
- Sprint 0: скелет монорепо (pnpm + turbo), tooling, packages/config|contracts|logger,
  apps/api|worker|web, compose (postgres+redis), CI, Husky, CLAUDE.md.
- Sprint 0 final-fix: Dockerfile'ы переведены на full-install без pnpm --filter,
  добавлен .dockerignore, подтверждены docker build x3; правки §11 применены.
- Sprint 1: packages/db (Prisma schema: Vacancy, FilterConfig, ScraperConfig, ScrapeRun),
  contracts (DTO + zod-схемы), REST stubs (/vacancies, /filter-configs, /scrape-runs)
  с валидацией Zod и unit/e2e тестами, глобальный error handler (ZodError → 400).
- Sprint 2: Playwright scraper, BullMQ worker, dedupe, CRUD, e2e тесты,
  схемы и API endpoints, fixtures, unit tests, CI workflow с service containers.

## Осталось
- Sprint 3: web UI (список, фильтры, статусы, экспорт).
- Sprint 4: GHCR-образы, деплой на VPS, поддомен, smoke-тест.

## Нюансы
- Спецификация — источник истины. Неясность → вопрос, не гипотеза.
- Селекторы Playwright — в ScraperConfig, не в коде.
- Живой hh.ru в CI не дёргаем.
- Local first → Reuse second → Extract only when justified (ED §57).
- Не создавать пустые архитектурные папки (ED §60.23).