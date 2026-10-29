export interface ParsedVacancy {
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
  publishedAt: string;
  rawPayload: unknown;
}

const CURRENCY_MAP: Record<string, string> = {
  '₽': 'RUB',
  'руб': 'RUB',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
};

const NUMBER_RE = /[\d\s]+/g;

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/\D/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function parseSalary(raw: string | null): {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
} {
  if (!raw) {
    return { salaryMin: null, salaryMax: null, currency: null };
  }

  const normalized = raw.trim();
  const currencyMatch = normalized.match(/[₽$€£]|руб/i);
  const currency = currencyMatch ? (CURRENCY_MAP[currencyMatch[0].toLowerCase()] ?? null) : null;

  const numbers = normalized.match(NUMBER_RE);
  if (!numbers) {
    return { salaryMin: null, salaryMax: null, currency };
  }

  const values = numbers.map((n) => parseNumber(n)).filter((n): n is number => n !== null);

  if (values.length === 0) {
    return { salaryMin: null, salaryMax: null, currency };
  }

  const hasFrom = /от\s/i.test(normalized);
  const hasTo = /до\s/i.test(normalized);

  if (hasFrom && hasTo && values.length >= 2) {
    return { salaryMin: values[0] ?? null, salaryMax: values[1] ?? null, currency };
  }

  if (hasTo) {
    return { salaryMin: null, salaryMax: values[0] ?? null, currency };
  }

  if (hasFrom) {
    return { salaryMin: values[0] ?? null, salaryMax: null, currency };
  }

  if (values.length >= 2) {
    return { salaryMin: values[0] ?? null, salaryMax: values[1] ?? null, currency };
  }

  return { salaryMin: values[0] ?? null, salaryMax: values[0] ?? null, currency };
}

const HH_ID_RE = /\/vacancy\/(\d+)/;

export function extractHhId(url: string): string | null {
  const match = url.match(HH_ID_RE);
  return match ? (match[1] ?? null) : null;
}

export function buildSearchUrl(baseUrl: string, query: string, location: string | null): string {
  const url = new URL(`${baseUrl}/search/vacancy`);
  url.searchParams.set('text', query);
  if (location) {
    url.searchParams.set('area', location);
  }
  url.searchParams.set('page', '1');
  return url.toString();
}