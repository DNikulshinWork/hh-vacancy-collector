import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  attachWorkerMetrics,
  createWorkerMetrics,
  handleMetricsRequest,
  type JobEventSource,
} from "../../src/app/metrics.js";

function createFakeWorker(): JobEventSource & { emit(event: string): void } {
  const listeners = new Map<string, Array<() => void>>();

  return {
    on(event: "active" | "completed" | "failed", listener: () => void) {
      const existing = listeners.get(event) ?? [];
      existing.push(listener);
      listeners.set(event, existing);
      return this;
    },
    emit(event: string) {
      for (const listener of listeners.get(event) ?? []) {
        listener();
      }
    },
  };
}

describe("worker metrics", () => {
  it("считает завершённые и проваленные задачи из событий Worker", async () => {
    const metrics = createWorkerMetrics();
    const worker = createFakeWorker();
    attachWorkerMetrics(worker, metrics);

    worker.emit("active");
    worker.emit("completed");
    worker.emit("active");
    worker.emit("failed");

    const output = await metrics.registry.metrics();

    expect(output).toContain("# HELP bullmq_jobs_completed_total");
    expect(output).toContain("# HELP bullmq_jobs_failed_total");
    expect(output).toContain("# HELP bullmq_jobs_active_total");
    expect(output).toMatch(/bullmq_jobs_completed_total 1/);
    expect(output).toMatch(/bullmq_jobs_failed_total 1/);
    expect(output).toMatch(/bullmq_jobs_active_total 0/);
  });

  it("не уводит gauge активных задач в минус", async () => {
    const metrics = createWorkerMetrics();
    const worker = createFakeWorker();
    attachWorkerMetrics(worker, metrics);

    worker.emit("failed");

    const output = await metrics.registry.metrics();
    expect(output).toMatch(/bullmq_jobs_active_total 0/);
  });

  it("handleMetricsRequest не перехватывает /health", async () => {
    const metrics = createWorkerMetrics();
    const res = { writeHead: vi.fn(), end: vi.fn() };

    const handled = await handleMetricsRequest(
      { url: "/health" } as never,
      res as never,
      metrics,
    );

    expect(handled).toBe(false);
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("отдаёт /metrics по HTTP в формате Prometheus", async () => {
    const metrics = createWorkerMetrics();
    const worker = createFakeWorker();
    attachWorkerMetrics(worker, metrics);
    worker.emit("active");
    worker.emit("completed");

    const server = createServer((req, res) => {
      void handleMetricsRequest(req, res, metrics);
    });

    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/metrics`);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");

      const body = await response.text();
      expect(body).toContain("# HELP");
      expect(body).toContain("bullmq_jobs_completed_total");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
