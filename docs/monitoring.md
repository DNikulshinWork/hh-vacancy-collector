# Monitoring & Observability Guide

Руководство по мониторингу, логированию и алертингу для **hh-vacancy-collector**.

Стек (решение заказчика, 2026-11-06): **Prometheus + Grafana + Alertmanager**, алерты в
Telegram, `/metrics` наружу — через nginx с basic-auth.

---

## 1. Структурированное логирование (JSON)

Все микросервисы (`api`, `worker`, `web`) используют структурированное JSON-логирование через пакет `@repo/logger` (Pino).

### Формат сообщений:

```json
{
  "level": 30,
  "time": 1730467200000,
  "pid": 1,
  "hostname": "api-6d8b945f-xxxx",
  "name": "api",
  "msg": "api listening on port 3001"
}
```

### Управление уровнем логирования:

Уровень логирования задается переменной окружения `LOG_LEVEL`:

- `debug` — детальная отладка запросов, селекторов парсинга и ответов;
- `info` (по умолчанию для staging) — жизненный цикл задач, статус очередей;
- `warn` (рекомендуется для production) — предупреждения о сбоях сети, задержках;
- `error` — критические ошибки, падения парсера, сбои БД.

### Ротация логов Docker:

В `docker-compose.prod.yml` настроен драйвер `json-file` с автоматической ротацией, предотвращающий переполнение диска:

```yaml
logging:
  driver: json-file
  options:
    max-size: 50m
    max-file: "5"
```

---

## 2. Эндпоинты проверки здоровья (Health Checks)

Каждый сервис предоставляет легковесный эндпоинт `/health`:

| Сервис     | Порт   | Эндпоинт      | Проверяемые подсистемы                      |
| :--------- | :----- | :------------ | :------------------------------------------ |
| **API**    | `3001` | `GET /health` | PostgreSQL (`SELECT 1`), Redis ping, Uptime |
| **Worker** | `3002` | `GET /health` | Процесс воркера, Uptime                     |
| **Web UI** | `3000` | `GET /health` | Next.js серверный статус                    |

### Пример ответа API `/health`:

```json
{
  "status": "ok",
  "service": "api",
  "uptime": 1420.5,
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

Если база данных или Redis недоступны, эндпоинт возвращает HTTP 503 со статусом `degraded`.

---

## 3. Prometheus Метрики — реализовано (Sprint 5)

Метрики отдают два сервиса, у каждого свой `Registry` (`prom-client`); агрегация — на
стороне Prometheus.

| Сервис     | Эндпоинт (внутри compose-сети) | Файл                                  |
| :--------- | :----------------------------- | :------------------------------------ |
| **API**    | `http://api:3001/metrics`      | `apps/api/src/app/plugins/metrics.ts` |
| **Worker** | `http://worker:3002/metrics`   | `apps/worker/src/app/metrics.ts`      |

### Метрики API

| Метрика                         | Тип       | Метки                       | Описание                                       |
| :------------------------------ | :-------- | :-------------------------- | :--------------------------------------------- |
| `http_requests_total`           | counter   | `method`, `route`, `status` | Все обработанные HTTP-запросы                  |
| `http_request_duration_seconds` | histogram | `method`, `route`, `status` | Латентность запросов (hook `onResponse`)       |
| `hhvc_vacancies_total`          | gauge     | —                           | Количество вакансий в БД (считается при сборе) |

### Метрики worker (BullMQ)

| Метрика                       | Тип     | Описание                                                                  |
| :---------------------------- | :------ | :------------------------------------------------------------------------ |
| `bullmq_jobs_completed_total` | counter | Успешно завершённые задачи скрапинга (событие `completed`)                |
| `bullmq_jobs_failed_total`    | counter | Проваленные попытки задач (событие `failed`, включая промежуточные retry) |
| `bullmq_jobs_active_total`    | gauge   | Задачи в обработке прямо сейчас (событие `active`)                        |

### Где смотреть

- `infrastructure/monitoring/prometheus.yml` — scrape `api:3001/metrics`,
  `worker:3002/metrics` (по внутренней сети compose, без basic-auth);
- `infrastructure/monitoring/alerts.yml` — правила алертинга;
- `infrastructure/monitoring/grafana/` — provisioning datasource и дашборд
  `hh-vacancy-collector — overview`;
- сервисы `prometheus`, `alertmanager`, `grafana` — в
  `docker-compose.staging.yml` и `docker-compose.prod.yml` (порты наружу не
  публикуются, Grafana доступна через nginx `/grafana/`).

---

## 4. Правила алертинга (Alerting Rules) — реализовано (Sprint 5)

Файл: `infrastructure/monitoring/alerts.yml`.

### 1. Критическая недоступность сервиса (Severity: Critical)

- **Условие**: `HhvcServiceDown` — `up{job=~"api|worker"} == 0` в течение 1 минуты.
- **Действие**: уведомление в Telegram (см. §6).
- **Примечание**: в исходной спецификации условие записано через
  `probe_success` blackbox-exporter; blackbox пока не разворачивается, поэтому
  используется эквивалентное `up{}`.

### 2. Сбои скрапинга вакансий (Severity: Warning)

- **Условие**: `HhvcScrapeFailures` — `rate(bullmq_jobs_failed_total[15m]) > 0.1`.
- **Причина**: возможно изменение разметки сайта hh.ru, капча или сетевая блокировка IP.

### 3. Накопление очереди задач (Severity: Warning)

- **Условие**: `HhvcQueueBacklog` — `bullmq_jobs_waiting_total > 50` в течение 10 минут.
- **Решение**: увеличение количества реплик worker (`docker compose up -d --scale worker=3`).
- **Примечание**: метрика `bullmq_jobs_waiting_total` пока не экспортируется
  worker'ом — правило находится в состоянии «no data» (см. `code-report.md`,
  «Открытые вопросы»).

### 4. Нехватка места на диске (Severity: Critical)

- **Условие**: `HhvcDiskSpaceLow` — `node_filesystem_free_bytes / node_filesystem_size_bytes < 0.10`.
- **Примечание**: требует `node-exporter`, который в Sprint 5 не разворачивался —
  правило находится в состоянии «no data».

---

## 5. Доступ к метрикам снаружи (basic-auth)

Внутри compose-сети метрики открыты, наружу — только через nginx с basic-auth:

| Внешний путь          | Куда проксируется     | Описание       |
| :-------------------- | :-------------------- | :------------- |
| `GET /metrics`        | `api:3001/metrics`    | Метрики API    |
| `GET /metrics/worker` | `worker:3002/metrics` | Метрики worker |
| `GET /grafana/`       | `grafana:3000`        | Grafana UI/API |

Grafana работает с `GF_SERVER_SERVE_FROM_SUB_PATH=true` и ожидает пути с префиксом
`/grafana/*`, поэтому в `app.conf` используется `proxy_pass http://grafana_upstream;`
(**без** trailing slash): запрос `/grafana/login` уходит в бэкенд как `/grafana/login`.

Порты `3001`/`3002` в `docker-compose.staging.yml` публикуются только на loopback
(`127.0.0.1:3001:3001`, `127.0.0.1:3002:3002`) — для smoke-тестов и
`scripts/smoke-test.sh`/CI на самом хосте; снаружи `/metrics` без basic-auth не
достучаться.

Запрос без кредов возвращает `401`, с кредами — метрики в текстовом формате
Prometheus:

```bash
curl -u "$METRICS_USER:$METRICS_PASSWORD" http://localhost/metrics
curl -u "$METRICS_USER:$METRICS_PASSWORD" http://localhost/metrics/worker
```

### Генерация `.htpasswd`

Креды хранятся только в env (`METRICS_USER`, `METRICS_PASSWORD`), файл `.htpasswd`
в git не попадает (`infrastructure/nginx/htpasswd/` в `.gitignore`) и монтируется в
nginx как `/etc/nginx/htpasswd/metrics`:

```bash
METRICS_USER=prometheus METRICS_PASSWORD='<strong-password>' ./scripts/gen-htpasswd.sh
```

Скрипт использует `htpasswd -B` (bcrypt), а если его нет — `openssl passwd -apr1`.

---

## 6. Алерты в Telegram

Alertmanager (`infrastructure/monitoring/alertmanager/alertmanager.yml.tmpl`)
отправляет алерты в Telegram. В git хранится **шаблон** с плейсхолдерами
`__TELEGRAM_BOT_TOKEN__` / `__TELEGRAM_CHAT_ID__`; значения подставляются из env при
старте контейнера (сервис `alertmanager` в compose).

Обязательные переменные окружения:

```bash
TELEGRAM_BOT_TOKEN=...   # токен бота от @BotFather
TELEGRAM_CHAT_ID=...     # id чата/канала (например, -1001234567890)
```

Как проверить:

1. Пересоздать alertmanager: `docker compose -f infrastructure/compose/docker-compose.staging.yml up -d alertmanager`.
2. В Prometheus → Alerts убедиться, что правила загружены.
3. Проверить доставку, остановив api: `docker compose ... stop api` — через ~1–2
   минуты должен прийти `HhvcServiceDown`, после старта — resolved-сообщение.

### Если переменные не заданы

Значения `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` **обязательны**: при пустых
значениях контейнер `alertmanager` не стартует, а завершается с кодом 1 и пишет в
логи понятную ошибку:

```text
error: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID обязательны для Alertmanager (см. docs/monitoring.md §6)
```

В staging оба значения по умолчанию пустые (`.env.staging.example`), то есть
**`alertmanager` в staging по умолчанию падает** — это штатно. Если алерты в
staging нужны, задайте переменные в `.env` и перезапустите сервис:

```bash
docker compose -f infrastructure/compose/docker-compose.staging.yml up -d alertmanager
```

Если алерты в staging не нужны, просто не поднимайте этот сервис
(`--scale alertmanager=0` либо не запускайте его) — на api/worker/prometheus/grafana
это не влияет; правило остаётся без нотификаций.

Подстановка значений в шаблон безопасна к спецсимволам `&`, `|`, `\` (они
экранируются перед `sed`), поэтому пароли/токены с такими символами не ломают
рендер `alertmanager.yml`.

Маршрутизация: `severity="critical"` — повтор каждые 1 ч, остальные — каждые 4 ч;
`send_resolved: true` (приходит уведомление о восстановлении).

---

## 7. Grafana

- Datasource и дашборды провижнятся из `infrastructure/monitoring/grafana/`;
- дашборд `hh-vacancy-collector — overview`: таргеты UP, RPS API, доля 5xx,
  латентность p95, задачи BullMQ (completed/failed/active), число вакансий в БД;
- UI доступен по `/grafana/` через nginx; администратор задаётся переменными
  `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`.
- `GRAFANA_ADMIN_PASSWORD` **обязателен и в staging, и в prod**
  (`${GRAFANA_ADMIN_PASSWORD:?GRAFANA_ADMIN_PASSWORD is required}` в compose):
  дефолта `admin` больше нет. Значение для staging — плейсхолдер в
  `.env.staging.example` (`change_me_grafana`), его нужно заменить на реальный
  пароль. Пока переменная не задана, любые команды compose для staging
  (включая `config`/`up`/`down`) завершаются ошибкой интерполяции.
