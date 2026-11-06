import type { IncomingMessage, ServerResponse } from "node:http";
import { Counter, Gauge, Registry } from "prom-client";

export interface WorkerMetrics {
  registry: Registry;
  jobsCompletedTotal: Counter;
  jobsFailedTotal: Counter;
  jobsActiveTotal: Gauge;
}

/** Источник событий BullMQ Worker (интерфейс упрощён для тестируемости). */
export interface JobEventSource {
  on(event: "active", listener: () => void): unknown;
  on(event: "completed", listener: () => void): unknown;
  on(event: "failed", listener: () => void): unknown;
}

/**
 * Метрики worker'а (Sprint 5). Registry отдельный от глобального: у api и worker
 * свои наборы метрик, агрегация выполняется на стороне Prometheus.
 */
export function createWorkerMetrics(): WorkerMetrics {
  const registry = new Registry();

  const jobsCompletedTotal = new Counter({
    name: "bullmq_jobs_completed_total",
    help: "Total number of scrape jobs completed by the worker",
    registers: [registry],
  });

  const jobsFailedTotal = new Counter({
    name: "bullmq_jobs_failed_total",
    help: "Total number of scrape jobs failed in the worker",
    registers: [registry],
  });

  const jobsActiveTotal = new Gauge({
    name: "bullmq_jobs_active_total",
    help: "Number of scrape jobs currently processed by the worker",
    registers: [registry],
  });

  return { registry, jobsCompletedTotal, jobsFailedTotal, jobsActiveTotal };
}

/** Подписывает метрики на события Worker: active/completed/failed. */
export function attachWorkerMetrics(
  worker: JobEventSource,
  metrics: WorkerMetrics,
): void {
  let active = 0;

  const setActive = (value: number): void => {
    active = Math.max(0, value);
    metrics.jobsActiveTotal.set(active);
  };

  worker.on("active", () => {
    setActive(active + 1);
  });

  worker.on("completed", () => {
    setActive(active - 1);
    metrics.jobsCompletedTotal.inc();
  });

  worker.on("failed", () => {
    setActive(active - 1);
    metrics.jobsFailedTotal.inc();
  });
}

/**
 * HTTP-обработчик `GET /metrics` для health-сервера worker'а (порт 3002).
 * true — запрос обработан, false — путь не относится к метрикам.
 */
export async function handleMetricsRequest(
  req: IncomingMessage,
  res: ServerResponse,
  metrics: WorkerMetrics,
): Promise<boolean> {
  const path = req.url?.split("?")[0];

  if (path !== "/metrics") {
    return false;
  }

  const body = await metrics.registry.metrics();
  res.writeHead(200, { "Content-Type": metrics.registry.contentType });
  res.end(body);

  return true;
}
