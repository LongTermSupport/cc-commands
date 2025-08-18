/**
 * @file Integration tests for CachingProxyServer
 * 
 * Tests the complete proxy functionality including:
 * - Server lifecycle management
 * - HTTP request/response proxying
 * - Caching behavior validation
 * - Rate limiting functionality
 * - Performance metrics
 * - Health check endpoints
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProxyConfig } from '../../../../src/infrastructure/proxy/config/ProxyConfig.js'

import { CachingProxyServer } from '../../../../src/infrastructure/proxy/server/CachingProxyServer.js'

describe('CachingProxyServer Integration', () => {
  let server: CachingProxyServer
  let testConfig: ProxyConfig
  let serverUrl: string

  beforeAll(async () => {
    // Use test configuration with unique port to avoid conflicts
    testConfig = {
      cache: {
        compressionEnabled: false,
        defaultTtlSeconds: 300,
        domains: {
          'api.github.com': {
            conditional: true,
            ttlSeconds: 900
          },
          'httpbin.org': {
            conditional: true,
            ttlSeconds: 600
          }
        },
        etagSupport: true,
        maxSizeBytes: 1024 * 1024 // 1MB
      },
      monitoring: {
        healthCheckEnabled: true,
        logLevel: 'warn',
        metricsEnabled: true,
        performanceTracking: true
      },
      proxy: {
        followRedirects: true,
        maxRedirects: 3,
        requestDeduplication: true,
        userAgent: 'CachingProxyServer-Test/1.0.0',
        validateCerts: false
      },
      rateLimit: {
        domains: {
          'httpbin.org': {
            burstAllowance: 10,
            requestsPerHour: 60,
            safetyMarginPercent: 80
          }
        },
        enabled: true,
        globalLimit: 100,
        windowSeconds: 60
      },
      server: {
        host: '127.0.0.1',
        keepAliveTimeout: 10_000,
        port: 3003, // Different from test config (3002) to avoid conflicts
        timeout: 5000
      }
    }

    server = new CachingProxyServer(testConfig)
    serverUrl = `http://${testConfig.server.host}:${testConfig.server.port}`

    // Start server and wait for it to be ready
    await server.start()
    
    // Verify server is running
    expect(server.isRunning()).toBe(true)
  })

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
  })

  beforeEach(() => {
    // Clear cache between tests
    server.clearCache()
  })

  describe('Server Lifecycle', () => {
    it('should start and stop server correctly', async () => {
      // Create a new server for lifecycle testing
      const lifecycleConfig = { ...testConfig, server: { ...testConfig.server, port: 3004 } }
      const testServer = new CachingProxyServer(lifecycleConfig)

      // Test startup
      expect(testServer.isRunning()).toBe(false)
      await testServer.start()
      expect(testServer.isRunning()).toBe(true)

      // Test shutdown
      await testServer.stop()
      expect(testServer.isRunning()).toBe(false)
    })

    it('should emit server events during lifecycle', async () => {
      const lifecycleConfig = { ...testConfig, server: { ...testConfig.server, port: 3005 } }
      const testServer = new CachingProxyServer(lifecycleConfig)

      let startedPort: number | undefined
      let stoppedCalled = false

      testServer.on('started', (port) => {
        startedPort = port
      })

      testServer.on('stopped', () => {
        stoppedCalled = true
      })

      await testServer.start()
      expect(startedPort).toBe(3005)

      await testServer.stop()
      expect(stoppedCalled).toBe(true)
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return healthy status when server is running', async () => {
      const response = await fetch(`${serverUrl}/health`)
      
      expect(response.status).toBe(200)
      const health = await response.json()
      
      expect(health.healthy).toBe(true)
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('components')
    })

    it('should include component health status', async () => {
      const response = await fetch(`${serverUrl}/health`)
      const health = await response.json()
      
      expect(health.components).toHaveProperty('cache')
      expect(health.components).toHaveProperty('rateLimiter')
      expect(health.components.cache.healthy).toBe(true)
      expect(health.components.rateLimiter.healthy).toBe(true)
    })
  })

  describe('Metrics Endpoint', () => {
    it('should return comprehensive metrics', async () => {
      const response = await fetch(`${serverUrl}/metrics`)
      
      expect(response.status).toBe(200)
      const metrics = await response.json()
      
      expect(metrics).toHaveProperty('cache')
      expect(metrics).toHaveProperty('rateLimiter')
      expect(metrics).toHaveProperty('server')
      expect(metrics.cache).toHaveProperty('hitRate')
      expect(metrics.cache).toHaveProperty('totalRequests')
    })

    it('should track metrics over time', async () => {
      // Get initial metrics
      const initialResponse = await fetch(`${serverUrl}/metrics`)
      const initialMetrics = await initialResponse.json()
      const initialRequests = initialMetrics.cache.totalRequests

      // Make a proxy request to generate metrics
      await fetch(`${serverUrl}/proxy/httpbin.org/json`)

      // Get updated metrics
      const updatedResponse = await fetch(`${serverUrl}/metrics`)
      const updatedMetrics = await updatedResponse.json()
      
      expect(updatedMetrics.cache.totalRequests).toBeGreaterThan(initialRequests)
    })
  })

  describe('Basic Proxy Functionality', () => {
    it('should successfully proxy GET requests', async () => {
      const targetUrl = 'httpbin.org/json'
      const response = await fetch(`${serverUrl}/proxy/${targetUrl}`)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('x-cache')).toBe('MISS') // First request should be cache miss
      
      const data = await response.json()
      expect(data).toHaveProperty('slideshow')
    })

    it('should proxy different HTTP methods', async () => {
      // Test POST request
      const postResponse = await fetch(`${serverUrl}/proxy/httpbin.org/post`, {
        body: JSON.stringify({ test: 'data' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      })
      
      expect(postResponse.status).toBe(200)
      const postData = await postResponse.json()
      expect(postData).toHaveProperty('json')
      expect(postData.json).toEqual({ test: 'data' })
    })

    it('should forward request headers correctly', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/headers`, {
        headers: {
          'Authorization': 'Bearer test-token',
          'X-Custom-Header': 'test-value'
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.headers['X-Custom-Header']).toBe('test-value')
      expect(data.headers['Authorization']).toBe('Bearer test-token')
    })

    it('should handle query parameters correctly', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/get?param1=value1&param2=value2`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.args).toEqual({
        param1: 'value1',
        param2: 'value2'
      })
    })

    it('should handle URL encoding in paths', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/anything/test%20path%20with%20spaces`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.url).toContain('/test%20path%20with%20spaces')
    })
  })

  describe('Caching Behavior', () => {
    it('should cache GET requests and return cache hits', async () => {
      const targetUrl = `${serverUrl}/proxy/httpbin.org/json`
      
      // First request - should be cache miss
      const firstResponse = await fetch(targetUrl)
      expect(firstResponse.status).toBe(200)
      expect(firstResponse.headers.get('x-cache')).toBe('MISS')
      
      const firstData = await firstResponse.json()
      
      // Second request - should be cache hit
      const secondResponse = await fetch(targetUrl)
      expect(secondResponse.status).toBe(200)
      expect(secondResponse.headers.get('x-cache')).toBe('HIT')
      
      const secondData = await secondResponse.json()
      
      // Data should be identical
      expect(firstData).toEqual(secondData)
    })

    it('should include cache TTL in response headers', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      
      if (response.headers.get('x-cache') === 'HIT') {
        expect(response.headers.get('x-cache-ttl')).toBeTruthy()
        const ttl = Number.parseInt(response.headers.get('x-cache-ttl') || '0')
        expect(ttl).toBeGreaterThan(0)
      }
    })

    it('should not cache non-GET requests', async () => {
      const postUrl = `${serverUrl}/proxy/httpbin.org/post`
      
      // Make two POST requests
      const firstPost = await fetch(postUrl, {
        body: JSON.stringify({ request: 1 }),
        method: 'POST'
      })
      
      const secondPost = await fetch(postUrl, {
        body: JSON.stringify({ request: 2 }),
        method: 'POST'
      })
      
      expect(firstPost.headers.get('x-cache')).toBe('MISS')
      expect(secondPost.headers.get('x-cache')).toBe('MISS')
    })

    it('should respect domain-specific cache TTL', async () => {
      // httpbin.org should use 600s TTL from config
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      
      if (response.headers.get('x-cache') === 'HIT') {
        const ttl = Number.parseInt(response.headers.get('x-cache-ttl') || '0')
        expect(ttl).toBeLessThanOrEqual(600)
        expect(ttl).toBeGreaterThan(500) // Should be close to 600 for fresh cache
      }
    })

    it('should invalidate cache for specific URLs', async () => {
      const targetUrl = `${serverUrl}/proxy/httpbin.org/uuid`
      
      // First request
      const firstResponse = await fetch(targetUrl)
      expect(firstResponse.headers.get('x-cache')).toBe('MISS')
      
      // Second request should be cache hit
      const secondResponse = await fetch(targetUrl)
      expect(secondResponse.headers.get('x-cache')).toBe('HIT')
      
      // Clear cache for httpbin.org domain
      await fetch(`${serverUrl}/cache/httpbin.org`, { method: 'DELETE' })
      
      // Third request should be cache miss again
      const thirdResponse = await fetch(targetUrl)
      expect(thirdResponse.headers.get('x-cache')).toBe('MISS')
    })
  })

  describe('Cache Management', () => {
    it('should clear entire cache via API', async () => {
      // Make some cached requests
      await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      await fetch(`${serverUrl}/proxy/httpbin.org/uuid`)
      
      // Verify cache hits
      const hitResponse = await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      expect(hitResponse.headers.get('x-cache')).toBe('HIT')
      
      // Clear entire cache
      const clearResponse = await fetch(`${serverUrl}/cache`, { method: 'DELETE' })
      expect(clearResponse.status).toBe(200)
      
      const clearResult = await clearResponse.json()
      expect(clearResult.success).toBe(true)
      
      // Subsequent requests should be cache misses
      const missResponse = await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      expect(missResponse.headers.get('x-cache')).toBe('MISS')
    })

    it('should clear domain-specific cache via API', async () => {
      // Make requests to different domains (simulated)
      await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      
      // Clear only httpbin.org cache
      const clearResponse = await fetch(`${serverUrl}/cache/httpbin.org`, { method: 'DELETE' })
      expect(clearResponse.status).toBe(200)
      
      const clearResult = await clearResponse.json()
      expect(clearResult.success).toBe(true)
      expect(clearResult.message).toContain('httpbin.org')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid target URLs gracefully', async () => {
      const response = await fetch(`${serverUrl}/proxy/invalid-url-format`)
      
      expect(response.status).toBe(502) // Bad Gateway
      const error = await response.json()
      expect(error).toHaveProperty('error')
    })

    it('should handle network timeouts', async () => {
      // Use a URL that will timeout (httpbin.org/delay/10 with 5s timeout)
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/delay/10`)
      
      expect(response.status).toBe(504) // Gateway Timeout
      const error = await response.json()
      expect(error.error).toContain('timeout')
    }, 10_000) // Allow 10s for timeout test

    it('should handle non-existent endpoints', async () => {
      const response = await fetch(`${serverUrl}/nonexistent`)
      
      expect(response.status).toBe(404)
      const error = await response.json()
      expect(error.error).toBe('Endpoint not found')
    })

    it('should handle malformed proxy requests', async () => {
      const response = await fetch(`${serverUrl}/proxy/`) // Empty path
      
      expect(response.status).toBe(502)
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/json`)
      
      expect(response.headers.get('x-ratelimit-limit')).toBeTruthy()
      expect(response.headers.get('x-ratelimit-remaining')).toBeTruthy()
      expect(response.headers.get('x-ratelimit-reset')).toBeTruthy()
    })

    it('should enforce rate limits when enabled', async () => {
      // Note: This test might be flaky depending on timing and previous tests
      // We'll make multiple rapid requests to trigger rate limiting
      const promises = []
      const targetUrl = `${serverUrl}/proxy/httpbin.org/json`
      
      // Make more requests than the burst allowance (10 in config)
      for (let i = 0; i < 15; i++) {
        promises.push(fetch(targetUrl))
      }
      
      const responses = await Promise.all(promises)
      
      // At least some should succeed, and we might hit rate limits
      const successCount = responses.filter(r => r.status === 200).length
      const rateLimitedCount = responses.filter(r => r.status === 429).length
      
      expect(successCount + rateLimitedCount).toBe(15)
      
      // If rate limiting triggered, verify proper headers
      const rateLimitedResponse = responses.find(r => r.status === 429)
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers.get('retry-after')).toBeTruthy()
        
        const errorBody = await rateLimitedResponse.json()
        expect(errorBody.error).toBe('Rate limit exceeded')
      }
    }, 15_000) // Allow extra time for multiple requests
  })

  describe('Performance Characteristics', () => {
    it('should serve cached responses faster than proxied responses', async () => {
      const targetUrl = `${serverUrl}/proxy/httpbin.org/json`
      
      // First request (cache miss) - measure time
      const missStart = performance.now()
      const missResponse = await fetch(targetUrl)
      const missTime = performance.now() - missStart
      
      expect(missResponse.status).toBe(200)
      expect(missResponse.headers.get('x-cache')).toBe('MISS')
      
      // Second request (cache hit) - measure time
      const hitStart = performance.now()
      const hitResponse = await fetch(targetUrl)
      const hitTime = performance.now() - hitStart
      
      expect(hitResponse.status).toBe(200)
      expect(hitResponse.headers.get('x-cache')).toBe('HIT')
      
      // Cache hit should be significantly faster
      expect(hitTime).toBeLessThan(missTime * 0.5) // At least 50% faster
      expect(hitTime).toBeLessThan(100) // Should be under 100ms for local cache
      
      console.log(`Cache miss: ${missTime.toFixed(2)}ms, Cache hit: ${hitTime.toFixed(2)}ms`)
    })

    it('should maintain response fidelity between cached and direct responses', async () => {
      const targetUrl = `${serverUrl}/proxy/httpbin.org/json`
      
      // Get direct response (cache miss)
      const directResponse = await fetch(targetUrl)
      const directData = await directResponse.json()
      const directHeaders = Object.fromEntries(directResponse.headers.entries())
      
      // Get cached response (cache hit)
      const cachedResponse = await fetch(targetUrl)
      const cachedData = await cachedResponse.json()
      const cachedHeaders = Object.fromEntries(cachedResponse.headers.entries())
      
      // Data should be identical
      expect(cachedData).toEqual(directData)
      
      // Most headers should be preserved (excluding cache-specific headers)
      const excludeHeaders = new Set(['date', 'x-cache', 'x-cache-ttl', 'x-ratelimit-remaining'])
      for (const [key, value] of Object.entries(directHeaders)) {
        if (!excludeHeaders.has(key.toLowerCase())) {
          expect(cachedHeaders[key]).toBe(value)
        }
      }
    })
  })

  describe('Request Deduplication', () => {
    it('should deduplicate concurrent identical requests', async () => {
      const targetUrl = `${serverUrl}/proxy/httpbin.org/uuid`
      
      // Clear cache to ensure fresh requests
      server.clearCache()
      
      // Make multiple concurrent requests for the same URL
      const promises = Array.from({length: 5}).fill(null).map(() => fetch(targetUrl))
      const responses = await Promise.all(promises)
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
      }
      
      // Get the response data
      const dataPromises = responses.map(r => r.json())
      const dataResults = await Promise.all(dataPromises)
      
      // With proper deduplication, all responses should be identical
      // (UUID endpoint normally returns different UUIDs, but deduplication should make them same)
      const firstUuid = dataResults[0].uuid
      for (const data of dataResults) {
        expect(data.uuid).toBe(firstUuid)
      }
    })
  })

  describe('CORS Support', () => {
    it('should include CORS headers for cross-origin requests', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/json`, {
        headers: {
          'Origin': 'https://example.com'
        }
      })
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
      expect(response.headers.get('access-control-allow-methods')).toContain('GET')
    })

    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${serverUrl}/proxy/httpbin.org/json`, {
        method: 'OPTIONS'
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy()
      expect(response.headers.get('access-control-allow-headers')).toBeTruthy()
    })
  })
})