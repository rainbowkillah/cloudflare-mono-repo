import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: 'packages/core',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    environment: 'node',
  },
});
