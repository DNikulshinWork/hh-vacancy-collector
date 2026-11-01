# Monitoring & Observability Guide

Руководство по мониторингу, логированию и алертингу для **hh-vacancy-collector**.

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
* `debug` — детальная отладка запросов, селекторов парсинга и ответов;
* `info` (по умолчанию для staging) — жизненный цикл задач, статус очередей;
* `warn` (рекомендуется для production) — предупреждения о сбоях сети, задержках;
* `error` — критические ошибки, падения парсера, сбои БД.

### Ротация логов Docker:
В `docker-compose.prod.yml` настроен драйвер `json-file` с автоматической ротацией, предотвращающий переполнение диска:
```yaml
logging:
  driver: json-file
  options:
    max-size: 50m
    max-file: '5'
```

---

## 2. Эндпоинты проверки здоровья (Health Checks)

Каждый сервис предоставляет легковесный эндпоинт `/health`:

| Сервис | Порт | Эндпоинт | Проверяемые подсистемы |
| :--- | :--- | :--- | :--- |
| **API** | `3001` | `GET /health` | PostgreSQL (`SELECT 1`), Redis ping, Uptime |
| **Worker** | `3002` | `GET /health` | Процесс воркера, Uptime |
| **Web UI** | `3000` | `GET /health` | Next.js серверный статус |

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

## 3. Prometheus Метрики

### Ключевые метрики для отслеживания:

1. **Метрики очереди BullMQ (`@repo/queue`)**:
   * `bullmq_jobs_waiting_total` — количество задач в очереди ожидания скрапинга;
   * `bullmq_jobs_active_total` — количество задач, обрабатываемых в данный момент;
   * `bullmq_jobs_completed_total` — успешно завершенные запуски сбора;
   * `bullmq_jobs_failed_total` — сбои при сборе вакансий.

2. **Метрики базы данных PostgreSQL**:
   * `pg_stat_database_numbackends` — активные соединения;
   * `pg_stat_activity_max_tx_duration` — длительность транзакций;
   * `hhvc_vacancies_total` — общее число сохраненных вакансий.

3. **Метрики HTTP API (Fastify)**:
   * `http_requests_total{status=~"[45].."}` — частота ошибок API;
   * `http_request_duration_seconds` — латентность запросов.

---

## 4. Правила алертинга (Alerting Rules)

### 1. Критическая недоступность сервиса (Severity: Critical)
* **Условие**: `probe_success{instance="http://api:3001/health"} == 0` в течение 1 минуты.
* **Действие**: Уведомление дежурному инженеру (Telegram / PagerDuty / Slack).

### 2. Сбои скрапинга вакансий (Severity: Warning)
* **Условие**: `rate(bullmq_jobs_failed_total[15m]) > 0.1` (более 10% сбоев задач).
* **Причина**: Возможно изменение разметки сайта hh.ru, капча или сетевая блокировка IP.

### 3. Накопление очереди задач (Severity: Warning)
* **Условие**: `bullmq_jobs_waiting_total > 50` в течение 10 минут.
* **Решение**: Увеличение количества реплик worker (`docker compose up -d --scale worker=3`).

### 4. Нехватка места на диске (Severity: Critical)
* **Условие**: `node_filesystem_free_bytes / node_filesystem_size_bytes < 0.10` (<10% свободного места на сервере).
