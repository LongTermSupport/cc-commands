/**
 * @file Proxy Metrics and Monitoring
 * 
 * Comprehensive monitoring system for the caching proxy with performance tracking,
 * health checks, and operational metrics.
 */

import type { CacheStats } from '../proxy/cache/CacheStore.js'
import type { MonitoringConfig } from '../proxy/config/ProxyConfig.js'
import type { RateLimiterStats } from '../proxy/rate-limiting/RateLimiter.js'

/**
 * Request metrics
 */
export interface RequestMetrics {
  /** Whether request was served from cache */
  cacheHit: boolean
  /** Domain that was requested */
  domain: string
  /** Request duration in milliseconds */
  duration: number
  /** Request method */
  method: string
  /** Whether request was rate limited */
  rateLimited: boolean
  /** Response size in bytes */
  responseSize: number
  /** Response status code */
  statusCode: number
  /** Request timestamp */
  timestamp: number
  /** Request URL */
  url: string
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average response time in milliseconds */
  averageResponseTime: number
  /** Cache hit rate (0-1) */
  cacheHitRate: number
  /** Error rate (0-1) */
  errorRate: number
  /** 95th percentile response time */
  p95ResponseTime: number
  /** 99th percentile response time */
  p99ResponseTime: number
  /** Requests per second */
  requestsPerSecond: number
}

/**
 * Proxy health status
 */
export interface HealthStatus {
  /** Individual component health */
  components: {
    cache: { healthy: boolean; issues: string[] }
    rateLimiter: { healthy: boolean; issues: string[] }
    server: { healthy: boolean; issues: string[] }
  }
  /** Overall health status */
  healthy: boolean
  /** Performance indicators */
  performance: PerformanceMetrics
  /** Health check timestamp */
  timestamp: number
  /** Service uptime in seconds */
  uptime: number
}

/**
 * Proxy metrics summary
 */
export interface ProxyMetricsSummary {
  /** Cache statistics */
  cache: CacheStats
  /** Failed requests */
  failedRequests: number
  /** Health status */
  health: HealthStatus
  /** Performance metrics */
  performance: PerformanceMetrics
  /** Rate limiter statistics */
  rateLimiter: RateLimiterStats
  /** Successful requests */
  successfulRequests: number
  /** Total requests processed */
  totalRequests: number
}

/**
 * Proxy metrics collector and analyzer
 */
export class ProxyMetrics {
  private readonly config: MonitoringConfig
  private failedRequests = 0
  private readonly maxHistorySize = 10_000 // Keep last 10k requests
  private readonly requestHistory: RequestMetrics[] = []
private readonly startTime = Date.now()
  private successfulRequests = 0
  private totalRequests = 0

  constructor(config: MonitoringConfig) {
    this.config = config
  }

  /**
   * Get domain-specific metrics
   * 
   * @param domain - Domain to analyze
   * @returns Domain-specific performance metrics
   */
  getDomainMetrics(domain: string): PerformanceMetrics {
    const domainRequests = this.requestHistory.filter(r => r.domain === domain)
    
    if (domainRequests.length === 0) {
      return {
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: 0
      }
    }

    // Similar calculations as getPerformanceMetrics but for specific domain
    const responseTimes = domainRequests.map(r => r.duration).sort((a, b) => a - b)
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    
    const errorRequests = domainRequests.filter(r => r.statusCode >= 400).length
    const errorRate = errorRequests / domainRequests.length

    const cacheHits = domainRequests.filter(r => r.cacheHit).length
    const cacheHitRate = cacheHits / domainRequests.length

    // Calculate recent request rate
    const oneMinuteAgo = Date.now() - 60 * 1000
    const recentRequests = domainRequests.filter(r => r.timestamp >= oneMinuteAgo).length

    return {
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate,
      errorRate,
      p95ResponseTime: Math.round(responseTimes[Math.floor(responseTimes.length * 0.95)] || 0),
      p99ResponseTime: Math.round(responseTimes[Math.floor(responseTimes.length * 0.99)] || 0),
      requestsPerSecond: Math.round(recentRequests / 60)
    }
  }

  /**
   * Get proxy health status
   * 
   * @param cacheStats - Current cache statistics
   * @param rateLimiterStats - Current rate limiter statistics
   * @returns Health status
   */
  getHealthStatus(
    cacheHealth: { healthy: boolean; issues: string[] },
    rateLimiterHealth: { healthy: boolean; issues: string[] }
  ): HealthStatus {
    const performance = this.getPerformanceMetrics()
    const serverIssues: string[] = []

    // Check server health indicators
    if (performance.errorRate > 0.1) {
      serverIssues.push(`High error rate: ${(performance.errorRate * 100).toFixed(1)}%`)
    }

    if (performance.averageResponseTime > 5000) {
      serverIssues.push(`Slow response times: ${performance.averageResponseTime}ms average`)
    }

    if (performance.requestsPerSecond > 1000) {
      serverIssues.push(`High request rate: ${performance.requestsPerSecond}/sec`)
    }

    const components = {
      cache: cacheHealth,
      rateLimiter: rateLimiterHealth,
      server: {
        healthy: serverIssues.length === 0,
        issues: serverIssues
      }
    }

    const overallHealthy = Object.values(components).every(component => component.healthy)

    return {
      components,
      healthy: overallHealthy,
      performance,
      timestamp: Date.now(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.requestHistory.length === 0) {
      return {
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: 0
      }
    }

    // Get recent requests (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentRequests = this.requestHistory.filter(r => r.timestamp >= fiveMinutesAgo)

    if (recentRequests.length === 0) {
      return this.getPerformanceMetrics() // Fallback to all-time metrics
    }

    // Calculate response time metrics
    const responseTimes = recentRequests.map(r => r.duration).sort((a, b) => a - b)
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const p95Index = Math.floor(responseTimes.length * 0.95)
    const p99Index = Math.floor(responseTimes.length * 0.99)
    
    // Calculate request rate (last minute)
    const oneMinuteAgo = Date.now() - 60 * 1000
    const lastMinuteRequests = recentRequests.filter(r => r.timestamp >= oneMinuteAgo).length
    
    // Calculate error rate
    const errorRequests = recentRequests.filter(r => r.statusCode >= 400).length
    const errorRate = errorRequests / recentRequests.length

    // Calculate cache hit rate
    const cacheHits = recentRequests.filter(r => r.cacheHit).length
    const cacheHitRate = cacheHits / recentRequests.length

    return {
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate,
      errorRate,
      p95ResponseTime: Math.round(responseTimes[p95Index] || 0),
      p99ResponseTime: Math.round(responseTimes[p99Index] || 0),
      requestsPerSecond: Math.round(lastMinuteRequests / 60)
    }
  }

  /**
   * Get complete metrics summary
   * 
   * @param cacheStats - Current cache statistics
   * @param rateLimiterStats - Current rate limiter statistics
   * @param cacheHealth - Cache health status
   * @param rateLimiterHealth - Rate limiter health status
   * @returns Complete metrics summary
   */
  getSummary(
    cacheStats: CacheStats,
    rateLimiterStats: RateLimiterStats,
    cacheHealth: { healthy: boolean; issues: string[] },
    rateLimiterHealth: { healthy: boolean; issues: string[] }
  ): ProxyMetricsSummary {
    return {
      cache: cacheStats,
      failedRequests: this.failedRequests,
      health: this.getHealthStatus(cacheHealth, rateLimiterHealth),
      performance: this.getPerformanceMetrics(),
      rateLimiter: rateLimiterStats,
      successfulRequests: this.successfulRequests,
      totalRequests: this.totalRequests
    }
  }

  /**
   * Record a request
   * 
   * @param metrics - Request metrics to record
   */
  recordRequest(metrics: RequestMetrics): void {
    if (!this.config.performanceTracking) {
      return
    }

    this.requestHistory.push(metrics)
    
    // Keep history within bounds
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift()
    }

    // Update counters
    this.totalRequests++
    if (metrics.statusCode >= 200 && metrics.statusCode < 400) {
      this.successfulRequests++
    } else {
      this.failedRequests++
    }

    // Log request if debug mode
    if (this.config.logLevel === 'debug') {
      this.logRequest(metrics)
    }
  }

  /**
   * Clear metrics history
   */
  reset(): void {
    this.requestHistory.length = 0
    this.totalRequests = 0
    this.successfulRequests = 0
    this.failedRequests = 0
  }

  /**
   * Log request details for debugging
   */
  private logRequest(metrics: RequestMetrics): void {
    const logData = {
      cacheHit: metrics.cacheHit,
      duration: `${metrics.duration}ms`,
      method: metrics.method,
      rateLimited: metrics.rateLimited,
      size: `${Math.round(metrics.responseSize / 1024)}KB`,
      status: metrics.statusCode,
      timestamp: new Date(metrics.timestamp).toISOString(),
      url: metrics.url
    }

    console.debug('[PROXY]', JSON.stringify(logData))
  }
}

/**
 * Middleware function to track request metrics
 */
export function createMetricsMiddleware(proxyMetrics: ProxyMetrics) {
  return (req: { get: (header: string) => string; method: string; originalUrl: string; protocol: string; }, res: { end: (...args: unknown[]) => void; get: (header: string) => string; statusCode: number }, next: () => void) => {
    const startTime = Date.now()
    
    // Capture original end method
    const originalEnd = res.end.bind(res)

    res.end = function(this: typeof res, ...args: unknown[]) {
      // Record metrics when response ends
      const duration = Date.now() - startTime
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
      
      try {
        const domain = new URL(url).hostname
        
        proxyMetrics.recordRequest({
          cacheHit: res.get('X-Cache') === 'HIT',
          domain,
          duration,
          method: req.method,
          rateLimited: res.statusCode === 429,
          responseSize: res.get('Content-Length') ? Number.parseInt(res.get('Content-Length'), 10) : 0,
          statusCode: res.statusCode,
          timestamp: startTime,
          url
        })
      } catch {
        // Ignore invalid URLs
      }

      // Call original end method
      originalEnd(...args)
      return this
    } as typeof res.end

    next()
  }
}