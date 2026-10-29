import type { FastifyInstance } from 'fastify';
import { makeCreateScrapeRunHandler } from './create-scrape-run.js';
import { getScrapeRunHandler } from './get-scrape-run.js';
import { listScrapeRunsHandler } from './list-scrape-runs.js';

export interface ScrapeRunRoutesDeps {
  redisUrl: string;
  queueFactory?: (redisUrl: string) => {
    add(name: string, data: { scrapeRunId: string; filterConfigId: string; scraperConfigId: string }): Promise<unknown>;
  };
}

export function registerScrapeRunRoutes(app: FastifyInstance, deps: ScrapeRunRoutesDeps): void {
  app.post('/scrape-runs', makeCreateScrapeRunHandler(deps));
  app.get('/scrape-runs/:id', getScrapeRunHandler);
  app.get('/scrape-runs', listScrapeRunsHandler);
}