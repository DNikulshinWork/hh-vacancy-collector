import type { FastifyReply, FastifyRequest } from 'fastify';

export async function listFilterConfigsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  // TODO(Sprint 2): реализовать чтение из Prisma
  return reply.code(200).send({ filterConfigs: [] });
}