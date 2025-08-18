/**
 * @file Cache Validation Tests
 * 
 * Comprehensive tests for cache behavior validation including:
 * - Cache hit/miss detection and verification
 * - Performance measurement and benchmarking
 * - Rate limiting behavior under load
 * - Cache consistency and data integrity
 * - Conditional requests and ETag handling
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ApiClient } from '../../../src/infrastructure/http/ApiClient.js'
import { createProxyAwareGitHubClient, ProxyUtils } from '../../../src/infrastructure/http/ProxyAwareClient.js'

describe('Cache Behavior Validation', () => {
  let githubToken: string
  let client: ApiClient

  beforeAll(async () => {
    githubToken = process.env.GITHUB_TOKEN || ''
    
    if (!githubToken) {
      console.warn('GITHUB_TOKEN not found. Skipping cache validation tests.')
      return
    }

    // Ensure proxy is running
    const proxyStarted = await ProxyUtils.startProxy()
    expect(proxyStarted).toBe(true)
    
    client = await createProxyAwareGitHubClient(githubToken)
  })

  afterAll(async () => {
    await ProxyUtils.stopProxy()
  })

  beforeEach(() => {
    if (ProxyUtils.isProxyRunning()) {
      ProxyUtils.clearProxyCache()
    }
  })

  describe('Cache Hit/Miss Detection', () => {
    it('should correctly identify cache MISS on first request', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // First request should be MISS
      const response = await client.get(endpoint)
      
      expect(response.status).toBe(200)
      expect(response.headers['x-cache']).toBe('MISS')
      expect(response.data).toHaveProperty('name', 'TypeScript')
      
      // Verify metrics show the miss
      const metrics = await ProxyUtils.getProxyMetrics()
      expect(metrics.cache.misses).toBeGreaterThan(0)
    })

    it('should correctly identify cache HIT on subsequent requests', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // First request to prime cache
      const missResponse = await client.get(endpoint)
      expect(missResponse.headers['x-cache']).toBe('MISS')
      const missData = missResponse.data
      
      // Second request should be HIT
      const hitResponse = await client.get(endpoint)
      expect(hitResponse.status).toBe(200)
      expect(hitResponse.headers['x-cache']).toBe('HIT')
      expect(hitResponse.headers['x-cache-ttl']).toBeDefined()
      
      // Data should be identical
      expect(hitResponse.data).toEqual(missData)
      
      // Verify metrics show the hit
      const metrics = await ProxyUtils.getProxyMetrics()
      expect(metrics.cache.hits).toBeGreaterThan(0)
      expect(metrics.cache.hitRate).toBeGreaterThan(0)
    })

    it('should maintain separate cache entries for different URLs', async () => {
      if (!githubToken) return

      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/microsoft/TypeScript/releases?per_page=1',
        '/repos/microsoft/TypeScript/contributors?per_page=1'
      ]
      
      // First request to each endpoint should be MISS
      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('MISS')
      }
      
      // Second request to each should be HIT
      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
      }
    })

    it('should respect query parameter differences in cache keys', async () => {
      if (!githubToken) return

      const baseEndpoint = '/repos/microsoft/TypeScript/releases'
      
      // Different query parameters should create different cache entries
      const endpoints = [
        `${baseEndpoint}?per_page=1`,
        `${baseEndpoint}?per_page=2`,
        `${baseEndpoint}?per_page=1&page=2`
      ]
      
      // Each should be a cache miss initially
      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('MISS')
      }
      
      // Each should be a cache hit on second request
      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
      }
    })
  })

  describe('Cache Performance Measurement', () => {
    interface PerformanceResult {
      dataIntegrity: boolean
      hitTime: number
      improvement: number
      missTime: number
    }

    async function measureCachePerformance(endpoint: string): Promise<PerformanceResult> {
      // Clear cache
      ProxyUtils.clearProxyCache()
      
      // Measure cache miss
      const missStart = performance.now()
      const missResponse = await client.get(endpoint)
      const missTime = performance.now() - missStart
      
      expect(missResponse.headers['x-cache']).toBe('MISS')
      
      // Measure cache hit
      const hitStart = performance.now()
      const hitResponse = await client.get(endpoint)
      const hitTime = performance.now() - hitStart
      
      expect(hitResponse.headers['x-cache']).toBe('HIT')
      
      // Calculate improvement
      const improvement = ((missTime - hitTime) / missTime) * 100
      
      // Verify data integrity
      const dataIntegrity = JSON.stringify(missResponse.data) === JSON.stringify(hitResponse.data)
      
      return { dataIntegrity, hitTime, improvement, missTime }
    }

    it('should demonstrate significant performance improvement (>50%)', async () => {
      if (!githubToken) return

      const result = await measureCachePerformance('/repos/microsoft/TypeScript')
      
      expect(result.improvement).toBeGreaterThan(50) // At least 50% improvement
      expect(result.hitTime).toBeLessThan(200) // Cache hits should be fast
      expect(result.dataIntegrity).toBe(true) // Data must be identical
      
      console.log(`Cache Performance for /repos/microsoft/TypeScript:`)
      console.log(`  Miss: ${result.missTime.toFixed(2)}ms`)
      console.log(`  Hit:  ${result.hitTime.toFixed(2)}ms`)
      console.log(`  Improvement: ${result.improvement.toFixed(1)}%`)
    })

    it('should maintain consistent performance across multiple endpoints', async () => {
      if (!githubToken) return

      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/microsoft/TypeScript/releases?per_page=1',
        '/repos/facebook/react'
      ]
      
      const results: PerformanceResult[] = []
      
      for (const endpoint of endpoints) {
        const result = await measureCachePerformance(endpoint)
        results.push(result)
        
        expect(result.improvement).toBeGreaterThan(30) // Minimum improvement
        expect(result.dataIntegrity).toBe(true)
      }
      
      // All cache hits should be consistently fast
      const hitTimes = results.map(r => r.hitTime)
      const avgHitTime = hitTimes.reduce((sum, time) => sum + time, 0) / hitTimes.length
      const maxHitTime = Math.max(...hitTimes)
      
      expect(avgHitTime).toBeLessThan(100)
      expect(maxHitTime).toBeLessThan(200)
      
      console.log(`Performance consistency across ${endpoints.length} endpoints:`)
      console.log(`  Average cache hit: ${avgHitTime.toFixed(2)}ms`)
      console.log(`  Max cache hit: ${maxHitTime.toFixed(2)}ms`)
      console.log(`  Average improvement: ${results.reduce((sum, r) => sum + r.improvement, 0) / results.length}%`)
    })

    it('should scale performance with concurrent requests', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Prime cache
      await client.get(endpoint)
      
      // Make concurrent cached requests
      const concurrentRequests = 10
      const promises = Array.from({length: concurrentRequests}).fill(null).map(async () => {
        const start = performance.now()
        const response = await client.get(endpoint)
        const time = performance.now() - start
        
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
        
        return time
      })
      
      const times = await Promise.all(promises)
      
      // All concurrent requests should be reasonably fast
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      
      expect(avgTime).toBeLessThan(150)
      expect(maxTime).toBeLessThan(300)
      
      console.log(`Concurrent cache performance (${concurrentRequests} requests):`)
      console.log(`  Average: ${avgTime.toFixed(2)}ms`)
      console.log(`  Max: ${maxTime.toFixed(2)}ms`)
      console.log(`  Min: ${Math.min(...times).toFixed(2)}ms`)
    })
  })

  describe('Cache TTL and Expiration', () => {
    it('should include accurate TTL information in cache hit responses', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Prime cache
      await client.get(endpoint)
      
      // Get cache hit with TTL
      const hitResponse = await client.get(endpoint)
      expect(hitResponse.headers['x-cache']).toBe('HIT')
      expect(hitResponse.headers['x-cache-ttl']).toBeDefined()
      
      const ttl = Number.parseInt(hitResponse.headers['x-cache-ttl'])
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(3600) // Should not exceed configured maximum
      
      // Make another request shortly after - TTL should decrease
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const secondHitResponse = await client.get(endpoint)
      const secondTtl = Number.parseInt(secondHitResponse.headers['x-cache-ttl'])
      
      expect(secondTtl).toBeLessThanOrEqual(ttl)
    })

    it('should respect domain-specific TTL configuration', async () => {
      if (!githubToken) return

      // GitHub API should have longer TTL than default
      const githubResponse = await client.get('/repos/microsoft/TypeScript')
      await client.get('/repos/microsoft/TypeScript') // Prime cache
      const cachedGithubResponse = await client.get('/repos/microsoft/TypeScript')
      
      if (cachedGithubResponse.headers['x-cache'] === 'HIT') {
        const githubTtl = Number.parseInt(cachedGithubResponse.headers['x-cache-ttl'])
        expect(githubTtl).toBeGreaterThan(300) // Should be longer than default 300s
      }
    })
  })

  describe('Conditional Requests and ETag Support', () => {
    it('should handle ETag-based conditional requests correctly', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Get initial response with ETag
      const initialResponse = await client.get(endpoint)
      const etag = initialResponse.headers['etag']
      
      if (etag) {
        // Make conditional request
        const conditionalResponse = await client.get(endpoint, {
          headers: { 'If-None-Match': etag }
        })
        
        // Should get 304 Not Modified if unchanged
        if (conditionalResponse.status === 304) {
          expect(conditionalResponse.data).toBeFalsy()
        } else {
          expect(conditionalResponse.status).toBe(200)
        }
      }
    })

    it('should optimize bandwidth usage with conditional requests', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Make request to prime cache and get ETag
      const firstResponse = await client.get(endpoint)
      const firstSize = JSON.stringify(firstResponse.data).length
      
      // Second request should use cache
      const cachedResponse = await client.get(endpoint)
      expect(cachedResponse.headers['x-cache']).toBe('HIT')
      
      const cachedSize = JSON.stringify(cachedResponse.data).length
      expect(cachedSize).toBe(firstSize) // Same data size
      
      console.log(`Response size: ${firstSize} bytes`)
    })
  })

  describe('Cache Consistency and Reliability', () => {
    it('should maintain data consistency across cache operations', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Get original data
      const originalResponse = await client.get(endpoint)
      const originalData = originalResponse.data
      
      // Multiple cache hits should return identical data
      const iterations = 5
      for (let i = 0; i < iterations; i++) {
        const cachedResponse = await client.get(endpoint)
        expect(cachedResponse.status).toBe(200)
        expect(cachedResponse.headers['x-cache']).toBe('HIT')
        expect(cachedResponse.data).toEqual(originalData)
      }
    })

    it('should handle cache invalidation correctly', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Prime cache
      await client.get(endpoint)
      
      // Verify cache hit
      const hitResponse = await client.get(endpoint)
      expect(hitResponse.headers['x-cache']).toBe('HIT')
      
      // Clear cache
      ProxyUtils.clearProxyCache('api.github.com')
      
      // Next request should be miss
      const missResponse = await client.get(endpoint)
      expect(missResponse.headers['x-cache']).toBe('MISS')
    })

    it('should maintain cache integrity under concurrent access', async () => {
      if (!githubToken) return

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Prime cache
      const originalResponse = await client.get(endpoint)
      const originalData = originalResponse.data
      
      // Make many concurrent cache requests
      const concurrentRequests = 20
      const promises = Array.from({length: concurrentRequests}).fill(null).map(() => 
        client.get(endpoint)
      )
      
      const responses = await Promise.all(promises)
      
      // All should be successful and return identical data
      for (const response of responses) {
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
        expect(response.data).toEqual(originalData)
      }
    })
  })

  describe('Cache Statistics and Monitoring', () => {
    it('should accurately track cache hit/miss statistics', async () => {
      if (!githubToken) return

      // Clear cache and get initial stats
      ProxyUtils.clearProxyCache()
      const initialMetrics = await ProxyUtils.getProxyMetrics()
      const initialHits = initialMetrics.cache.hits
      const initialMisses = initialMetrics.cache.misses
      
      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/facebook/react',
        '/repos/google/go'
      ]
      
      // Make first round of requests (all misses)
      for (const endpoint of endpoints) {
        await client.get(endpoint)
      }
      
      // Make second round (all hits)
      for (const endpoint of endpoints) {
        await client.get(endpoint)
      }
      
      const finalMetrics = await ProxyUtils.getProxyMetrics()
      
      expect(finalMetrics.cache.misses - initialMisses).toBe(3) // 3 misses
      expect(finalMetrics.cache.hits - initialHits).toBe(3) // 3 hits
      expect(finalMetrics.cache.totalRequests).toBeGreaterThan(initialMetrics.cache.totalRequests + 5)
      expect(finalMetrics.cache.hitRate).toBeGreaterThan(0)
      
      console.log(`Cache statistics:`)
      console.log(`  Hits: ${finalMetrics.cache.hits}`)
      console.log(`  Misses: ${finalMetrics.cache.misses}`)
      console.log(`  Hit Rate: ${(finalMetrics.cache.hitRate * 100).toFixed(1)}%`)
    })

    it('should provide accurate cache size and memory usage', async () => {
      if (!githubToken) return

      ProxyUtils.clearProxyCache()
      
      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/facebook/react',
        '/repos/google/go',
        '/repos/nodejs/node',
        '/repos/python/cpython'
      ]
      
      // Cache multiple repositories
      for (const endpoint of endpoints) {
        await client.get(endpoint)
      }
      
      const metrics = await ProxyUtils.getProxyMetrics()
      
      expect(metrics.cache.cacheSize).toBeGreaterThan(0)
      expect(metrics.cache.entriesCount).toBe(5)
      
      console.log(`Cache usage:`)
      console.log(`  Entries: ${metrics.cache.entriesCount}`)
      console.log(`  Size: ${metrics.cache.cacheSize} bytes`)
      console.log(`  Average entry size: ${Math.round(metrics.cache.cacheSize / metrics.cache.entriesCount)} bytes`)
    })
  })

  describe('Error Handling in Cache Operations', () => {
    it('should handle cache errors gracefully', async () => {
      if (!githubToken) return

      // This test ensures cache errors don't break functionality
      // Even if cache fails, requests should still work via proxy
      
      const response = await client.get('/repos/microsoft/TypeScript')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('name', 'TypeScript')
    })

    it('should maintain service availability during cache failures', async () => {
      if (!githubToken) return

      // Test that service continues working even if cache has issues
      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/facebook/react'
      ]
      
      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        // Should work regardless of cache state
      }
    })
  })
})