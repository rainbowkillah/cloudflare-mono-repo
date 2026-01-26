import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    root: 'apps/worker-api',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        main: 'src/index.ts',
        wrangler: {
          configPath: '../../tenants/mrrainbowsmoke/wrangler.jsonc',
        },
      },
    },
  },
});
