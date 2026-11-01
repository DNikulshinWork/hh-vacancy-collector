import { Redis } from 'ioredis';
import { loadEnv } from '@repo/config';
import { createLogger } from '@repo/logger';
import { createScrapeWorker } from '@repo/queue';
import { createScrapeProcessor } from '../features/scrape-job/index.js';
import type { LockProvider } from '../services/vacancies.js';

const env = loadEnv();
const log = createLogger('worker');

async function main(): Promise<void> {
  log.info({ nodeEnv: env.NODE_ENV }, 'worker bootstrap');

  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  const lock: LockProvider = {
    acquireLock: async (key: string): Promise<boolean> => {
      const res = await redis.set(key, '1', 'NX');
      return res === 'OK';
    },
  };

  const processor = createScrapeProcessor({
    baseUrl: 'https://hh.ru',
    headless: env.SCRAPER_HEADLESS,
    lock,
  });

  const worker = createScrapeWorker(env.REDIS_URL, processor, env.SCRAPER_CONCURRENCY);

  worker.on('ready', () => log.info('scrape worker ready'));
  worker.on('failed', (job, err) =>
    log.error({ jobId: job?.id, err: err.message }, 'scrape job failed'),
  );
  worker.on('error', (err) => log.error({ err: err.message }, 'worker error'));

  const healthPort = Number(process.env.WORKER_HEALTH_PORT || 3002);
  const healthServer = (await import('node:http')).createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'worker', uptime: process.uptime() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  healthServer.listen(healthPort, '0.0.0.0', () => {
    log.info({ port: healthPort }, 'worker health server listening');
  });

  log.info('worker listening');

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'shutting down');
    healthServer.close();
    await worker.close();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  log.error({ err }, 'worker crashed');
  process.exit(1);
});