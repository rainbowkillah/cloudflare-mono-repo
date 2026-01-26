import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
process.env.WRANGLER_LOG_PATH ??= path.join(repoRoot, '.wrangler', 'logs');

export default defineWorkersConfig({
  resolve: {
    alias: {
      '@org/tenant-mrrainbowsmoke': path.join(
        repoRoot,
        'tenants/mrrainbowsmoke/index.ts'
      ),
      '@org/tenant-rainbowsmokeofficial': path.join(
        repoRoot,
        'tenants/rainbowsmokeofficial/index.ts'
      ),
    },
  },
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
