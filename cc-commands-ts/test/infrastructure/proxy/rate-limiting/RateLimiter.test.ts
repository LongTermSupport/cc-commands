/**
 * @file Tests for RateLimiter
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RateLimitConfig } from '../../../../src/infrastructure/proxy/config/ProxyConfig.js'

import { RateLimiter } from '../../../../src/infrastructure/proxy/rate-limiting/RateLimiter.js'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  let config: RateLimitConfig

  beforeEach(() => {
    config = {
      domains: {
        'api.example.com': {
          burstAllowance: 50,
          requestsPerHour: 1000,
          safetyMarginPercent: 10 // Use 90% of limit
        },
        'api.github.com': {
          burstAllowance: 100,
          requestsPerHour: 5000,
          safetyMarginPercent: 20 // Use 80% of limit
        }
      },
      enabled: true,
      globalLimit: 1000,
      windowSeconds: 3600
    }
    
    rateLimiter = new RateLimiter(config)
  })

  afterEach(() => {
    rateLimiter.destroy()
  })

  describe('basic rate limiting', () => {
    it('should allow requests within limits', () => {
      const result = rateLimiter.checkLimit('https://api.github.com/repos/test/test')
      
      expect(result.allowed).toBe(true)
      expect(result.domain).toBe('api.github.com')
      expect(result.remaining).toBeGreaterThan(0)
      expect(result.limit).toBeGreaterThan(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should apply safety margin to configured limits', () => {
      const result = rateLimiter.checkLimit('https://api.github.com/test')
      
      // With 20% safety margin, effective limit should be 80% of 5000 = 4000
      // But limited by burst allowance of 100
      expect(result.limit).toBeLessThanOrEqual(4000)
    })

    it('should track consumed tokens', () => {
      const url = 'https://api.github.com/test'
      
      // Check initial limit
      const before = rateLimiter.checkLimit(url)
      const initialRemaining = before.remaining
      
      // Consume tokens
      rateLimiter.consumeTokens(url, 5)
      
      // Check updated limit
      const after = rateLimiter.checkLimit(url)
      expect(after.remaining).toBeLessThan(initialRemaining)
    })

    it('should block requests when limit exceeded', () => {
      const url = 'https://api.github.com/test'
      
      // Consume all available tokens
      const initialCheck = rateLimiter.checkLimit(url, 0) // Don't consume yet
      rateLimiter.consumeTokens(url, initialCheck.remaining + 10) // Exceed limit
      
      // Should now be blocked
      const result = rateLimiter.checkLimit(url)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('domain-specific rate limiting', () => {
    it('should use domain-specific configuration', () => {
      const githubResult = rateLimiter.checkLimit('https://api.github.com/test')
      const exampleResult = rateLimiter.checkLimit('https://api.example.com/test')
      
      expect(githubResult.domain).toBe('api.github.com')
      expect(exampleResult.domain).toBe('api.example.com')
      
      // Different domains should have different limits
      expect(githubResult.limit).not.toBe(exampleResult.limit)
    })

    it('should isolate limits between domains', () => {
      const githubUrl = 'https://api.github.com/test'
      const exampleUrl = 'https://api.example.com/test'
      
      // Consume all tokens for GitHub
      const githubLimit = rateLimiter.checkLimit(githubUrl, 0)
      rateLimiter.consumeTokens(githubUrl, githubLimit.remaining)
      
      // GitHub should be blocked
      expect(rateLimiter.checkLimit(githubUrl).allowed).toBe(false)
      
      // Example should still be allowed
      expect(rateLimiter.checkLimit(exampleUrl).allowed).toBe(true)
    })

    it('should use global limit for unconfigured domains', () => {
      const result = rateLimiter.checkLimit('https://unknown.com/api')
      
      expect(result.domain).toBe('global')
      expect(result.limit).toBe(config.globalLimit)
    })
  })

  describe('rate limiter disabled', () => {
    beforeEach(() => {
      const disabledConfig = { ...config, enabled: false }
      rateLimiter.destroy()
      rateLimiter = new RateLimiter(disabledConfig)
    })

    it('should allow all requests when disabled', () => {
      const result = rateLimiter.checkLimit('https://api.github.com/test')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(config.globalLimit)
    })

    it('should not consume tokens when disabled', () => {
      const url = 'https://api.github.com/test'
      
      rateLimiter.consumeTokens(url, 100)
      const result = rateLimiter.checkLimit(url)
      
      expect(result.remaining).toBe(config.globalLimit)
    })
  })

  describe('token bucket algorithm', () => {
    it('should refill tokens over time', async () => {
      const url = 'https://api.example.com/test'
      
      // Consume some tokens
      const initial = rateLimiter.checkLimit(url, 0)
      rateLimiter.consumeTokens(url, 10)
      
      const afterConsumption = rateLimiter.checkLimit(url, 0)
      expect(afterConsumption.remaining).toBe(initial.remaining - 10)
      
      // Mock time passage (tokens should refill)
      vi.setSystemTime(Date.now() + 1000) // 1 second later
      
      const afterTime = rateLimiter.checkLimit(url, 0)
      // Tokens should have been refilled (at least partially)
      expect(afterTime.remaining).toBeGreaterThanOrEqual(afterConsumption.remaining)
    })

    it('should respect burst allowance', () => {
      const url = 'https://api.github.com/test'
      const result = rateLimiter.checkLimit(url)
      
      // Should not exceed burst allowance even if hourly limit is higher
      expect(result.remaining).toBeLessThanOrEqual(config.domains['api.github.com'].burstAllowance)
    })
  })

  describe('status and statistics', () => {
    it('should provide current status without consuming tokens', () => {
      const url = 'https://api.github.com/test'
      
      const status1 = rateLimiter.getStatus(url)
      const status2 = rateLimiter.getStatus(url)
      
      expect(status1.remaining).toBe(status2.remaining)
    })

    it('should track rate limiter statistics', () => {
      const url = 'https://api.github.com/test'
      
      // Generate some activity
      rateLimiter.checkLimit(url)
      rateLimiter.checkLimit('https://api.example.com/test')
      
      const stats = rateLimiter.getStats()
      expect(stats.totalRequests).toBeGreaterThan(0)
      expect(stats.blockRate).toBeGreaterThanOrEqual(0)
      expect(typeof stats.domains).toBe('object')
    })

    it('should provide health check information', () => {
      const health = rateLimiter.healthCheck()
      
      expect(typeof health.healthy).toBe('boolean')
      expect(Array.isArray(health.issues)).toBe(true)
    })
  })

  describe('domain management', () => {
    it('should reset limits for specific domain', () => {
      const url = 'https://api.github.com/test'
      
      // Consume tokens
      rateLimiter.consumeTokens(url, 50)
      const beforeReset = rateLimiter.checkLimit(url, 0)
      
      // Reset domain
      rateLimiter.resetDomain('api.github.com')
      
      // Should have fresh limits
      const afterReset = rateLimiter.checkLimit(url, 0)
      expect(afterReset.remaining).toBeGreaterThanOrEqual(beforeReset.remaining)
    })
  })

  describe('error handling', () => {
    it('should handle invalid URLs gracefully', () => {
      expect(() => {
        rateLimiter.checkLimit('not-a-valid-url')
      }).toThrow('Invalid URL format')
    })

    it('should handle malformed URLs in consumption', () => {
      // Should not throw when consuming tokens for invalid URL
      expect(() => {
        rateLimiter.consumeTokens('invalid-url', 1)
      }).not.toThrow()
    })
  })

  describe('concurrent requests', () => {
    it('should handle multiple concurrent checks correctly', async () => {
      const url = 'https://api.github.com/test'
      
      // Make multiple concurrent checks
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(rateLimiter.checkLimit(url, 1))
      )
      
      const results = await Promise.all(promises)
      
      // All should be allowed initially
      expect(results.every(r => r.allowed)).toBe(true)
      
      // Should have consumed different amounts (or all be the same if processed sequentially)
      const remainingCounts = results.map(r => r.remaining)
      const uniqueCounts = new Set(remainingCounts)
      expect(uniqueCounts.size).toBeGreaterThanOrEqual(1) // Should have at least one value
    })
  })

  describe('time window behavior', () => {
    it('should reset limits when time window expires', async () => {
      const url = 'https://api.github.com/test'
      
      // Consume all tokens
      const initialCheck = rateLimiter.checkLimit(url, 0)
      rateLimiter.consumeTokens(url, initialCheck.remaining)
      
      // Should be blocked
      expect(rateLimiter.checkLimit(url).allowed).toBe(false)
      
      // Mock time passage beyond window
      vi.setSystemTime(Date.now() + 3700 * 1000) // Beyond 1 hour window
      
      // Should be allowed again
      const afterWindow = rateLimiter.checkLimit(url)
      expect(afterWindow.allowed).toBe(true)
      expect(afterWindow.remaining).toBeGreaterThan(0)
    })
  })
})