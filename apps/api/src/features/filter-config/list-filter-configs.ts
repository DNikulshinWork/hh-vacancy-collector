import type { FastifyReply, FastifyRequest } from 'fastify';
import { listFilterConfigs } from '../../services/filter-configs.js';

export async function listFilterConfigsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const items = await listFilterConfigs();
  return reply.code(200).send({ filterConfigs: items });
}