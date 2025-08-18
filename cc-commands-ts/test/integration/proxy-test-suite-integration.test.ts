/**
 * @file Integration tests showing how proxy improves main test suite reliability
 * 
 * This test demonstrates:
 * - Running GitHub API tests with and without proxy
 * - Measuring test reliability improvements
 * - Cache hit rates during test execution
 * - Performance improvements in test suite execution
 * - Rate limiting protection during intensive testing
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ApiClient } from '../../src/infrastructure/http/ApiClient.js'
import { createProxyAwareGitHubClient, ProxyUtils } from '../../src/infrastructure/http/ProxyAwareClient.js'

describe('Proxy Integration with Test Suite', () => {
  let githubToken: string
  let proxyClient: ApiClient
  let directClient: ApiClient

  beforeAll(async () => {
    githubToken = process.env.GITHUB_TOKEN || ''
    
    if (!githubToken) {
      console.warn('GITHUB_TOKEN not found. Integration tests will be limited.')
      return
    }

    // Start proxy
    const proxyStarted = await ProxyUtils.startProxy()
    expect(proxyStarted).toBe(true)

    // Create proxy-enabled client
    proxyClient = await createProxyAwareGitHubClient(githubToken)

    // Create direct client (without proxy)
    directClient = new ApiClient({
      baseUrl: 'https://api.github.com',
      defaultHeaders: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      retry: {
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxAttempts: 2,
        maxDelay: 10_000,
        retryOnStatus: [502, 503, 504, 429]
      }
    })
  })

  afterAll(async () => {
    // Keep proxy running for other tests, just clear cache
    if (ProxyUtils.isProxyRunning()) {
      ProxyUtils.clearProxyCache()
    }
  })

  describe('Test Suite Reliability Improvements', () => {
    const testEndpoints = [
      '/repos/microsoft/TypeScript',
      '/repos/microsoft/TypeScript/releases?per_page=1', 
      '/repos/microsoft/TypeScript/contributors?per_page=1',
      '/repos/facebook/react',
      '/repos/google/go'
    ]

    it('should demonstrate faster test execution with caching', async () => {
      if (!githubToken) return

      console.log('Testing GitHub API access patterns typical in test suites...')

      // Clear cache for fair comparison
      ProxyUtils.clearProxyCache()

      // Simulate test suite pattern: multiple tests accessing same endpoints
      
      // First run (cache misses) - simulate initial test run
      const firstRunStart = performance.now()
      for (const endpoint of testEndpoints) {
        const response = await proxyClient.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('MISS')
      }

      const firstRunTime = performance.now() - firstRunStart

      // Second run (cache hits) - simulate repeated test execution
      const secondRunStart = performance.now()
      for (const endpoint of testEndpoints) {
        const response = await proxyClient.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
      }

      const secondRunTime = performance.now() - secondRunStart

      const improvement = ((firstRunTime - secondRunTime) / firstRunTime) * 100

      // Verify significant improvement
      expect(improvement).toBeGreaterThan(50)
      expect(secondRunTime).toBeLessThan(firstRunTime * 0.5)

      console.log(`Test execution performance:`)
      console.log(`  First run (cache miss): ${firstRunTime.toFixed(0)}ms`)
      console.log(`  Second run (cache hit): ${secondRunTime.toFixed(0)}ms`)
      console.log(`  Improvement: ${improvement.toFixed(1)}%`)

      // Verify cache metrics
      const metrics = await ProxyUtils.getProxyMetrics()
      expect(metrics.cache.hitRate).toBeGreaterThan(0.4) // At least 40% hit rate
    })

    it('should prevent rate limit exhaustion during intensive testing', async () => {
      if (!githubToken) return

      console.log('Testing rate limit protection during intensive API usage...')

      // Get initial GitHub rate limit
      const rateLimitCheck = await proxyClient.get('/rate_limit')
      const initialRemaining = rateLimitCheck.data.rate.remaining
      
      console.log(`Initial GitHub rate limit: ${initialRemaining} requests remaining`)

      // Simulate intensive test scenario - many requests to same endpoints
      const intensiveEndpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/microsoft/TypeScript',  // Intentional duplicates
        '/repos/microsoft/TypeScript',
        '/repos/facebook/react',
        '/repos/facebook/react',
        '/repos/facebook/react'
      ]

      let cacheHits = 0
      let cacheMisses = 0

      for (const endpoint of intensiveEndpoints) {
        const response = await proxyClient.get(endpoint)
        expect(response.status).toBe(200)
        
        if (response.headers['x-cache'] === 'HIT') {
          cacheHits++
        } else {
          cacheMisses++
        }
      }

      // Check final rate limit
      const finalRateLimitCheck = await proxyClient.get('/rate_limit')
      const finalRemaining = finalRateLimitCheck.data.rate.remaining

      const rateLimitConsumed = initialRemaining - finalRemaining

      console.log(`Cache performance: ${cacheHits} hits, ${cacheMisses} misses`)
      console.log(`Rate limit consumed: ${rateLimitConsumed} requests`)
      console.log(`Rate limit saved by caching: ~${cacheHits} requests`)

      // Caching should have prevented most rate limit consumption
      expect(cacheHits).toBeGreaterThan(cacheMisses)
      expect(rateLimitConsumed).toBeLessThan(intensiveEndpoints.length)
    })

    it('should maintain test data consistency across test runs', async () => {
      if (!githubToken) return

      console.log('Testing data consistency across multiple test executions...')

      const testEndpoint = '/repos/microsoft/TypeScript'
      
      // Get data multiple times (should be cached after first)
      const responses = []
      for (let i = 0; i < 5; i++) {
        const response = await proxyClient.get(testEndpoint)
        responses.push(response)
        expect(response.status).toBe(200)
      }

      // All responses should have identical data
      const firstData = responses[0].data
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].data).toEqual(firstData)
        
        // Verify key fields are consistent
        expect(responses[i].data.id).toBe(firstData.id)
        expect(responses[i].data.name).toBe(firstData.name)
        expect(responses[i].data.full_name).toBe(firstData.full_name)
      }

      // Most should be cache hits
      const cacheHits = responses.filter(r => r.headers['x-cache'] === 'HIT').length
      expect(cacheHits).toBeGreaterThanOrEqual(3)

      console.log(`Data consistency maintained across ${responses.length} requests`)
      console.log(`Cache hits: ${cacheHits}/${responses.length}`)
    })
  })

  describe('Performance Comparison: Proxy vs Direct', () => {
    it('should show performance benefits of proxy over direct API calls', async () => {
      if (!githubToken) return

      console.log('Comparing proxy vs direct API performance...')

      const testEndpoint = '/repos/microsoft/TypeScript'

      // Test direct API performance (multiple calls)
      const directTimes: number[] = []
      for (let i = 0; i < 3; i++) {
        const start = performance.now()
        const response = await directClient.get(testEndpoint)
        const time = performance.now() - start
        
        expect(response.status).toBe(200)
        directTimes.push(time)
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Clear cache for fair test
      ProxyUtils.clearProxyCache()

      // Test proxy performance (first call = miss, subsequent = hits)
      const proxyMissStart = performance.now()
      const missResponse = await proxyClient.get(testEndpoint)
      const proxyMissTime = performance.now() - proxyMissStart
      
      expect(missResponse.status).toBe(200)
      expect(missResponse.headers['x-cache']).toBe('MISS')

      const proxyHitTimes: number[] = []
      for (let i = 0; i < 3; i++) {
        const start = performance.now()
        const response = await proxyClient.get(testEndpoint)
        const time = performance.now() - start
        
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
        proxyHitTimes.push(time)
      }

      // Calculate averages
      const avgDirectTime = directTimes.reduce((sum, time) => sum + time, 0) / directTimes.length
      const avgProxyHitTime = proxyHitTimes.reduce((sum, time) => sum + time, 0) / proxyHitTimes.length

      // Performance assertions
      expect(avgProxyHitTime).toBeLessThan(avgDirectTime * 0.3) // At least 70% faster
      expect(avgProxyHitTime).toBeLessThan(100) // Cache hits should be very fast

      console.log(`Performance comparison:`)
      console.log(`  Direct API (avg): ${avgDirectTime.toFixed(2)}ms`)
      console.log(`  Proxy miss: ${proxyMissTime.toFixed(2)}ms`)
      console.log(`  Proxy hits (avg): ${avgProxyHitTime.toFixed(2)}ms`)
      console.log(`  Improvement: ${(((avgDirectTime - avgProxyHitTime) / avgDirectTime) * 100).toFixed(1)}%`)
    })
  })

  describe('Test Suite Integration Scenarios', () => {
    it('should handle typical GitHub integration test patterns', async () => {
      if (!githubToken) return

      console.log('Testing common GitHub integration test patterns...')

      // Pattern 1: Repository info + releases + contributors (typical test setup)
      const repo = 'microsoft/TypeScript'
      
      const repoResponse = await proxyClient.get(`/repos/${repo}`)
      const releasesResponse = await proxyClient.get(`/repos/${repo}/releases?per_page=1`)
      const contributorsResponse = await proxyClient.get(`/repos/${repo}/contributors?per_page=1`)

      expect(repoResponse.status).toBe(200)
      expect(releasesResponse.status).toBe(200)
      expect(contributorsResponse.status).toBe(200)

      // Pattern 2: Repeated access to same data (multiple test cases)
      const repeatResponses = []
      for (let i = 0; i < 3; i++) {
        const response = await proxyClient.get(`/repos/${repo}`)
        repeatResponses.push(response)
        expect(response.status).toBe(200)
      }

      // Should have cache hits after first
      const cacheHits = repeatResponses.filter(r => r.headers['x-cache'] === 'HIT').length
      expect(cacheHits).toBeGreaterThanOrEqual(2)

      // Pattern 3: Rate limit checking (common in robust tests)
      const rateLimitResponse = await proxyClient.get('/rate_limit')
      expect(rateLimitResponse.status).toBe(200)
      expect(rateLimitResponse.data.rate).toBeDefined()

      console.log(`Integration test patterns completed successfully`)
      console.log(`Rate limit remaining: ${rateLimitResponse.data.rate.remaining}`)
    })

    it('should provide reliable test execution under load', async () => {
      if (!githubToken) return

      console.log('Testing reliability under concurrent test execution...')

      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/facebook/react',
        '/repos/google/go'
      ]

      // Simulate concurrent test execution
      const concurrentPromises = []
      
      for (const endpoint of endpoints) {
        // Each "test" makes multiple API calls
        const testPromise = async () => {
          const responses = []
          for (let i = 0; i < 3; i++) {
            const response = await proxyClient.get(endpoint)
            responses.push(response)
          }

          return responses
        }
        
        concurrentPromises.push(testPromise())
      }

      const results = await Promise.all(concurrentPromises)

      // All tests should succeed
      for (const testResults of results) {
        for (const response of testResults) {
          expect(response.status).toBe(200)
        }
      }

      // Should have good cache utilization
      const metrics = await ProxyUtils.getProxyMetrics()
      expect(metrics.cache.totalRequests).toBeGreaterThan(5)
      expect(metrics.cache.hits).toBeGreaterThan(0)

      console.log(`Concurrent test execution successful`)
      console.log(`Total requests: ${metrics.cache.totalRequests}`)
      console.log(`Cache hits: ${metrics.cache.hits}`)
      console.log(`Hit rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`)
    })

    it('should gracefully handle test failures without affecting cache', async () => {
      if (!githubToken) return

      console.log('Testing graceful handling of API failures...')

      // Test successful request (should cache)
      const successResponse = await proxyClient.get('/repos/microsoft/TypeScript')
      expect(successResponse.status).toBe(200)
      expect(successResponse.headers['x-cache']).toBe('MISS')

      // Test failed request (should not affect cache)
      try {
        await proxyClient.get('/repos/nonexistent-user-99999/nonexistent-repo-99999')
        expect.fail('Should have thrown error for non-existent repository')
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined()
      }

      // Original successful endpoint should still be cached
      const cachedResponse = await proxyClient.get('/repos/microsoft/TypeScript')
      expect(cachedResponse.status).toBe(200)
      expect(cachedResponse.headers['x-cache']).toBe('HIT')

      console.log(`Graceful error handling verified`)
    })
  })

  describe('Cache Behavior with Test Data', () => {
    it('should optimize repeated test data access', async () => {
      if (!githubToken) return

      console.log('Testing optimization of repeated test data patterns...')

      // Common test pattern: access same repository multiple times
      const repository = '/repos/microsoft/TypeScript'
      const accessCount = 5
      
      const responses = []
      const timings = []
      
      for (let i = 0; i < accessCount; i++) {
        const start = performance.now()
        const response = await proxyClient.get(repository)
        const time = performance.now() - start
        
        responses.push(response)
        timings.push(time)
        
        expect(response.status).toBe(200)
      }

      // First should be miss, rest should be hits
      expect(responses[0].headers['x-cache']).toBe('MISS')
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].headers['x-cache']).toBe('HIT')
      }

      // Cache hits should be significantly faster
      const firstTime = timings[0]
      const avgCacheTime = timings.slice(1).reduce((sum, time) => sum + time, 0) / (timings.length - 1)
      
      expect(avgCacheTime).toBeLessThan(firstTime * 0.3)

      // Data should be consistent
      const firstData = responses[0].data
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].data.id).toBe(firstData.id)
        expect(responses[i].data.name).toBe(firstData.name)
      }

      console.log(`Test data access optimization:`)
      console.log(`  First access: ${firstTime.toFixed(2)}ms`)
      console.log(`  Avg cached access: ${avgCacheTime.toFixed(2)}ms`)
      console.log(`  Speedup: ${(firstTime / avgCacheTime).toFixed(1)}x`)
    })

    it('should provide comprehensive test metrics and monitoring', async () => {
      if (!githubToken) return

      console.log('Verifying test metrics and monitoring capabilities...')

      // Generate some test activity
      await proxyClient.get('/repos/microsoft/TypeScript')
      await proxyClient.get('/repos/facebook/react')
      await proxyClient.get('/repos/microsoft/TypeScript') // Should be cached

      // Get comprehensive metrics
      const metrics = await ProxyUtils.getProxyMetrics()
      const health = ProxyUtils.getProxyHealth()

      // Verify metrics structure
      expect(metrics).toHaveProperty('cache')
      expect(metrics).toHaveProperty('rateLimiter')
      expect(metrics).toHaveProperty('server')
      
      expect(metrics.cache).toHaveProperty('hits')
      expect(metrics.cache).toHaveProperty('misses')
      expect(metrics.cache).toHaveProperty('hitRate')
      expect(metrics.cache).toHaveProperty('totalRequests')

      // Verify health information
      expect(health).toHaveProperty('healthy')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('components')

      expect(health.healthy).toBe(true)
      expect(health.components.cache.healthy).toBe(true)
      expect(health.components.rateLimiter.healthy).toBe(true)

      console.log(`Metrics and monitoring verified:`)
      console.log(`  Cache hit rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`)
      console.log(`  Total requests: ${metrics.cache.totalRequests}`)
      console.log(`  System health: ${health.healthy ? 'Healthy' : 'Unhealthy'}`)
      console.log(`  Uptime: ${health.uptime}s`)
    })
  })
})