import type { FastifyReply, FastifyRequest } from 'fastify';
import { getVacanciesQuerySchema } from '@repo/contracts';
import { listVacancies } from '../../services/vacancies.js';

type Query = ReturnType<typeof getVacanciesQuerySchema.parse>;

export async function getVacanciesHandler(
  request: FastifyRequest<{ Querystring: Query }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = getVacanciesQuerySchema.parse(request.query ?? {});

  const result = await listVacancies(query);

  return reply.code(200).send(result);
}