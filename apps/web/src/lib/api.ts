export interface Vacancy {
  id: string;
  hhId: string;
  title: string;
  company: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  location: string;
  experience: string;
  description: string;
  url: string;
  publishedAt: string | Date;
  rawPayload?: unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface VacancyPagination {
  page: number;
  limit: number;
  total: number;
}

export interface VacanciesResponse {
  vacancies: Vacancy[];
  pagination: VacancyPagination;
}

export interface FilterConfig {
  id: string;
  name: string;
  query: string;
  location: string | null;
  experience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FilterConfigsResponse {
  filterConfigs: FilterConfig[];
}

export interface ScraperConfig {
  id: string;
  name: string;
  selectors: Record<string, string>;
  timeouts: Record<string, number>;
  paginationLimits: Record<string, number>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ScraperConfigsResponse {
  scraperConfigs: ScraperConfig[];
}

export interface ScrapeRun {
  id: string;
  filterConfigId: string;
  scraperConfigId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string | Date | null;
  finishedAt: string | Date | null;
  resultCount: number;
  error: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ScrapeRunsResponse {
  runs: ScrapeRun[];
  pagination: VacancyPagination;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getApiBaseUrl(): string {
    return API_BASE;
  },

  async getVacancies(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'publishedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    location?: string;
    experience?: string;
  }): Promise<VacanciesResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.search) searchParams.set('search', params.search);
    if (params.location) searchParams.set('location', params.location);
    if (params.experience) searchParams.set('experience', params.experience);

    return fetchJson<VacanciesResponse>(`${API_BASE}/vacancies?${searchParams.toString()}`);
  },

  async getFilterConfigs(): Promise<FilterConfigsResponse> {
    return fetchJson<FilterConfigsResponse>(`${API_BASE}/filter-configs`);
  },

  async createFilterConfig(data: {
    name: string;
    query: string;
    location?: string | null;
    experience?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    active?: boolean;
  }): Promise<{ id: string }> {
    return fetchJson<{ id: string }>(`${API_BASE}/filter-configs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFilterConfig(
    id: string,
    data: Partial<{
      name: string;
      query: string;
      location: string | null;
      experience: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      active: boolean;
    }>,
  ): Promise<{ id: string }> {
    return fetchJson<{ id: string }>(`${API_BASE}/filter-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteFilterConfig(id: string): Promise<{ id: string }> {
    return fetchJson<{ id: string }>(`${API_BASE}/filter-configs/${id}`, {
      method: 'DELETE',
    });
  },

  async getScraperConfigs(): Promise<ScraperConfigsResponse> {
    return fetchJson<ScraperConfigsResponse>(`${API_BASE}/scraper-configs`);
  },

  async getScrapeRuns(page = 1, limit = 20): Promise<ScrapeRunsResponse> {
    return fetchJson<ScrapeRunsResponse>(`${API_BASE}/scrape-runs?page=${page}&limit=${limit}`);
  },

  async getScrapeRun(id: string): Promise<ScrapeRun> {
    return fetchJson<ScrapeRun>(`${API_BASE}/scrape-runs/${id}`);
  },

  async createScrapeRun(filterConfigId: string, scraperConfigId: string): Promise<{ id: string }> {
    return fetchJson<{ id: string }>(`${API_BASE}/scrape-runs`, {
      method: 'POST',
      body: JSON.stringify({ filterConfigId, scraperConfigId }),
    });
  },

  getExportUrl(scrapeRunId: string, format: 'csv' | 'pdf'): string {
    return `${API_BASE}/scrape-runs/${scrapeRunId}/export?format=${format}`;
  },
};
