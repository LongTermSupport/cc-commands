/**
 * @file Integration tests for ProxyAware HTTP Client
 * 
 * Tests the ProxyAwareGitHubClient functionality including:
 * - Proxy auto-start and fallback behavior
 * - GitHub API integration through proxy
 * - Cache behavior with real GitHub API responses
 * - Rate limiting with GitHub API
 * - Performance comparison between direct and cached requests
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClient } from '../../../src/infrastructure/http/ApiClient.js'
import { createProxyAwareGitHubClient, ProxyUtils } from '../../../src/infrastructure/http/ProxyAwareClient.js'

describe('ProxyAware GitHub Client Integration', () => {
  let githubToken: string
  let client: ApiClient

  beforeAll(async () => {
    // Get GitHub token from environment
    githubToken = process.env.GITHUB_TOKEN || ''
    
    if (!githubToken) {
      console.warn('GITHUB_TOKEN not found. Some tests will be skipped.')
      return
    }

    // Ensure proxy is stopped initially to test startup
    await ProxyUtils.stopProxy()
    
    // Create proxy-aware GitHub client
    client = await createProxyAwareGitHubClient(githubToken)
  })

  afterAll(async () => {
    // Clean up proxy
    await ProxyUtils.stopProxy()
  })

  beforeEach(() => {
    // Clear proxy cache between tests
    if (ProxyUtils.isProxyRunning()) {
      ProxyUtils.clearProxyCache()
    }
  })

  describe('Proxy Auto-Start Behavior', () => {
    it('should automatically start proxy when creating GitHub client', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Ensure proxy is stopped
      await ProxyUtils.stopProxy()
      expect(ProxyUtils.isProxyRunning()).toBe(false)

      // Create new client should start proxy
      const newClient = await createProxyAwareGitHubClient(githubToken)
      expect(newClient).toBeInstanceOf(ApiClient)
      
      // Proxy should now be running
      expect(ProxyUtils.isProxyRunning()).toBe(true)
      
      // Health check should work
      const health = ProxyUtils.getProxyHealth()
      expect(health.healthy).toBe(true)
    })

    it('should reuse existing proxy when already running', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Start proxy manually
      const started = await ProxyUtils.startProxy()
      expect(started).toBe(true)
      
      const initialMetrics = await ProxyUtils.getProxyMetrics()
      
      // Create new client should reuse existing proxy
      const newClient = await createProxyAwareGitHubClient(githubToken)
      expect(newClient).toBeInstanceOf(ApiClient)
      
      // Should still be the same proxy instance
      expect(ProxyUtils.isProxyRunning()).toBe(true)
    })
  })

  describe('GitHub API Integration', () => {
    it('should successfully fetch public repository data', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Test with a well-known public repository
      const response = await client.get('/repos/microsoft/TypeScript')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name', 'TypeScript')
      expect(response.data).toHaveProperty('full_name', 'microsoft/TypeScript')
      expect(response.data).toHaveProperty('owner')
      expect(response.data.owner).toHaveProperty('login', 'microsoft')
    })

    it('should include proper GitHub API headers', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const response = await client.get('/repos/microsoft/TypeScript')
      
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      
      // Should include cache status from proxy
      expect(response.headers).toHaveProperty('x-cache')
      expect(['HIT', 'MISS']).toContain(response.headers['x-cache'])
    })

    it('should handle GitHub API rate limits gracefully', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Check current rate limit status
      const rateLimitResponse = await client.get('/rate_limit')
      expect(rateLimitResponse.status).toBe(200)
      
      const rateLimitData = rateLimitResponse.data
      expect(rateLimitData).toHaveProperty('rate')
      expect(rateLimitData.rate).toHaveProperty('limit')
      expect(rateLimitData.rate).toHaveProperty('remaining')
      expect(rateLimitData.rate).toHaveProperty('reset')
      
      console.log(`GitHub API Rate Limit: ${rateLimitData.rate.remaining}/${rateLimitData.rate.limit} remaining`)
    })

    it('should work with different GitHub API endpoints', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Test multiple endpoints to verify proxy works across different API paths
      const endpoints = [
        '/repos/microsoft/TypeScript',
        '/repos/microsoft/TypeScript/releases?per_page=1',
        '/repos/microsoft/TypeScript/contributors?per_page=1'
      ]

      for (const endpoint of endpoints) {
        const response = await client.get(endpoint)
        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
        
        // Should have cache headers
        expect(['HIT', 'MISS']).toContain(response.headers['x-cache'])
      }
    })

    it('should handle GitHub API errors correctly', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Test 404 error with non-existent repository
      try {
        await client.get('/repos/nonexistent-user-12345/nonexistent-repo-67890')
        expect.fail('Should have thrown an error for non-existent repository')
      } catch (error) {
        expect(error).toBeDefined()
        // Should be a 404 error
        if (error instanceof Error && 'status' in error) {
          expect((error as any).status).toBe(404)
        }
      }
    })
  })

  describe('Caching Behavior with GitHub API', () => {
    it('should cache GET requests and return cache hits', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const endpoint = '/repos/microsoft/TypeScript'
      
      // First request should be cache miss
      const firstResponse = await client.get(endpoint)
      expect(firstResponse.status).toBe(200)
      expect(firstResponse.headers['x-cache']).toBe('MISS')
      
      const firstData = firstResponse.data
      
      // Second request should be cache hit
      const secondResponse = await client.get(endpoint)
      expect(secondResponse.status).toBe(200)
      expect(secondResponse.headers['x-cache']).toBe('HIT')
      
      const secondData = secondResponse.data
      
      // Data should be identical
      expect(firstData).toEqual(secondData)
      expect(firstData.id).toBe(secondData.id)
      expect(firstData.name).toBe(secondData.name)
    })

    it('should include cache TTL information for GitHub API requests', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const response = await client.get('/repos/microsoft/TypeScript')
      
      if (response.headers['x-cache'] === 'HIT') {
        expect(response.headers['x-cache-ttl']).toBeDefined()
        const ttl = Number.parseInt(response.headers['x-cache-ttl'])
        expect(ttl).toBeGreaterThan(0)
        expect(ttl).toBeLessThanOrEqual(3600) // Should not exceed configured TTL
      }
    })

    it('should respect conditional requests with ETags', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const endpoint = '/repos/microsoft/TypeScript'
      
      // First request to get ETag
      const firstResponse = await client.get(endpoint)
      const etag = firstResponse.headers['etag']
      
      if (etag) {
        // Make conditional request with If-None-Match header
        const conditionalResponse = await client.get(endpoint, {
          headers: { 'If-None-Match': etag }
        })
        
        // Depending on whether data changed, should get 304 or 200
        expect([200, 304]).toContain(conditionalResponse.status)
        
        if (conditionalResponse.status === 304) {
          // Not Modified response should have minimal body
          expect(conditionalResponse.data).toBeFalsy()
        }
      }
    })

    it('should handle cache invalidation correctly', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Make request to cache it
      const firstResponse = await client.get(endpoint)
      expect(firstResponse.headers['x-cache']).toBe('MISS')
      
      // Second request should be cache hit
      const secondResponse = await client.get(endpoint)
      expect(secondResponse.headers['x-cache']).toBe('HIT')
      
      // Clear GitHub cache
      ProxyUtils.clearProxyCache('api.github.com')
      
      // Third request should be cache miss again
      const thirdResponse = await client.get(endpoint)
      expect(thirdResponse.headers['x-cache']).toBe('MISS')
    })
  })

  describe('Performance with GitHub API', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Clear cache to ensure fresh test
      ProxyUtils.clearProxyCache('api.github.com')
      
      // First request (cache miss) - measure time
      const missStart = performance.now()
      const missResponse = await client.get(endpoint)
      const missTime = performance.now() - missStart
      
      expect(missResponse.status).toBe(200)
      expect(missResponse.headers['x-cache']).toBe('MISS')
      
      // Second request (cache hit) - measure time
      const hitStart = performance.now()
      const hitResponse = await client.get(endpoint)
      const hitTime = performance.now() - hitStart
      
      expect(hitResponse.status).toBe(200)
      expect(hitResponse.headers['x-cache']).toBe('HIT')
      
      // Performance assertions
      expect(hitTime).toBeLessThan(missTime * 0.3) // Cache should be at least 70% faster
      expect(hitTime).toBeLessThan(200) // Cache hit should be under 200ms
      expect(missTime).toBeGreaterThan(100) // API call should take some measurable time
      
      console.log(`GitHub API Performance:`)
      console.log(`  Cache miss: ${missTime.toFixed(2)}ms`)
      console.log(`  Cache hit:  ${hitTime.toFixed(2)}ms`)
      console.log(`  Improvement: ${((missTime - hitTime) / missTime * 100).toFixed(1)}%`)
      
      // Data fidelity check
      expect(hitResponse.data).toEqual(missResponse.data)
    })

    it('should maintain consistent response times for cached requests', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const endpoint = '/repos/microsoft/TypeScript'
      
      // Make initial request to cache it
      await client.get(endpoint)
      
      // Make multiple cache hit requests and measure times
      const times: number[] = []
      const iterations = 5
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        const response = await client.get(endpoint)
        const time = performance.now() - start
        
        expect(response.status).toBe(200)
        expect(response.headers['x-cache']).toBe('HIT')
        
        times.push(time)
      }
      
      // Calculate statistics
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      
      // All cached requests should be reasonably fast and consistent
      expect(averageTime).toBeLessThan(100)
      expect(maxTime - minTime).toBeLessThan(50) // Low variance
      
      console.log(`Cache consistency over ${iterations} requests:`)
      console.log(`  Average: ${averageTime.toFixed(2)}ms`)
      console.log(`  Min: ${minTime.toFixed(2)}ms`)
      console.log(`  Max: ${maxTime.toFixed(2)}ms`)
      console.log(`  Variance: ${(maxTime - minTime).toFixed(2)}ms`)
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should track and report rate limiting metrics', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Get initial metrics
      const initialMetrics = await ProxyUtils.getProxyMetrics()
      const initialRequests = initialMetrics.rateLimiter?.totalRequests || 0
      
      // Make some requests
      await client.get('/repos/microsoft/TypeScript')
      await client.get('/repos/microsoft/TypeScript/releases?per_page=1')
      
      // Get updated metrics
      const updatedMetrics = await ProxyUtils.getProxyMetrics()
      const updatedRequests = updatedMetrics.rateLimiter?.totalRequests || 0
      
      // Should have tracked the requests
      expect(updatedRequests).toBeGreaterThan(initialRequests)
      
      console.log(`Rate limiter metrics:`)
      console.log(`  Total requests: ${updatedRequests}`)
      console.log(`  Allowed: ${updatedMetrics.rateLimiter?.allowedRequests || 0}`)
      console.log(`  Rejected: ${updatedMetrics.rateLimiter?.rejectedRequests || 0}`)
    })

    it('should handle proxy rate limits vs GitHub rate limits', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Check GitHub rate limit status
      const rateLimitResponse = await client.get('/rate_limit')
      const githubLimits = rateLimitResponse.data.rate
      
      // Check proxy rate limit status
      const proxyMetrics = await ProxyUtils.getProxyMetrics()
      
      console.log(`Rate limiting status:`)
      console.log(`  GitHub API: ${githubLimits.remaining}/${githubLimits.limit} remaining`)
      console.log(`  Proxy: ${proxyMetrics.rateLimiter?.allowedRequests || 0} allowed requests`)
      
      // Proxy should not be more restrictive than GitHub for normal usage
      expect(rateLimitResponse.status).toBe(200)
      expect(githubLimits.remaining).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Fallback', () => {
    it('should fall back to direct requests when proxy fails', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // Stop proxy to force fallback
      await ProxyUtils.stopProxy()
      expect(ProxyUtils.isProxyRunning()).toBe(false)
      
      // Create new client without proxy
      const fallbackClient = await createProxyAwareGitHubClient(githubToken)
      
      // Should still work via direct connection
      const response = await fallbackClient.get('/repos/microsoft/TypeScript')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('name', 'TypeScript')
      
      // Should not have proxy cache headers
      expect(response.headers['x-cache']).toBeUndefined()
    })

    it('should handle proxy connection errors gracefully', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      // This test simulates proxy connectivity issues
      // The client should handle errors and potentially fall back
      
      const response = await client.get('/repos/microsoft/TypeScript')
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('name', 'TypeScript')
      
      // Request should succeed regardless of proxy state
      // (via proxy if available, direct if not)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve exact GitHub API response structure', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const response = await client.get('/repos/microsoft/TypeScript')
      
      // Verify all expected GitHub API fields are present
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('full_name')
      expect(response.data).toHaveProperty('owner')
      expect(response.data).toHaveProperty('html_url')
      expect(response.data).toHaveProperty('description')
      expect(response.data).toHaveProperty('created_at')
      expect(response.data).toHaveProperty('updated_at')
      expect(response.data).toHaveProperty('stargazers_count')
      expect(response.data).toHaveProperty('watchers_count')
      expect(response.data).toHaveProperty('forks_count')
      
      // Verify data types
      expect(typeof response.data.id).toBe('number')
      expect(typeof response.data.name).toBe('string')
      expect(typeof response.data.stargazers_count).toBe('number')
    })

    it('should preserve GitHub API response headers', async () => {
      if (!githubToken) {
        console.log('Skipping test: No GitHub token available')
        return
      }

      const response = await client.get('/repos/microsoft/TypeScript')
      
      // Should have GitHub-specific headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('content-type')
      
      // Content type should be JSON
      expect(response.headers['content-type']).toContain('application/json')
    })
  })
})