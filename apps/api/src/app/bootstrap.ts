import Fastify, { type FastifyInstance, type FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { createLogger } from '@repo/logger';
import { registerHealthRoute } from '../features/health/index.js';
import { registerDomainRoutes } from '../features/domain/index.js';

export async function buildApp(): Promise<FastifyInstance> {
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

    return reply.code(500).send({ message: 'internal server error' });
  });

  registerHealthRoute(app);
  registerDomainRoutes(app);

  return app;
}
