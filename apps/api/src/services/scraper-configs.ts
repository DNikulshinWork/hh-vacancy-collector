import { prisma } from '@repo/db';

export async function listScraperConfigs() {
  return prisma.scraperConfig.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createScraperConfig(data: {
  name: string;
  selectors: unknown;
  timeouts: unknown;
  paginationLimits: unknown;
}) {
  return prisma.scraperConfig.create({
    data: {
      name: data.name,
      selectors: data.selectors as object,
      timeouts: data.timeouts as object,
      paginationLimits: data.paginationLimits as object,
    },
  });
}