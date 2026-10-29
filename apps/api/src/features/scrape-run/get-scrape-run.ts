import type { FastifyReply, FastifyRequest } from 'fastify';
import { getScrapeRun } from '../../services/scrape-runs.js';

export async function getScrapeRunHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const run = await getScrapeRun(request.params.id);

  if (!run) {
    return reply.code(404).send({ message: 'scrape run not found' });
  }

  return reply.code(200).send({
    id: run.id,
    status: run.status,
    resultCount: run.resultCount,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    error: run.error,
    filterConfigId: run.filterConfigId,
    scraperConfigId: run.scraperConfigId,
    createdAt: run.createdAt,
  });
}