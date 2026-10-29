import type { FastifyReply, FastifyRequest } from 'fastify';
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
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2025') {
      return reply.code(404).send({ message: 'filter config not found' });
    }
    throw err;
  }
}