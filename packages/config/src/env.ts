import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://hhvc:hhvc@localhost:5432/hhvc'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  API_PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(3000),
  SCRAPER_HEADLESS: z.coerce.boolean().default(true),
  SCRAPER_CONCURRENCY: z.coerce.number().default(1),
  // HTTP(S)-прокси для скрапера (напр. для dev-машины за VPN). Не задано/пусто —
  // прямой доступ. hh.ru блокирует VPN-диапазоны (страница /vpncheeck вместо
  // списка вакансий), поэтому в проде прокси оставлять пустым.
  // Пустая строка трактуется как «не задано»: в .env.example значение
  // оставлено пустым, и z.string().url() иначе отверг бы его.
  SCRAPER_PROXY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${missing}`);
  }

  return result.data;
}
