import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from '../common/index.js';
import {
  employmentSchema,
  scheduleSchema,
  experienceSchema,
} from '../vacancy/index.js';

export const orderBySchema = z.enum([
  'publication_time',
  'relevance',
  'salary_desc',
  'salary_asc',
]);

export const filterConfigUpdateSchema = z.object({
  name: z.string().min(1),
  titleKeywordsInclude: z.array(z.string()).default([]),
  descriptionKeywordsInclude: z.array(z.string()).default([]),
  titleKeywordsExclude: z.array(z.string()).default([]),
  descriptionKeywordsExclude: z.array(z.string()).default([]),
  employment: z.array(employmentSchema).default([]),
  schedule: z.array(scheduleSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  area: z.array(z.number().int()).default([]),
  searchPeriodDays: z.number().int().min(1).max(30),
  orderBy: orderBySchema.default('publication_time'),
});

export const filterConfigSchema = filterConfigUpdateSchema.extend({
  id: idSchema,
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const filterListResponseSchema = z.object({
  items: z.array(filterConfigSchema),
  activeId: idSchema.nullable(),
});

export type OrderBy = z.infer<typeof orderBySchema>;
export type FilterConfigUpdate = z.infer<typeof filterConfigUpdateSchema>;
export type FilterConfig = z.infer<typeof filterConfigSchema>;
export type FilterListResponse = z.infer<typeof filterListResponseSchema>;
