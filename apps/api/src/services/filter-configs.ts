import { prisma, type Prisma } from '@repo/db';

export async function listFilterConfigs() {
  return prisma.filterConfig.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createFilterConfig(data: {
  name: string;
  query: string;
  location?: string | null;
  experience?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  active?: boolean;
}) {
  return prisma.filterConfig.create({ data });
}

export async function updateFilterConfig(
  id: string,
  data: Prisma.FilterConfigUpdateInput,
): Promise<{ id: string } | null> {
  const existing = await prisma.filterConfig.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.filterConfig.update({ where: { id }, data });
}

export async function deleteFilterConfig(id: string): Promise<{ id: string } | null> {
  const existing = await prisma.filterConfig.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.filterConfig.delete({ where: { id } });
}
