import type { FastifyInstance } from 'fastify';
import { registerVacancyRoutes } from '../vacancy/index.js';
import { registerFilterConfigRoutes } from '../filter-config/index.js';
import { registerScrapeRunRoutes } from '../scrape-run/index.js';

export function registerDomainRoutes(app: FastifyInstance): void {
  registerVacancyRoutes(app);
  registerFilterConfigRoutes(app);
  registerScrapeRunRoutes(app);
}