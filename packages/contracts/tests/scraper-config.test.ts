import { describe, it, expect } from 'vitest';
import {
  scraperConfigSchema,
  scraperConfigUpdateSchema,
} from '../src/scraper-config/index.js';

describe('ScraperConfig Schemas', () => {
  const validConfig = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userAgent: 'Mozilla/5.0 Custom UA',
    headless: true,
    userDataDir: './.scraper-profile',
    viewportWidth: 1920,
    viewportHeight: 1080,
    locale: 'ru-RU',
    maxConcurrency: 1,
    pageTimeoutMs: 30000,
    onCaptcha: 'retryLater' as const,
    captchaRetryDelayMs: 900000,
    proxyUrl: null,
    proxyRotation: null,
    rateLimit: {
      serpMaxRequests: 1,
      serpWindowMs: 8000,
      detailMaxRequests: 1,
      detailWindowMs: 8000,
      interPageDelayMsMin: 500,
      interPageDelayMsMax: 1500,
    },
    enrichment: {
      fetchDetail: true,
      onlyForNewHhIds: true,
      detailWaitTimeoutMs: 15000,
      convertToMarkdown: true,
      lazyScrollBeforeCollect: true,
    },
    navigationRetry: {
      attempts: 3,
      backoffMs: 5000,
    },
    selectors: {
      resultsRoot: { primary: '[data-qa="vacancy-serp__results"]' },
      cardRoot: { primary: '[data-qa="vacancy-serp__vacancy"]' },
    },
    createdAt: '2026-10-15T12:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  };

  it('validates full ScraperConfig and rejects invalid onCaptcha enum', () => {
    expect(scraperConfigSchema.safeParse(validConfig).success).toBe(true);
    expect(
      scraperConfigSchema.safeParse({ ...validConfig, onCaptcha: 'invalid_action' }).success
    ).toBe(false);
  });

  it('validates partial ScraperConfigUpdate and rejects negative timeout', () => {
    expect(
      scraperConfigUpdateSchema.safeParse({
        headless: false,
        pageTimeoutMs: 15000,
      }).success
    ).toBe(true);
    expect(
      scraperConfigUpdateSchema.safeParse({
        pageTimeoutMs: -100,
      }).success
    ).toBe(false);
  });
});
