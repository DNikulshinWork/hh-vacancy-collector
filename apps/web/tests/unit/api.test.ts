import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../src/lib/api';

describe('Web API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates correct export URLs for csv and pdf', () => {
    const csvUrl = api.getExportUrl('run-123', 'csv');
    const pdfUrl = api.getExportUrl('run-123', 'pdf');
    expect(csvUrl).toContain('/scrape-runs/run-123/export?format=csv');
    expect(pdfUrl).toContain('/scrape-runs/run-123/export?format=pdf');
  });

  it('calls getVacancies with formatted query parameters', async () => {
    const mockData = {
      vacancies: [{ id: '1', title: 'Senior Developer' }],
      pagination: { page: 1, limit: 10, total: 1 },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    globalThis.fetch = fetchMock;

    const res = await api.getVacancies({
      page: 1,
      limit: 10,
      search: 'react',
      sortBy: 'title',
      sortOrder: 'asc',
    });

    expect(fetchMock).toHaveBeenCalled();
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('search=react');
    expect(calledUrl).toContain('sortBy=title');
    expect(calledUrl).toContain('sortOrder=asc');
    expect(res).toEqual(mockData);
  });

  it('throws helpful error on non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Route not found',
    });

    await expect(api.getScrapeRun('unknown-id')).rejects.toThrow('API Error 404: Route not found');
  });
});
