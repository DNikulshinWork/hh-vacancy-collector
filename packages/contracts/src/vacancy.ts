import { z } from 'zod';

export const vacancySchema = z.object({
  id: z.string().uuid(),
  hhId: z.string(),
  title: z.string(),
  company: z.string(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  location: z.string(),
  experience: z.string(),
  description: z.string(),
  url: z.string().url(),
  publishedAt: z.date(),
  rawPayload: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Vacancy = z.infer<typeof vacancySchema>;

export const filterConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  query: z.string(),
  location: z.string().nullable(),
  experience: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FilterConfig = z.infer<typeof filterConfigSchema>;

export const scraperConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  selectors: z.any(),
  timeouts: z.any(),
  paginationLimits: z.any(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScraperConfig = z.infer<typeof scraperConfigSchema>;

export const scrapeRunSchema = z.object({
  id: z.string().uuid(),
  filterConfigId: z.string().uuid(),
  scraperConfigId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  resultCount: z.number(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScrapeRun = z.infer<typeof scrapeRunSchema>;