import type { FastifyReply, FastifyRequest } from 'fastify';
import { listScrapeRunsQuerySchema } from '@repo/contracts';
import { listScrapeRuns } from '../../services/scrape-runs.js';

type Query = ReturnType<typeof listScrapeRunsQuerySchema.parse>;

export async function listScrapeRunsHandler(
  request: FastifyRequest<{ Querystring: Query }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = listScrapeRunsQuerySchema.parse(request.query ?? {});

  const result = await listScrapeRuns(query.page, query.limit);

  return reply.code(200).send(result);
}