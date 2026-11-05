import { chromium, type Browser } from 'playwright';
import { parseVacanciesHtml } from './parse.js';
import type { ParsedVacancy } from './normalize.js';
import {
  parseScraperConfig,
  type ScraperConfigData,
} from './selectors.js';
import { buildSearchUrl } from './normalize.js';

export interface BrowserDeps {
  launch?: (opts: BrowserLaunchOptions) => Promise<Browser>;
  fetchPage?: () => Promise<string>;
}

export interface BrowserLaunchOptions {
  headless: boolean;
  proxy?: string | null;
}

export interface ScrapeResult {
  vacancies: ParsedVacancy[];
  pagesProcessed: number;
}

const defaultLaunch = async (opts: BrowserLaunchOptions): Promise<Browser> => {
  // Прокси используется только когда явно задан через SCRAPER_PROXY (например,
  // на dev-машине за VPN). По умолчанию — прямой доступ: Chromium на Linux
  // подхватывает HTTP(S)_PROXY из окружения, а hh.ru блокирует VPN-адреса
  // (отдаёт страницу /vpncheeck вместо списка вакансий). Поэтому если прокси
  // не задан, принудительно отключаем прокси.
  if (opts.proxy) {
    return chromium.launch({ headless: opts.headless, proxy: { server: opts.proxy } });
  }
  return chromium.launch({ headless: opts.headless, args: ['--no-proxy-server'] });
};

export async function runBrowserScrape(
  baseUrl: string,
  filterConfig: { query: string; location: string | null },
  scraperConfig: ScraperConfigData,
  opts: { headless?: boolean; proxy?: string | null; deps?: BrowserDeps } = {},
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

  const browser = await launch({ headless: opts.headless ?? true, proxy: opts.proxy ?? null });
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