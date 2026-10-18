import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from '../common/index.js';

export const captchaActionSchema = z.enum(['pause', 'abort', 'retryLater']);
export const proxyRotationSchema = z.enum(['perRequest', 'perSession']);

export const rateLimitSchema = z.object({
  serpMaxRequests: z.number().int().positive(),
  serpWindowMs: z.number().int().positive(),
  detailMaxRequests: z.number().int().positive(),
  detailWindowMs: z.number().int().positive(),
  interPageDelayMsMin: z.number().int().nonnegative(),
  interPageDelayMsMax: z.number().int().positive(),
});

export const enrichmentSchema = z.object({
  fetchDetail: z.boolean(),
  onlyForNewHhIds: z.boolean(),
  detailWaitTimeoutMs: z.number().int().positive(),
  convertToMarkdown: z.boolean(),
  lazyScrollBeforeCollect: z.boolean(),
});

export const navigationRetrySchema = z.object({
  attempts: z.number().int().min(1),
  backoffMs: z.number().int().nonnegative(),
});

export const selectorTargetSchema = z.object({
  primary: z.string().min(1),
  fallback: z.string().optional(),
});

export const selectorsSchema = z.record(selectorTargetSchema);

export const scraperConfigUpdateSchema = z.object({
  userAgent: z.string().optional(),
  headless: z.boolean().optional(),
  userDataDir: z.string().optional(),
  viewportWidth: z.number().int().positive().optional(),
  viewportHeight: z.number().int().positive().optional(),
  locale: z.string().optional(),
  maxConcurrency: z.number().int().positive().optional(),
  pageTimeoutMs: z.number().int().positive().optional(),
  onCaptcha: captchaActionSchema.optional(),
  captchaRetryDelayMs: z.number().int().nonnegative().optional(),
  proxyUrl: z.string().nullable().optional(),
  proxyRotation: proxyRotationSchema.nullable().optional(),
  rateLimit: rateLimitSchema.optional(),
  enrichment: enrichmentSchema.optional(),
  navigationRetry: navigationRetrySchema.optional(),
  selectors: selectorsSchema.optional(),
});

export const scraperConfigSchema = z.object({
  id: idSchema,
  userAgent: z.string(),
  headless: z.boolean(),
  userDataDir: z.string(),
  viewportWidth: z.number().int(),
  viewportHeight: z.number().int(),
  locale: z.string(),
  maxConcurrency: z.number().int(),
  pageTimeoutMs: z.number().int(),
  onCaptcha: captchaActionSchema,
  captchaRetryDelayMs: z.number().int(),
  proxyUrl: z.string().nullable(),
  proxyRotation: proxyRotationSchema.nullable(),
  rateLimit: rateLimitSchema,
  enrichment: enrichmentSchema,
  navigationRetry: navigationRetrySchema,
  selectors: selectorsSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CaptchaAction = z.infer<typeof captchaActionSchema>;
export type ProxyRotation = z.infer<typeof proxyRotationSchema>;
export type RateLimit = z.infer<typeof rateLimitSchema>;
export type Enrichment = z.infer<typeof enrichmentSchema>;
export type NavigationRetry = z.infer<typeof navigationRetrySchema>;
export type SelectorTarget = z.infer<typeof selectorTargetSchema>;
export type Selectors = z.infer<typeof selectorsSchema>;
export type ScraperConfigUpdate = z.infer<typeof scraperConfigUpdateSchema>;
export type ScraperConfig = z.infer<typeof scraperConfigSchema>;
