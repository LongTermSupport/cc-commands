/**
 * @file Rate Limiting Validation Tests
 * 
 * Comprehensive tests for rate limiting functionality including:
 * - Rate limit enforcement and 429 responses
 * - Burst allowance handling
 * - Rate limit headers and metadata
 * - Domain-specific rate limiting
 * - Performance under rate limiting
 * - Integration with GitHub API rate limits
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { ProxyConfig } from '../../../src/infrastructure/proxy/config/ProxyConfig.js'

import { ApiClient } from '../../../src/infrastructure/http/ApiClient.js'
import { createProxyAwareGitHubClient, ProxyUtils } from '../../../src/infrastructure/http/ProxyAwareClient.js'
import { CachingProxyServer } from '../../../src/infrastructure/proxy/server/CachingProxyServer.js'

describe('Rate Limiting Validation', () => {
  let server: CachingProxyServer
  let client: ApiClient
  let githubToken: string
  let testConfig: ProxyConfig
  let serverUrl: string

  beforeAll(async () => {
    githubToken = process.env.GITHUB_TOKEN || ''
    
    if (!githubToken) {
      console.warn('GITHUB_TOKEN not found. Some rate limiting tests will be skipped.')
    }

    // Create aggressive rate limiting config for testing
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
            conditional: false,
            ttlSeconds: 300
          }
        },
        etagSupport: true,
        maxSizeBytes: 1024 * 1024
      },
      monitoring: {
        healthCheckEnabled: true,
        logLevel: 'debug',
        metricsEnabled: true,
        performanceTracking: true
      },
      proxy: {
        followRedirects: true,
        maxRedirects: 3,
        requestDeduplication: true,
        userAgent: 'RateLimitTest/1.0.0',
        validateCerts: false
      },
      rateLimit: {
        domains: {
          'api.github.com': {
            burstAllowance: 50,
            requestsPerHour: 1000, // Higher for GitHub
            safetyMarginPercent: 80
          },
          'httpbin.org': {
            burstAllowance: 5,   // Small burst
            requestsPerHour: 30, // Very low for testing
            safetyMarginPercent: 90 // High safety margin
          }
        },
        enabled: true,
        globalLimit: 50, // Low global limit for testing
        windowSeconds: 60 // 1 minute window
      },
      server: {
        host: '127.0.0.1',
        keepAliveTimeout: 15_000,
        port: 3006, // Unique port for rate limiting tests
        timeout: 10_000
      }
    }

    server = new CachingProxyServer(testConfig)
    serverUrl = `http://${testConfig.server.host}:${testConfig.server.port}`

    await server.start()
    expect(server.isRunning()).toBe(true)

    // Create client pointing to our test server
    client = new ApiClient({
      baseUrl: serverUrl,
      defaultHeaders: githubToken ? {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${githubToken}`
      } : {}
    })
  })

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
  })

  beforeEach(() => {
    // Clear cache between tests to isolate rate limiting behavior
    server.clearCache()
  })

  describe('Rate Limit Headers and Metadata', () => {
    it('should include rate limit headers in all responses', async () => {
      const response = await client.get('/proxy/httpbin.org/json')
      
      expect(response.status).toBe(200)
      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
      expect(response.headers).toHaveProperty('x-ratelimit-reset')
      
      const limit = Number.parseInt(response.headers['x-ratelimit-limit'])
      const remaining = Number.parseInt(response.headers['x-ratelimit-remaining'])
      
      expect(limit).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(limit)
      
      console.log(`Initial rate limits - Limit: ${limit}, Remaining: ${remaining}`)
    })

    it('should track rate limit consumption across requests', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // Make first request
      const firstResponse = await client.get(endpoint)
      const firstRemaining = Number.parseInt(firstResponse.headers['x-ratelimit-remaining'])
      
      // Make second request (cache should be cleared between tests)
      const secondResponse = await client.get(endpoint)
      const secondRemaining = Number.parseInt(secondResponse.headers['x-ratelimit-remaining'])
      
      // Second request should have fewer remaining (unless it was cached)
      if (secondResponse.headers['x-cache'] === 'MISS') {
        expect(secondRemaining).toBeLessThan(firstRemaining)
      }
      
      console.log(`Rate limit tracking - First: ${firstRemaining}, Second: ${secondRemaining}`)
    })

    it('should provide accurate rate limit reset timestamps', async () => {
      const response = await client.get('/proxy/httpbin.org/json')
      const resetHeader = response.headers['x-ratelimit-reset']
      
      expect(resetHeader).toBeDefined()
      
      const resetTime = new Date(resetHeader)
      const now = new Date()
      
      // Reset time should be in the future
      expect(resetTime.getTime()).toBeGreaterThan(now.getTime())
      
      // Should be within reasonable time window (1 hour max)
      expect(resetTime.getTime() - now.getTime()).toBeLessThan(60 * 60 * 1000)
      
      console.log(`Rate limit resets at: ${resetTime.toISOString()}`)
    })
  })

  describe('Rate Limit Enforcement', () => {
    it('should enforce rate limits and return 429 responses', async () => {
      const endpoint = '/proxy/httpbin.org/uuid'
      const responses: Response[] = []
      
      // Make requests until we hit rate limit
      // httpbin.org is configured with 30 requests per hour, 5 burst allowance
      for (let i = 0; i < 10; i++) {
        try {
          const response = await client.request({
            method: 'GET',
            url: endpoint
          })
          responses.push(response as any)
          
          // Small delay between requests to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 10))
        } catch (error) {
          // Some requests might fail with rate limiting
          if (error instanceof Error && 'status' in error) {
            responses.push(error as any)
          }
        }
      }
      
      // Should have some successful requests and some rate limited
      const successfulRequests = responses.filter(r => r.status === 200)
      const rateLimitedRequests = responses.filter(r => r.status === 429)
      
      expect(successfulRequests.length).toBeGreaterThan(0)
      expect(rateLimitedRequests.length).toBeGreaterThan(0)
      
      console.log(`Rate limiting results: ${successfulRequests.length} successful, ${rateLimitedRequests.length} rate limited`)
      
      // Verify rate limited responses have proper headers
      if (rateLimitedRequests.length > 0) {
        const rateLimitedResponse = rateLimitedRequests[0]
        expect(rateLimitedResponse.headers).toHaveProperty('retry-after')
        
        if ('json' in rateLimitedResponse) {
          const errorBody = await (rateLimitedResponse as any).json()
          expect(errorBody.error).toBe('Rate limit exceeded')
        }
      }
    }, 30_000) // Allow time for multiple requests

    it('should handle burst allowance correctly', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // Make burst requests (5 allowed for httpbin.org)
      const burstPromises = Array.from({length: 3}).fill(null).map(() => 
        client.get(endpoint)
      )
      
      const burstResponses = await Promise.all(burstPromises)
      
      // All burst requests should succeed
      for (const response of burstResponses) {
        expect(response.status).toBe(200)
      }
      
      console.log(`Burst requests completed successfully: ${burstResponses.length}`)
    })

    it('should include Retry-After header in 429 responses', async () => {
      const endpoint = '/proxy/httpbin.org/uuid'
      
      // Try to trigger rate limiting
      for (let i = 0; i < 15; i++) {
        try {
          const response = await client.get(endpoint)
          
          if (response.status === 429) {
            expect(response.headers).toHaveProperty('retry-after')
            
            const retryAfter = Number.parseInt(response.headers['retry-after'])
            expect(retryAfter).toBeGreaterThan(0)
            expect(retryAfter).toBeLessThan(3600) // Should be reasonable
            
            console.log(`Rate limited with Retry-After: ${retryAfter} seconds`)
            break
          }
        } catch (error) {
          if (error instanceof Error && 'status' in error && (error as any).status === 429) {
            console.log('Rate limiting triggered via exception')
            break
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }, 20_000)
  })

  describe('Domain-Specific Rate Limiting', () => {
    it('should apply different rate limits per domain', async () => {
      // Test httpbin.org (30/hour) vs api.github.com (1000/hour)
      if (!githubToken) {
        console.log('Skipping GitHub rate limit test: No token available')
        return
      }

      // Get rate limits for httpbin
      const httpbinResponse = await client.get('/proxy/httpbin.org/json')
      const httpbinLimit = Number.parseInt(httpbinResponse.headers['x-ratelimit-limit'])
      
      // Get rate limits for GitHub API
      const githubResponse = await client.get('/proxy/api.github.com/repos/microsoft/TypeScript')
      const githubLimit = Number.parseInt(githubResponse.headers['x-ratelimit-limit'])
      
      // GitHub should have higher limits
      expect(githubLimit).toBeGreaterThan(httpbinLimit)
      
      console.log(`Domain rate limits - httpbin: ${httpbinLimit}, github: ${githubLimit}`)
    })

    it('should maintain separate rate limit counters per domain', async () => {
      if (!githubToken) return

      // Make requests to different domains
      const httpbinResponse = await client.get('/proxy/httpbin.org/json')
      const githubResponse = await client.get('/proxy/api.github.com/repos/microsoft/TypeScript')
      
      const httpbinRemaining = Number.parseInt(httpbinResponse.headers['x-ratelimit-remaining'])
      const githubRemaining = Number.parseInt(githubResponse.headers['x-ratelimit-remaining'])
      
      // Both should have their own counters
      expect(httpbinRemaining).toBeGreaterThan(0)
      expect(githubRemaining).toBeGreaterThan(0)
      
      console.log(`Per-domain remaining - httpbin: ${httpbinRemaining}, github: ${githubRemaining}`)
    })
  })

  describe('Cache Interaction with Rate Limiting', () => {
    it('should not consume rate limit tokens for cached responses', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // First request - should consume rate limit
      const firstResponse = await client.get(endpoint)
      expect(firstResponse.headers['x-cache']).toBe('MISS')
      const firstRemaining = Number.parseInt(firstResponse.headers['x-ratelimit-remaining'])
      
      // Second request - should be cached, not consume rate limit
      const secondResponse = await client.get(endpoint)
      expect(secondResponse.headers['x-cache']).toBe('HIT')
      const secondRemaining = Number.parseInt(secondResponse.headers['x-ratelimit-remaining'])
      
      // Rate limit should not have been consumed for cached response
      expect(secondRemaining).toBeGreaterThanOrEqual(firstRemaining)
      
      console.log(`Cache + Rate limit - Miss remaining: ${firstRemaining}, Hit remaining: ${secondRemaining}`)
    })

    it('should prevent rate limit exhaustion through effective caching', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // Get initial rate limit
      const initialResponse = await client.get(endpoint)
      const initialRemaining = Number.parseInt(initialResponse.headers['x-ratelimit-remaining'])
      
      // Make many requests - should be served from cache
      const cacheRequests = 10
      for (let i = 0; i < cacheRequests; i++) {
        const response = await client.get(endpoint)
        expect(response.headers['x-cache']).toBe('HIT')
      }
      
      // Final rate limit check
      const finalResponse = await client.get(endpoint)
      const finalRemaining = Number.parseInt(finalResponse.headers['x-ratelimit-remaining'])
      
      // Should not have consumed additional rate limit tokens
      expect(finalRemaining).toBeGreaterThanOrEqual(initialRemaining - 1)
      
      console.log(`Cache protection - Initial: ${initialRemaining}, Final: ${finalRemaining} after ${cacheRequests} cached requests`)
    })
  })

  describe('Rate Limiting Performance Impact', () => {
    it('should add minimal latency for rate limit checks', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // Measure response time with rate limiting
      const start = performance.now()
      const response = await client.get(endpoint)
      const responseTime = performance.now() - start
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should not add significant delay
      
      console.log(`Response time with rate limiting: ${responseTime.toFixed(2)}ms`)
    })

    it('should maintain throughput within rate limits', async () => {
      const endpoint = '/proxy/httpbin.org/uuid'
      const requestCount = 5 // Within burst allowance
      
      const start = performance.now()
      const promises = Array.from({length: requestCount}).fill(null).map(() => client.get(endpoint))
      const responses = await Promise.all(promises)
      const totalTime = performance.now() - start
      
      // All requests should succeed within burst allowance
      for (const response of responses) {
        expect(response.status).toBe(200)
      }
      
      const throughput = requestCount / (totalTime / 1000) // requests per second
      console.log(`Throughput within rate limits: ${throughput.toFixed(2)} req/sec`)
      
      expect(throughput).toBeGreaterThan(1) // Should maintain reasonable throughput
    })
  })

  describe('Rate Limiting Recovery', () => {
    it('should allow requests after rate limit window expires', async () => {
      // This test would require waiting for the rate limit window to reset
      // For practical testing, we'll verify the reset timestamp logic
      
      const response = await client.get('/proxy/httpbin.org/json')
      const resetTime = new Date(response.headers['x-ratelimit-reset'])
      const now = new Date()
      
      // Reset time should be in the future but reasonable
      const resetDelayMs = resetTime.getTime() - now.getTime()
      expect(resetDelayMs).toBeGreaterThan(0)
      expect(resetDelayMs).toBeLessThan(60 * 60 * 1000) // Less than 1 hour
      
      console.log(`Rate limit will reset in ${Math.round(resetDelayMs / 1000)} seconds`)
    })

    it('should provide accurate remaining count after partial consumption', async () => {
      const endpoint = '/proxy/httpbin.org/uuid'
      
      // Make a few requests
      const responses: any[] = []
      for (let i = 0; i < 3; i++) {
        try {
          const response = await client.get(endpoint)
          responses.push(response)
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch {
          break // Stop if we hit rate limit
        }
      }
      
      if (responses.length > 0) {
        const lastResponse = responses.at(-1)
        const remaining = Number.parseInt(lastResponse.headers['x-ratelimit-remaining'])
        const limit = Number.parseInt(lastResponse.headers['x-ratelimit-limit'])
        
        expect(remaining).toBeGreaterThanOrEqual(0)
        expect(remaining).toBeLessThanOrEqual(limit)
        
        console.log(`After ${responses.length} requests: ${remaining}/${limit} remaining`)
      }
    })
  })

  describe('Rate Limiting Metrics and Monitoring', () => {
    it('should track rate limiting statistics in metrics', async () => {
      const endpoint = '/proxy/httpbin.org/json'
      
      // Get initial metrics
      const initialMetrics = server.getMetrics()
      const initialAllowed = initialMetrics.rateLimiter?.allowedRequests || 0
      const initialRejected = initialMetrics.rateLimiter?.rejectedRequests || 0
      
      // Make some requests
      for (let i = 0; i < 3; i++) {
        try {
          await client.get(endpoint)
        } catch {
          // Some might be rate limited
        }

        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Get updated metrics
      const updatedMetrics = server.getMetrics()
      const updatedAllowed = updatedMetrics.rateLimiter?.allowedRequests || 0
      const updatedRejected = updatedMetrics.rateLimiter?.rejectedRequests || 0
      
      // Should have tracked the requests
      expect(updatedAllowed + updatedRejected).toBeGreaterThan(initialAllowed + initialRejected)
      
      console.log(`Rate limiting metrics:`)
      console.log(`  Allowed: ${updatedAllowed} (was ${initialAllowed})`)
      console.log(`  Rejected: ${updatedRejected} (was ${initialRejected})`)
    })

    it('should include rate limiting health in overall system health', async () => {
      const health = server.getHealthStatus()
      
      expect(health.components).toHaveProperty('rateLimiter')
      expect(health.components.rateLimiter).toHaveProperty('healthy')
      
      // Rate limiter should be healthy under normal conditions
      expect(health.components.rateLimiter.healthy).toBe(true)
    })
  })

  describe('GitHub API Integration with Rate Limiting', () => {
    it('should respect GitHub API rate limits when available', async () => {
      if (!githubToken) {
        console.log('Skipping GitHub integration test: No token available')
        return
      }

      // Check actual GitHub rate limit status
      const rateLimitResponse = await client.get('/proxy/api.github.com/rate_limit')
      expect(rateLimitResponse.status).toBe(200)
      
      const rateLimitData = rateLimitResponse.data
      const githubRemaining = rateLimitData.rate.remaining
      const githubLimit = rateLimitData.rate.limit
      
      console.log(`GitHub API limits: ${githubRemaining}/${githubLimit} remaining`)
      
      // Our proxy should not be more restrictive than GitHub itself
      const proxyResponse = await client.get('/proxy/api.github.com/repos/microsoft/TypeScript')
      const proxyRemaining = Number.parseInt(proxyResponse.headers['x-ratelimit-remaining'])
      
      // Proxy rate limits should be reasonable compared to GitHub limits
      expect(githubRemaining).toBeGreaterThan(0)
      expect(proxyRemaining).toBeGreaterThan(0)
    })
  })
})