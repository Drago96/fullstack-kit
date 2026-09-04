import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.api-spec.ts'],
    globalSetup: ['test/start-api.ts'],
    fileParallelism: false,
  },
});
