# Sprint 1 — Amendment 1

## 1. Причина

Окружение агента (sandbox) не предоставляет Docker, не может запустить
PostgreSQL, не имеет доступа к сети от GitHub. Integration-тесты против
реального Postgres (§4.5 и §6 DoD specs/sprint-1.md) физически не могут
быть выполнены агентом.

## 2. Изменение

Ответственность за прогон integration-тестов в Sprint 1 разделяется:

- **Агент** в B2 пишет:
  - integration-тесты против `testcontainers-pg` (в репозитории);
  - unit-тесты хэндлеров;
  - e2e-тесты API через `supertest` с мок-клиентом Prisma.

- **Тимлид** локально прогоняет:
  - `docker compose up -d postgres redis`;
  - `pnpm --filter @repo/db db:migrate`;
  - `pnpm turbo run test:integration`;
  - и прикладывает логи в PR B2.

## 3. DoD B2 (уточнение)

- `pnpm turbo run lint typecheck test:unit test:e2e build` — зелёный у агента.
- `pnpm --filter @repo/db db:migrate` + `pnpm turbo run test:integration` — приложены тимлидом.
- `GET /docs`, `curl /vacancies`, `curl /scraper-config` — вывод от тимлида или от агента.

## 4. Что не меняется

- Архитектурные требования — без изменений.
- Схема БД — без изменений.
- HTTP-контракт — без изменений.
- Все предыдущие разделы `specs/sprint-1.md` сохраняют силу, кроме явно переопределённого здесь.
