import { describe, it, expect } from 'vitest';
import { parseSalary, extractHhId, buildSearchUrl } from '../../src/services/hh-scraper/normalize.js';

describe('parseSalary', () => {
  it('parses "от X до Y ₽"', () => {
    expect(parseSalary('от 150 000 до 250 000 ₽')).toEqual({
      salaryMin: 150000,
      salaryMax: 250000,
      currency: 'RUB',
    });
  });

  it('parses "до X ₽"', () => {
    expect(parseSalary('до 100 000 ₽')).toEqual({
      salaryMin: null,
      salaryMax: 100000,
      currency: 'RUB',
    });
  });

  it('parses "от X ₽"', () => {
    expect(parseSalary('от 80 000 ₽')).toEqual({
      salaryMin: 80000,
      salaryMax: null,
      currency: 'RUB',
    });
  });

  it('parses plain number', () => {
    expect(parseSalary('50 000 ₽')).toEqual({
      salaryMin: 50000,
      salaryMax: 50000,
      currency: 'RUB',
    });
  });

  it('handles currency symbols', () => {
    expect(parseSalary('$1,000 - $2,000')?.currency).toBe('USD');
  });

  it('returns nulls for empty input', () => {
    expect(parseSalary('')).toEqual({ salaryMin: null, salaryMax: null, currency: null });
    expect(parseSalary(null)).toEqual({ salaryMin: null, salaryMax: null, currency: null });
  });

  it('returns nulls for text without numbers', () => {
    expect(parseSalary('зп не указана')).toEqual({
      salaryMin: null,
      salaryMax: null,
      currency: null,
    });
  });
});

describe('extractHhId', () => {
  it('extracts id from canonical url', () => {
    expect(extractHhId('https://hh.ru/vacancy/123456')).toBe('123456');
  });

  it('extracts id from url with query', () => {
    expect(extractHhId('https://hh.ru/vacancy/123456?query=frontend')).toBe('123456');
  });

  it('returns null for relative url without id', () => {
    expect(extractHhId('/search/vacancy?text=frontend')).toBeNull();
  });
});

describe('buildSearchUrl', () => {
  it('builds url with query and area', () => {
    const url = buildSearchUrl('https://hh.ru', 'frontend', '1');
    expect(url).toBe('https://hh.ru/search/vacancy?text=frontend&area=1&page=1');
  });

  it('builds url without area', () => {
    const url = buildSearchUrl('https://hh.ru', 'qa', null);
    expect(url).toBe('https://hh.ru/search/vacancy?text=qa&page=1');
  });
});