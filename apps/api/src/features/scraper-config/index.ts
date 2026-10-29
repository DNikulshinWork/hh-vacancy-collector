import type { FastifyInstance } from 'fastify';
import { listScraperConfigsHandler } from './list-scraper-configs.js';
import { createScraperConfigHandler } from './create-scraper-config.js';

export function registerScraperConfigRoutes(app: FastifyInstance): void {
  app.get('/scraper-configs', listScraperConfigsHandler);
  app.post('/scraper-configs', createScraperConfigHandler);
}