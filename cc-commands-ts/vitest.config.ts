import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Increase timeout for integration tests (GitHub API calls, etc.)
    testTimeout: 15000, // 15 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/real-integration.test.ts' // Exclude real API integration tests by default
    ],
    coverage: {
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './var/coverage',
      exclude: [
        'coverage/**',
        'var/**',
        'dist/**',
        'lib/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'test/**'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})