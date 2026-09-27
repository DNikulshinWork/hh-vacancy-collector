import { loadEnv } from '@repo/config';
import { createLogger } from '@repo/logger';
import { buildApp } from './bootstrap.js';

async function main() {
  const env = loadEnv();
  const log = createLogger('api');
  const app = await buildApp();

  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  log.info(`api listening on port ${env.API_PORT}`);
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});

