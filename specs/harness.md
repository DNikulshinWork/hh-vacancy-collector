# Harness — оркестратор plan → code → review

Источник истины для задачи «обвязка harness». Всё, что не описано здесь, не делается. При неясности — вопрос, не гипотеза.

---

## 1. Метаданные

|             |                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Задача      | Harness: пайплайн plan → code → review по спекам спринтов                                                                                          |
| Зависимости | Sprint 0 закрыт (main)                                                                                                                             |
| Ветка       | `feat/harness`                                                                                                                                     |
| DoD         | `pnpm i && pnpm turbo run lint typecheck test:unit build` зелёный; `pnpm harness run specs/sprint-0.md --dry-run` печатает план и оценку стоимости |

## 2. Цель

CLI-инструмент, который берёт `specs/<name>.md` и прогоняет цикл:

1. **plan** — спека → структурированный план (слои, файлы, команды проверки);
2. **code** — по шагам плана генерирует содержимое файлов, применяет их в рабочую ветку, после слоя гоняет проверки;
3. **review** — модель другого семейства сверяет diff со спекой и запретами §7 спеки;
4. при красных проверках или замечаниях — возврат в code (лимит итераций), затем стоп и эскалация человеку.

Модели, лимиты и бюджет — только в конфиге, не в коде.

## 3. Модели (стартовый конфиг, цены ₽ за 1M токенов, каталог от 22.10.2026)

| Роль                     | Модель (ID)                             |         Вход |          Выход | Заметка                      |
| ------------------------ | --------------------------------------- | -----------: | -------------: | ---------------------------- |
| plan                     | `anthropic/claude-sonnet-5.5`           |       234,07 |       1 170,36 | редкий вызов, малый объём    |
| plan (fallback)          | `deepseek/deepseek-v4-pro`              |        46,88 |          93,76 |                              |
| code                     | `deepseek/deepseek-v4-pro`              |        46,88 |          93,76 | основной расход токенов      |
| code (кандидаты для A/B) | `qwen/qwen3-coder-next`, `z-ai/glm-5.3` | 14,04 / 9,25 | 93,63 / 163,85 |                              |
| review                   | `anthropic/claude-haiku-5.5`            |        11,70 |          58,52 | другое семейство, чем у code |
| review (fallback)        | `google/gemini-3.8-flash`               |        43,89 |         219,44 |                              |

Выбор code-модели подтверждается бенчмарком (§8), а не названием.

## 4. Дерево (ровно эти файлы)

```
tooling/harness/
├── src/
│   ├── cli.ts            # команды: run, plan, review
│   ├── config.ts         # загрузка и валидация harness.config.ts (zod)
│   ├── llm.ts            # клиент polza.ai (fetch), ретраи, учёт токенов
│   ├── cost.ts           # подсчёт стоимости по ценам из конфига
│   ├── checks.ts         # запуск pnpm turbo run lint/typecheck/test:unit
│   ├── git.ts            # ветка, apply файлов, diff
│   └── pipeline/
│       ├── plan.ts
│       ├── code.ts
│       └── review.ts
├── tests/unit/
│   ├── cost.test.ts
│   └── config.test.ts
├── harness.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Правила: workspace `tooling/*` уже подхватывает пакет; новые зависимости вне §5 запрещены; пустых папок нет.

## 5. Пофайловая спецификация

**package.json**: `name: @repo/harness`, `private`, `type: module`, `bin`/script `harness`. Dependencies: `zod`, `@repo/config` не нужен. DevDependencies: `tsx`, `vitest`. HTTP — нативный `fetch` (Node 20). Корневой script: `"harness": "pnpm --filter @repo/harness exec tsx src/cli.ts"`.

**Окружение**: `POLZA_API_KEY` (обязателен, в `.env.example` не добавляется значением — добавить пустую строку), `POLZA_BASE_URL` (default `https://polza.ai/api/v1`).

**llm.ts**: `chat({ model, messages, maxTokens, temperature }) → { text, usage }` через `POST {base}/chat/completions` (OpenAI-совместимый формат, **проверен живым запросом 23.10.2026**: ответ `choices[0].message.content`, `usage.prompt_tokens/completion_tokens`, а также `usage.cost_rub` — фактическая стоимость вызова в ₽). Не использовать tool calling: ответы моделей — строго JSON (plan, review) или JSON `{ files: [{ path, content }] }` (code). `response_format: json_object` сервис принимает, но модель (haiku-5.5) всё равно оборачивает JSON в ```json-ограждение, поэтому: параметр не считать гарантией, перед парсингом снимать markdown-ограждения. Парсинг через zod, при невалидном JSON — один ретрай с текстом ошибки. Ретраи на 429/5xx с backoff.

**plan.ts**: вход — текст спеки + дерево репо. Выход (zod): `{ layers: [{ name, files: [{ path, intent }], checkCommands }] }`. Файлы вне дерева спеки — ошибка валидации плана.

**code.ts**: по слою — один вызов модели с контекстом: спека, план слоя, содержимое уже существующих затронутых файлов. Ответ — файлы целиком. Применение через `git.ts`, коммит на слой `harness(<spec>): layer <name>`. После слоя — `checks.ts`.

**review.ts**: вход — `git diff main...HEAD` + спека. Выход (zod): `{ verdict: 'pass'|'fail', findings: [{ severity, file, message }] }`. Критерии из спеки §7: файлы вне дерева, зависимости вне спеки, доменная логика, «улучшение» спеки.

**checks.ts**: запускает команды, возвращает `{ ok, output }`, вывод обрезается до 8 КБ на ошибку для передачи в code.

**cost.ts**: источник истины по стоимости — `usage.cost_rub` из ответа API; расчёт по ценам из конфига (`cost(usage, prices)`) используется только для оценки худшего случая до вызова и как запасной вариант, если `cost_rub` нет; накопитель бюджета на запуск (`runBudgetRub`) и сквозной леджер `.harness/ledger.jsonl` (`totalBudgetRub` = стартовый бюджет 500 ₽). Перед каждым вызовом оценивается худший случай (входные токены + `maxTokensPerCall`); если он не помещается в остаток запуска или леджера — стоп с кодом 1. При достижении `warnAtRatio` от общего бюджета печатается предупреждение. Леджер ведётся локально и не заменяет баланс на polza.ai: при расхождении ориентир — баланс провайдера.

**harness.config.ts**: экспорт объекта (валидируется zod):

```
models: { plan, code, review }  // id + priceIn + priceOut (₽/1M)
limits: { maxCodeIterations: 3, maxReviewRounds: 2, runBudgetRub: 80, totalBudgetRub: 500, warnAtRatio: 0.8, maxTokensPerCall: 16000 }
paths:  { specsDir: 'specs', logDir: '.harness' }
```

**Логи**: `.harness/<timestamp>/` (jsonl вызовов, токены, стоимость). Добавить `.harness/` в `.gitignore`.

## 6. Поведение CLI

- `harness plan <spec>` — только план, печатает JSON и оценку стоимости.
- `harness run <spec> [--dry-run]` — полный цикл; `--dry-run` без записи файлов и без code-вызовов.
- `harness review <spec>` — только ревью текущего diff.
- Код выхода: 0 — pass; 1 — исчерпаны итерации/бюджет (эскалация); 2 — ошибка конфигурации.

## 7. Что вне задачи

Автосоздание PR, работа с GitHub API, tool calling и агентные циклы, параллельные ветки, веб-UI, хранение в БД, любые изменения `apps/*` и `packages/*`.

## 8. Бенчмарк code-модели (в рамках задачи)

Один и тот же слой (`packages/*` из `sprint-0.md`) прогоняется на 3 кандидатах из §3. Лимит на весь бенчмарк — 30 ₽ (оценка ≈ 15 ₽), без повторных прогонов. Метрики: прошли ли `typecheck/lint`, число итераций, стоимость ₽, число замечаний ревью. Результат — таблица в PR, победитель в `harness.config.ts`.

## 9. Правила эскалации

Агент останавливается: при расхождении формата API polza.ai с OpenAI-совместимым, при невалидных ответах после ретрая, при превышении бюджета или итераций, при любой неоднозначности.

## 10. Definition of Done

1. `pnpm install` — успешно, lockfile закоммичен.
2. `pnpm turbo run lint typecheck test:unit build` — exit 0.
3. `pnpm harness plan specs/sprint-0.md` — валидный план, оценка стоимости.
4. `pnpm harness run specs/sprint-0.md --dry-run` — exit 0.
5. Unit-тесты `cost` и `config` зелёные (в т.ч. стоп по `runBudgetRub` и `totalBudgetRub`, предупреждение на 80 %).
6. Таблица бенчмарка (§8) в описании PR.
7. `CLAUDE.md` обновлён (раздел «Сделано» и «Решения»: модели, лимиты).
