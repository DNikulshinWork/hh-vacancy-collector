import type { FastifyInstance } from 'fastify';
import { registerVacancyRoutes } from '../vacancy/index.js';
import { registerFilterConfigRoutes } from '../filter-config/index.js';
import { registerScraperConfigRoutes } from '../scraper-config/index.js';
import { registerScrapeRunRoutes } from '../scrape-run/index.js';

export interface DomainRoutesDeps {
  redisUrl: string;
  queueFactory?: (redisUrl: string) => {
    add(name: string, data: { scrapeRunId: string; filterConfigId: string; scraperConfigId: string }): Promise<unknown>;
  };
}

export function registerDomainRoutes(app: FastifyInstance, deps: DomainRoutesDeps): void {
  registerVacancyRoutes(app);
  registerFilterConfigRoutes(app);
  registerScraperConfigRoutes(app);
  registerScrapeRunRoutes(app, deps);
}