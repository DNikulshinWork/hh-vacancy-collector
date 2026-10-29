# Sprint 2 — Playwright scraper + BullMQ worker, dedupe, CRUD, e2e

## Цель спринта

Реализовать цикл «запрос на сбор → очередь BullMQ → Playwright-скрейпинг по конфигурациям из БД → дедуп → сохранение вакансий → статус ScrapeRun».

Заменяем все REST stubs из Sprint 1 реальной работой с Prisma/BullMQ. Отдельный эндпоинт прогресса: `GET /scrape-runs/:id` (+ список `GET /scrape-runs`).

## 1. Поток данных

```
POST /scrape-runs {filterConfigId, scraperConfigId}
  → create ScrapeRun (status=pending) в Postgres
  → enqueue job в BullMQ queue "scrape"
Worker (apps/worker):
  → load FilterConfig + ScraperConfig из БД
  → ScrapeRun: pending → running
  → Playwright: обход страниц по селекторам и пагинации из ScraperConfig
  → извлечение вакансий (чистый парсер, отвязанный от браузера)
  → дедуп: Redis SETNX(hhvc:vac:hhId) как fast-path, unique hhId в Postgres как source of truth
  → upsert Vacancy в Postgres (rawPayload = полный HTML-узел/JSON)
  → ScrapeRun: running → completed|failed + resultCount
GET /scrape-runs/:id — статус, resultCount, время, ошибка
```

## 2. Модели данных

### ScraperConfig.selectors (пример, источник — конфиг в БД, НЕ код)

```json
{
  "vacancyCard": "div[data-qa='vacancy-serp__vacancy']",
  "title": "a[data-qa='serp-item__title']",
  "company": "span[data-qa='vacancy-serp__vacancy-employer']",
  "salary": "span[data-qa='vacancy-serp__vacancy-compensation']",
  "location": "span[data-qa='vacancy-serp__vacancy-address']",
  "experience": "div[data-qa='vacancy-serp__vacancy-work-experience']",
  "link": "a[data-qa='serp-item__title']",
  "nextPage": "a[data-qa='pager-next']"
}
```

### ScraperConfig.timeouts

```json
{ "navigation": 30000, "waitForSelector": 15000 }
```

### ScraperConfig.paginationLimits

```json
{ "maxPages": 5, "delayMs": 1500 }
```

## 3. Новый пакет packages/queue

**Обоснование:** очередь нужна двум приложениям (api ставит задачи, worker обрабатывает). Общий контракт создаётся один раз (ED §45 — extract when justified).

- `src/index.ts`:
  - `SCRAPE_QUEUE_NAME = 'scrape'`
  - `createScrapeQueue(connection)` → BullMQ `Queue`
  - `createScrapeWorker(connection, processor)` → BullMQ `Worker`
  - тип `ScrapeJobData = { scrapeRunId: string; filterConfigId: string; scraperConfigId: string }`
- зависимости: `bullmq`, `ioredis`, `@repo/config`

## 4. Скрейпер (apps/worker)

### Структура

```
apps/worker/
├── src/
│   ├── app/
│   │   └── main.ts            # bootstrap: createWorker + graceful shutdown
│   ├── features/
│   │   └── scrape-job/
│   │       ├── index.ts       # processor: runScrapeRun(job)
│   │       └── processor.ts
│   ├── services/
│   │   └── hh-scraper/
│   │       ├── index.ts       # публичный API сервиса
│   │       ├── parse.ts       # чистый парсер HTML → вакансии (без браузера)
│   │       ├── normalize.ts   # нормализация зарплаты, URL, дат
│   │       ├── browser.ts     # Playwright-обход (pages, пагинация, задержки)
│   │       └── selectors.ts   # типы + валидация selectors из ScraperConfig
│   └── shared/
```

### parse.ts — чистый парсер

- Вход: `html: string`, `selectors: Json`
- Выход: `ParsedVacancy[]`:
  ```ts
  {
    hhId: string;        // из URL /vacancy/{id}
    title: string;
    company: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
    location: string;
    experience: string;
    url: string;
    publishedAt: string; // ISO из карточки/даты
    rawPayload: unknown; // структурированный объект, не HTML-строка
  }
  ```
- Реализация: `parse5` (без DOM-зависимостей, работает в Node) — не Playwright.
- salary "от 50 000 до 80 000 ₽" → `{min: 50000, max: 80000, currency: 'RUB'}`.
- hhId из `href="https://hh.ru/vacancy/{id}?query=..."` — regex.

### browser.ts — Playwright

- `chromium.launch({ headless: true })` (env `SCRAPER_HEADLESS`, default true).
- По страницам: открыть `https://hh.ru/search/vacancy?text={query}&area={location}`.
  query/location из FilterConfig.
- Для каждой страницы: `page.content()` → `parse.ts`; next → `selectors.nextPage` до `maxPages`.
- `delayMs` между страницами (полиси-задержка, не хардкод).
- `waitForSelector` на `vacancyCard`.

### scrape-job/processor.ts

1. `findUnique ScrapeRun` (связи filterConfig, scraperConfig); нет → fail 'scrape run not found'
2. update ScrapeRun → `running`, `startedAt=now`
3. `runBrowserScrape(...)` → `ParsedVacancy[]`
4. foreach vacancy: `dedupeAndSave`
5. update ScrapeRun → `completed`, `resultCount`, `finishedAt`
6. catch → update ScrapeRun → `failed`, error message; rethrow (BullMQ повторные попытки через `attempts`)

### dedupeAndSave (services/vacancies.ts)

- `SETNX hhvc:vac:{hhId} 1` → 0 = уже видели, пропуск
- 1 = новинка → `prisma.vacancy.upsert({ where: { hhId }, ... })`
  (unique hhId — source of truth; при гонке P2002 → пропуск)
- Redis-ключ не удаляем (никаких повторных сборов дублей в жизни вакансии).

## 5. API (замена stubs)

| Метод | Путь | Поведение |
|---|---|---|
| GET | /vacancies | список из БД, пагинация, сортировка, фильтры search/location/experience |
| POST | /vacancies | создание (для тестов/инструментов) |
| GET | /filter-configs | список из БД |
| POST | /filter-configs | создание |
| PATCH | /filter-configs/:id | обновление |
| GET | /scraper-configs | список (нужно для создания scrape-run и UI) |
| POST | /scraper-configs | создание |
| POST | /scrape-runs | создание ScrapeRun + enqueue job → 201 `{ id }` |
| **GET** | **/scrape-runs/:id** | **отдельный эндпоинт: статус, resultCount, startedAt, finishedAt, error** |
| GET | /scrape-runs | список с пагинацией |

- API заводит PrismaClient через `@repo/db`.
- Единый паттерн: handler → service (services/ в api) → Prisma; контракты — из `@repo/contracts`.
- Ошибки: Prisma P2025 → 404, P2002 → 409.

## 6. ENV

```bash
# .env.example добавляем
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENCY=1
REDIS_URL=redis://localhost:6379   # уже есть
```

`packages/config`: `SCRAPER_HEADLESS: z.coerce.boolean().default(true)`, `SCRAPER_CONCURRENCY: z.coerce.number().default(1)`.

## 7. Тесты

### Unit (worker)
- `tests/unit/parse.test.ts` — парсер: фикстура `search-page-1.html` (реальный HTML hh.ru, сохранённый как fixture) → корректные ParsedVacancy; карточки без зарплаты; отсутствие карточек; URL с query.
- `tests/unit/normalize.test.ts` — salary "от 50 000 до 80 000 ₽", "до 100 000 ₽", "не указана"; currency "₽"→RUB, "$"→USD; hhId regex.
- `tests/unit/dedupe.test.ts` — SETNX path: первый → true, второй → false (ioredis-mock или реальный Redis-контейнер).

### E2E (worker + api) — цикл сбор→сохранение
- `tests/e2e/scrape-cycle.test.ts`:
  - требует живых postgres+redis (docker compose); в CI — service containers.
  - Setup: `prisma db push --skip-generate`; seed: FilterConfig, ScraperConfig (фикстура), ScrapeRun.
  - Browser заменяем: инжектируем fake fetcher вместо Playwright (processor принимает `deps`).
  - runScrapeRun(job) → ScrapeRun completed, в БД появились вакансии с hhId.
  - повторный запуск → дублей нет (dedupe).
- `tests/e2e/scrape-runs-api.test.ts` (api): POST /scrape-runs создаёт запись pending; GET /scrape-runs/:id возвращает статус.

### CI (ci.yml)
- Добавить `services: postgres:16, redis:7` (service containers) для e2e.
- Прогон: lint, typecheck, test:unit, build, затем `test:e2e` (api + worker) против сервисов.

## 8. Definition of Done

1. `packages/queue` создан, API и worker используют одну очередь.
2. Скрейпер парсит фикстуры (unit-тесты зелёные), браузер — только через ScraperConfig.
3. Цикл POST /scrape-runs → worker → Postgres → GET /scrape-runs/:id работает (e2e).
4. Дедуп работает: повторный сбор не создаёт дублей.
5. Все stubs из Sprint 1 заменены реальной логикой.
6. `lint + typecheck + test:unit + test:e2e + build` — зелёные.
7. Локальные коммиты по шагам.

## 9. Вне скоупа

- AI-скоринг rawPayload (Sprint задел есть).
- Авторизация.
- Экспорт (Sprint 3).