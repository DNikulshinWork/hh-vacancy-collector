import { chromium, type Browser } from 'playwright';
import { parseVacanciesHtml } from './parse.js';
import type { ParsedVacancy } from './normalize.js';
import {
  parseScraperConfig,
  type ScraperConfigData,
} from './selectors.js';
import { buildSearchUrl } from './normalize.js';

export interface BrowserDeps {
  launch?: () => Promise<Browser>;
  fetchPage?: () => Promise<string>;
}

export interface ScrapeResult {
  vacancies: ParsedVacancy[];
  pagesProcessed: number;
}

const defaultLaunch = async (headless: boolean): Promise<Browser> =>
  chromium.launch({ headless });

export async function runBrowserScrape(
  baseUrl: string,
  filterConfig: { query: string; location: string | null },
  scraperConfig: ScraperConfigData,
  opts: { headless?: boolean; deps?: BrowserDeps } = {},
): Promise<ScrapeResult> {
  const { selectors, timeouts, paginationLimits } = parseScraperConfig(scraperConfig);

  const fetchPage = opts.deps?.fetchPage;

  // Fixture-режим (e2e): без браузера.
  if (fetchPage) {
    const collected: ParsedVacancy[] = [];
    for (let i = 0; i < paginationLimits.maxPages; i++) {
      const html = await fetchPage();
      collected.push(...parseVacanciesHtml(html, selectors));
    }
    return { vacancies: collected, pagesProcessed: Math.min(paginationLimits.maxPages, 1) };
  }

  const launch = opts.deps?.launch ?? defaultLaunch;
  const startUrl = buildSearchUrl(baseUrl, filterConfig.query, filterConfig.location);

  const browser = await launch(opts.headless ?? true);
  const collected: ParsedVacancy[] = [];
  let pagesProcessed = 0;

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    let currentUrl = startUrl;
    for (let i = 0; i < paginationLimits.maxPages; i++) {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, paginationLimits.delayMs));
      }

      await page.goto(currentUrl, { timeout: timeouts.navigation, waitUntil: 'domcontentloaded' });
      if (selectors.vacancyCard) {
        await page.waitForSelector(selectors.vacancyCard, { timeout: timeouts.waitForSelector });
      }
      const html = await page.content();

      const parsed = parseVacanciesHtml(html, selectors);
      collected.push(...parsed);
      pagesProcessed += 1;

      if (!selectors.nextPage) break;
      const next = await page.$(selectors.nextPage);
      const href = next ? await next.getAttribute('href') : null;
      if (!href) break;
      currentUrl = new URL(href, currentUrl).toString();
    }

    await context.close();
    return { vacancies: collected, pagesProcessed };
  } finally {
    await browser.close();
  }
}