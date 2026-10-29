import { describe, it, expect, vi } from 'vitest';
import { parseVacanciesHtml } from '../../src/services/hh-scraper/parse.js';
import type { ScraperSelectors } from '../../src/services/hh-scraper/selectors.js';

const selectors: ScraperSelectors = {
  vacancyCard: "div[data-qa='vacancy-serp__vacancy']",
  title: "a[data-qa='serp-item__title']",
  company: "[data-qa='vacancy-serp__vacancy-employer']",
  salary: "span[data-qa='vacancy-serp__vacancy-compensation']",
  location: "div[data-qa='vacancy-serp__vacancy-address']",
  experience: "div[data-qa='vacancy-serp__vacancy-work-experience']",
  link: "a[data-qa='serp-item__title']",
};

function cardEl(hhId: string, salary?: string): string {
  return `
    <div class="serp-item" data-qa="vacancy-serp__vacancy">
      <a href="https://hh.ru/vacancy/${hhId}" data-qa="serp-item__title">Dev #${hhId}</a>
      <span data-qa="vacancy-serp__vacancy-employer">Company ${hhId}</span>
      ${salary ? `<span data-qa="vacancy-serp__vacancy-compensation">${salary}</span>` : ''}
      <div data-qa="vacancy-serp__vacancy-address">City ${hhId}</div>
      <div data-qa="vacancy-serp__vacancy-work-experience">exp ${hhId}</div>
    </div>`;
}

describe('parseVacanciesHtml edge cases', () => {
  it('deduplicates identical hhId across pages (different html)', () => {
    const htmlA = `<main>${cardEl('100')}${cardEl('200')}</main>`;
    const htmlB = `<main>${cardEl('200')}${cardEl('300')}</main>`;

    const all = [...parseVacanciesHtml(htmlA, selectors), ...parseVacanciesHtml(htmlB, selectors)];
    const uniqueHhIds = new Set(all.map((v) => v.hhId));

    expect(all).toHaveLength(4); // парсер сам не дедуплицирует
    expect(uniqueHhIds.size).toBe(3); // 200 встречается на обеих страницах
  });

  it('is stable and deterministic (без publishedAt и rawPayload.salary)', () => {
    const html = `<main>${cardEl('100')}${cardEl('200', 'от 50 000 ₽')}</main>`;
    const normalize = (v: ReturnType<typeof JSON.parse>): unknown =>
      v.map((x: Record<string, unknown>) => ({ ...x, publishedAt: 'fixed' }));
    const one = JSON.stringify(normalize(parseVacanciesHtml(html, selectors)));
    const two = JSON.stringify(normalize(parseVacanciesHtml(html, selectors)));
    expect(one).toBe(two);
  });

  it('handles custom missing salary selector gracefully', () => {
    const withoutSalary = { ...selectors, salary: undefined };
    const html = `<main>${cardEl('100', 'от 10 000 ₽')}</main>`;
    const vacancies = parseVacanciesHtml(html, withoutSalary);
    expect(vacancies[0]?.salaryMin).toBeNull();
  });

  it('skips cards without link selector', () => {
    const broken = `
      <div class="serp-item" data-qa="vacancy-serp__vacancy">
        <span>No link here</span>
      </div>`;
    expect(parseVacanciesHtml(`<main>${broken}</main>`, selectors)).toHaveLength(0);
  });

  it('returns no vacancies for selectors mismatch', () => {
    const wrong = { ...selectors, vacancyCard: "div[data-qa='missing']" };
    const html = `<main>${cardEl('100')}</main>`;
    expect(parseVacanciesHtml(html, wrong)).toHaveLength(0);
  });

  void vi;
});