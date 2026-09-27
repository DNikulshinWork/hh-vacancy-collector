import pino from 'pino';
import { loadEnv } from '@repo/config';

export function createLogger(name: string) {
  const env = loadEnv();
  return pino({
    name,
    level: env.LOG_LEVEL,
  });
}
