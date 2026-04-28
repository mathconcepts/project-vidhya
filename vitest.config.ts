import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Several test files share `.data/` for persistence-layer tests
    // (content-library, content-studio, teaching-turns, operator,
    // lifecycle, content-library-routes, content-library-router). Each
    // backs up `.data/` in beforeAll and restores in afterAll. Running
    // files in parallel produces a race where one file's afterAll
    // restores an empty backup over another file's still-running tests.
    //
    // Serial file execution removes the race. Tests within each file
    // still run normally; the cost is total wall time growing linearly
    // with the number of test files — currently ~5s vs ~3s parallel.
    // Acceptable trade-off for determinism.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/index.ts',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
