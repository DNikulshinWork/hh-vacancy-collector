import type { FastifyReply, FastifyRequest } from 'fastify';
import { createVacancyBodySchema } from '@repo/contracts';
import { createVacancy } from '../../services/vacancies.js';

type Body = ReturnType<typeof createVacancyBodySchema.parse>;

export async function createVacancyHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createVacancyBodySchema.parse(request.body ?? {});

  const vacancy = await createVacancy({
    ...body,
    rawPayload: body.rawPayload ?? {},
  });

  return reply.code(201).send({ id: vacancy.id });
}