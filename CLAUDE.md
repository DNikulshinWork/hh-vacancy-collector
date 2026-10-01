# CLAUDE.md

## Контекст
- Проект: hh-vacancy-collector
- Спецификация: PROJECT_SPEC.md — источник истины. Что не описано — уточнять, не додумывать.
- Архитектурный паттерн: ED Microservices Monorepo Pattern v1.0 (PNPM Workspaces + Turborepo).
- Стек: Fastify + Prisma 7 + Postgres + Redis (BullMQ) + Playwright (scraper) + Next.js.
- Workflow: SDD — /specs/<feature>.md → contracts → tests → реализация.

## Цель
Сбор вакансий hh.ru через Playwright по конфигурируемым фильтрам.
Хранение в Postgres. Отдача через Fastify REST. UI на Next.js.
AI-скоринг — задел (поле rawPayload + отдельный будущий модуль), не MVP.

## Решения
- Источник данных: Playwright-скрейпинг (REST hh.ru недоступен для физлиц).
- Очередь: BullMQ поверх Redis. Отдельный runtime-юнит apps/worker.
- Фильтры и параметры скрейпинга — данные в БД (FilterConfig, ScraperConfig), не константы в коде.
- Дедуп вакансий: unique hhId в Postgres + Redis SETNX как fast-path.
- Структура: apps/ + packages/ + tooling/ + infrastructure/.
  Внутри каждого app: src/{app,features,services,shared}/.
- Cross-app импорты — только через @repo/contracts и @repo/db, не через исходники друг друга.
- packages/* не зависят от apps/*.

## Сделано
- Sprint 0: скелет монорепо (pnpm + turbo), tooling, packages/config|contracts|logger,
  apps/api|worker|web, compose (postgres+redis), CI, Husky, CLAUDE.md.
- Sprint 0 final-fix: Dockerfile'ы переведены на full-install без pnpm --filter,
  добавлен .dockerignore, подтверждены docker build x3; правки §11 применены.

## Осталось
- Sprint 1: /specs/domain.md, /specs/api.md, Prisma-схема Vacancy+FilterConfig+ScraperConfig,
  contracts, Swagger, заглушки эндпоинтов + unit/integration тесты.
- Sprint 2: Playwright-скрейпер + BullMQ worker, dedupe, e2e на цикл сбор→сохранение (фикстуры).
- Sprint 3: web UI (список, фильтры, статусы, экспорт).
- Sprint 4: GHCR-образы, деплой на VPS, поддомен, smoke-тест.

## Нюансы
- Спецификация — источник истины. Неясность → вопрос, не гипотеза.
- Селекторы Playwright — в ScraperConfig, не в коде.
- Живой hh.ru в CI не дёргаем.
- Local first → Reuse second → Extract only when justified (ED §57).
- Не создавать пустые архитектурные папки (ED §60.23).
