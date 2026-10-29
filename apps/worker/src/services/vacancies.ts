import { prisma } from '@repo/db';
import type { ParsedVacancy } from './hh-scraper/index.js';

export interface LockProvider {
  /** SETNX-семантика. true — ключ зафиксирован впервые (fast-path "новый"). */
  acquireLock(key: string): Promise<boolean>;
}

export async function dedupeAndSave(
  vacancies: ParsedVacancy[],
  lock: LockProvider,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const v of vacancies) {
    const key = `hhvc:vac:${v.hhId}`;
    const isNew = await lock.acquireLock(key);
    if (!isNew) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.vacancy.upsert({
        where: { hhId: v.hhId },
        update: {},
        create: {
          hhId: v.hhId,
          title: v.title,
          company: v.company,
          salaryMin: v.salaryMin,
          salaryMax: v.salaryMax,
          currency: v.currency,
          location: v.location,
          experience: v.experience,
          description: v.description,
          url: v.url,
          publishedAt: new Date(v.publishedAt),
          rawPayload: v.rawPayload as object,
        },
      });
      created += 1;
    } catch (err) {
      // P2002 — гонка: вакансия вставлена другим воркером/запуском
      if (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002') {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  return { created, skipped };
}