import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { repoRoot } from '../../src/repo-root.js';
import {
  DEFAULT_FILTERS,
  DEFAULT_SCRAPER_CONFIG,
  seedFilterConfig,
  seedScraperConfig,
  type FilterConfigSeed,
  type ScraperConfigSeed,
  type SeedClient,
} from '../../src/seed-configs.js';

function makeFakeClient(): SeedClient & {
  scraperConfigs: ScraperConfigSeed[];
  filterConfigs: FilterConfigSeed[];
} {
  const scraperConfigs: ScraperConfigSeed[] = [];
  const filterConfigs: FilterConfigSeed[] = [];

  return {
    scraperConfigs,
    filterConfigs,
    scraperConfig: {
      async findFirst({ where }) {
        const found = scraperConfigs.find((c) => c.name === where.name);
        return found ? { id: found.name } : null;
      },
      async create({ data }) {
        scraperConfigs.push(data);
        return data;
      },
    },
    filterConfig: {
      async findFirst({ where }) {
        const found = filterConfigs.find((c) => c.name === where.name);
        return found ? { id: found.name } : null;
      },
      async create({ data }) {
        filterConfigs.push(data);
        return data;
      },
    },
  };
}

describe('repoRoot', () => {
  it('указывает на корень монорепо, а не на packages', () => {
    expect(existsSync(path.join(repoRoot, 'pnpm-workspace.yaml'))).toBe(true);
  });
});

describe('seedDefaultConfigs', () => {
  it('первый запуск создаёт конфиги, повторный — ничего не дублирует', async () => {
    const client = makeFakeClient();

    await expect(seedScraperConfig(client, DEFAULT_SCRAPER_CONFIG)).resolves.toBe('created');
    for (const filter of DEFAULT_FILTERS) {
      await expect(seedFilterConfig(client, filter)).resolves.toBe('created');
    }

    await expect(seedScraperConfig(client, DEFAULT_SCRAPER_CONFIG)).resolves.toBe('skipped');
    for (const filter of DEFAULT_FILTERS) {
      await expect(seedFilterConfig(client, filter)).resolves.toBe('skipped');
    }

    expect(client.scraperConfigs).toHaveLength(1);
    expect(client.filterConfigs).toHaveLength(DEFAULT_FILTERS.length);
  });

  it('не перезаписывает существующий конфиг, изменённый через UI/API', async () => {
    const client = makeFakeClient();

    await seedScraperConfig(client, DEFAULT_SCRAPER_CONFIG);
    await seedFilterConfig(client, DEFAULT_FILTERS[0]!);

    // Пользователь отредактировал конфиги через UI.
    client.scraperConfigs[0]!.selectors = { vacancyCard: '[data-qa="custom"]' };
    client.filterConfigs[0]!.active = false;
    client.filterConfigs[0]!.query = 'custom query';

    await seedScraperConfig(client, DEFAULT_SCRAPER_CONFIG);
    await seedFilterConfig(client, DEFAULT_FILTERS[0]!);

    expect(client.scraperConfigs[0]!.selectors).toEqual({ vacancyCard: '[data-qa="custom"]' });
    expect(client.filterConfigs[0]!.active).toBe(false);
    expect(client.filterConfigs[0]!.query).toBe('custom query');
  });
});
