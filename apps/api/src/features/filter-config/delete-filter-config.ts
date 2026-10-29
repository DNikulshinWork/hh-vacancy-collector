import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { deleteFilterConfig } from '../../services/filter-configs.js';

export async function deleteFilterConfigHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  try {
    const deleted = await deleteFilterConfig(request.params.id);
    if (!deleted) {
      return reply.code(404).send({ message: 'filter config not found' });
    }
    return reply.code(200).send({ id: deleted.id });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2025') {
      return reply.code(404).send({ message: 'filter config not found' });
    }
    throw err;
  }
}
