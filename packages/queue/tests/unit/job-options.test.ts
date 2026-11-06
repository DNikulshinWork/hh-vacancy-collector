import { describe, expect, it } from "vitest";
import {
  SCRAPE_JOB_DEFAULT_OPTIONS,
  createScrapeQueue,
} from "../../src/index.js";

describe("scrape queue job options", () => {
  it("ограничивает число попыток и задаёт экспоненциальный backoff ≥ 10 с", () => {
    expect(SCRAPE_JOB_DEFAULT_OPTIONS.attempts).toBe(3);
    expect(SCRAPE_JOB_DEFAULT_OPTIONS.backoff).toEqual({
      type: "exponential",
      delay: 10_000,
    });
  });

  it("ограничивает хранение завершённых и проваленных задач", () => {
    expect(SCRAPE_JOB_DEFAULT_OPTIONS.removeOnComplete).toEqual({ count: 100 });
    expect(SCRAPE_JOB_DEFAULT_OPTIONS.removeOnFail).toEqual({ count: 500 });
  });

  it("createScrapeQueue прокидывает defaultJobOptions в очередь", () => {
    // Порт заведомо закрыт: соединение не устанавливается, а опции очереди
    // доступны сразу после конструирования (проверяем только конфигурацию).
    const queue = createScrapeQueue("redis://127.0.0.1:1");
    try {
      expect(queue.defaultJobOptions).toEqual(SCRAPE_JOB_DEFAULT_OPTIONS);
    } finally {
      queue.disconnect();
    }
  });
});
