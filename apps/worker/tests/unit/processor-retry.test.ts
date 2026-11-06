import { beforeEach, describe, expect, it, vi } from "vitest";
import selectors from "../fixtures/selectors.js";

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    scrapeRun: {
      findUnique: db.findUnique,
      update: db.update,
    },
    vacancy: {
      upsert: db.upsert,
    },
  },
}));

vi.mock("@repo/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const { createScrapeProcessor } =
  await import("../../src/features/scrape-job/processor.js");
const { SCRAPE_JOB_DEFAULT_OPTIONS } = await import("@repo/queue");

import type { ScrapeJob } from "@repo/queue";

const scrapeRun = {
  id: "run-1",
  filterConfigId: "filter-1",
  scraperConfigId: "scraper-1",
  filterConfig: { query: "qa", location: "Moscow" },
  scraperConfig: {
    name: "default",
    selectors,
    timeouts: { navigation: 30_000, waitForSelector: 15_000 },
    paginationLimits: { maxPages: 1, delayMs: 0 },
  },
};

function makeJob(attemptsMade: number, attempts?: number): ScrapeJob {
  return {
    data: {
      scrapeRunId: "run-1",
      filterConfigId: "filter-1",
      scraperConfigId: "scraper-1",
    },
    attemptsMade,
    opts: attempts === undefined ? {} : { attempts },
  } as unknown as ScrapeJob;
}

function createFailingProcessor(): (job: ScrapeJob) => Promise<void> {
  return createScrapeProcessor({
    baseUrl: "https://hh.ru",
    headless: true,
    lock: { acquireLock: async () => true },
    browserDeps: {
      fetchPage: async () => {
        throw new Error("hh unavailable");
      },
    },
  });
}

describe("createScrapeProcessor / retry-статусы", () => {
  beforeEach(() => {
    db.findUnique.mockReset();
    db.update.mockReset();
    db.findUnique.mockResolvedValue(scrapeRun);
    db.update.mockResolvedValue({ ...scrapeRun, status: "running" });
  });

  it("на промежуточной попытке оставляет статус running и пробрасывает ошибку", async () => {
    const processor = createFailingProcessor();

    await expect(processor(makeJob(0, 3))).rejects.toThrow("hh unavailable");

    // первое обновление — старт попытки (running + startedAt), второе —
    // фиксация неудачной попытки без смены статуса
    expect(db.update).toHaveBeenCalledTimes(2);
    expect(db.update).toHaveBeenLastCalledWith({
      where: { id: "run-1" },
      data: { status: "running" },
    });
  });

  it("на последней попытке переводит запуск в failed с текстом ошибки", async () => {
    const processor = createFailingProcessor();

    await expect(processor(makeJob(2, 3))).rejects.toThrow("hh unavailable");

    const call = db.update.mock.calls.at(-1)?.[0] as {
      where: { id: string };
      data: { status: string; error: string; finishedAt: Date };
    };
    expect(call.where).toEqual({ id: "run-1" });
    expect(call.data.status).toBe("failed");
    expect(call.data.error).toBe("hh unavailable");
    expect(call.data.finishedAt).toBeInstanceOf(Date);
  });

  it("без явного attempts считает попытку единственной (failed сразу)", async () => {
    const processor = createFailingProcessor();

    await expect(processor(makeJob(0))).rejects.toThrow("hh unavailable");

    const call = db.update.mock.calls.at(-1)?.[0] as {
      data: { status: string };
    };
    expect(call.data.status).toBe("failed");
  });

  it("политика очереди даёт ровно 3 попытки", async () => {
    expect(SCRAPE_JOB_DEFAULT_OPTIONS.attempts).toBe(3);

    const processor = createFailingProcessor();
    const attempts = SCRAPE_JOB_DEFAULT_OPTIONS.attempts ?? 1;

    await expect(processor(makeJob(0, attempts))).rejects.toThrow();
    await expect(processor(makeJob(1, attempts))).rejects.toThrow();
    await expect(processor(makeJob(2, attempts))).rejects.toThrow();

    const failedUpdates = db.update.mock.calls.filter(
      (call) =>
        (call[0] as { data: { status: string } }).data.status === "failed",
    );
    expect(failedUpdates).toHaveLength(1);
  });
});
