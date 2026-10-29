# Sprint 1 — Domain Schema, Prisma, Contracts, REST stubs/tests

## Цель спринта

Создать доменную модель данных, реализовать Prisma схему и DTO, подготовить REST API stubs и unit/integration тесты.

## 1. Доменная модель

### Сущности

1. **Vacancy** — вакансия hh.ru
   - id: UUID
   - hhId: string (уникальный ID hh.ru)
   - title: string
   - company: string
   - salaryMin: number | null
   - salaryMax: number | null
   - currency: string | null
   - location: string
   - experience: string
   - description: string
   - url: string
   - publishedAt: datetime
   - rawPayload: jsonb (для AI-скоринга)
   - createdAt: datetime
   - updatedAt: datetime

2. **FilterConfig** — конфигурация фильтров поиска
   - id: UUID
   - name: string
   - query: string
   - location: string | null
   - experience: string | null
   - salaryMin: number | null
   - salaryMax: number | null
   - active: boolean
   - createdAt: datetime
   - updatedAt: datetime

3. **ScraperConfig** — конфигурация скрейпера
   - id: UUID
   - name: string
   - selectors: jsonb (CSS селекторы)
   - timeouts: jsonb (таймауты)
   - paginationLimits: jsonb (лимиты пагинации)
   - createdAt: datetime
   - updatedAt: datetime

4. **ScrapeRun** — запуск сбора вакансий
   - id: UUID
   - filterConfigId: UUID (FK)
   - scraperConfigId: UUID (FK)
   - status: enum (pending, running, completed, failed)
   - startedAt: datetime | null
   - finishedAt: datetime | null
   - resultCount: integer
   - error: string | null
   - createdAt: datetime
   - updatedAt: datetime

## 2. Prisma схема

Файл: `packages/db/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Vacancy {
  id           String    @id @default(uuid())
  hhId         String    @unique
  title        String
  company      String
  salaryMin    Int?      @db.Integer
  salaryMax    Int?      @db.Integer
  currency     String?   @db.VarChar(3)
  location     String
  experience   String
  description  String
  url          String
  publishedAt  DateTime
  rawPayload   Json      @db.Jsonb
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model FilterConfig {
  id          String    @id @default(uuid())
  name        String
  query       String
  location    String?   @db.VarChar(255)
  experience  String?   @db.VarChar(255)
  salaryMin   Int?      @db.Integer
  salaryMax   Int?      @db.Integer
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ScraperConfig {
  id              String    @id @default(uuid())
  name            String
  selectors       Json      @db.Jsonb
  timeouts        Json      @db.Jsonb
  paginationLimits Json     @db.Jsonb
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ScrapeRun {
  id               String    @id @default(uuid())
  filterConfigId   String
  filterConfig     FilterConfig @relation(fields: [filterConfigId], references: [id])
  scraperConfigId  String
  scraperConfig    ScraperConfig @relation(fields: [scraperConfigId], references: [id])
  status           ScrapeRunStatus
  startedAt        DateTime?
  finishedAt       DateTime?
  resultCount      Int       @default(0)
  error            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

enum ScrapeRunStatus {
  pending
  running
  completed
  failed
}
```

## 3. DTO и контракты

Файл: `packages/contracts/src/vacancy.ts`

```typescript
import { z } from 'zod';

export const vacancySchema = z.object({
  id: z.string().uuid(),
  hhId: z.string(),
  title: z.string(),
  company: z.string(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  location: z.string(),
  experience: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.date(),
  rawPayload: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Vacancy = z.infer<typeof vacancySchema>;

export const filterConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  query: z.string(),
  location: z.string().nullable(),
  experience: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FilterConfig = z.infer<typeof filterConfigSchema>;

export const scraperConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  selectors: z.any(),
  timeouts: z.any(),
  paginationLimits: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScraperConfig = z.infer<typeof scraperConfigSchema>;

export const scrapeRunSchema = z.object({
  id: z.string().uuid(),
  filterConfigId: z.string().uuid(),
  scraperConfigId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  resultCount: z.number(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScrapeRun = z.infer<typeof scrapeRunSchema>;
```

Файл: `packages/contracts/src/api.ts`

```typescript
import { z } from 'zod';

// Vacancy endpoints
export const getVacanciesQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
});

export type GetVacanciesQuery = z.infer<typeof getVacanciesQuerySchema>;

export const createVacancyBodySchema = z.object({
  hhId: z.string(),
  title: z.string(),
  company: z.string(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  location: z.string(),
  experience: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.date(),
  rawPayload: z.any(),
});

export type CreateVacancyBody = z.infer<typeof createVacancyBodySchema>;

// FilterConfig endpoints
export const createFilterConfigBodySchema = z.object({
  name: z.string(),
  query: z.string(),
  location: z.string().nullable(),
  experience: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  active: z.boolean().default(true),
});

export type CreateFilterConfigBody = z.infer<typeof createFilterConfigBodySchema>;

export const updateFilterConfigBodySchema = z.object({
  name: z.string().optional(),
  query: z.string().optional(),
  location: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  active: z.boolean().optional(),
});

export type UpdateFilterConfigBody = z.infer<typeof updateFilterConfigBodySchema>;

// ScrapeRun endpoints
export const createScrapeRunBodySchema = z.object({
  filterConfigId: z.string().uuid(),
  scraperConfigId: z.string().uuid(),
});

export type CreateScrapeRunBody = z.infer<typeof createScrapeRunBodySchema>;
```

## 4. REST API stubs

### Файлы в `apps/api/src/features/vacancy/`

#### `index.ts`
```typescript
import type { FastifyInstance } from 'fastify';
import { getVacanciesHandler } from './get-vacancies.js';
import { createVacancyHandler } from './create-vacancy.js';

export function registerVacancyRoutes(app: FastifyInstance): void {
  app.get('/vacancies', getVacanciesHandler);
  app.post('/vacancies', createVacancyHandler);
}
```

#### `get-vacancies.ts`
```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getVacanciesQuerySchema } from '@repo/contracts';

export async function getVacanciesHandler(
  request: FastifyRequest<{ Querystring: typeof getVacanciesQuerySchema._type }>,
  reply: FastifyReply
) {
  // TODO: implement actual logic
  return reply.status(200).send({
    vacancies: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
  });
}
```

#### `create-vacancy.ts`
```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createVacancyBodySchema } from '@repo/contracts';

export async function createVacancyHandler(
  request: FastifyRequest<{ Body: typeof createVacancyBodySchema._type }>,
  reply: FastifyReply
) {
  // TODO: implement actual logic
  return reply.status(201).send({ id: 'uuid' });
}
```

## 5. Тесты

### `apps/api/tests/unit/vacancy.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getVacanciesQuerySchema, createVacancyBodySchema } from '@repo/contracts';

describe('Contracts validation', () => {
  it('should validate getVacancies query correctly', () => {
    const validQuery = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const result = getVacanciesQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it('should validate createVacancy body correctly', () => {
    const validBody = {
      hhId: '12345',
      title: 'Frontend Developer',
      company: 'Company Inc',
      salaryMin: 50000,
      salaryMax: 80000,
      currency: 'RUB',
      location: 'Moscow',
      experience: '1-3 years',
      description: 'Great job opportunity',
      url: 'https://hh.ru/vacancy/12345',
      publishedAt: new Date(),
      rawPayload: {},
    };

    const result = createVacancyBodySchema.safeParse(validBody);
    expect(result.success).toBe(true);
  });
});
```

## 6. Implementation plan

1. Создать пакет `packages/db` с Prisma схемой
2. Создать `packages/contracts` с DTO и API контрактами
3. Реализовать REST stubs в `apps/api`
4. Добавить unit тесты
5. Обновить документацию и спецификации

## 7. Definition of Done

1. Prisma схема создана и работает
2. DTO в `packages/contracts` реализованы
3. REST API stubs созданы
4. Unit тесты проходят
5. Документация обновлена
6. Все зависимости правильно указаны