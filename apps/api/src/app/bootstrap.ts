import Fastify, { type FastifyInstance, type FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { loadEnv, type Env } from '@repo/config';
import { createLogger } from '@repo/logger';
import { registerHealthRoute } from '../features/health/index.js';
import { registerDomainRoutes } from '../features/domain/index.js';

export interface BuildAppOptions {
  env?: Env;
  queueFactory?: (redisUrl: string) => {
    add(name: string, data: { scrapeRunId: string; filterConfigId: string; scraperConfigId: string }): Promise<unknown>;
  };
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const logger = createLogger('api');

  const app = Fastify({
    loggerInstance: logger as FastifyBaseLogger,
  });

  await app.register(cors);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'validation error',
        issues: error.issues,
      });
    }

    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2025') {
      return reply.code(404).send({ message: 'not found' });
    }

    return reply.code(500).send({ message: 'internal server error' });
  });

  registerHealthRoute(app);
  registerDomainRoutes(app, {
    redisUrl: env.REDIS_URL,
    queueFactory: options.queueFactory,
  });

  return app;
}