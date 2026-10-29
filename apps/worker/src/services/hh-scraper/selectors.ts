import { z } from 'zod';

export const scraperSelectorsSchema = z.object({
  vacancyCard: z.string(),
  title: z.string(),
  company: z.string(),
  salary: z.string().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  link: z.string(),
  nextPage: z.string().optional(),
});

export type ScraperSelectors = z.infer<typeof scraperSelectorsSchema>;

export interface ScraperConfigData {
  name: string;
  selectors: unknown;
  timeouts: unknown;
  paginationLimits: unknown;
}

export interface ScraperTimeouts {
  navigation: number;
  waitForSelector: number;
}

export interface ScraperPaginationLimits {
  maxPages: number;
  delayMs: number;
}

export function parseScraperConfig(config: ScraperConfigData): {
  selectors: ScraperSelectors;
  timeouts: ScraperTimeouts;
  paginationLimits: ScraperPaginationLimits;
} {
  const selectors = scraperSelectorsSchema.parse(config.selectors);

  const timeouts = z
    .object({
      navigation: z.number().default(30000),
      waitForSelector: z.number().default(15000),
    })
    .parse(config.timeouts ?? {});

  const paginationLimits = z
    .object({
      maxPages: z.number().min(1).default(5),
      delayMs: z.number().min(0).default(1500),
    })
    .parse(config.paginationLimits ?? {});

  return { selectors, timeouts, paginationLimits };
}