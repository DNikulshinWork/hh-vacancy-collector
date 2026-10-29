import type { FastifyReply, FastifyRequest } from 'fastify';
import { createFilterConfigBodySchema } from '@repo/contracts';
import { createFilterConfig } from '../../services/filter-configs.js';

type Body = ReturnType<typeof createFilterConfigBodySchema.parse>;

export async function createFilterConfigHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createFilterConfigBodySchema.parse(request.body ?? {});

  const config = await createFilterConfig(body);

  return reply.code(201).send({ id: config.id });
}