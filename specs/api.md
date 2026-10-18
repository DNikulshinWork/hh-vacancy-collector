# HTTP API contract — источник истины

> Base URL: http://localhost:3001 (dev). Все пути — от корня.

## 1. Общие правила

- Все тела: application/json; charset=utf-8.
- Даты: ISO 8601 UTC (2026-10-15T12:34:56.789Z).
- ID: UUID v4.
- Валидация входящих DTO — zod-схемы из packages/contracts.
- Ошибки — единый формат:
  ```json
  {
    "error": {
      "code": "STRING_CODE",
      "message": "человекочитаемое",
      "details": [{ "path": "…", "message": "…" }]
    }
  }
  ```
Коды ошибок: VALIDATION_ERROR (400), NOT_FOUND (404), CONFLICT (409), INTERNAL_ERROR (500).

## 2. Пагинация
Offset/limit. Query: `?page=1&pageSize=20`. pageSize — 1..100, default 20. page ≥ 1, default 1.

Формат ответа списка:

```json
{
  "items": [ /* … */ ],
  "total": 123,
  "page": 1,
  "pageSize": 20
}
```

## 3. GET /health
Ответ 200:

```json
{ "status": "ok", "service": "api", "uptime": 12.34 }
```
Реализован в Sprint 0.

## 4. GET /vacancies
Query:

| Параметр | Тип | Default | Примечание |
|---|---|---|---|
| status | VacancyStatus[] | — | повторяющийся параметр, OR |
| employment | Employment[] | — | повторяющийся |
| schedule | Schedule[] | — | повторяющийся |
| experience | Experience[] | — | повторяющийся |
| companyContains | string | — | подстрока в company |
| titleContains | string | — | подстрока в title |
| publishedAfter | ISO datetime | — | |
| publishedBefore | ISO datetime | — | |
| page | int | 1 | |
| pageSize | int | 20 | 1..100 |
| sort | enum | publishedAt:desc | publishedAt:asc \| publishedAt:desc \| createdAt:asc \| createdAt:desc |

Ответ 200:

```json
{
  "items": [ { /* VacancyListItem */ } ],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```
VacancyListItem — сокращённая форма (id, hhId, title, company, url, salaryFrom, salaryTo, currency, salaryTax, employment, schedule, experience, publishedAt, status, createdAt). rawPayload и descriptionMd не включаются в список.

400 VALIDATION_ERROR при невалидных параметрах.

## 5. GET /vacancies/:id
id — UUID или hhId (строка из цифр). Парсинг: если валидный UUID — поиск по id; иначе — по hhId.

Ответ 200 — полная Vacancy, включая descriptionMd. rawPayload — не включается (по умолчанию). Опциональный ?include=raw — вернуть rawPayload (для отладки/будущего AI).

404 NOT_FOUND если нет.

## 6. PATCH /vacancies/:id/status
Body:

```json
{ "status": "viewed" }
```
status ∈ VacancyStatus.

Ответ 200 — обновлённая Vacancy (сокращённая форма).

404 NOT_FOUND если нет. 400 VALIDATION_ERROR при невалидном status.

## 7. GET /filters
Ответ 200:

```json
{
  "items": [ /* FilterConfig[] */ ],
  "activeId": "uuid-или-null"
}
```
Все записи FilterConfig + id активной.

## 8. PUT /filters
Обновляет активную запись. Если активной нет — создаёт новую с isActive=true.

Body:

```json
{
  "name": "default",
  "titleKeywordsInclude": ["fullstack", "разработчик"],
  "descriptionKeywordsInclude": ["TypeScript", "React"],
  "titleKeywordsExclude": ["1С", "QA"],
  "descriptionKeywordsExclude": [],
  "employment": ["full", "part", "project"],
  "schedule": ["remote"],
  "experience": [],
  "area": [1],
  "searchPeriodDays": 7,
  "orderBy": "publication_time"
}
```
Все поля валидируются zod-схемой filterConfigUpdateSchema.

Ответ 200 — обновлённая FilterConfig (полная форма, включая id, isActive, timestamps).

400 VALIDATION_ERROR при невалидных полях (например, searchPeriodDays ∉ [1,30], orderBy не из enum).

## 9. GET /scraper-config
Ответ 200 — полная ScraperConfig (см. domain.md §5).

## 10. PUT /scraper-config
Body — полная или частичная ScraperConfig (zod scraperConfigUpdateSchema, все поля опциональны, но при наличии — валидируются).

Ответ 200 — обновлённая полная ScraperConfig.

400 VALIDATION_ERROR при невалидных значениях.

## 11. POST /collect/run
Sprint 1: заглушка. Реальная постановка в BullMQ — Sprint 2.

Body (опционально):

```json
{ "filterId": "uuid-или-null" }
```
Если null — берётся активный FilterConfig.

Ответ 202:

```json
{ "jobId": "sprint-2-stub", "status": "queued" }
```
Sprint 2 заменит jobId на реальный.

## 12. GET /collect/jobs
Sprint 1: заглушка. Возвращает:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 20 }
```
Query — стандартная пагинация + status (Sprint 2).

## 13. GET /collect/jobs/:jobId
Sprint 1: заглушка. Всегда 404 NOT_FOUND.

Sprint 2 — возврат { jobId, status, progress, createdAt, startedAt, finishedAt, error }.

## 14. GET /collect/schedule / PUT /collect/schedule
Sprint 1: не реализуется. Появляется в Sprint 2 вместе с cron.

## 15. Swagger
GET /docs — UI. GET /docs/json — OpenAPI schema. Все DTO — из zod-схем через @fastify/swagger + zod-to-json-schema (или аналог).

## 16. Auth
MVP: нет. Все эндпоинты открыты. В Sprint 4 — reverse-proxy + IP/поддомен. Bull Board (/admin/queues, Sprint 2) — basic-auth через env.

## 17. CORS
В dev — разрешить http://localhost:3000 (web). В prod — поддомен через env. Конфиг — @fastify/cors в bootstrap.ts.
