import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@repo/db';
import { buildApp } from '../../src/app/bootstrap.js';
import { prepareTestDatabase, resetDatabase } from '../helpers.js';

describe('domain routes', () => {
  let app: FastifyInstance;
  let filterConfigId: string;
  let scraperConfigId: string;

  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['LOG_LEVEL'] = 'error';
    const databaseUrl =
      process.env['DATABASE_URL'] ?? 'postgresql://hhvc:hhvc@localhost:5432/hhvc';
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

    prepareTestDatabase();
    await resetDatabase();

    const filterConfig = await prisma.filterConfig.create({
      data: { name: 'QL', query: 'ql', active: true },
    });
    const scraperConfig = await prisma.scraperConfig.create({
      data: {
        name: 'default',
        selectors: { vacancyCard: 'div' },
        timeouts: { navigation: 30000 },
        paginationLimits: { maxPages: 1, delayMs: 0 },
      },
    });
    filterConfigId = filterConfig.id;
    scraperConfigId = scraperConfig.id;

    app = await buildApp({
      env: {
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        API_PORT: 3001,
        WEB_PORT: 3000,
        SCRAPER_HEADLESS: true,
        SCRAPER_CONCURRENCY: 1,
      },
      queueFactory: () => ({
        add: async () => ({ id: 'mock-job' }),
      }),
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /vacancies returns empty list', async () => {
    const res = await request(app.server).get('/vacancies');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      vacancies: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
  });

  it('GET /vacancies respects pagination params', async () => {
    const res = await request(app.server).get('/vacancies?page=2&limit=50');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 50 });
  });

  it('POST /vacancies validates body', async () => {
    const res = await request(app.server)
      .post('/vacancies')
      .send({ hhId: 'x', title: '' });

    expect(res.status).toBe(400);
  });

  it('GET /filter-configs returns seeded config', async () => {
    const res = await request(app.server).get('/filter-configs');

    expect(res.status).toBe(200);
    expect(res.body.filterConfigs).toHaveLength(1);
    expect(res.body.filterConfigs[0].name).toBe('QL');
  });

  it('POST /filter-configs creates config', async () => {
    const res = await request(app.server)
      .post('/filter-configs')
      .send({ name: 'Find QA', query: 'qa' });

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
  });

  it('PATCH /filter-configs/:id validates body', async () => {
    const res = await request(app.server)
      .patch(`/filter-configs/${filterConfigId}`)
      .send({ active: false });

    expect(res.status).toBe(200);
  });

  it('PATCH /filter-configs/:id returns 404 for unknown id', async () => {
    const res = await request(app.server)
      .patch('/filter-configs/00000000-0000-0000-0000-000000000099')
      .send({ active: false });

    expect(res.status).toBe(404);
  });

  it('GET /scraper-configs returns seeded config', async () => {
    const res = await request(app.server).get('/scraper-configs');

    expect(res.status).toBe(200);
    expect(res.body.scraperConfigs).toHaveLength(1);
  });

  it('POST /scrape-runs creates run and enqueues (mock queue)', async () => {
    const res = await request(app.server)
      .post('/scrape-runs')
      .send({ filterConfigId, scraperConfigId });

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
  });

  it('GET /scrape-runs/:id returns status', async () => {
    const created = await request(app.server)
      .post('/scrape-runs')
      .send({ filterConfigId, scraperConfigId });

    const res = await request(app.server).get(`/scrape-runs/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
  });

  it('GET /scrape-runs/:id returns 404', async () => {
    const res = await request(app.server).get(
      '/scrape-runs/00000000-0000-0000-0000-000000000099',
    );

    expect(res.status).toBe(404);
  });

  it('GET /scrape-runs lists runs with pagination', async () => {
    const res = await request(app.server).get('/scrape-runs?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 10 });
    expect(res.body.runs.length).toBeGreaterThanOrEqual(2);
  });
});