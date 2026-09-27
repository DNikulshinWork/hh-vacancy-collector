import type { FastifyInstance } from 'fastify';

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'api',
      uptime: process.uptime(),
    };
  });
}
