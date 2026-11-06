import type { Prisma } from '@prisma/client';

export type ScraperConfigSeed = Pick<
  Prisma.ScraperConfigCreateInput,
  'name' | 'selectors' | 'timeouts' | 'paginationLimits'
>;
export type FilterConfigSeed = Pick<
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
export const DEFAULT_SCRAPER_CONFIG: ScraperConfigSeed = {
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
export const DEFAULT_FILTERS: FilterConfigSeed[] = [
  {
    name: 'Full stack разработчик',
    query: 'Full stack разработчик',
    location: null,
    active: true,
  },
];

export type SeedOutcome = 'created' | 'skipped';

/**
 * Минимальная часть PrismaClient, нужная сиду. Позволяет прогонять сид
 * в тестах без реальной БД.
 */
export interface SeedClient {
  scraperConfig: {
    findFirst(args: {
      where: { name: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: { data: ScraperConfigSeed }): Promise<unknown>;
  };
  filterConfig: {
    findFirst(args: {
      where: { name: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: { data: FilterConfigSeed }): Promise<unknown>;
  };
}

/**
 * Создаёт запись, только если конфига с таким именем ещё нет. Существующий
 * конфиг НЕ обновляется: правки, сделанные через UI/API, не должны
 * откатываться повторным запуском сида.
 */
async function createIfMissing(
  find: () => Promise<{ id: string } | null>,
  create: () => Promise<unknown>,
): Promise<SeedOutcome> {
  if (await find()) {
    return 'skipped';
  }
  await create();
  return 'created';
}

export function seedScraperConfig(
  client: SeedClient,
  data: ScraperConfigSeed = DEFAULT_SCRAPER_CONFIG,
): Promise<SeedOutcome> {
  return createIfMissing(
    () => client.scraperConfig.findFirst({ where: { name: data.name }, select: { id: true } }),
    () => client.scraperConfig.create({ data }),
  );
}

export function seedFilterConfig(
  client: SeedClient,
  data: FilterConfigSeed,
): Promise<SeedOutcome> {
  return createIfMissing(
    () => client.filterConfig.findFirst({ where: { name: data.name }, select: { id: true } }),
    () => client.filterConfig.create({ data }),
  );
}
