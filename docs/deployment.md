# Deployment Guide

Руководство по развертыванию сервиса **hh-vacancy-collector** в staging и production окружениях.

---

## Архитектура системы

Вся система упакована в Docker-контейнеры и управляется через **Docker Compose**:

1. **`postgres` (порт 5432)** — PostgreSQL 16 для хранения вакансий, конфигураций фильтров, скраперов и логов запусков.
2. **`redis` (порт 6379)** — Redis 7 для очередей задач BullMQ и распределенных блокировок дедупликации вакансий.
3. **`api` (порт 3001)** — Fastify REST API сервер.
4. **`worker` (порт 3002)** — BullMQ worker со встроенным Playwright scraper и Chromium.
5. **`web` (порт 3000)** — Next.js 15 Web UI (Standalone режим).
6. **`nginx` (порты 80, 443)** — Обратный прокси (Reverse Proxy) с SSL/TLS терминацией, сжатием gzip и кэшированием статики.

---

## Предварительные требования

* Linux-сервер (Ubuntu 22.04 LTS / 24.04 LTS или Debian 12)
* Docker 24.0+ и Docker Compose v2.20+
* Доменное имя (например, `hhvc.yourdomain.com`), направленное A-записью на IP адрес вашего сервера.

---

## Быстрый старт (Staging)

1. Клонируйте репозиторий на сервер:
   ```bash
   git clone https://github.com/DNikulshinWork/hh-vacancy-collector.git
   cd hh-vacancy-collector
   ```

2. Скопируйте файл переменных окружения:
   ```bash
   cp .env.staging.example .env
   # Отредактируйте .env при необходимости
   ```

3. Запустите сервисы через Docker Compose:
   ```bash
   docker compose -f infrastructure/compose/docker-compose.staging.yml up -d
   ```

4. Примените схему базы данных:
   ```bash
   docker compose -f infrastructure/compose/docker-compose.staging.yml exec api pnpm --filter @repo/db db:push
   ```

5. Выполните проверку работоспособности (Smoke Tests):
   ```bash
   ./scripts/smoke-test.sh http://localhost:3001 http://localhost:3000 http://localhost:3002
   ```

---

## Production развертывание

### 1. Подготовка конфигурации окружения

```bash
cp .env.prod.example .env
```
Обязательно задайте надежный пароль для базы данных в `.env`:
```ini
POSTGRES_PASSWORD=your_super_secret_strong_password
DATABASE_URL=postgresql://hhvc:your_super_secret_strong_password@postgres:5432/hhvc
```

### 2. Запуск сервисов

```bash
docker compose -f infrastructure/compose/docker-compose.prod.yml up -d
```

### 3. Настройка SSL/TLS сертификатов (Let's Encrypt / Certbot)

Для выпуска бесплатного SSL-сертификата выполните:

```bash
# Получение сертификата через certbot webroot
docker run -it --rm --name certbot \
  -v "$(pwd)/infrastructure/compose/certbot_prod_etc:/etc/letsencrypt" \
  -v "$(pwd)/infrastructure/compose/certbot_prod_www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d your-domain.com -d www.your-domain.com --email admin@your-domain.com --agree-tos --no-eff-email
```

После выпуска сертификата активируйте конфигурацию SSL:
1. Скопируйте шаблон:
   ```bash
   cp infrastructure/nginx/conf.d/ssl-template.conf infrastructure/nginx/conf.d/app.ssl.conf
   ```
2. Замените `your-domain.com` на ваш реальный домен в `app.ssl.conf`.
3. Перезапустите Nginx:
   ```bash
   docker compose -f infrastructure/compose/docker-compose.prod.yml restart nginx
   ```

Для автоматического продления сертификата добавьте задачу в cron:
```bash
0 3 * * * docker run --rm -v "$(pwd)/infrastructure/compose/certbot_prod_etc:/etc/letsencrypt" -v "$(pwd)/infrastructure/compose/certbot_prod_www:/var/www/certbot" certbot/certbot renew --webroot -w /var/www/certbot && docker compose -f infrastructure/compose/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Масштабирование

При росте объема сбора вакансий можно горизонтально масштабировать worker'ов:

```bash
docker compose -f infrastructure/compose/docker-compose.prod.yml up -d --scale worker=3
```

Каждый worker подключается к общей очереди Redis `scrape` и параллельно обрабатывает задания на сбор данных с соблюдением распределенных блокировок дедупликации.

---

## Откат (Rollback)

В случае необходимости отката на предыдущую версию:

1. Укажите конкретный тег коммита/образа в `.env`:
   ```ini
   IMAGE_TAG=<previous_commit_sha>
   ```
2. Перезапустите контейнеры:
   ```bash
   docker compose -f infrastructure/compose/docker-compose.prod.yml pull
   docker compose -f infrastructure/compose/docker-compose.prod.yml up -d
   ```
