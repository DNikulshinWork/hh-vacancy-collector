import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app/bootstrap.js';

describe('GET /health', () => {
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

  it('returns 200 with status ok and service api', async () => {
    const res = await request(app.server).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'api',
    });
    expect(typeof res.body.uptime).toBe('number');
  });
});
