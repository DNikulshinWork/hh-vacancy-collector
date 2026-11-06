import { Queue, Worker, type DefaultJobOptions, type Job, type Processor } from 'bullmq';
import {
  Redis,
  type Redis as RedisInstance,
  type RedisOptions as IORedisOptions,
} from 'ioredis';

export const SCRAPE_QUEUE_NAME = 'scrape';

/**
 * Единая retry-политика задач скрапинга (Sprint 5).
 * attempts ≤ 3 и backoff ≥ 10 c ограничивают нагрузку на hh.ru при сбоях,
 * removeOn* не дают очереди расти бесконечно.
 */
export const SCRAPE_JOB_DEFAULT_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export interface ScrapeJobData {
  scrapeRunId: string;
  filterConfigId: string;
  scraperConfigId: string;
}

export type ScrapeJob = Job<ScrapeJobData>;

export type ScrapeProcessor = Processor<ScrapeJobData>;

function redisConnection(redisUrl: string): RedisInstance {
  const options: IORedisOptions = { maxRetriesPerRequest: null };
  return new Redis(redisUrl, options);
}

export function createScrapeQueue(redisUrl: string): Queue<ScrapeJobData> {
  return new Queue<ScrapeJobData>(SCRAPE_QUEUE_NAME, {
    connection: redisConnection(redisUrl),
    defaultJobOptions: SCRAPE_JOB_DEFAULT_OPTIONS,
  });
}

export function createScrapeWorker(
  redisUrl: string,
  processor: ScrapeProcessor,
  concurrency = 1,
): Worker<ScrapeJobData> {
  return new Worker<ScrapeJobData>(SCRAPE_QUEUE_NAME, processor, {
    connection: redisConnection(redisUrl),
    concurrency,
  });
}

export async function pingRedis(redisUrl: string): Promise<boolean> {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 0,
  });
  try {
    await client.connect();
    const res = await client.ping();
    await client.quit();
    return res === 'PONG';
  } catch {
    return false;
  }
}