import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from '../common/index.js';

export const employmentSchema = z.enum([
  'full',
  'part',
  'project',
  'volunteer',
  'probation',
]);

export const scheduleSchema = z.enum([
  'fullDay',
  'shift',
  'flexible',
  'remote',
  'flyInFlyOut',
]);

export const experienceSchema = z.enum([
  'noExperience',
  'between1And3',
  'between3And6',
  'moreThan6',
]);

export const vacancyStatusSchema = z.enum([
  'new',
  'viewed',
  'exported',
  'archived',
  'skipped',
]);

export const salaryTaxSchema = z.enum(['net', 'gross']);

export const vacancyListItemSchema = z.object({
  id: idSchema,
  hhId: z.string(),
  title: z.string(),
  company: z.string(),
  url: z.string().url(),
  salaryFrom: z.number().int().nullable(),
  salaryTo: z.number().int().nullable(),
  currency: z.string().nullable(),
  salaryTax: salaryTaxSchema.nullable(),
  employment: employmentSchema.nullable(),
  schedule: scheduleSchema.nullable(),
  experience: experienceSchema.nullable(),
  publishedAt: isoDateTimeSchema,
  status: vacancyStatusSchema,
  createdAt: isoDateTimeSchema,
});

export const vacancySchema = vacancyListItemSchema.extend({
  descriptionMd: z.string().nullable(),
  rawPayload: z.record(z.unknown()).optional(),
  updatedAt: isoDateTimeSchema,
});

export const vacancyListQuerySchema = z.object({
  status: z
    .union([vacancyStatusSchema, z.array(vacancyStatusSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  employment: z
    .union([employmentSchema, z.array(employmentSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  schedule: z
    .union([scheduleSchema, z.array(scheduleSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  experience: z
    .union([experienceSchema, z.array(experienceSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  companyContains: z.string().optional(),
  titleContains: z.string().optional(),
  publishedAfter: isoDateTimeSchema.optional(),
  publishedBefore: isoDateTimeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      'publishedAt:asc',
      'publishedAt:desc',
      'createdAt:asc',
      'createdAt:desc',
    ])
    .default('publishedAt:desc'),
});

export const vacancyListResponseSchema = z.object({
  items: z.array(vacancyListItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export const patchStatusBodySchema = z.object({
  status: vacancyStatusSchema,
});

export type Employment = z.infer<typeof employmentSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type VacancyStatus = z.infer<typeof vacancyStatusSchema>;
export type SalaryTax = z.infer<typeof salaryTaxSchema>;
export type VacancyListItem = z.infer<typeof vacancyListItemSchema>;
export type Vacancy = z.infer<typeof vacancySchema>;
export type VacancyListQuery = z.infer<typeof vacancyListQuerySchema>;
export type VacancyListResponse = z.infer<typeof vacancyListResponseSchema>;
export type PatchStatusBody = z.infer<typeof patchStatusBodySchema>;
