import { prisma } from '@repo/db';
import { createLogger } from '@repo/logger';
import { runBrowserScrape } from '../../services/hh-scraper/index.js';
import { dedupeAndSave, type LockProvider } from '../../services/vacancies.js';
import type { BrowserDeps } from '../../services/hh-scraper/browser.js';
import type { ScrapeJob } from '@repo/queue';

const log = createLogger('worker');

export interface ScrapeProcessorDeps {
  baseUrl: string;
  headless: boolean;
  lock: LockProvider;
  browserDeps?: BrowserDeps;
}

export function createScrapeProcessor(
  deps: ScrapeProcessorDeps,
): (job: ScrapeJob) => Promise<void> {
  return async (job: ScrapeJob): Promise<void> => {
    const { scrapeRunId, filterConfigId, scraperConfigId } = job.data;

    const scrapeRun = await prisma.scrapeRun.findUnique({
      where: { id: scrapeRunId },
      include: {
        filterConfig: true,
        scraperConfig: true,
      },
    });

    if (!scrapeRun) {
      throw new Error(`scrape run not found: ${scrapeRunId}`);
    }

    if (
      scrapeRun.filterConfigId !== filterConfigId ||
      scrapeRun.scraperConfigId !== scraperConfigId
    ) {
      throw new Error('scrape run config mismatch');
    }

    log.info({ scrapeRunId }, 'scrape run started');

    await prisma.scrapeRun.update({
      where: { id: scrapeRunId },
      data: { status: 'running', startedAt: new Date() },
    });

    try {
      const result = await runBrowserScrape(
        deps.baseUrl,
        {
          query: scrapeRun.filterConfig.query,
          location: scrapeRun.filterConfig.location,
        },
        {
          name: scrapeRun.scraperConfig.name,
          selectors: scrapeRun.scraperConfig.selectors,
          timeouts: scrapeRun.scraperConfig.timeouts,
          paginationLimits: scrapeRun.scraperConfig.paginationLimits,
        },
        { headless: deps.headless, deps: deps.browserDeps },
      );

      const { created, skipped } = await dedupeAndSave(result.vacancies, deps.lock);

      log.info(
        { scrapeRunId, created, skipped, pagesProcessed: result.pagesProcessed },
        'scrape run completed',
      );

      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          status: 'completed',
          resultCount: created,
          finishedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ scrapeRunId, err }, 'scrape run failed');

      await prisma.scrapeRun.update({
        where: { id: scrapeRunId },
        data: {
          status: 'failed',
          error: message.slice(0, 2000),
          finishedAt: new Date(),
        },
      });

      throw err;
    }
  };
}