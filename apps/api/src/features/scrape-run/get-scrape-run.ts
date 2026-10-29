import type { FastifyReply, FastifyRequest } from 'fastify';

export async function getScrapeRunHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  // TODO(Sprint 2): реализовать чтение из Prisma
  void request.params.id;

  return reply.code(404).send({ message: 'not found' });
}