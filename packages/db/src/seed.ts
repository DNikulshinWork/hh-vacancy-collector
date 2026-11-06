/* eslint-disable no-console -- standalone CLI seed-скрипт, логгеру здесь не место */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import type { Prisma } from '@prisma/client';

// Корень монорепо (packages/db/src/seed.ts -> 3 уровня вверх).
const repoRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

// Prisma CLI запускает seed с CWD = packages/db, а .env лежит в корне монорепо.
// Загружаем его ДО создания PrismaClient (через динамический импорт ниже),
// иначе клиент упадёт на отсутствии DATABASE_URL.
loadDotenv({ path: path.join(repoRoot, '.env') });

const { prisma } = await import('./index.js');

type ScraperConfigSeed = Pick<
  Prisma.ScraperConfigCreateInput,
  'name' | 'selectors' | 'timeouts' | 'paginationLimits'
>;
type FilterConfigSeed = Pick<
  Prisma.FilterConfigCreateInput,
  'name' | 'query' | 'location' | 'active'
>;

/**
 * Базовый ScraperConfig для hh.ru. Селекторы актуальны для текущей разметки
 * SERP (карточка — element[data-qa="vacancy-serp__vacancy"], заголовок —
 * [data-qa="serp-item__title"]). Зарплата в новой разметке не имеет data-qa,
 * поэтому селектор не задан (парсер вернёт salary: null).
 * Синтаксис ограничен движком парсера (parse.ts): только `tag[attr="value"]`
 * или `[attr="value"]` — без классов, запятых и ^=. Этот же конфиг Chromium
 * использует для waitForSelector, так что селекторы обязаны быть CSS-валидными.
 */
const DEFAULT_SCRAPER_CONFIG: ScraperConfigSeed = {
  name: 'hh.ru default',
  selectors: {
    vacancyCard: '[data-qa="vacancy-serp__vacancy"]',
    title: '[data-qa="serp-item__title"]',
    link: 'a[data-qa="serp-item__title"]',
    company: '[data-qa="vacancy-serp__vacancy-employer"]',
    location: '[data-qa="vacancy-serp__vacancy-address"]',
  },
  timeouts: { navigation: 30000, waitForSelector: 15000 },
  paginationLimits: { delayMs: 1500, maxPages: 5 },
};

/** Стартовые фильтры (активные) — базис для свежего окружения. */
const DEFAULT_FILTERS: FilterConfigSeed[] = [
  {
    name: 'Full stack разработчик',
    query: 'Full stack разработчик',
    location: null,
    active: true,
  },
];

async function upsertByExisting(
  find: (name: string) => Promise<{ id: string } | null>,
  create: () => Promise<unknown>,
  update: (existing: { id: string }) => Promise<unknown>,
  name: string,
): Promise<'created' | 'updated'> {
  const existing = await find(name);
  if (existing) {
    await update(existing);
    return 'updated';
  }
  await create();
  return 'created';
}

function upsertScraper(data: ScraperConfigSeed): Promise<'created' | 'updated'> {
  return upsertByExisting(
    (name) => prisma.scraperConfig.findFirst({ where: { name }, select: { id: true } }),
    () => prisma.scraperConfig.create({ data }),
    (existing) => prisma.scraperConfig.update({ where: { id: existing.id }, data }),
    data.name,
  );
}

function upsertFilter(data: FilterConfigSeed): Promise<'created' | 'updated'> {
  return upsertByExisting(
    (name) => prisma.filterConfig.findFirst({ where: { name }, select: { id: true } }),
    () => prisma.filterConfig.create({ data }),
    (existing) => prisma.filterConfig.update({ where: { id: existing.id }, data }),
    data.name,
  );
}

async function main(): Promise<void> {
  const scraper = await upsertScraper(DEFAULT_SCRAPER_CONFIG);
  console.log(`[seed] ScraperConfig "${DEFAULT_SCRAPER_CONFIG.name}" — ${scraper}`);

  for (const filter of DEFAULT_FILTERS) {
    const res = await upsertFilter(filter);
    console.log(`[seed] FilterConfig "${filter.name}" — ${res}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err: unknown) => {
  console.error('[seed] failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});