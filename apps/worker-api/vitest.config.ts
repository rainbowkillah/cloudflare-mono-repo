import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
process.env.WRANGLER_LOG_PATH ??= path.join(repoRoot, '.wrangler', 'logs');

const baseConfig = {
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
  },
};

const useWorkerPool = process.env.NX_TASK_TARGET_PROJECT === undefined;

export default useWorkerPool
  ? defineWorkersConfig({
      ...baseConfig,
      test: {
        ...baseConfig.test,
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
    })
  : defineConfig({
      ...baseConfig,
      test: {
        ...baseConfig.test,
        environment: 'node',
      },
    });
