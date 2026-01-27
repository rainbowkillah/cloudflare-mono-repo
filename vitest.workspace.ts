import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      environment: 'node',
      include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      pool: 'threads',
      coverage: {
        provider: 'v8',
        reportsDirectory: 'coverage',
      },
    },
  },
]);
