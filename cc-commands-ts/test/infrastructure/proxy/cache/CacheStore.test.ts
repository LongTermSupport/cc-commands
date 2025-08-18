/**
 * @file Tests for CacheStore
 */

import { beforeEach, describe, expect, it } from 'vitest'

import type { CacheConfig } from '../../../../src/infrastructure/proxy/config/ProxyConfig.js'

import { type CacheEntry, CacheStore } from '../../../../src/infrastructure/proxy/cache/CacheStore.js'

describe('CacheStore', () => {
  let cacheStore: CacheStore
  let config: CacheConfig

  beforeEach(() => {
    config = {
      compressionEnabled: false,
      defaultTtlSeconds: 300,
      domains: {
        'api.github.com': {
          conditional: true,
          ttlSeconds: 600
        },
        'example.com': {
          conditional: false,
          ttlSeconds: 120
        }
      },
      etagSupport: true,
      maxSizeBytes: 1024 * 1024 // 1MB
    }
    
    cacheStore = new CacheStore(config)
  })

  describe('basic cache operations', () => {
    it('should store and retrieve cache entries', () => {
      const entry: CacheEntry = {
        data: 'test response',
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)
      const retrieved = cacheStore.get('https://api.github.com/test')

      expect(retrieved).toBeDefined()
      expect(retrieved!.data).toBe('test response')
      expect(retrieved!.statusCode).toBe(200)
    })

    it('should return undefined for cache miss', () => {
      const result = cacheStore.get('https://nonexistent.com/test')
      expect(result).toBeUndefined()
    })

    it('should invalidate specific entries', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)
      expect(cacheStore.get('https://api.github.com/test')).toBeDefined()

      cacheStore.invalidate('https://api.github.com/test')
      expect(cacheStore.get('https://api.github.com/test')).toBeUndefined()
    })

    it('should clear entire cache', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test1', entry)
      cacheStore.set('https://api.github.com/test2', entry)

      expect(cacheStore.get('https://api.github.com/test1')).toBeDefined()
      expect(cacheStore.get('https://api.github.com/test2')).toBeDefined()

      cacheStore.clear()

      expect(cacheStore.get('https://api.github.com/test1')).toBeUndefined()
      expect(cacheStore.get('https://api.github.com/test2')).toBeUndefined()
    })
  })

  describe('conditional requests (ETag/Last-Modified)', () => {
    it('should handle ETag-based conditional requests', () => {
      const entry: CacheEntry = {
        data: 'cached response',
        etag: '"123456"',
        headers: { 'etag': '"123456"' },
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)

      // Request with matching ETag should return 304
      const result = cacheStore.get('https://api.github.com/test', {
        'if-none-match': '"123456"'
      })

      expect(result).toBeDefined()
      expect(result!.statusCode).toBe(304)
      expect(result!.data).toBe('') // No body for 304
    })

    it('should handle Last-Modified-based conditional requests', () => {
      const lastModified = 'Wed, 21 Oct 2015 07:28:00 GMT'
      const entry: CacheEntry = {
        data: 'cached response',
        headers: { 'last-modified': lastModified },
        lastModified,
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)

      // Request with If-Modified-Since equal to Last-Modified should return 304
      const result = cacheStore.get('https://api.github.com/test', {
        'if-modified-since': lastModified
      })

      expect(result).toBeDefined()
      expect(result!.statusCode).toBe(304)
    })

    it('should return full response when ETag does not match', () => {
      const entry: CacheEntry = {
        data: 'cached response',
        etag: '"123456"',
        headers: { 'etag': '"123456"' },
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)

      // Request with different ETag should return full response
      const result = cacheStore.get('https://api.github.com/test', {
        'if-none-match': '"different"'
      })

      expect(result).toBeDefined()
      expect(result!.statusCode).toBe(200)
      expect(result!.data).toBe('cached response')
    })
  })

  describe('domain-specific configuration', () => {
    it('should apply domain-specific TTL', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 0 // Will be overridden
      }

      // Set with domain config
      cacheStore.set('https://api.github.com/test', entry, config.domains['api.github.com'])
      const retrieved = cacheStore.get('https://api.github.com/test')

      expect(retrieved).toBeDefined()
      expect(retrieved!.ttl).toBe(600) // Domain-specific TTL
    })

    it('should use default TTL when no domain config provided', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 0 // Will be overridden
      }

      cacheStore.set('https://unknown.com/test', entry)
      const retrieved = cacheStore.get('https://unknown.com/test')

      expect(retrieved).toBeDefined()
      expect(retrieved!.ttl).toBe(300) // Default TTL
    })
  })

  describe('conditional headers generation', () => {
    it('should generate conditional headers for cached entries', () => {
      const entry: CacheEntry = {
        data: 'test',
        etag: '"123456"',
        headers: {},
        lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/test', entry)
      const headers = cacheStore.getConditionalHeaders('https://api.github.com/test')

      expect(headers['If-None-Match']).toBe('"123456"')
      expect(headers['If-Modified-Since']).toBe('Wed, 21 Oct 2015 07:28:00 GMT')
    })

    it('should return empty headers for uncached entries', () => {
      const headers = cacheStore.getConditionalHeaders('https://uncached.com/test')
      expect(Object.keys(headers)).toHaveLength(0)
    })

    it('should return empty headers when ETag support disabled', () => {
      const configWithoutEtag = { ...config, etagSupport: false }
      const store = new CacheStore(configWithoutEtag)

      const headers = store.getConditionalHeaders('https://api.github.com/test')
      expect(Object.keys(headers)).toHaveLength(0)
    })
  })

  describe('statistics and health', () => {
    it('should track cache statistics', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      // Initial stats
      let stats = cacheStore.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)

      // Cache miss
      cacheStore.get('https://api.github.com/test')
      stats = cacheStore.getStats()
      expect(stats.misses).toBe(1)

      // Cache set and hit
      cacheStore.set('https://api.github.com/test', entry)
      cacheStore.get('https://api.github.com/test')
      stats = cacheStore.getStats()
      expect(stats.hits).toBe(1)
    })

    it('should provide health check status', () => {
      const health = cacheStore.healthCheck()
      expect(health.healthy).toBe(true)
      expect(Array.isArray(health.issues)).toBe(true)
    })

    it('should report configuration', () => {
      const reportedConfig = cacheStore.getConfig()
      expect(reportedConfig).toEqual(config)
    })
  })

  describe('request deduplication', () => {
    it('should deduplicate concurrent requests', async () => {
      let requestCount = 0
      const mockRequest = async () => {
        requestCount++
        return {
          data: `response-${requestCount}`,
          headers: {},
          statusCode: 200,
          timestamp: Date.now(),
          ttl: 300
        } as CacheEntry
      }

      // Start multiple concurrent requests
      const promises = [
        cacheStore.deduplicateRequest('https://api.github.com/test', mockRequest),
        cacheStore.deduplicateRequest('https://api.github.com/test', mockRequest),
        cacheStore.deduplicateRequest('https://api.github.com/test', mockRequest)
      ]

      const results = await Promise.all(promises)

      // Should have made only one actual request
      expect(requestCount).toBe(1)
      
      // All results should be identical
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])
      expect(results[0].data).toBe('response-1')
    })

    it('should handle errors in deduplicated requests', async () => {
      const mockRequest = async () => {
        throw new Error('Request failed')
      }

      const promises = [
        cacheStore.deduplicateRequest('https://api.github.com/test', mockRequest),
        cacheStore.deduplicateRequest('https://api.github.com/test', mockRequest)
      ]

      // Both should reject with the same error
      await expect(Promise.all(promises)).rejects.toThrow('Request failed')
    })
  })

  describe('cache key generation', () => {
    it('should generate consistent keys for same URL', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/repos/owner/repo', entry)
      const retrieved1 = cacheStore.get('https://api.github.com/repos/owner/repo')
      const retrieved2 = cacheStore.get('https://api.github.com/repos/owner/repo')

      expect(retrieved1).toBeDefined()
      expect(retrieved2).toBeDefined()
      expect(retrieved1).toEqual(retrieved2)
    })

    it('should handle URLs with query parameters', () => {
      const entry: CacheEntry = {
        data: 'test',
        headers: {},
        statusCode: 200,
        timestamp: Date.now(),
        ttl: 300
      }

      cacheStore.set('https://api.github.com/repos/owner/repo?page=1&per_page=10', entry)
      const retrieved = cacheStore.get('https://api.github.com/repos/owner/repo?page=1&per_page=10')

      expect(retrieved).toBeDefined()
      expect(retrieved!.data).toBe('test')
    })
  })
})