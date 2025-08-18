/**
 * @file Tests for ProxyConfig service
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProxyConfigService, type ProxyEnvironment } from '../../../../src/infrastructure/proxy/config/ProxyConfig.js'

describe('ProxyConfigService', () => {
  let configService: ProxyConfigService

  beforeEach(() => {
    // Reset singleton state
    const instance = ProxyConfigService.getInstance()
    instance.reset()
    configService = ProxyConfigService.getInstance()
  })

  describe('environment detection', () => {
    it('should detect test environment from NODE_ENV', () => {
      vi.stubEnv('NODE_ENV', 'test')
      
      const env = configService.getEnvironment()
      expect(env).toBe('test')
    })

    it('should detect test environment from VITEST', () => {
      vi.stubEnv('NODE_ENV', '')
      vi.stubEnv('VITEST', 'true')
      
      const env = configService.getEnvironment()
      expect(env).toBe('test')
    })

    it('should detect development environment by default', () => {
      vi.stubEnv('NODE_ENV', '')
      vi.stubEnv('VITEST', '')
      vi.stubEnv('CI', '')
      
      const env = configService.getEnvironment()
      expect(env).toBe('development')
    })

    it('should detect production environment', () => {
      vi.stubEnv('NODE_ENV', 'production')
      
      const env = configService.getEnvironment()
      expect(env).toBe('production')
    })
  })

  describe('configuration loading', () => {
    it('should load test configuration successfully', async () => {
      const config = await configService.loadConfig('test')
      
      expect(config).toBeDefined()
      expect(config.server.port).toBe(3002)
      expect(config.cache.defaultTtlSeconds).toBe(3600)
      expect(config.rateLimit.enabled).toBe(false)
      expect(config.monitoring.logLevel).toBe('warn')
    })

    it('should load development configuration successfully', async () => {
      const config = await configService.loadConfig('development')
      
      expect(config).toBeDefined()
      expect(config.server.port).toBe(3001)
      expect(config.cache.defaultTtlSeconds).toBe(900)
      expect(config.rateLimit.enabled).toBe(false)
      expect(config.monitoring.logLevel).toBe('debug')
    })

    it('should load production configuration successfully', async () => {
      const config = await configService.loadConfig('production')
      
      expect(config).toBeDefined()
      expect(config.server.port).toBe(3001)
      expect(config.cache.defaultTtlSeconds).toBe(120)
      expect(config.rateLimit.enabled).toBe(true)
      expect(config.monitoring.logLevel).toBe('info')
    })

    it('should throw error for invalid configuration file', async () => {
      await expect(
        configService.loadConfig('invalid' as ProxyEnvironment)
      ).rejects.toThrow('ENOENT')
    })
  })

  describe('domain configuration', () => {
    beforeEach(async () => {
      await configService.loadConfig('test')
    })

    it('should get domain-specific configuration', () => {
      const domainConfig = configService.getDomainConfig('api.github.com')
      
      expect(domainConfig).toBeDefined()
      expect(domainConfig.ttlSeconds).toBe(3600)
      expect(domainConfig.conditional).toBe(true)
    })

    it('should return default configuration for unknown domain', () => {
      const domainConfig = configService.getDomainConfig('unknown.com')
      
      expect(domainConfig).toBeDefined()
      expect(domainConfig.ttlSeconds).toBe(3600) // default TTL
      expect(domainConfig.conditional).toBe(true) // default ETag support
    })

    it('should get rate limit configuration for domain', () => {
      const rateLimitConfig = configService.getRateLimitConfig('api.github.com')
      
      expect(rateLimitConfig).toBeDefined()
      expect(rateLimitConfig!.requestsPerHour).toBe(10_000)
      expect(rateLimitConfig!.burstAllowance).toBe(500)
      expect(rateLimitConfig!.safetyMarginPercent).toBe(80)
    })

    it('should return undefined for unknown domain rate limits', () => {
      const rateLimitConfig = configService.getRateLimitConfig('unknown.com')
      expect(rateLimitConfig).toBeUndefined()
    })
  })

  describe('proxy usage determination', () => {
    beforeEach(async () => {
      await configService.loadConfig('test')
    })

    it('should recommend proxy for configured domains', () => {
      expect(configService.shouldUseProxy('https://api.github.com/repos/test/test')).toBe(true)
      expect(configService.shouldUseProxy('https://github.com/test/test')).toBe(true)
    })

    it('should not recommend proxy for unconfigured domains', () => {
      expect(configService.shouldUseProxy('https://example.com/api')).toBe(false)
    })

    it('should handle invalid URLs gracefully', () => {
      expect(configService.shouldUseProxy('not-a-url')).toBe(false)
    })
  })

  describe('configuration validation', () => {
    it('should validate production configuration', async () => {
      const config = await configService.loadConfig('production')
      
      // Should not throw - production config is valid
      expect(config.server.port).toBeGreaterThan(0)
      expect(config.server.port).toBeLessThanOrEqual(65_535)
      expect(config.cache.defaultTtlSeconds).toBeGreaterThanOrEqual(0)
    })

    it('should handle configuration without errors', async () => {
      // All provided configurations should be valid
      await expect(configService.loadConfig('production')).resolves.toBeDefined()
      await expect(configService.loadConfig('development')).resolves.toBeDefined()
      await expect(configService.loadConfig('test')).resolves.toBeDefined()
    })
  })

  describe('singleton behavior', () => {
    it('should return same instance', () => {
      const instance1 = ProxyConfigService.getInstance()
      const instance2 = ProxyConfigService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across getInstance calls', async () => {
      const instance1 = ProxyConfigService.getInstance()
      await instance1.loadConfig('test')
      
      const instance2 = ProxyConfigService.getInstance()
      const config = instance2.getConfig()
      
      expect(config.server.port).toBe(3002) // Test config port
    })
  })

  describe('error handling', () => {
    it('should throw error when getting config before loading', () => {
      const freshService = ProxyConfigService.getInstance()
      freshService.reset()
      
      expect(() => freshService.getConfig()).toThrow('Configuration not loaded')
    })
  })
})