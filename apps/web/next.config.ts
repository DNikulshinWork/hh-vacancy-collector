import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import type { NextConfig } from 'next';

// Загружаем корневой .env монорепо, чтобы WEB_BASE_PATH из него попадал в конфиг.
loadDotenv({ path: path.join(__dirname, '../../.env') });

// Публичный префикс, под которым приложение доступно через обратный прокси
// (например /proxy/3000). Пусто — приложение на корне домена.
const basePath = process.env.WEB_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  // Прокси (code-server style) показывает приложение по /proxy/3000 и СРЕЗАЕТ
  // префикс при форварде на бэкенд. Поэтому basePath применять нельзя (маршруты
  // живут на корне бэкенда), а статика /_next/static/... адресуется с префиксом
  // через assetPrefix — браузер грузит её внутри прокси.
  // Ссылки навигации префиксуются в коде через lib/base-path.ts (client-side).
  assetPrefix: basePath || undefined,
};

export default nextConfig;
