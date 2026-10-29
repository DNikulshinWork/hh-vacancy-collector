import type { FastifyInstance } from 'fastify';
import { getVacanciesHandler } from './get-vacancies.js';
import { createVacancyHandler } from './create-vacancy.js';

export function registerVacancyRoutes(app: FastifyInstance): void {
  app.get('/vacancies', getVacanciesHandler);
  app.post('/vacancies', createVacancyHandler);
}