# Sprint 0 — Скелет монорепо

Передать агенту-исполнителю целиком. Этот документ — источник истины для Sprint 0.
Всё, что не описано здесь, — не делается. При неясности — задать вопрос, не додумывать (PROJECT_SPEC §1, CLAUDE.md §Нюансы).

---

1. Метаданные

 
Спринт 0 — скелет монорепо
Зависимости нет
Блокирует Sprint 1 (домен и контракт)
Estimated DoD pnpm i && pnpm turbo run lint typecheck test:unit build — зелёный
Ветка feat/sprint-0
Апрув тимлид подтверждает PR с этим DoD

---

2. Цель спринта

Создать работающий скелет монорепо по ED Microservices Monorepo Pattern v1.0:

· pnpm workspaces + Turborepo;
· три app-скелета (api, worker, web) с одним healthcheck каждый;
· три packages (config, contracts, logger);
· tooling-пакеты (typescript, eslint, prettier);
· compose с postgres + redis (без подключения приложений);
· CI (lint + typecheck + unit + build);
· Husky-хуки;
· CLAUDE.md в корне;
· .env.example.

Никакой доменной логики, никакой Prisma, никакого Playwright, никакого BullMQ, никаких реальных эндпоинтов кроме /health.

---

3. Дерево репозитория (полное, ровно эти файлы)

```
hh-vacancy-collector/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── bootstrap.ts
│   │   │   │   └── main.ts
│   │   │   ├── features/
│   │   │   │   └── health/
│   │   │   │       └── index.ts
│   │   │   ├── services/
│   │   │   │   └── .gitkeep
│   │   │   └── shared/
│   │   │       └── .gitkeep
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   └── .gitkeep
│   │   │   └── e2e/
│   │   │       └── health.test.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── worker/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── main.ts
│   │   │   ├── features/
│   │   │   │   └── .gitkeep
│   │   │   ├── services/
│   │   │   │   └── .gitkeep
│   │   │   └── shared/
│   │   │       └── .gitkeep
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   └── app/
│       │       ├── health/
│       │       │   └── route.ts
│       │       ├── layout.tsx
│       │       └── page.tsx
│       ├── public/
│       │   └── .gitkeep
│       ├── Dockerfile
│       ├── eslint.config.js
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   ├── config/
│   │   ├── src/
│   │   │   ├── env.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contracts/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── logger/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── tooling/
│   ├── typescript/
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── node.json
│   │   └── package.json
│   ├── eslint/
│   │   ├── base.js
│   │   ├── node.js
│   │   ├── next.js
│   │   └── package.json
│   └── prettier/
│       ├── index.js
│       └── package.json
├── infrastructure/
│   └── compose/
│       ├── docker-compose.yml
│       └── README.md
├── specs/
│   └── sprint-0.md
├── .editorconfig
├── .env.example
├── .gitignore
├── .npmrc
├── .nvmrc
├── CLAUDE.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

Правила:

· Не создавать пустые папки без .gitkeep.
· Не создавать packages/domain, packages/db, packages/testing, packages/observability, packages/errors в этом спринте — они появляются только по доказанной потребности (ED §45).
· Не добавлять файлы, которых нет в дереве.

---

4. Пофайловая спецификация

4.1 Корень

package.json (root, private)

· name: hh-vacancy-collector, private: true, packageManager: pnpm@9.x
· engines: node >= 20, pnpm >= 9
· scripts:
  · build: turbo run build
  · dev: turbo run dev
  · lint: turbo run lint
  · typecheck: turbo run typecheck
  · test:unit: turbo run test:unit
  · format: prettier --write "**/*.{ts,tsx,json,md,yml,yaml}"
  · prepare: husky
· devDependencies (только эти): turbo, typescript, prettier, husky, lint-staged, eslint, @repo/eslint-config (workspace), @repo/tsconfig (workspace)
· lint-staged: *.{ts,tsx} → eslint --fix, *.{json,md,yml,yaml} → prettier --write

pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

turbo.json (Turbo 2.x schema)

· tasks: build (dependsOn ^build, outputs dist/**, .next/**, !.next/cache/**), lint (dependsOn ^build), typecheck (dependsOn ^build), test:unit (dependsOn ^build), dev (cache false, persistent true)

.nvmrc: 20

.gitignore: node_modules/, dist/, .next/, .turbo/, coverage/, .env, .env.local, *.log, .DS_Store, packages/*/generated/

.editorconfig: базовые правила (indent 2, LF, utf-8, trim trailing whitespace).

.env.example — ровно эти переменные, без значений:

```
NODE_ENV=
LOG_LEVEL=
DATABASE_URL=
REDIS_URL=
API_PORT=
WEB_PORT=
```

.npmrc: registry=https://registry.npmjs.org/, node-linker=hoisted, package-import-method=copy, symlink=false. Обоснование: eslint установлен только в root devDependencies, а lint запускается из каждого workspace. hoisted + symlink=false обеспечивает корректный резолв без дублирования ESLint в каждом пакете.

README.md: 10–15 строк — что это, как поставить (pnpm i), как поднять инфру (docker compose ... up -d), как запустить (pnpm dev), ссылка на PROJECT_SPEC.md и /specs.

CLAUDE.md — контекст проекта, решения, Сделано (Sprint 0), Осталось, Нюансы.

4.2 tooling/

tooling/typescript/package.json: name @repo/tsconfig, private, files: ["*.json"], экспорт через exports map.

tooling/typescript/base.json: strict TS-конфиг. Обязательно: strict: true, noUncheckedIndexedAccess: true, noImplicitOverride: true, target: ES2022, module: NodeNext, moduleResolution: NodeNext, esModuleInterop: true, skipLibCheck: true, resolveJsonModule: true, isolatedModules: true, declaration: true, sourceMap: true.

tooling/typescript/node.json: extends ./base.json, lib: ["ES2022"], types: ["node"].

tooling/typescript/nextjs.json: extends ./base.json, lib: ["DOM","DOM.Iterable","ES2022"], jsx: "preserve", noEmit: true, allowJs: true, incremental: true, plugins: [{ name: "next" }].

tooling/eslint/package.json: name @repo/eslint-config, private, exports: . → base.js, ./node → node.js, ./next → next.js. dependencies: @eslint/js, eslint-plugin-import, typescript-eslint, @next/eslint-plugin-next, eslint-plugin-react-hooks.

tooling/eslint/base.js: flat config (ESLint 9). Подключить: @eslint/js recommended, typescript-eslint recommended, eslint-plugin-import для запрета циклов и правил границ.

Правила границ (ED §54) — обязательны:

· import/no-restricted-paths: запретить shared → features, shared → services, services → features, packages/* → apps/*.
· import/no-cycle: error.
· no-console: off (logger-пакет допустим).

tooling/eslint/node.js: extends base, env node, no-console: error.

tooling/eslint/next.js: extends base + @next/eslint-plugin-next (recommended + core-web-vitals) + eslint-plugin-react-hooks recommended.

tooling/prettier/package.json: name @repo/prettier-config, private, exports . → index.js.

tooling/prettier/index.js: semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, tabWidth: 2, endOfLine: "lf".

4.3 packages/

packages/config/package.json: name @repo/config, private, type module, main/types → src/index.ts, dependencies: zod, dotenv.

packages/config/src/env.ts: zod-схема:

```
NODE_ENV: enum development|test|production, default development
LOG_LEVEL: enum debug|info|warn|error, default info
DATABASE_URL: string url, default postgresql://hhvc:hhvc@localhost:5432/hhvc
REDIS_URL: string url, default redis://localhost:6379
API_PORT: coerce number, default 3001
WEB_PORT: coerce number, default 3000
```

Экспорт: loadEnv(): Env. Читает process.env, бросает ошибку с перечнем недостающих переменных (обёртка с читаемым сообщением).

packages/config/src/index.ts: реэкспорт loadEnv, тип Env.

packages/contracts/package.json: name @repo/contracts, private, type module, dependencies: zod.

packages/contracts/src/index.ts: пустая заглушка — export {};. Реальные DTO — Sprint 1.

packages/logger/package.json: name @repo/logger, private, type module, dependencies: pino, @repo/config.

packages/logger/src/index.ts: фабрика createLogger(name: string), возвращает pino инстанс с level из @repo/config (loadEnv). Единственный публичный экспорт.

4.4 apps/api

apps/api/package.json: name @repo/api, private, type module, dependencies: fastify, @fastify/cors, @repo/config, @repo/logger, @repo/contracts; devDependencies: vitest, supertest, @types/supertest, tsx. Scripts: dev: tsx watch src/app/main.ts, build: tsc -p tsconfig.json, lint: eslint ., typecheck: tsc --noEmit, test:unit: vitest run tests/unit --passWithNoTests, test:e2e: vitest run tests/e2e.

apps/api/tsconfig.json: extends @repo/tsconfig/node.json, outDir: dist, rootDir: src, include: ["src"].

apps/api/src/app/bootstrap.ts: экспорт buildApp(): FastifyInstance. Регистрирует @fastify/cors, монтирует features/health. Логгер — createLogger('api').

apps/api/src/app/main.ts: читает env через @repo/config, поднимает buildApp(), слушает API_PORT.

apps/api/src/features/health/index.ts: registerHealthRoute(app). GET /health → 200 { status: 'ok', service: 'api', uptime: process.uptime() }.

apps/api/tests/e2e/health.test.ts: supertest, buildApp(), GET /health → 200, тело содержит status: 'ok', service: 'api'.

apps/api/tests/unit/.gitkeep: пустая директория unit-тестов.

apps/api/vitest.config.ts: окружение node, include tests/**/*.test.ts.

apps/api/Dockerfile: multi-stage, base node:20-alpine, pnpm через corepack. Стадии deps (COPY apps + packages + tooling typescript/eslint/prettier package.json), build, runtime.

4.5 apps/worker

apps/worker/package.json: name @repo/worker, private, type module, dependencies: @repo/config, @repo/logger; Scripts: dev, build, lint, typecheck.

apps/worker/src/app/main.ts: читает env, createLogger('worker'), log.info('worker bootstrap ok'), process.exit(0).

apps/worker/Dockerfile: аналогичен api, COPY tooling eslint/prettier package.json в deps.

4.6 apps/web

apps/web/package.json: name @repo/web, private, dependencies: next, react, react-dom, @repo/config, @repo/contracts, tailwindcss, postcss, autoprefixer; Scripts: dev, build, start, lint: eslint ., typecheck. devDependencies включают @repo/eslint-config.

apps/web/eslint.config.js: import nextConfig from '@repo/eslint-config/next'; export default [...nextConfig];

apps/web/next.config.ts: output standalone.

apps/web/src/app/layout.tsx, page.tsx, health/route.ts, globals.css — как в Sprint 0.

apps/web/Dockerfile: multi-stage Next standalone; COPY tooling eslint/prettier в deps.

4.7 infrastructure/compose/docker-compose.yml

postgres:16-alpine + redis:7-alpine, healthchecks, volume pgdata. api/worker/web не в compose.

4.8 CI

.github/workflows/ci.yml: PR/push main, node 20, pnpm 9, pnpm install --frozen-lockfile, pnpm turbo run lint typecheck test:unit build.

4.9 Husky

.husky/pre-commit: pnpm lint-staged
.husky/pre-push: pnpm turbo run typecheck test:unit

---

5. Definition of Done (жёсткий чек-лист)

1. pnpm install — успешно, pnpm-lock.yaml закоммичен.
2. pnpm turbo run lint — exit 0.
3. pnpm turbo run typecheck — exit 0.
4. pnpm turbo run test:unit — exit 0 (api unit: 0 тестов, --passWithNoTests).
5. pnpm turbo run build — exit 0.
6. pnpm --filter @repo/api dev → curl /health → ok.
7. pnpm --filter @repo/web dev → curl /health → ok.
8. pnpm --filter @repo/worker dev → worker bootstrap ok, exit 0.
9. docker compose up -d → healthy.
10–12. husky / CI зелёные.

По тестам: test:unit = vitest run tests/unit --passWithNoTests. E2E не в CI Sprint 0.

---

6. Что явно вне Sprint 0

Prisma, Playwright, BullMQ, реальные DTO, Swagger, shadcn, worker scraper, docker api|worker|web в compose, GHCR, любые эндпоинты кроме /health.

---

7. Правила эскалации

Агент останавливается при конфликте major-версий, проблемах eslint flat config, линковке @repo/*, turbo packageManager, docker multi-stage glibc, любой неоднозначности.

Запрещено: зависимости вне спеки, файлы вне дерева, смена структуры, доменная логика, «улучшение» спеки, PR без DoD.

---

8. Порядок работы агента

1. Ветка feat/sprint-0.
2. Корень → tooling → packages → apps → infrastructure → CI → Husky.
3. После слоя — typecheck.
4. DoD §5.
5. PR с выводами.
6. При §7 — стоп.

---

9. Приёмка

Чек-лист §5, CI зелёный, нет лишних файлов/зависимостей, CLAUDE.md обновлён.

---

10. Известные ограничения

Известное ограничение Sprint 0. Пакеты @repo/config, @repo/contracts, @repo/logger экспортируются из ./src/index.ts без build-шага. Это работает в dev (tsx) и в turbo run typecheck/lint/test:unit, но не работает в prod-контейнере при node dist/.... Исправляется в Sprint 1: каждому packages добавить реальный build и переключить exports на ./dist/index.js с типами.

Hotfix (fix/sprint-0-hotfix): Dockerfiles COPY tooling/eslint и tooling/prettier; test:unit ограничен tests/unit; eslint next = core-web-vitals; logger через loadEnv; .npmrc и defaults DATABASE_URL/REDIS_URL приняты спекой.
