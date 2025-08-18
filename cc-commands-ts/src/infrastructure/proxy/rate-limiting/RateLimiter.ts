/**
 * @file Production Rate Limiting System
 * 
 * Token bucket algorithm implementation with per-domain rate limiting,
 * burst allowance, and safety margins to prevent API limit violations.
 */

import type { RateLimitConfig, RateLimitDomainConfig } from '../config/ProxyConfig.js'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * Token bucket state
 */
interface TokenBucket {
  /** Last refill timestamp */
  lastRefill: number
  /** Maximum tokens (bucket capacity) */
  maxTokens: number
  /** Token refill rate (tokens per second) */
  refillRate: number
  /** Number of requests made */
  requestCount: number
  /** Current number of tokens */
  tokens: number
  /** Window start time */
  windowStart: number
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean
  /** Domain that was checked */
  domain: string
  /** Limit that was applied */
  limit: number
  /** Remaining tokens/requests */
  remaining: number
  /** When limit resets (timestamp) */
  resetTime: number
  /** Seconds until reset */
  retryAfter?: number
}

/**
 * Rate limiter statistics
 */
export interface RateLimiterStats {
  /** Total requests blocked */
  blockedRequests: number
  /** Block rate (0-1) */
  blockRate: number
  /** Per-domain statistics */
  domains: Record<string, {
    blocked: number
    remaining: number
    requests: number
    resetTime: number
  }>
  /** Total requests processed */
  totalRequests: number
}

/**
 * Production-grade rate limiter with token bucket algorithm
 */
export class RateLimiter {
  private readonly buckets = new Map<string, TokenBucket>()
  private cleanupInterval?: NodeJS.Timeout
  private readonly config: RateLimitConfig
  private stats: RateLimiterStats

  constructor(config: RateLimitConfig) {
    this.config = config
    this.stats = {
      blockedRequests: 0,
      blockRate: 0,
      domains: {},
      totalRequests: 0
    }

    // Set up periodic cleanup of old buckets
    this.setupPeriodicCleanup()
  }

  /**
   * Check if request should be allowed
   * 
   * @param url - Request URL
   * @param tokensRequested - Number of tokens to consume (default 1)
   * @returns Rate limit check result
   */
  checkLimit(url: string, tokensRequested = 1): RateLimitResult {
    this.stats.totalRequests++

    // If rate limiting is disabled, allow all requests
    if (!this.config.enabled) {
      return {
        allowed: true,
        domain: 'global',
        limit: this.config.globalLimit,
        remaining: this.config.globalLimit,
        resetTime: Date.now() + this.config.windowSeconds * 1000
      }
    }

    try {
      const domain = this.extractDomain(url)
      const domainConfig = this.config.domains[domain]

      if (!domainConfig) {
        // No specific config for domain, use global limit
        return this.checkGlobalLimit(url, tokensRequested)
      }

      // Use domain-specific rate limiting
      return this.checkDomainLimit(domain, domainConfig, tokensRequested)
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Provide valid URL format'],
        { tokensRequested, url }
      )
    }
  }

  /**
   * Consume tokens for a successful request
   * 
   * @param url - Request URL
   * @param tokensConsumed - Number of tokens to consume
   */
  consumeTokens(url: string, tokensConsumed = 1): void {
    if (!this.config.enabled) {
      return
    }

    try {
      const domain = this.extractDomain(url)
      const bucketKey = this.getBucketKey(domain)
      const bucket = this.buckets.get(bucketKey)

      if (bucket) {
        bucket.tokens = Math.max(0, bucket.tokens - tokensConsumed)
        bucket.requestCount += tokensConsumed
        this.updateDomainStats(domain, bucket)
      }
    } catch {
      // Ignore errors in consumption - rate check should have caught issues
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    this.buckets.clear()
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): RateLimiterStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Get current rate limit status for a domain
   * 
   * @param url - Request URL
   * @returns Current rate limit status
   */
  getStatus(url: string): RateLimitResult {
    return this.checkLimit(url, 0) // Check without consuming tokens
  }

  /**
   * Health check for rate limiter
   */
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Check if block rate is too high
    if (this.stats.blockRate > 0.1) {
      issues.push(`High block rate: ${(this.stats.blockRate * 100).toFixed(1)}%`)
    }

    // Check for domains approaching limits
    for (const [domain, domainStats] of Object.entries(this.stats.domains)) {
      if (domainStats.remaining < 100) {
        issues.push(`Domain ${domain} has low remaining requests: ${domainStats.remaining}`)
      }
    }

    return {
      healthy: issues.length === 0,
      issues
    }
  }

  /**
   * Reset rate limits for a domain
   * 
   * @param domain - Domain to reset
   */
  resetDomain(domain: string): void {
    const bucketKey = this.getBucketKey(domain)
    this.buckets.delete(bucketKey)
    delete this.stats.domains[domain]
  }

  /**
   * Check domain-specific rate limit
   */
  private checkDomainLimit(
    domain: string, 
    domainConfig: RateLimitDomainConfig, 
    tokensRequested: number
  ): RateLimitResult {
    // Apply safety margin to the configured limit
    const safetyMarginMultiplier = (100 - domainConfig.safetyMarginPercent) / 100
    const effectiveLimit = Math.floor(domainConfig.requestsPerHour * safetyMarginMultiplier)
    
    // Use burst allowance for short-term capacity
    const maxTokens = Math.min(effectiveLimit, domainConfig.burstAllowance)
    
    const bucketKey = this.getBucketKey(domain)
    const bucket = this.getOrCreateBucket(bucketKey, maxTokens, 3600) // 1 hour window
    
    this.refillBucket(bucket, 3600)

    const allowed = bucket.tokens >= tokensRequested
    if (!allowed) {
      this.stats.blockedRequests++
    }

    this.updateDomainStats(domain, bucket)

    const resetTime = bucket.windowStart + 3600 * 1000
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000)

    return {
      allowed,
      domain,
      limit: effectiveLimit,
      remaining: Math.floor(bucket.tokens),
      resetTime,
      retryAfter
    }
  }

  /**
   * Check global rate limit
   */
  private checkGlobalLimit(_url: string, tokensRequested: number): RateLimitResult {
    const bucketKey = 'global'
    const bucket = this.getOrCreateBucket(bucketKey, this.config.globalLimit, this.config.windowSeconds)
    
    this.refillBucket(bucket, this.config.windowSeconds)

    const allowed = bucket.tokens >= tokensRequested
    if (!allowed) {
      this.stats.blockedRequests++
    }

    const resetTime = bucket.windowStart + this.config.windowSeconds * 1000
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000)

    return {
      allowed,
      domain: 'global',
      limit: this.config.globalLimit,
      remaining: Math.floor(bucket.tokens),
      resetTime,
      retryAfter
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      throw new Error(`Invalid URL format: ${url}`)
    }
  }

  /**
   * Generate bucket key for domain
   */
  private getBucketKey(domain: string): string {
    return `domain:${domain}`
  }

  /**
   * Get or create token bucket for a key
   */
  private getOrCreateBucket(bucketKey: string, maxTokens: number, windowSeconds: number): TokenBucket {
    let bucket = this.buckets.get(bucketKey)
    
    if (!bucket) {
      const now = Date.now()
      bucket = {
        lastRefill: now,
        maxTokens,
        refillRate: maxTokens / windowSeconds,
        requestCount: 0,
        tokens: maxTokens,
        windowStart: now
      }
      this.buckets.set(bucketKey, bucket)
    }
    
    return bucket
  }

  /**
   * Refill tokens in bucket based on elapsed time
   */
  private refillBucket(bucket: TokenBucket, windowSeconds: number): void {
    const now = Date.now()
    const windowDuration = windowSeconds * 1000

    // Check if we need to start a new window
    if (now - bucket.windowStart >= windowDuration) {
      bucket.tokens = bucket.maxTokens
      bucket.requestCount = 0
      bucket.windowStart = now
      bucket.lastRefill = now
      return
    }

    // Calculate tokens to add based on elapsed time
    const timeSinceRefill = (now - bucket.lastRefill) / 1000
    const tokensToAdd = timeSinceRefill * bucket.refillRate
    
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  /**
   * Set up periodic cleanup of old buckets
   */
  private setupPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const maxAge = 2 * 3600 * 1000 // 2 hours

      for (const [key, bucket] of this.buckets.entries()) {
        if (now - bucket.windowStart > maxAge) {
          this.buckets.delete(key)
        }
      }
    }, 300_000) // Run every 5 minutes
  }

  /**
   * Update domain statistics
   */
  private updateDomainStats(domain: string, bucket: TokenBucket): void {
    this.stats.domains[domain] = {
      blocked: this.stats.domains[domain]?.blocked || 0,
      remaining: Math.floor(bucket.tokens),
      requests: bucket.requestCount,
      resetTime: bucket.windowStart + 3600 * 1000
    }
  }

  /**
   * Update overall statistics
   */
  private updateStats(): void {
    this.stats.blockRate = this.stats.totalRequests > 0 
      ? this.stats.blockedRequests / this.stats.totalRequests
      : 0
  }
}