# hh-vacancy-collector

Сбор вакансий hh.ru через Playwright, хранение в Postgres, REST API (Fastify), UI (Next.js).

## Структура

- `apps/api` — Fastify REST API
- `apps/worker` — BullMQ worker и Playwright scraper
- `apps/web` — Next.js UI
- `packages/config` — env/config
- `packages/contracts` — DTO и shared schemas
- `packages/db` — Prisma schema/client
- `packages/queue` — BullMQ wrapper
- `infrastructure/compose` — docker-compose для dev
- `specs/` — спецификации спринтов
- `docs/` — deployment, monitoring
- `infrastructure/nginx/` — Nginx SSL reverse-proxy
- `.github/workflows/` — ci, deploy, smoke-containers
- `scripts/`, `tooling/` — служебные скрипты и конфиги (назначение уточнить)

## Принятые решения (с датами)

- 2026-11-06: LLM-провайдер для pi — Polza AI (провайдер `polza-ai`, api `openai-completions`, ключ из `$POLZA_API_KEY`). Работает напрямую, без xray-прокси: запускать `pi`, не `pi-proxy`.
- 2026-11-06: модели по ролям (₽/1M вход/выход): план — `z-ai/glm-5.3` (32/102); код — `deepseek/deepseek-v4.1-flash` (2.5/46); ревью — `z-ai/glm-5.3-flash` (3.3/10.7). Ревьюер из другого семейства, чем кодер. Запас для кода: `qwen/qwen3-coder-next`.
- 2026-11-06: не использовать `moonshotai/kimi-k3*` и `z-ai/glm-5.3-prime` (выход ~1000 ₽/1M).
- 2026-11-06: основная сессия pi — на кодере; план и ревью делегируются субагентам. Цикл: plan → код → review → коммит.

## Сделано

- Sprint 0: скелет монорепо (pnpm + turbo), tooling, packages/config|contracts|logger,
  apps/api|worker|web, compose (postgres+redis), CI, Husky, CLAUDE.md.
- Sprint 0 final-fix: Dockerfile'ы переведены на full-install без pnpm --filter,
  добавлен .dockerignore, подтверждены docker build x3; правки §11 применены.
- Sprint 1: packages/db (Prisma schema: Vacancy, FilterConfig, ScraperConfig, ScrapeRun),
  contracts (DTO + zod-схемы), REST stubs (/vacancies, /filter-configs, /scrape-runs)
  с валидацией Zod и unit/e2e тестами, глобальный error handler (ZodError → 400).
- Sprint 2: Playwright scraper, BullMQ worker, dedupe, CRUD, e2e тесты,
  схемы и API endpoints, fixtures, unit tests, CI workflow с service containers.

- Sprint 3: web UI (Next.js 15, dashboard, вакансии, фильтры, scrape-runs, экспорт CSV/PDF).
- Sprint 4: GHCR-образы, docker-compose.staging.yml, docker-compose.prod.yml, Nginx SSL reverse-proxy, healthchecks, smoke-test.sh, CI/CD deploy pipeline, документация deployment и monitoring.
- 2026-11-06 (инструменты): pi подключён к Polza AI (`~/.pi/agent/models.json`, 3 модели); установлены pi-mcp-adapter и pi-subagents; агенты `plan` и `review` в `~/.pi/agent/agents/`.
- 2026-11-06: в `~/.pi/agent/settings.json` зафиксированы `defaultProvider` = `polza-ai`, `defaultModel` = `deepseek/deepseek-v4.1-flash`.
- 2026-11-06: прогон проверен: `/run plan` → polza-ai/z-ai/glm-5.3 (~1 ₽ за 20k/3k токенов), `/run review` → polza-ai/z-ai/glm-5.3-flash (~0.1 ₽ за 17k/6k); `/subagents-models plan` подтверждает модель из конфига агента.

## Инструменты разработки (pi)

- Агенты: `plan` (glm-5.3, tools: read/grep/find/ls, без записи), `review` (glm-5.3-flash, tools: read/grep/find/ls/bash; «только `git diff`» задано промптом, технически bash не ограничен). Кодирует основная сессия.
- Артефакты вывода субагентов: `~/.pi/agent/sessions/--home-dev-projects-hh-vacancy-collector--/subagent-artifacts/`.
- Встроенные агенты pi-subagents (worker, scout, reviewer, oracle и др.) по умолчанию наследуют модель основной сессии.
- Запуск: `/run plan "<задача>"`, `/run review "проверь git diff"`; маппинг моделей: `/subagents-models <имя>`.
- MCP: адаптер читает `~/.config/mcp/mcp.json`, `.mcp.json` (корень), `~/.pi/agent/mcp.json`, `.pi/mcp.json`; серверов пока нет (0/0); настройка — `/mcp-adapter setup`. Встроенный MCP pi отключён адаптером (`-builtin:mcp` в settings.json) — штатно.
- Цены Polza: `curl https://polza.ai/api/v1/models`, поле `top_provider.pricing.*_per_million` (RUB).

## Что осталось

- Подключить MCP-серверы (PostgreSQL, GitHub), если понадобятся.
- После первых сессий сверить реальный расход в кабинете Polza и пересмотреть роли.
- Следующий спринт после Sprint 4: уточнить и добавить сюда.

## Нюансы

- Спецификация — источник истины. Неясность → вопрос, не гипотеза.
- Селекторы Playwright — в ScraperConfig, не в коде.
- Живой hh.ru в CI не дёргаем.
- Local first → Reuse second → Extract only when justified (ED §57).
- Не создавать пустые архитектурные папки (ED §60.23).
- Ключ `pza_...` не хранить в репозитории и в `models.json`: только `"apiKey": "$POLZA_API_KEY"`.
- Ошибка «No API provider registered for api: openai» = в `models.json` `api: "openai"`; допустимы только `openai-completions`, `openai-responses`, `anthropic-messages`.
- Если `glm-5.3` с `reasoning: true` даёт ошибку параметров — поставить `reasoning: false`.
- Если модель субагента не распознана (вложенные слэши в ID) — сверить через `pi --list-models polza-ai`.
