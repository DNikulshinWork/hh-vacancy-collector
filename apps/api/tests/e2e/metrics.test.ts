import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app/bootstrap.js";

describe("GET /metrics", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env["NODE_ENV"] = "test";
    process.env["LOG_LEVEL"] = "error";
    process.env["DATABASE_URL"] = "postgresql://hhvc:hhvc@localhost:5432/hhvc";
    process.env["REDIS_URL"] = "redis://localhost:6379";
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("отдаёт метрики в формате Prometheus", async () => {
    // Любой запрос, чтобы counter http_requests_total получил значения.
    await request(app.server).get("/health");

    const res = await request(app.server).get("/metrics");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("# HELP");
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toContain("http_request_duration_seconds");
    expect(res.text).toContain("hhvc_vacancies_total");
  });

  it("учитывает запросы в http_requests_total", async () => {
    await request(app.server).get("/health");
    const res = await request(app.server).get("/metrics");

    expect(res.text).toMatch(/http_requests_total\{[^}]*method="GET"[^}]*\}/);
  });
});
