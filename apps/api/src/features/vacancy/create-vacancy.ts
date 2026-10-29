import type { FastifyReply, FastifyRequest } from 'fastify';
import { createVacancyBodySchema } from '@repo/contracts';

type Body = ReturnType<typeof createVacancyBodySchema.parse>;

export async function createVacancyHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createVacancyBodySchema.parse(request.body ?? {});

  // TODO(Sprint 2): реализовать запись через Prisma
  void body;

  return reply.code(201).send({ id: '' });
}