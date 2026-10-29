import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { updateFilterConfigBodySchema } from '@repo/contracts';
import { updateFilterConfig } from '../../services/filter-configs.js';

type Body = ReturnType<typeof updateFilterConfigBodySchema.parse>;

export async function updateFilterConfigHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: Body }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = updateFilterConfigBodySchema.parse(request.body ?? {});

  try {
    const config = await updateFilterConfig(request.params.id, body);
    if (!config) {
      return reply.code(404).send({ message: 'filter config not found' });
    }
    return reply.code(200).send({ id: config.id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return reply.code(404).send({ message: 'filter config not found' });
    }
    throw err;
  }
}