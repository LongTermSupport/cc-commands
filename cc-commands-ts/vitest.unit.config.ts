import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Fast timeout for pure unit tests
    testTimeout: 5000,
    hookTimeout: 5000,
    // Better error handling
    bail: 0,
    silent: false,
    include: [
      'test/core/**/*.test.ts',
      'test/orchestrator-services/**/dto/*.test.ts',
      'test/orchestrator-services/**/services/*.test.ts' // Only unit tests, not integration
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/integration.test.ts',
      '**/e2e.test.ts',
      '**/real-integration.test.ts',
      '**/gh-integration.test.ts'
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
      ]
    }
  }
})