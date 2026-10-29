import { prisma, type Prisma } from '@repo/db';

export interface VacancyListParams {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'publishedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  search?: string;
  location?: string;
  experience?: string;
}

const SORT_COLUMNS: Record<VacancyListParams['sortBy'], string> = {
  createdAt: 'createdAt',
  publishedAt: 'publishedAt',
  title: 'title',
};

export async function listVacancies(params: VacancyListParams) {
  const where: Prisma.VacancyWhereInput = {};

  if (params.search) {
    where.OR = [{ title: { contains: params.search, mode: 'insensitive' } }];
  }
  if (params.location) {
    where.location = { contains: params.location, mode: 'insensitive' };
  }
  if (params.experience) {
    where.experience = { contains: params.experience, mode: 'insensitive' };
  }

  const [vacancies, total] = await Promise.all([
    prisma.vacancy.findMany({
      where,
      orderBy: { [SORT_COLUMNS[params.sortBy]]: params.sortOrder },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.vacancy.count({ where }),
  ]);

  return { vacancies, pagination: { page: params.page, limit: params.limit, total } };
}

export async function createVacancy(data: {
  hhId: string;
  title: string;
  company: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  location: string;
  experience: string;
  description: string;
  url: string;
  publishedAt: Date;
  rawPayload: unknown;
}) {
  return prisma.vacancy.create({
    data: {
      ...data,
      rawPayload: data.rawPayload as object,
    },
  });
}