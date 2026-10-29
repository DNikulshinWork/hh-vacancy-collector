import type { FastifyInstance } from 'fastify';
import { createScrapeRunHandler } from './create-scrape-run.js';
import { getScrapeRunHandler } from './get-scrape-run.js';

export function registerScrapeRunRoutes(app: FastifyInstance): void {
  app.post('/scrape-runs', createScrapeRunHandler);
  app.get('/scrape-runs/:id', getScrapeRunHandler);
}