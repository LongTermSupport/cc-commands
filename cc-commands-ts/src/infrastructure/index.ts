/**
 * @file Infrastructure Module Exports
 * 
 * Provides easy access to the production-first caching proxy infrastructure
 */

// HTTP Client Infrastructure
export { ApiClient, type ApiRequestConfig, type ApiResponse, createGitHubApiClient } from './http/ApiClient.js'
export { 
  createProxyAwareGitHubClient,
  initializeProxySystem,
  proxyAwareFetch,
  ProxyUtils
} from './http/ProxyAwareClient.js'

// Monitoring
export { 
  createMetricsMiddleware,
  type HealthStatus,
  type PerformanceMetrics,
  ProxyMetrics,
  type ProxyMetricsSummary,
  type RequestMetrics
} from './monitoring/ProxyMetrics.js'

// Caching System
export { type CacheEntry, type CacheStats, CacheStore } from './proxy/cache/CacheStore.js'

// Proxy Configuration
export { 
  type DomainConfig,
  getCurrentProxyConfig,
  getProxyConfig,
  type ProxyConfig,
  ProxyConfigService,
  type ProxyEnvironment,
  type RateLimitDomainConfig
} from './proxy/config/ProxyConfig.js'

// Demo and Examples
export { runProxyDemo } from './proxy/examples/proxy-demo.js'

// Rate Limiting
export { RateLimiter, type RateLimiterStats, type RateLimitResult } from './proxy/rate-limiting/RateLimiter.js'

// Proxy Server
export { CachingProxyServer, type ServerEvents } from './proxy/server/CachingProxyServer.js'