import type { FastifyReply, FastifyRequest } from 'fastify';
import { createScraperConfigBodySchema } from '@repo/contracts';
import { createScraperConfig } from '../../services/scraper-configs.js';

type Body = ReturnType<typeof createScraperConfigBodySchema.parse>;

export async function createScraperConfigHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createScraperConfigBodySchema.parse(request.body ?? {});

  const config = await createScraperConfig(body);

  return reply.code(201).send({ id: config.id });
}