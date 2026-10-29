import type { FastifyReply, FastifyRequest } from 'fastify';
import { createScrapeRunBodySchema } from '@repo/contracts';
import { createScrapeQueue, type ScrapeJobData } from '@repo/queue';
import { createLogger } from '@repo/logger';
import { createScrapeRun } from '../../services/scrape-runs.js';

type Body = ReturnType<typeof createScrapeRunBodySchema.parse>;
type QueueFactory = (redisUrl: string) => { add(name: string, data: ScrapeJobData): Promise<unknown> };

const log = createLogger('api');

export interface CreateScrapeRunDeps {
  redisUrl: string;
  queueFactory?: QueueFactory;
}

function defaultQueueFactory(redisUrl: string): ReturnType<QueueFactory> {
  const queue = createScrapeQueue(redisUrl);
  return {
    add: (name, data) => queue.add(name, data),
  };
}

export function makeCreateScrapeRunHandler(deps: CreateScrapeRunDeps) {
  return async function createScrapeRunHandler(
    request: FastifyRequest<{ Body: Body }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    const body = createScrapeRunBodySchema.parse(request.body ?? {});

    const run = await createScrapeRun(body);

    const queue = deps.queueFactory
      ? deps.queueFactory(deps.redisUrl)
      : defaultQueueFactory(deps.redisUrl);
    try {
      await queue.add('scrape', {
        scrapeRunId: run.id,
        filterConfigId: body.filterConfigId,
        scraperConfigId: body.scraperConfigId,
      });
      log.info({ scrapeRunId: run.id }, 'scrape job enqueued');
    } catch (err) {
      log.error({ scrapeRunId: run.id, err }, 'failed to enqueue scrape job');
      return reply.code(502).send({ message: 'failed to enqueue job' });
    }

    return reply.code(201).send({ id: run.id });
  };
}