/**
 * @file Advanced Caching System
 * 
 * Production-grade cache store with LRU eviction, ETag support, conditional requests,
 * and request deduplication for concurrent requests.
 */

import { LRUCache } from 'lru-cache'

import type { CacheConfig, DomainConfig } from '../config/ProxyConfig.js'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  /** Content encoding */
  contentEncoding?: string
  /** Response body */
  data: Buffer | string
  /** ETag from response */
  etag?: string
  /** Response headers */
  headers: Record<string, string>
  /** Last-Modified from response */
  lastModified?: string
  /** Original response status code */
  statusCode: number
  /** Cache timestamp */
  timestamp: number
  /** Time to live in seconds */
  ttl: number
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of evictions */
  evictions: number
  /** Number of expired entries removed */
  expired: number
  /** Cache hit ratio (0-1) */
  hitRatio: number
  /** Total cache hits */
  hits: number
  /** Memory usage in bytes */
  memoryUsage: number
  /** Total cache misses */
  misses: number
  /** Total entries in cache */
  size: number
}

/**
 * Cache key generation options
 */
interface CacheKeyOptions {
  /** Additional key components */
  additionalComponents?: string[]
  /** Include query parameters in key */
  includeQuery?: boolean
}

/**
 * In-flight request tracking for deduplication
 */
interface InFlightRequest {
  /** Promise for the ongoing request */
  promise: Promise<CacheEntry>
  /** Timestamp when request started */
  timestamp: number
}

/**
 * Production-grade cache store with advanced features
 */
export class CacheStore {
  private readonly cache: LRUCache<string, CacheEntry>
  private readonly config: CacheConfig
  private readonly inFlightRequests = new Map<string, InFlightRequest>()
  private stats: CacheStats

  constructor(config: CacheConfig) {
    this.config = config

    // Initialize LRU cache with size limits
    this.cache = new LRUCache({
      allowStale: false,
      dispose: () => {
        this.stats.evictions++
      },
      max: this.calculateMaxEntries(config.maxSizeBytes),
      maxSize: config.maxSizeBytes,
      // Calculate size based on entry data size
      sizeCalculation(entry: CacheEntry) {
        const dataSize = Buffer.isBuffer(entry.data) 
          ? entry.data.length 
          : Buffer.byteLength(entry.data, 'utf8')
        const headersSize = JSON.stringify(entry.headers).length
        return dataSize + headersSize + 200 // Account for metadata overhead
      },
      ttl: config.defaultTtlSeconds * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      updateAgeOnHas: true
    })

    // Initialize statistics
    this.stats = {
      evictions: 0,
      expired: 0,
      hitRatio: 0,
      hits: 0,
      memoryUsage: 0,
      misses: 0,
      size: 0
    }

    // Set up periodic cleanup
    this.setupPeriodicCleanup()
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
    this.inFlightRequests.clear()
    this.stats = {
      evictions: this.stats.evictions, // Keep eviction count
      expired: this.stats.expired, // Keep expiration count
      hitRatio: 0,
      hits: 0,
      memoryUsage: 0,
      misses: 0,
      size: 0
    }
  }

  /**
   * Handle request deduplication for concurrent requests
   * 
   * @param url - Request URL
   * @param requestFn - Function that performs the actual request
   * @returns Promise resolving to cache entry
   */
  async deduplicateRequest<T extends CacheEntry>(
    url: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.generateCacheKey(url)
    
    // Check if request is already in flight
    const inFlight = this.inFlightRequests.get(key)
    if (inFlight) {
      // Clean up expired in-flight requests (older than 5 minutes)
      if (Date.now() - inFlight.timestamp > 5 * 60 * 1000) {
        this.inFlightRequests.delete(key)
      } else {
        return inFlight.promise as Promise<T>
      }
    }

    // Start new request
    const promise = requestFn()
    this.inFlightRequests.set(key, {
      promise: promise as Promise<CacheEntry>,
      timestamp: Date.now()
    })

    try {
      const result = await promise
      this.inFlightRequests.delete(key)
      return result
    } catch (error) {
      this.inFlightRequests.delete(key)
      throw error
    }
  }

  /**
   * Get cached entry if available and valid
   * 
   * @param url - Request URL
   * @param headers - Request headers for conditional requests
   * @returns Cached entry or undefined
   */
  get(url: string, headers: Record<string, string> = {}): CacheEntry | undefined {
    const key = this.generateCacheKey(url)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateStats()
      return undefined
    }

    // Check if entry supports conditional requests
    if (this.config.etagSupport && entry.etag && headers['if-none-match'] && // If ETag matches, content hasn't changed
      headers['if-none-match'] === entry.etag) {
        this.stats.hits++
        this.updateStats()
        return {
          ...entry,
          data: '', // No body for 304 responses
          statusCode: 304 // Not Modified
        }
      }

    if (this.config.etagSupport && entry.lastModified && headers['if-modified-since']) {
      const ifModifiedSince = new Date(headers['if-modified-since'])
      const lastModified = new Date(entry.lastModified)
      
      if (ifModifiedSince >= lastModified) {
        this.stats.hits++
        this.updateStats()
        return {
          ...entry,
          data: '', // No body for 304 responses
          statusCode: 304 // Not Modified
        }
      }
    }

    this.stats.hits++
    this.updateStats()
    return entry
  }

  /**
   * Check if URL should use conditional requests
   * 
   * @param url - Request URL
   * @returns Headers for conditional request
   */
  getConditionalHeaders(url: string): Record<string, string> {
    if (!this.config.etagSupport) {
      return {}
    }

    const key = this.generateCacheKey(url)
    const entry = this.cache.peek(key) // Don't update access time
    
    if (!entry) {
      return {}
    }

    const headers: Record<string, string> = {}
    
    if (entry.etag) {
      headers['If-None-Match'] = entry.etag
    }
    
    if (entry.lastModified) {
      headers['If-Modified-Since'] = entry.lastModified
    }

    return headers
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Health check for cache
   */
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []
    
    if (this.stats.memoryUsage > this.config.maxSizeBytes * 0.9) {
      issues.push('Cache approaching memory limit')
    }
    
    if (this.stats.hitRatio < 0.1 && this.stats.hits + this.stats.misses > 100) {
      issues.push('Very low cache hit ratio')
    }

    if (this.inFlightRequests.size > 100) {
      issues.push('Too many in-flight requests')
    }

    return {
      healthy: issues.length === 0,
      issues
    }
  }

  /**
   * Invalidate cache entry
   * 
   * @param url - URL to invalidate
   */
  invalidate(url: string): void {
    const key = this.generateCacheKey(url)
    this.cache.delete(key)
    this.updateStats()
  }

  /**
   * Invalidate all cache entries for a domain
   * 
   * @param domain - Domain to invalidate
   */
  invalidateDomain(domain: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      try {
        const url = this.reconstructUrlFromKey(key)
        if (url && new URL(url).hostname === domain) {
          keysToDelete.push(key)
        }
      } catch {
        // Skip invalid keys
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
    
    this.updateStats()
  }

  /**
   * Store entry in cache
   * 
   * @param url - Request URL
   * @param entry - Cache entry to store
   * @param domainConfig - Domain-specific configuration
   */
  set(url: string, entry: CacheEntry, domainConfig?: DomainConfig): void {
    const key = this.generateCacheKey(url)
    
    // Apply domain-specific TTL if provided
    const ttl = domainConfig?.ttlSeconds || this.config.defaultTtlSeconds
    const entryWithTtl = {
      ...entry,
      timestamp: Date.now(),
      ttl
    }

    // Only cache successful responses and some client errors
    if (this.shouldCache(entry.statusCode)) {
      this.cache.set(key, entryWithTtl, { ttl: ttl * 1000 })
      this.updateStats()
    }
  }

  /**
   * Calculate maximum number of entries based on size limit
   */
  private calculateMaxEntries(maxSizeBytes: number): number {
    // Estimate average entry size (JSON responses are typically 1-10KB)
    const estimatedAvgSize = 5 * 1024 // 5KB average
    return Math.max(100, Math.floor(maxSizeBytes / estimatedAvgSize))
  }

  /**
   * Generate cache key for URL
   */
  private generateCacheKey(url: string, options: CacheKeyOptions = {}): string {
    try {
      const urlObj = new URL(url)
      
      // Base key components
      let key = `${urlObj.hostname}${urlObj.pathname}`
      
      // Include query parameters if requested
      if (options.includeQuery !== false && urlObj.search) {
        // Sort query parameters for consistent keys
        const params = new URLSearchParams(urlObj.search)
        const sortedParams = [...params.entries()].sort()
        key += `?${new URLSearchParams(sortedParams).toString()}`
      }
      
      // Add additional components
      if (options.additionalComponents?.length) {
        key += `#${options.additionalComponents.join('|')}`
      }
      
      return key
    } catch (error) {
      throw new OrchestratorError(
        new Error(`Invalid URL for cache key: ${url}`),
        ['Provide valid URL format'],
        { error: error instanceof Error ? error.message : String(error), url }
      )
    }
  }

  /**
   * Reconstruct URL from cache key (best effort)
   */
  private reconstructUrlFromKey(key: string): string | undefined {
    try {
      // Remove hash component if present
      const [urlPart] = key.split('#')
      
      if (!urlPart) {
        return undefined
      }
      
      // Add protocol if missing
      if (!urlPart.startsWith('http')) {
        return `https://${urlPart}`
      }
      
      return urlPart
    } catch {
      return undefined
    }
  }

  /**
   * Set up periodic cleanup of expired entries and in-flight requests
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      // Clean up expired in-flight requests (older than 5 minutes)
      const now = Date.now()
      const expiredKeys: string[] = []
      
      for (const [key, request] of this.inFlightRequests.entries()) {
        if (now - request.timestamp > 5 * 60 * 1000) {
          expiredKeys.push(key)
        }
      }
      
      for (const key of expiredKeys) {
        this.inFlightRequests.delete(key)
      }
      
      // The LRU cache handles its own TTL cleanup automatically
      this.updateStats()
    }, 60_000) // Run every minute
  }

  /**
   * Determine if response should be cached based on status code
   */
  private shouldCache(statusCode: number): boolean {
    // Cache successful responses
    if (statusCode >= 200 && statusCode < 300) {
      return true
    }
    
    // Cache some client errors that are unlikely to change quickly
    if (statusCode === 404 || statusCode === 410) {
      return true
    }
    
    return false
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.hitRatio = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0
    this.stats.memoryUsage = this.cache.calculatedSize || 0
  }
}