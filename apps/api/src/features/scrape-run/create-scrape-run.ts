import type { FastifyReply, FastifyRequest } from 'fastify';
import { createScrapeRunBodySchema } from '@repo/contracts';

type Body = ReturnType<typeof createScrapeRunBodySchema.parse>;

export async function createScrapeRunHandler(
  request: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createScrapeRunBodySchema.parse(request.body ?? {});

  // TODO(Sprint 2): поставить задачу в BullMQ
  void body;

  return reply.code(201).send({ id: '' });
}