# hh-vacancy-collector

Сбор вакансий hh.ru через Playwright, хранение в Postgres, REST API (Fastify), UI (Next.js).

## Setup

```bash
pnpm i
```

## Infrastructure

```bash
docker compose -f infrastructure/compose/docker-compose.yml up -d
```

## Development

```bash
pnpm dev
```

- API: http://localhost:3001/health
- Web: http://localhost:3000/health

## API endpoints (Sprint 1 stubs)

- `GET /health` — healthcheck
- `GET /vacancies` — список вакансий (пагинация: `page`, `limit`, `sortBy`, `sortOrder`)
- `POST /vacancies` — создать вакансию
- `GET /filter-configs` — список конфигураций фильтров
- `POST /filter-configs` — создать конфигурацию фильтра
- `PATCH /filter-configs/:id` — обновить конфигурацию фильтра
- `POST /scrape-runs` — создать запуск сбора
- `GET /scrape-runs/:id` — статус запуска сбора

## Specs

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) and `/specs`.