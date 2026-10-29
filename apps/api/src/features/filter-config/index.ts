import type { FastifyInstance } from 'fastify';
import { listFilterConfigsHandler } from './list-filter-configs.js';
import { createFilterConfigHandler } from './create-filter-config.js';
import { updateFilterConfigHandler } from './update-filter-config.js';
import { deleteFilterConfigHandler } from './delete-filter-config.js';

export function registerFilterConfigRoutes(app: FastifyInstance): void {
  app.get('/filter-configs', listFilterConfigsHandler);
  app.post('/filter-configs', createFilterConfigHandler);
  app.patch('/filter-configs/:id', updateFilterConfigHandler);
  app.delete('/filter-configs/:id', deleteFilterConfigHandler);
}
