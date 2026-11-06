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

## API endpoints (Sprint 1 stubs)

- `GET /health` — healthcheck
- `GET /vacancies` — список вакансий (пагинация: `page`, `limit`, `sortBy`, `sortOrder`)
- `POST /vacancies` — создать вакансию
- `GET /filter-configs` — список конфигураций фильтров
- `POST /filter-configs` — создать конфигурацию фильтра
- `PATCH /filter-configs/:id` — обновить конфигурацию фильтра
- `POST /scrape-runs` — создать запуск сбора
- `GET /scrape-runs/:id` — статус запуска сбора

## AI-ассистент разработки (pi)

Разработка ведётся с терминальным агентом [pi](https://pi.dev) и моделями Polza AI. Контекст проекта агент читает из `CLAUDE.md` автоматически.

### Подготовка

1. Ключ Polza в окружении: `export POLZA_API_KEY="pza_..."` (в репозиторий и в `models.json` ключ не писать).
2. Провайдер `polza-ai` описан в `~/.pi/agent/models.json` (`api: openai-completions`, `baseUrl: https://polza.ai/api/v1`).
3. Расширения: `pi install npm:pi-subagents` и `pi install npm:pi-mcp-adapter`, затем перезапуск `pi`.
4. Агенты `plan` и `review` лежат в `~/.pi/agent/agents/*.md`.

### Схема агентов

| Роль                  | Кто               | Модель                         | Права                          |
| --------------------- | ----------------- | ------------------------------ | ------------------------------ |
| Код (основная сессия) | `pi`              | `deepseek/deepseek-v4.1-flash` | чтение и запись                |
| Планирование          | субагент `plan`   | `z-ai/glm-5.3`                 | только чтение                  |
| Ревью                 | субагент `review` | `z-ai/glm-5.3-flash`           | чтение и `bash` для `git diff` |

Ревьюер намеренно из другого семейства моделей, чем кодер: так он замечает больше.

### Рабочий цикл

1. **Спека.** Источник истины — `specs/` и `PROJECT_SPEC.md`. Неясность → вопрос, не гипотеза.
2. **План:** `/run plan "<задача, ссылка на спеку>"`. Агент ничего не меняет, возвращает нумерованный план.
3. **Код:** основная сессия `pi` реализует план, по шагам, с тестами.
4. **Ревью:** `/run review "проверь git diff"`. Для всей ветки: `/run review "проверь git diff origin/<ветка>..HEAD"`.
5. **Правки** по замечаниям `blocker` и `major`, коммит, push.

Типичный цикл «план + ревью» стоит около 1 ₽. Основная нагрузка идёт на кодера.

### Команды pi

| Что                   | Как                                                     |
| --------------------- | ------------------------------------------------------- |
| Запуск                | `pi` в корне репозитория                                |
| Список агентов        | `/agents`                                               |
| Какая модель у агента | `/subagents-models plan`                                |
| Сменить модель сессии | `Ctrl+L` или `/model`; `Ctrl+P` — переключение по кругу |
| Выполнить bash        | `!команда` (`!!` — без добавления вывода в контекст)    |
| MCP-серверы           | `/mcp`, первичная настройка `/mcp-adapter setup`        |
| Прервать / выйти      | `Esc` / `Ctrl+C` дважды                                 |

### Правила

- Не использовать дорогие модели (`moonshotai/kimi-k3*`, `z-ai/glm-5.3-prime`): список и причины — в `CLAUDE.md`.
- Если кодер дважды не справился с одним шагом — временно `qwen/qwen3-coder-next` или `z-ai/glm-5.3` через `/model`, затем вернуться.
- Перед `git push` — ревью всего диффа ветки.
- Живой hh.ru в тестах и CI не дёргаем; селекторы Playwright — в `ScraperConfig`.
- Значимые решения и изменения процесса фиксируются в `CLAUDE.md` (с датой).

## Specs

See [PROJECT_SPEC.md](./PROJECT_SPEC.md) and `/specs`.
