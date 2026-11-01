import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@repo/db';
import { pingRedis } from '@repo/queue';

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const isRedisOk = await pingRedis(redisUrl);
      if (!isRedisOk) redisStatus = 'down';
    } catch {
      redisStatus = 'down';
    }

    const isHealthy = dbStatus === 'ok' && redisStatus === 'ok';

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'api',
      uptime: process.uptime(),
      checks: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  });
}
