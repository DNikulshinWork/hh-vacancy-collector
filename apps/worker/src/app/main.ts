import { loadEnv } from '@repo/config';
import { createLogger } from '@repo/logger';

const env = loadEnv();
const log = createLogger('worker');

log.info('worker bootstrap ok');
log.info({ nodeEnv: env.NODE_ENV }, 'env loaded');
process.exit(0);
