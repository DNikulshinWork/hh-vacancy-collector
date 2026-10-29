import { Queue, Worker, type Job, type Processor } from 'bullmq';
import {
  Redis,
  type Redis as RedisInstance,
  type RedisOptions as IORedisOptions,
} from 'ioredis';

export const SCRAPE_QUEUE_NAME = 'scrape';

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