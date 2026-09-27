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

## Specs

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) and `/specs`.
