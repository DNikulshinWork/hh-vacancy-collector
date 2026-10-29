# PROJECT_SPEC — hh-vacancy-collector

## 1. Цель

Собрать локально управляемый сервис для поиска и накопления вакансий hh.ru по настраиваемым фильтрам: сбор через Playwright, хранение в PostgreSQL, REST API на Fastify, UI на Next.js.

Спецификация является источником истины. Если требование не описано здесь или в `specs/*.md`, его нужно уточнить до реализации.

## 2. MVP

MVP должен уметь:

- хранить вакансии с дедупликацией по `hhId`;
- хранить конфигурации фильтров поиска;
- запускать сбор вакансий через очередь Redis/BullMQ;
- сохранять исходный payload вакансии для будущего AI-скоринга;
- отдавать список вакансий и состояние системы через REST API;
- показывать список вакансий и фильтры в Web UI;
- работать локально через Docker Compose для PostgreSQL и Redis.

## 3. Вне MVP

- AI-скоринг и LLM-интеграции;
- авторизация и многопользовательский режим;
- production orchestration кроме базового Docker/VPS;
- обращение к live hh.ru из CI;
- изменение селекторов Playwright без записи в `ScraperConfig`.

## 4. Архитектура

Монорепозиторий PNPM Workspaces + Turborepo:

- `apps/api` — Fastify REST API;
- `apps/worker` — BullMQ worker и Playwright scraper;
- `apps/web` — Next.js UI;
- `packages/config` — env/config;
- `packages/contracts` — DTO и shared schemas;
- `packages/logger` — logging;
- будущий `packages/db` — Prisma schema/client после Sprint 1.

Cross-app импорты запрещены. Общий контракт — только через `packages/*`.

## 5. Данные MVP

Минимальные сущности Sprint 1:

- `Vacancy` — вакансия hh.ru;
- `FilterConfig` — параметры поиска;
- `ScraperConfig` — selectors/timeouts/pagination limits;
- `ScrapeRun` — запуск сбора и его статус.

Подробная модель описывается в `specs/sprint-1.md` перед реализацией.

## 6. Качество и проверки

Перед PR обязательны:

```bash
pnpm install --frozen-lockfile
pnpm turbo run lint typecheck test:unit build
pnpm --filter @repo/api test:e2e
```

CI не должен ходить на live hh.ru. Для scraper-тестов использовать фикстуры HTML/JSON.

## 7. Roadmap

1. Sprint 0 — skeleton monorepo, healthchecks, CI.
2. Sprint 1 — domain schema, Prisma, contracts, REST stubs/tests.
3. Sprint 2 — Playwright scraper, BullMQ worker, dedupe, fixtures.
4. Sprint 3 — Web UI, filters, statuses, export.
5. Sprint 4 — container images, VPS deploy, smoke tests.
