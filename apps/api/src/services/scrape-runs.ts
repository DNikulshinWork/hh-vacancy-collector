import { prisma } from '@repo/db';

export async function createScrapeRun(data: { filterConfigId: string; scraperConfigId: string }) {
  const run = await prisma.scrapeRun.create({
    data: { ...data, status: 'pending' },
  });
  return run;
}

export async function getScrapeRun(id: string) {
  return prisma.scrapeRun.findUnique({ where: { id } });
}

export async function listScrapeRuns(page: number, limit: number) {
  const [runs, total] = await Promise.all([
    prisma.scrapeRun.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scrapeRun.count(),
  ]);
  return { runs, pagination: { page, limit, total } };
}