# Infrastructure (Sprint 0)

Postgres 16 + Redis 7. Applications are not included — run them locally via `pnpm dev`.

## Start

```bash
docker compose -f infrastructure/compose/docker-compose.yml up -d
```

## Status

```bash
docker compose -f infrastructure/compose/docker-compose.yml ps
```

## Stop

```bash
docker compose -f infrastructure/compose/docker-compose.yml down
```

## Reset volumes

```bash
docker compose -f infrastructure/compose/docker-compose.yml down -v
```
