# Sprint 5 — наблюдаемость + устойчивость очереди

## Цель спринта

Закрыть проверенные пробелы Sprint 0–4 в наблюдаемости и устойчивости очереди:
метрики Prometheus для API и worker, алерты в Telegram, basic-auth на `/metrics`,
retry-политика BullMQ, согласованный статус `ScrapeRun` между попытками джобы,
автообновление статуса запуска в UI и вынос `baseUrl` скрапера в env.

## Решения заказчика (2026-11-06)

1. Стек: Prometheus + Grafana (+ Alertmanager для алертов).
2. Алерты — в Telegram (Alertmanager receiver `telegram`); токен и chat id только из
   env (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`), в git не попадают.
3. `/metrics` публикуется наружу через nginx с basic-auth; креды (`METRICS_USER`,
   `METRICS_PASSWORD`) из env, файл `.htpasswd` не в git.
4. Бэкапы БД — Sprint 6 (вне этого спринта).
5. `baseUrl` скрапера выносится из хардкода в env (`SCRAPER_BASE_URL`) в этом спринте.

## Границы спринта

В скоупе:

- `specs/sprint-5.md` (эта спека);
- `SCRAPER_BASE_URL` в `packages/config` + использование в worker, `.env*` и compose;
- `defaultJobOptions` (retry/backoff/cleanup) в `packages/queue`;
- согласование статуса `ScrapeRun` между попытками джобы в processor;
- `GET /metrics` в `apps/api` (prom-client, отдельный registry);
- `GET /metrics` в health-сервере worker (порт 3002) с метриками BullMQ;
- `infrastructure/monitoring/*` (Prometheus, Alertmanager, Grafana provisioning) и
  сервисы `prometheus`/`alertmanager`/`grafana` в compose staging/prod;
- nginx basic-auth для `/metrics` и `/metrics/worker`, `scripts/gen-htpasswd.sh`;
- автообновление статуса запусков в UI (`apps/web`) без F5;
- документация: `docs/monitoring.md`, `CLAUDE.md`, `.env.example`.

Вне скоупа:

- бэкапы PostgreSQL (Sprint 6);
- тесты `apps/web` (нет тестового раннера в web — вне спринта);
- изменение селекторов Playwright;
- изменение CI workflow: новые тесты идут через существующие turbo-джобы;
- любые обращения к живому hh.ru из тестов (только моки/фикстуры).

## Требования

### 1. Конфигурация

- `SCRAPER_BASE_URL` — `z.string().url()`, default `https://hh.ru`.
- Значение используется worker'ом вместо хардкода `https://hh.ru`.
- Переменная описана в `.env.example`, `.env.staging.example`, `.env.prod.example`
  и проброшена в `docker-compose.staging.yml` / `docker-compose.prod.yml`.

### 2. Retry-политика очереди

`createScrapeQueue` создаёт очередь со следующими `defaultJobOptions`:

| Параметр           | Значение                                 |
| :----------------- | :--------------------------------------- |
| `attempts`         | `3`                                      |
| `backoff`          | `{ type: 'exponential', delay: 10_000 }` |
| `removeOnComplete` | `{ count: 100 }`                         |
| `removeOnFail`     | `{ count: 500 }`                         |

Ограничение `attempts ≤ 3` и `backoff ≥ 10 с` — защита от лишних запросов к hh.ru.

### 3. Статус `ScrapeRun` и попытки

- Промежуточная попытка: `ScrapeRun.status` остаётся `running`, ошибка пишется в лог
  worker'а, джоба бросает исключение (BullMQ делает retry).
- Последняя попытка (`job.attemptsMade + 1 >= job.opts.attempts`):
  `ScrapeRun.status = failed`, `error` (≤ 2000 символов), `finishedAt`.
- Если `attempts` не задан (значение по умолчанию — 1), поведение прежнее: сразу `failed`.

### 4. Метрики API (`apps/api`)

- Отдельный (не глобальный) `Registry` prom-client.
- `http_requests_total{method,route,status}` — counter.
- `http_request_duration_seconds{method,route,status}` — histogram (hook `onResponse`).
- `hhvc_vacancies_total` — gauge, значение берётся из БД при сборе метрик.
- `GET /metrics` отдаёт `registry.metrics()` с `Content-Type: registry.contentType`.
- Метрика `/metrics` доступна внутри compose-сети без auth; наружу — только через
  nginx с basic-auth.

### 5. Метрики worker (`apps/worker`, порт 3002)

- `bullmq_jobs_completed_total` — counter (событие `completed`).
- `bullmq_jobs_failed_total` — counter (событие `failed`).
- `bullmq_jobs_active_total` — gauge (инкремент на `active`, декремент на
  `completed`/`failed`).
- `GET /metrics` в том же health-сервере; `GET /health` не меняется.

### 6. Инфраструктура мониторинга

- `infrastructure/monitoring/prometheus.yml`: scrape `api:3001/metrics` и
  `worker:3002/metrics` по внутренней сети compose (без basic-auth), правило-файл
  `alerts.yml`.
- `infrastructure/monitoring/alerts.yml`: правила из `docs/monitoring.md` §4.
- `infrastructure/monitoring/alertmanager/alertmanager.yml.tmpl`: receiver `telegram`
  с плейсхолдерами `__TELEGRAM_BOT_TOKEN__` / `__TELEGRAM_CHAT_ID__`, подстановка из
  env при старте контейнера.
- `infrastructure/monitoring/grafana/provisioning/*`: datasource Prometheus + провайдер
  дашбордов и один дашборд (`hhvc-overview.json`).
- Сервисы `prometheus`, `alertmanager`, `grafana` в `docker-compose.staging.yml` и
  `docker-compose.prod.yml` с volumes; наружу публикуется только Grafana — через nginx.

### 7. Nginx и basic-auth

- `location = /metrics` → `api:3001/metrics`.
- `location = /metrics/worker` → `worker:3002/metrics`.
- Оба location защищены `auth_basic`; файл `auth_basic_user_file /etc/nginx/htpasswd/metrics`.
- Файл генерируется `scripts/gen-htpasswd.sh` из `METRICS_USER`/`METRICS_PASSWORD`,
  каталог `infrastructure/nginx/htpasswd/` в `.gitignore`, в compose монтируется ro.
- Запрос без кредов — `401`; с кредами — метрики в текстовом формате Prometheus.

### 8. UI

- Список запусков (`/scrape-runs`) и карточка запуска (`/scrape-runs/[id]`) обновляют
  данные каждые 5 с, пока есть запуски в статусе `pending`/`running`; интервал
  очищается при размонтировании и при отсутствии активных запусков.
- Ручное обновление и пагинация продолжают работать.

## Критерии приёмки

1. `pnpm turbo run lint typecheck test:unit` зелёные; новые тесты шагов 2–6 проходят.
2. Проваленная задача: 3 попытки, затем `failed` (unit-тест processor и тест
   `defaultJobOptions`).
3. `curl -u user:pass localhost/metrics` и `/metrics/worker` отдают метрики; без кредов —
   `401` (проверяется на staging; статически — `docker compose config -q`).
4. На staging Prometheus видит оба таргета UP, Grafana показывает дашборд, тестовый
   алерт доходит в Telegram (проверка на стенде, вне CI).
5. Страница запусков обновляет статус без F5.
6. `SCRAPER_BASE_URL` переопределяется через env (unit-тест).
7. Секреты (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `METRICS_USER`,
   `METRICS_PASSWORD`) в репозитории отсутствуют; `.htpasswd` в `.gitignore`.
