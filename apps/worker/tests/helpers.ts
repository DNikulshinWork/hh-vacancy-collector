import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '@repo/db';

export const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://hhvc:hhvc@localhost:5432/hhvc';

/** Применяет схему Prisma к БД (обязательно для e2e; требует живого Postgres). */
export function prepareTestDatabase(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '../../..');
  const dbDir = path.join(root, 'packages/db');
  const prismaCli = path.join(root, 'node_modules/prisma/build/index.js');

  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--skip-generate'], {
    cwd: dbDir,
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}

/** Очищает все доменные таблицы (порядок с учётом FK). */
export async function resetDatabase(): Promise<void> {
  await prisma.scrapeRun.deleteMany();
  await prisma.vacancy.deleteMany();
  await prisma.filterConfig.deleteMany();
  await prisma.scraperConfig.deleteMany();
}