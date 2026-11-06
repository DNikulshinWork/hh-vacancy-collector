import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import type { NextConfig } from 'next';

// Загружаем корневой .env монорепо, чтобы WEB_BASE_PATH из него попадал в конфиг.
loadDotenv({ path: path.join(__dirname, '../../.env') });

// Публичный префикс, под которым приложение открывают через reverse-proxy.
// Только dev через code-server: code.dnikulshin.ru/absproxy/3000 — префикс НЕ
// срезается, поэтому нужен штатный basePath (Next сам префиксует ссылки и
// статику). В проде префикса нет — пусто.
const basePath = process.env.WEB_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  basePath,
  // В dev приложение открывают с внешнего домена code-server, а Next 15
  // блокирует запросы к dev-серверу с неразрешённых origin'ов.
  ...(process.env.NODE_ENV !== 'production' ? { allowedDevOrigins: ['code.dnikulshin.ru'] } : {}),
};

export default nextConfig;
