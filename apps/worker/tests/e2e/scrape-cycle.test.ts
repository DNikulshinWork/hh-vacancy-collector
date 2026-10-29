import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Redis } from 'ioredis';
import { prisma } from '@repo/db';
import { createScrapeProcessor } from '../../src/features/scrape-job/processor.js';
import type { ScrapeJob } from '@repo/queue';
import selectors from '../fixtures/selectors.js';
import { prepareTestDatabase, resetDatabase } from '../helpers.js';

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures/search-page-1.html',
);

describe('scrape cycle (collect -> save)', () => {
  let redis: Redis;
  let filterConfigId: string;
  let scraperConfigId: string;

  beforeAll(async () => {
    prepareTestDatabase();
    await resetDatabase();

    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

    const filterConfig = await prisma.filterConfig.create({
      data: { name: 'QA Moscow', query: 'qa', location: 'Moscow' },
    });
    const scraperConfig = await prisma.scraperConfig.create({
      data: {
        name: 'hh search default',
        selectors: selectors as unknown as object,
        timeouts: { navigation: 30000, waitForSelector: 15000 },
        paginationLimits: { maxPages: 1, delayMs: 0 },
      },
    });

    filterConfigId = filterConfig.id;
    scraperConfigId = scraperConfig.id;
  });

  afterAll(async () => {
    await redis.quit();
    await prisma.$disconnect();
  });

  async function runOnce(): Promise<{ runId: string }> {
    const run = await prisma.scrapeRun.create({
      data: {
        filterConfigId,
        scraperConfigId,
        status: 'pending',
      },
    });

    const processor = createScrapeProcessor({
      baseUrl: 'https://hh.ru',
      headless: true,
      lock: {
        acquireLock: async (key: string): Promise<boolean> => {
          const res = await redis.set(key, '1', 'NX');
          return res === 'OK';
        },
      },
      browserDeps: {
        fetchPage: async () => {
          return readFileSync(fixturePath, 'utf-8');
        },
      },
    });

    const job = { data: { scrapeRunId: run.id, filterConfigId, scraperConfigId } } as ScrapeJob;
    await processor(job);

    return { runId: run.id };
  }

  it('collect and save vacancies, status completed', async () => {
    const { runId } = await runOnce();

    const run = await prisma.scrapeRun.findUnique({ where: { id: runId } });
    expect(run?.status).toBe('completed');
    expect(run?.resultCount).toBe(4);
    expect(run?.startedAt).not.toBeNull();
    expect(run?.finishedAt).not.toBeNull();

    const expected = ['111111', '222222', '333333', '444444'];
    const vacancies = await prisma.vacancy.findMany({ orderBy: { hhId: 'asc' } });
    expect(vacancies.map((v) => v.hhId)).toEqual(expected);

    const first = vacancies[0];
    expect(first?.title).toBe('Frontend Developer');
    expect(first?.company).toBe('Acme Corp');
    expect(first?.salaryMin).toBe(150000);
    expect(first?.rawPayload).toBeDefined();
  });

  it('second run does not create duplicates (dedupe via Redis SETNX)', async () => {
    const { runId } = await runOnce();

    const run = await prisma.scrapeRun.findUnique({ where: { id: runId } });
    expect(run?.status).toBe('completed');
    expect(run?.resultCount).toBe(0);

    const count = await prisma.vacancy.count();
    expect(count).toBe(4);
  });
});