import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { loadEnv } from '@repo/config';

export function createPrismaClient(): PrismaClient {
  const env = loadEnv();
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();
export type { PrismaClient } from '@prisma/client';
