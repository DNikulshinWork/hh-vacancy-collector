import type { FastifyReply, FastifyRequest } from 'fastify';
import { createFilterConfigBodySchema } from '@repo/contracts';

type Body = ReturnType<typeof createFilterConfigBodySchema.parse>;

export async function createFilterConfigHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createFilterConfigBodySchema.parse(request.body ?? {});

  // TODO(Sprint 2): реализовать запись через Prisma
  void body;

  return reply.code(201).send({ id: '' });
}