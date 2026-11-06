import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../../src/env.js';

describe('loadEnv / SCRAPER_PROXY', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('принимает пустую строку как «прямой доступ» (undefined)', () => {
    vi.stubEnv('SCRAPER_PROXY', '');
    expect(loadEnv().SCRAPER_PROXY).toBeUndefined();
  });

  it('принимает валидный URL прокси', () => {
    vi.stubEnv('SCRAPER_PROXY', 'http://127.0.0.1:10809');
    expect(loadEnv().SCRAPER_PROXY).toBe('http://127.0.0.1:10809');
  });

  it('отвергает невалидный URL', () => {
    vi.stubEnv('SCRAPER_PROXY', 'not-a-url');
    expect(() => loadEnv()).toThrow(/SCRAPER_PROXY/);
  });
});

describe('loadEnv / SCRAPER_BASE_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('по умолчанию указывает на https://hh.ru', () => {
    vi.stubEnv('SCRAPER_BASE_URL', undefined as unknown as string);
    expect(loadEnv().SCRAPER_BASE_URL).toBe('https://hh.ru');
  });

  it('переопределяется через env', () => {
    vi.stubEnv('SCRAPER_BASE_URL', 'http://localhost:4010');
    expect(loadEnv().SCRAPER_BASE_URL).toBe('http://localhost:4010');
  });

  it('отвергает невалидный URL', () => {
    vi.stubEnv('SCRAPER_BASE_URL', 'hh.ru');
    expect(() => loadEnv()).toThrow(/SCRAPER_BASE_URL/);
  });
});
