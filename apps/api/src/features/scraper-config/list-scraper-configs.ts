import type { FastifyReply, FastifyRequest } from 'fastify';
import { listScraperConfigs } from '../../services/scraper-configs.js';

export async function listScraperConfigsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const items = await listScraperConfigs();
  return reply.code(200).send({ scraperConfigs: items });
}