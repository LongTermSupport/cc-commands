/**
 * @file Proxy Configuration Management
 * 
 * Handles multi-environment configuration with automatic environment detection.
 * Provides type-safe configuration loading for production, development, and test environments.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'

/**
 * Environment types supported by the proxy configuration system
 */
export type ProxyEnvironment = 'development' | 'production' | 'test'

/**
 * Domain-specific configuration for caching and rate limiting
 */
export interface DomainConfig {
  /** Whether to support conditional requests (ETag/Last-Modified) */
  conditional: boolean
  /** Cache TTL in seconds for this domain */
  ttlSeconds: number
}

/**
 * Rate limiting configuration per domain
 */
export interface RateLimitDomainConfig {
  /** Burst allowance for temporary spikes */
  burstAllowance: number
  /** Maximum requests per hour */
  requestsPerHour: number
  /** Safety margin percentage (e.g., 20% = use 80% of actual limit) */
  safetyMarginPercent: number
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Host to bind to */
  host: string
  /** Keep-alive timeout in milliseconds */
  keepAliveTimeout: number
  /** Port to listen on */
  port: number
  /** Request timeout in milliseconds */
  timeout: number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Whether compression is enabled */
  compressionEnabled: boolean
  /** Default TTL in seconds */
  defaultTtlSeconds: number
  /** Domain-specific configurations */
  domains: Record<string, DomainConfig>
  /** Whether ETag support is enabled */
  etagSupport: boolean
  /** Maximum cache size in bytes */
  maxSizeBytes: number
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Domain-specific rate limits */
  domains: Record<string, RateLimitDomainConfig>
  /** Whether rate limiting is enabled */
  enabled: boolean
  /** Global request limit per window */
  globalLimit: number
  /** Window size in seconds */
  windowSeconds: number
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  /** Whether health check endpoint is enabled */
  healthCheckEnabled: boolean
  /** Log level */
  logLevel: 'debug' | 'error' | 'info' | 'warn'
  /** Whether metrics collection is enabled */
  metricsEnabled: boolean
  /** Whether performance tracking is enabled */
  performanceTracking: boolean
}

/**
 * Proxy behavior configuration
 */
export interface ProxyBehaviorConfig {
  /** Whether to follow redirects */
  followRedirects: boolean
  /** Maximum redirects to follow */
  maxRedirects: number
  /** Whether to deduplicate concurrent requests */
  requestDeduplication: boolean
  /** User agent string to send */
  userAgent: string
  /** Whether to validate SSL certificates */
  validateCerts: boolean
}

/**
 * Complete proxy configuration
 */
export interface ProxyConfig {
  cache: CacheConfig
  monitoring: MonitoringConfig
  proxy: ProxyBehaviorConfig
  rateLimit: RateLimitConfig
  server: ServerConfig
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Validation errors if any */
  errors: string[]
  /** Whether configuration is valid */
  isValid: boolean
  /** Configuration warnings */
  warnings: string[]
}

/**
 * Proxy configuration service with environment auto-detection
 */
export class ProxyConfigService {
  private static instance?: ProxyConfigService
  private config?: ProxyConfig
  private environment?: ProxyEnvironment

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ProxyConfigService {
    if (!ProxyConfigService.instance) {
      ProxyConfigService.instance = new ProxyConfigService()
    }

    return ProxyConfigService.instance
  }

  /**
   * Get current configuration
   * 
   * @throws {OrchestratorError} When configuration not loaded
   */
  getConfig(): ProxyConfig {
    if (!this.config) {
      throw new OrchestratorError(
        new Error('Configuration not loaded'),
        ['Call loadConfig() first'],
        {}
      )
    }

    return this.config
  }

  /**
   * Get configuration for specific domain
   * 
   * @param domain - Domain name (e.g., 'api.github.com')
   * @returns Domain configuration or default
   */
  getDomainConfig(domain: string): DomainConfig {
    const config = this.getConfig()
    return config.cache.domains[domain] || {
      conditional: config.cache.etagSupport,
      ttlSeconds: config.cache.defaultTtlSeconds
    }
  }

  /**
   * Get current environment
   */
  getEnvironment(): ProxyEnvironment {
    return this.environment || this.detectEnvironment()
  }

  /**
   * Get rate limit configuration for specific domain
   * 
   * @param domain - Domain name
   * @returns Rate limit configuration or default
   */
  getRateLimitConfig(domain: string): RateLimitDomainConfig | undefined {
    const config = this.getConfig()
    return config.rateLimit.domains[domain]
  }

  /**
   * Load configuration for the current environment
   * 
   * @param forceEnvironment - Force specific environment (for testing)
   * @returns Loaded proxy configuration
   * @throws {OrchestratorError} When configuration loading fails
   */
  async loadConfig(forceEnvironment?: ProxyEnvironment): Promise<ProxyConfig> {
    try {
      const environment = forceEnvironment || this.detectEnvironment()
      const configPath = this.getConfigPath(environment)
      
      const rawConfig = readFileSync(configPath, 'utf8')
      const parsedConfig = JSON.parse(rawConfig) as ProxyConfig
      
      // Validate configuration
      const validation = this.validateConfig(parsedConfig)
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
      }
      
      // Log warnings if any
      if (validation.warnings.length > 0 && parsedConfig.monitoring.logLevel === 'debug') {
        console.warn(`Configuration warnings: ${validation.warnings.join(', ')}`)
      }
      
      this.config = parsedConfig
      this.environment = environment
      
      return parsedConfig
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check configuration file exists and is valid JSON', 'Verify file permissions', 'Validate configuration schema'],
        { environment: forceEnvironment || this.detectEnvironment() }
      )
    }
  }

  /**
   * Reset configuration (for testing)
   * @internal
   */
  reset(): void {
    this.config = undefined
    this.environment = undefined
  }

  /**
   * Check if proxy should be used for a given URL
   * 
   * @param url - URL to check
   * @returns True if proxy should be used
   */
  shouldUseProxy(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const config = this.getConfig()
      
      // Check if domain is configured for caching/rate limiting
      return Object.keys(config.cache.domains).some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  }

  /**
   * Detect current environment based on NODE_ENV and other indicators
   */
  private detectEnvironment(): ProxyEnvironment {
    const nodeEnv = process.env['NODE_ENV']?.toLowerCase()
    
    // Check for test environment indicators
    if (nodeEnv === 'test' || 
        process.env['VITEST'] === 'true' || 
        process.env['CI'] === 'true' ||
        process.argv.some(arg => arg.includes('vitest') || arg.includes('test'))) {
      return 'test'
    }
    
    // Check for development environment indicators
    if (nodeEnv === 'development' || 
        nodeEnv === 'dev' ||
        !nodeEnv) {  // Default to development if not specified
      return 'development'
    }
    
    // Production environment
    return 'production'
  }

  /**
   * Get configuration file path for environment
   */
  private getConfigPath(environment: ProxyEnvironment): string {
    const configDir = join(process.cwd(), 'config')
    return join(configDir, `proxy.${environment}.json`)
  }

  /**
   * Validate proxy configuration
   */
  private validateConfig(config: ProxyConfig): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate server configuration
    if (config.server.port < 1 || config.server.port > 65_535) {
      errors.push('Server port must be between 1 and 65535')
    }

    if (config.server.timeout < 1000) {
      warnings.push('Server timeout less than 1 second may cause issues')
    }

    // Validate cache configuration
    if (config.cache.defaultTtlSeconds < 0) {
      errors.push('Cache TTL cannot be negative')
    }

    if (config.cache.maxSizeBytes < 1024 * 1024) {
      warnings.push('Cache size less than 1MB may be too small for effective caching')
    }

    // Validate rate limiting
    if (config.rateLimit.enabled && config.rateLimit.globalLimit < 1) {
      errors.push('Global rate limit must be positive when enabled')
    }

    // Validate domain configurations
    for (const [domain, domainConfig] of Object.entries(config.cache.domains)) {
      if (domainConfig.ttlSeconds < 0) {
        errors.push(`Domain ${domain} TTL cannot be negative`)
      }
    }

    // Validate proxy configuration
    if (config.proxy.maxRedirects < 0 || config.proxy.maxRedirects > 10) {
      warnings.push('Max redirects should be between 0 and 10')
    }

    return {
      errors,
      isValid: errors.length === 0,
      warnings
    }
  }
}

/**
 * Convenience function to get proxy configuration
 */
export async function getProxyConfig(environment?: ProxyEnvironment): Promise<ProxyConfig> {
  const service = ProxyConfigService.getInstance()
  return service.loadConfig(environment)
}

/**
 * Convenience function to get current proxy configuration
 */
export function getCurrentProxyConfig(): ProxyConfig {
  const service = ProxyConfigService.getInstance()
  return service.getConfig()
}