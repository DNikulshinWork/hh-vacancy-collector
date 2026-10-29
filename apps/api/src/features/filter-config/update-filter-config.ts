import type { FastifyReply, FastifyRequest } from 'fastify';
import { updateFilterConfigBodySchema } from '@repo/contracts';

type Body = ReturnType<typeof updateFilterConfigBodySchema.parse>;

export async function updateFilterConfigHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = updateFilterConfigBodySchema.parse(request.body ?? {});

  // TODO(Sprint 2): реализовать обновление через Prisma
  void request.params.id;
  void body;

  return reply.code(200).send({ id: request.params.id });
}