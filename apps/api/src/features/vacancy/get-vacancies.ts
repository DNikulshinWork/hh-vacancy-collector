import type { FastifyReply, FastifyRequest } from 'fastify';
import { getVacanciesQuerySchema } from '@repo/contracts';

type Query = ReturnType<typeof getVacanciesQuerySchema.parse>;

export async function getVacanciesHandler(
  request: FastifyRequest<{ Querystring: Query }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = getVacanciesQuerySchema.parse(request.query ?? {});

  // TODO(Sprint 2): реализовать чтение из Prisma
  void query;

  return reply.code(200).send({
    vacancies: [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: 0,
    },
  });
}