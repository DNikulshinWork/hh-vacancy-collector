import { defineConfig } from 'prisma/config';
import { loadEnv } from '@repo/config';

const env = loadEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});
