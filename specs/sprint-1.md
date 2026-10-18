# Sprint 1 — Домен и контракт

## 1. Метаданные

| | |
|---|---|
| Спринт | 1 — домен и контракт |
| Зависимости | Sprint 0 закрыт (acceptance по specs/sprint-0.md + micro-fix) |
| Блокирует | Sprint 2 (сбор данных) |
| Ветка | feat/sprint-1 |
| Точки апрува | 1) specs/domain.md 2) specs/api.md 3) PR |

## 2. Цели

1. Зафиксировать доменную модель (specs/domain.md).
2. Зафиксировать HTTP-контракт (specs/api.md).
3. По этим спекам: Prisma-схема + миграция init, zod-контракты, Fastify-заглушки эндпоинтов + Swagger.
4. Покрыть unit + integration + e2e(API).

Код не пишется до утверждения specs/domain.md и specs/api.md.

## 3. Порядок работ
specs/domain.md → апрув

specs/api.md → апрув

packages/db (Prisma) → миграция init

packages/contracts (zod) → unit-тесты

apps/api (Fastify + Swagger + stub-routes) → e2e(API)-тесты

Definition of Done

text

Пункты 3–5 не начинаются, пока не утверждены 1 и 2. Пункт 5 не начинается, пока не утверждён 3+4.

## 4. Артефакты

### 4.1. Спеки
- specs/domain.md — источник истины по домену.
- specs/api.md — источник истины по HTTP-контракту.

### 4.2. packages/db
- prisma/schema.prisma — модели Vacancy, FilterConfig, ScraperConfig + enum'ы.
- prisma/migrations/<ts>_init/ — первая миграция.
- prisma.config.ts — Prisma 7, DATABASE_URL, @prisma/adapter-pg.
- src/client.ts — PrismaClient через adapter.
- src/index.ts — публичный API пакета (реэкспорт prisma + типов).
- Скрипты db:generate, db:migrate, db:studio.
- Публичный API — только через src/index.ts.

### 4.3. packages/contracts
- src/common/ — idSchema, paginationSchema, apiErrorSchema, isoDateTime.
- src/vacancy/ — vacancySchema, vacancyListQuerySchema, vacancyListResponseSchema, vacancyStatusSchema, patchStatusBodySchema.
- src/filter/ — filterConfigSchema, filterConfigUpdateSchema.
- src/scraper-config/ — scraperConfigSchema, scraperConfigUpdateSchema, включая selectors, rateLimit, enrichment.
- src/index.ts — публичный реэкспорт.
- Только zod-схемы + выведенные типы. Никакой логики.
- Unit-тесты на каждую схему.

### 4.4. apps/api
- src/app/main.ts — entrypoint.
- src/app/bootstrap.ts — Fastify instance, регистрация плагинов.
- src/app/router.ts — монтирование routes.
- src/app/swagger.ts — @fastify/swagger + UI на /docs.
- src/app/providers.ts — композиция зависимостей (Prisma client).
- src/shared/ — конфиг, lib/.

Features (заглушки, БД пустая):
- features/vacancy-list/ — GET /vacancies
- features/vacancy-detail/ — GET /vacancies/:id
- features/vacancy-status/ — PATCH /vacancies/:id/status
- features/filter-management/ — GET|PUT /filters
- features/scraper-config/ — GET|PUT /scraper-config
- features/collect-trigger/ — POST /collect/run → 202 без постановки в очередь; GET /collect/jobs → пустой список; GET /collect/jobs/:id → 404

Routes — транспорт + валидация через packages/contracts. Логика в routes запрещена.

### 4.5. Тесты
| Уровень | Путь | Что |
|---|---|---|
| Unit | packages/contracts/tests/ | zod-схемы: валидные/невалидные payload'ы |
| Unit | apps/api/tests/unit/ | handlers в изоляции |
| Integration | apps/api/tests/integration/ | Prisma-репозитории против testcontainers-pg |
| E2E (API) | apps/api/tests/e2e/ | supertest против Fastify |

Живой hh.ru не дёргается. Redis не нужен.

## 5. Что вне Sprint 1

- Playwright-скрейпер (Sprint 2).
- BullMQ-очередь и реальная логика apps/worker (Sprint 2).
- UI (apps/web) — Sprint 3.
- AI-скоринг — не в MVP.
- Auth — не в MVP (см. api.md §16).

## 6. Definition of Done

Команды (все зелёные):
pnpm install
pnpm turbo run lint typecheck test:unit test:integration build
docker compose -f infrastructure/compose/docker-compose.yml up -d postgres redis
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/api dev

text

Ручные проверки:
- GET /health → 200
- GET /docs → Swagger UI открывается, все эндпоинты api.md §3–§13 присутствуют
- GET /vacancies → 200 { items: [], total: 0, ... }
- PUT /filters с baseline из PROJECT_SPEC §1 → 200, запись создана, GET /filters её возвращает
- GET /scraper-config → дефолтная конфигурация из domain.md §5

Схема БД:
- миграция init создаёт таблицы Vacancy, FilterConfig, ScraperConfig со всеми полями и enum'ами.

Контракты:
- OpenAPI-схемы в Swagger сгенерированы из zod-схем packages/contracts.

## 7. Открытые вопросы

Отсутствуют. Пять решений (пагинация offset/limit, формат { items, total, page, pageSize }, FilterConfig с isActive, ScraperConfig singleton, отсутствие Auth в MVP) подтверждены тимлидом.
