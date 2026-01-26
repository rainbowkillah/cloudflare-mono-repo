import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      environment: 'node',
      include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
      pool: 'threads',
      coverage: {
        provider: 'v8',
        reportsDirectory: 'coverage'
      }
    }
  }
]);
