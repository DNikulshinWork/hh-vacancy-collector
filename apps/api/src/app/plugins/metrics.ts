import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Counter, Gauge, Histogram, Registry } from "prom-client";
import { prisma } from "@repo/db";

export interface ApiMetrics {
  registry: Registry;
  httpRequestsTotal: Counter<"method" | "route" | "status">;
  httpRequestDurationSeconds: Histogram<"method" | "route" | "status">;
  vacanciesTotal: Gauge;
}

/**
 * Метрики API (Sprint 5). Registry отдельный от глобального: у api и worker свои
 * наборы метрик, агрегация выполняется на стороне Prometheus.
 */
export function createApiMetrics(): ApiMetrics {
  const registry = new Registry();

  const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests handled by the API",
    labelNames: ["method", "route", "status"] as const,
    registers: [registry],
  });

  const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const vacanciesTotal = new Gauge({
    name: "hhvc_vacancies_total",
    help: "Total number of vacancies stored in the database",
    registers: [registry],
    async collect() {
      try {
        const count = await prisma.vacancy.count();
        this.set(count);
      } catch {
        // БД недоступна: значение метрики не обновляем, /metrics остаётся живым.
      }
    },
  });

  return {
    registry,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    vacanciesTotal,
  };
}

export function registerMetrics(
  app: FastifyInstance,
  metrics = createApiMetrics(),
): void {
  app.addHook(
    "onResponse",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const labels = {
        method: request.method,
        route: request.routeOptions?.url ?? "unknown",
        status: String(reply.statusCode),
      };

      metrics.httpRequestsTotal.inc(labels);
      metrics.httpRequestDurationSeconds.observe(
        labels,
        reply.elapsedTime / 1000,
      );
    },
  );

  app.get("/metrics", async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.type(metrics.registry.contentType);
    return metrics.registry.metrics();
  });
}
