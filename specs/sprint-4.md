# Sprint 4 — GHCR образы, деплой, smoke-тест

## Цель спринта
Подготовить проект к production деплою: создать Docker образы, настроить деплой и smoke-тесты.

## 1. Docker образы

### Базовые образы
- `ghcr.io/dnikulshinwork/hh-vacancy-collector/api:latest`
- `ghcr.io/dnikulshinwork/hh-vacancy-collector/worker:latest`
- `ghcr.io/dnikulshinwork/hh-vacancy-collector/web:latest`

### Конфигурация
- `Dockerfile` для каждого сервиса
- `.dockerignore` для оптимизации
- Healthcheck для сервисов

## 2. CI/CD pipeline

### GitHub Actions
- Автоматический build и push образов при push в main
- Тестирование в CI перед сборкой
- Deploy в staging окружение

### Deploy workflow
- `deploy/staging` — тестовое окружение
- `deploy/prod` — production окружение

## 3. Инфраструктура

### Docker Compose
- `docker-compose.prod.yml` — production версия
- `docker-compose.staging.yml` — staging версия
- Поддержка SSL через Traefik или Nginx

### Environment variables
- `.env.prod` — production переменные
- `.env.staging` — staging переменные

## 4. Smoke тесты

### API endpoint
- `GET /health` — проверка сервисов
- `GET /vacancies` — проверка работы БД
- `GET /scrape-runs` — проверка очереди

### Системные тесты
- Проверка связей БД
- Проверка Redis подключения
- Проверка запуска worker

## 5. Документация

### Deployment guide
- Как запустить в production
- Как настроить SSL
- Как масштабировать сервисы

### Monitoring
- Логирование в JSON
- Prometheus метрики
- Alerting правила

## 6. Требования
- Все сервисы работают в контейнерах
- Docker Compose для staging/prod
- CI/CD pipeline с автоматическим деплоем
- Smoke тесты в CI
- Документация по деплою