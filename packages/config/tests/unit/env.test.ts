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
