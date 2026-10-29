import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseVacanciesHtml } from '../../src/services/hh-scraper/parse.js';
import selectors from '../fixtures/selectors.js';

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../fixtures/search-page-1.html',
);

describe('parseVacanciesHtml', () => {
  const html = readFileSync(fixturePath, 'utf-8');

  it('extracts vacancy cards with hhId from url', () => {
    const vacancies = parseVacanciesHtml(html, selectors);

    expect(vacancies).toHaveLength(4);
    expect(vacancies.map((v) => v.hhId)).toEqual(['111111', '222222', '333333', '444444']);
  });

  it('normalizes salary ranges', () => {
    const vacancies = parseVacanciesHtml(html, selectors);
    const [first, second, third] = vacancies;

    expect(first?.salaryMin).toBe(150000);
    expect(first?.salaryMax).toBe(250000);
    expect(first?.currency).toBe('RUB');

    expect(second?.salaryMin).toBeNull();
    expect(second?.salaryMax).toBe(100000);

    expect(third?.salaryMin).toBeNull();
    expect(third?.salaryMax).toBeNull();
  });

  it('extracts title, company, location, experience', () => {
    const vacancies = parseVacanciesHtml(html, selectors);
    const [first] = vacancies;

    expect(first?.title).toBe('Frontend Developer');
    expect(first?.company).toBe('Acme Corp');
    expect(first?.location).toBe('Москва');
    expect(first?.experience).toBe('3-6 лет');
    expect(first?.url).toBe('https://hh.ru/vacancy/111111?query=frontend');
  });

  it('handles cards without salary', () => {
    const vacancies = parseVacanciesHtml(html, selectors);
    const noSalary = vacancies.find((v) => v.hhId === '333333');

    expect(noSalary?.company).toBe('Backend Inc');
    expect(noSalary?.salaryMin).toBeNull();
  });

  it('returns empty list for empty html', () => {
    expect(parseVacanciesHtml('', selectors)).toHaveLength(0);
  });
});