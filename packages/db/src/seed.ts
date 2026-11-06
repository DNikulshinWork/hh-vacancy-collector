/* eslint-disable no-console -- standalone CLI seed-скрипт, логгеру здесь не место */
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { repoRoot } from './repo-root.js';
import { DEFAULT_FILTERS, DEFAULT_SCRAPER_CONFIG, seedFilterConfig, seedScraperConfig } from './seed-configs.js';

// Prisma CLI запускает seed с CWD = packages/db, а .env лежит в корне монорепо.
// Загружаем его ДО создания PrismaClient (через динамический импорт ниже),
// иначе клиент упадёт на отсутствии DATABASE_URL.
loadDotenv({ path: path.join(repoRoot, '.env') });

const { prisma } = await import('./index.js');

async function main(): Promise<void> {
  const scraper = await seedScraperConfig(prisma, DEFAULT_SCRAPER_CONFIG);
  console.log(`[seed] ScraperConfig "${DEFAULT_SCRAPER_CONFIG.name}" — ${scraper}`);

  for (const filter of DEFAULT_FILTERS) {
    const res = await seedFilterConfig(prisma, filter);
    console.log(`[seed] FilterConfig "${filter.name}" — ${res}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error('[seed] failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
