import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '@repo/logger';
import { registerHealthRoute } from '../features/health/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const logger = createLogger('api');

  const app = Fastify({
    loggerInstance: logger,
  });

  await app.register(cors);

  registerHealthRoute(app);

  return app;
}
