import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app/bootstrap.js';

describe('domain routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['LOG_LEVEL'] = 'error';
    process.env['DATABASE_URL'] = 'postgresql://hhvc:hhvc@localhost:5432/hhvc';
    process.env['REDIS_URL'] = 'redis://localhost:6379';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
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

  it('GET /filter-configs returns empty list', async () => {
    const res = await request(app.server).get('/filter-configs');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ filterConfigs: [] });
  });

  it('POST /filter-configs validates and creates (stub)', async () => {
    const res = await request(app.server)
      .post('/filter-configs')
      .send({ name: 'Find QA', query: 'qa' });

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
  });

  it('PATCH /filter-configs/:id validates body', async () => {
    const res = await request(app.server)
      .patch('/filter-configs/00000000-0000-0000-0000-000000000001')
      .send({ active: 'yes' });

    expect(res.status).toBe(400);
  });

  it('POST /scrape-runs validates body', async () => {
    const res = await request(app.server).post('/scrape-runs').send({});

    expect(res.status).toBe(400);
  });

  it('GET /scrape-runs/:id returns 404 stub', async () => {
    const res = await request(app.server).get(
      '/scrape-runs/00000000-0000-0000-0000-000000000001',
    );

    expect(res.status).toBe(404);
  });
});