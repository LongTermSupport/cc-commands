/**
 * @file Caching Proxy Server
 * 
 * Production-grade Express server with caching, rate limiting, monitoring,
 * and proper error handling for API requests.
 */

import express, { type Application, type NextFunction, type Request, type Response } from 'express'
import { createServer, type Server } from 'node:http'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { createMetricsMiddleware, ProxyMetrics } from '../../monitoring/ProxyMetrics.js'
import { CacheStore } from '../cache/CacheStore.js'
import { type ProxyConfig, ProxyConfigService } from '../config/ProxyConfig.js'
import { RateLimiter } from '../rate-limiting/RateLimiter.js'

/**
 * Proxy request options
 */
interface ProxyRequestOptions {
  /** Request body */
  body?: Buffer | string
  /** Additional fetch options */
  fetchOptions?: globalThis.RequestInit
  /** Request headers */
  headers: Record<string, string>
  /** Request method */
  method: string
  /** Request URL */
  url: string
}

/**
 * Proxy response
 */
interface ProxyResponse {
  /** Response body */
  body: Buffer | string
  /** Cache TTL in seconds (if cached) */
  cacheTtl?: number
  /** Whether response was served from cache */
  fromCache: boolean
  /** Response headers */
  headers: Record<string, string>
  /** Response status code */
  statusCode: number
}

/**
 * Server lifecycle events
 */
export interface ServerEvents {
  /** Server error event */
  error: (error: Error) => void
  /** Request proxied event */
  requestProxied: (url: string, fromCache: boolean) => void
  /** Server started event */
  started: (port: number) => void
  /** Server stopped event */
  stopped: () => void
}

/**
 * Production-grade caching proxy server
 */
export class CachingProxyServer {
  private readonly app: Application
  private readonly cacheStore: CacheStore
  private readonly config: ProxyConfig
  private events: Partial<ServerEvents> = {}
  private readonly proxyMetrics: ProxyMetrics
  private readonly rateLimiter: RateLimiter
  private server?: Server

  constructor(config: ProxyConfig) {
    this.config = config
    this.app = express()
    this.cacheStore = new CacheStore(config.cache)
    this.rateLimiter = new RateLimiter(config.rateLimit)
    this.proxyMetrics = new ProxyMetrics(config.monitoring)

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandlers()
  }

  /**
   * Clear cache for specific domain
   */
  clearCache(domain?: string): void {
    if (domain) {
      this.cacheStore.invalidateDomain(domain)
    } else {
      this.cacheStore.clear()
    }
  }

  /**
   * Get server health status
   */
  getHealthStatus() {
    const cacheHealth = this.cacheStore.healthCheck()
    const rateLimiterHealth = this.rateLimiter.healthCheck()
    
    return this.proxyMetrics.getHealthStatus(cacheHealth, rateLimiterHealth)
  }

  /**
   * Get comprehensive server metrics
   */
  getMetrics() {
    const cacheStats = this.cacheStore.getStats()
    const rateLimiterStats = this.rateLimiter.getStats()
    const cacheHealth = this.cacheStore.healthCheck()
    const rateLimiterHealth = this.rateLimiter.healthCheck()

    return this.proxyMetrics.getSummary(
      cacheStats,
      rateLimiterStats,
      cacheHealth,
      rateLimiterHealth
    )
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server?.listening ?? false
  }

  /**
   * Register event listeners
   */
  on<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]): void {
    this.events[event] = listener
  }

  /**
   * Start the proxy server
   * 
   * @returns Promise that resolves when server is listening
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app)
        
        // Configure server settings
        this.server.timeout = this.config.server.timeout
        this.server.keepAliveTimeout = this.config.server.keepAliveTimeout
        
        this.server.listen(this.config.server.port, this.config.server.host, () => {
          this.events.started?.(this.config.server.port)
          resolve()
        })

        this.server.on('error', (error) => {
          this.events.error?.(error)
          reject(new OrchestratorError(
            error,
            ['Check if port is already in use', 'Verify server configuration', 'Check network permissions'],
            { host: this.config.server.host, port: this.config.server.port }
          ))
        })

        // Graceful shutdown handling
        process.on('SIGTERM', () => this.stop())
        process.on('SIGINT', () => this.stop())

      } catch (error) {
        reject(new OrchestratorError(
          error instanceof Error ? error : new Error(String(error)),
          ['Verify server configuration', 'Check available resources'],
          { 
            host: this.config.server.host,
            port: this.config.server.port
          }
        ))
      }
    })
  }

  /**
   * Stop the proxy server
   * 
   * @returns Promise that resolves when server is stopped
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve()
        return
      }

      this.server.close(() => {
        this.rateLimiter.destroy()
        this.events.stopped?.()
        resolve()
      })
    })
  }

  /**
   * Extract target URL from request
   */
  private extractTargetUrl(req: Request): string {
    const path = req.path.replace('/proxy/', '')
    
    // Handle different URL formats
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Full URL provided
      return path + (req.url.includes('?') ? '?' + req.url.split('?')[1]! : '')
    }
 
    // Assume HTTPS and construct URL
    const url = `https://${path}`
    return url + (req.url.includes('?') ? '?' + req.url.split('?')[1]! : '')
  }

  /**
   * Handle proxy errors
   */
  private handleProxyError(error: unknown, req: Request, res: Response): void {
    console.error('Proxy error:', error)

    if (res.headersSent) {
      return
    }

    let statusCode = 502 // Bad Gateway
    let errorMessage = 'Proxy error occurred'

    if (error instanceof OrchestratorError) {
      errorMessage = error.message
      if (error.message.includes('timeout')) {
        statusCode = 504 // Gateway Timeout
      }
    }

    res.status(statusCode).json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
      url: req.url
    })
  }

  /**
   * Handle proxy request
   */
  private async handleProxyRequest(req: Request, res: Response): Promise<void> {
    // Extract target URL from request path
    const targetUrl = this.extractTargetUrl(req)
    
    // Check rate limits
    const rateLimitResult = this.rateLimiter.checkLimit(targetUrl)
    if (!rateLimitResult.allowed) {
      res.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      res.set('X-RateLimit-Remaining', '0')
      res.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      if (rateLimitResult.retryAfter) {
        res.set('Retry-After', rateLimitResult.retryAfter.toString())
      }
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      })
      return
    }

    // Check cache first
    const conditionalHeaders = this.cacheStore.getConditionalHeaders(targetUrl)
    const cachedEntry = this.cacheStore.get(targetUrl, conditionalHeaders)
    
    if (cachedEntry) {
      this.serveCachedResponse(res, cachedEntry, rateLimitResult)
      this.events.requestProxied?.(targetUrl, true)
      return
    }

    // Make proxy request
    const proxyResponse = await this.makeProxyRequest({
      body: req.body,
      fetchOptions: {
        signal: AbortSignal.timeout(this.config.server.timeout)
      },
      headers: this.prepareRequestHeaders(req, conditionalHeaders),
      method: req.method,
      url: targetUrl
    })

    // Cache response if appropriate
    if (proxyResponse.statusCode < 400) {
      const domainConfig = ProxyConfigService.getInstance().getDomainConfig(new URL(targetUrl).hostname)
      this.cacheStore.set(targetUrl, {
        contentEncoding: proxyResponse.headers['content-encoding'],
        data: proxyResponse.body,
        etag: proxyResponse.headers['etag'],
        headers: proxyResponse.headers,
        lastModified: proxyResponse.headers['last-modified'],
        statusCode: proxyResponse.statusCode,
        timestamp: Date.now(),
        ttl: domainConfig.ttlSeconds
      }, domainConfig)
    }

    // Consume rate limit tokens
    this.rateLimiter.consumeTokens(targetUrl)

    // Send response
    this.serveProxyResponse(res, proxyResponse, rateLimitResult)
    this.events.requestProxied?.(targetUrl, false)
  }

  /**
   * Make actual proxy request
   */
  private async makeProxyRequest(options: ProxyRequestOptions): Promise<ProxyResponse> {
    try {
      // Don't send body for GET/HEAD requests
      const fetchOptions: globalThis.RequestInit = {
        headers: options.headers,
        method: options.method,
        redirect: this.config.proxy.followRedirects ? 'follow' : 'manual',
        ...options.fetchOptions
      }
      
      // Only add body for non-GET/HEAD methods
      if (options.method !== 'GET' && options.method !== 'HEAD' && options.body) {
        fetchOptions.body = options.body
      }
      
      const response = await fetch(options.url, fetchOptions)

      // Convert headers to plain object
      const headers: Record<string, string> = {}
      for (const [key, value] of response.headers.entries()) {
        headers[key.toLowerCase()] = value
      }

      // Get response body as buffer
      const bodyBuffer = Buffer.from(await response.arrayBuffer())

      return {
        body: bodyBuffer,
        fromCache: false,
        headers,
        statusCode: response.status
      }
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check network connectivity', 'Verify target URL', 'Check proxy configuration'],
        { method: options.method, url: options.url }
      )
    }
  }

  /**
   * Prepare request headers for proxy
   */
  private prepareRequestHeaders(req: Request, conditionalHeaders: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.config.proxy.userAgent,
      ...conditionalHeaders
    }

    // Copy relevant headers from original request
    const headersToForward = [
      'authorization', 'content-type', 'accept', 'accept-encoding',
      'cache-control', 'x-github-api-version'
    ]

    for (const header of headersToForward) {
      const value = req.get(header)
      if (value) {
        headers[header] = value
      }
    }

    return headers
  }

  /**
   * Serve cached response
   */
  private serveCachedResponse(res: Response, entry: { data: Buffer | string; headers: Record<string, string>; statusCode: number; ttl: number; }, rateLimitResult: { limit: number; remaining: number; resetTime: number }): void {
    // Set cache headers
    res.set('X-Cache', 'HIT')
    res.set('X-Cache-TTL', entry.ttl.toString())
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    res.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    res.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    // Set original response headers
    for (const [key, value] of Object.entries(entry.headers)) {
      if (!key.startsWith('x-cache')) {
        res.set(key, value as string)
      }
    }

    res.status(entry.statusCode).send(entry.data)
  }

  /**
   * Serve proxy response
   */
  private serveProxyResponse(res: Response, proxyResponse: ProxyResponse, rateLimitResult: { limit: number; remaining: number; resetTime: number }): void {
    // Set cache headers
    res.set('X-Cache', 'MISS')
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    res.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    res.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())

    // Set response headers
    for (const [key, value] of Object.entries(proxyResponse.headers)) {
      res.set(key, value)
    }

    res.status(proxyResponse.statusCode).send(proxyResponse.body)
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    // Express error handler
    this.app.use((error: unknown, _req: unknown, res: { headersSent: boolean; json: (data: unknown) => unknown; status: (code: number) => { json: (data: unknown) => unknown } }, _next: unknown) => {
      console.error('Express error:', error)
      
      if (!res.headersSent) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        res.status(500).json({
          error: 'Internal server error',
          message: this.config.monitoring.logLevel === 'debug' ? errorMessage : undefined
        })
      }
    })

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason)
      this.events.error?.(new Error(`Unhandled rejection: ${reason}`))
    })
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Trust proxy headers
    this.app.set('trust proxy', true)

    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }))

    // Parse raw bodies for non-JSON content
    this.app.use('/proxy', express.raw({ 
      limit: '50mb', 
      type: () => true // Accept all content types as raw
    }))

    // Add metrics middleware if enabled
    if (this.config.monitoring.metricsEnabled) {
      this.app.use(createMetricsMiddleware(this.proxyMetrics) as (req: Request, res: Response, next: NextFunction) => void)
    }

    // CORS headers for cross-origin requests
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
        return
      }
      
      next()
    })
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      if (!this.config.monitoring.healthCheckEnabled) {
        res.status(404).json({ error: 'Health check disabled' })
        return
      }

      const health = this.getHealthStatus()
      const statusCode = health.healthy ? 200 : 503
      
      res.status(statusCode).json(health)
    })

    // Metrics endpoint
    this.app.get('/metrics', (_req, res) => {
      if (!this.config.monitoring.metricsEnabled) {
        res.status(404).json({ error: 'Metrics disabled' })
        return
      }

      const metrics = this.getMetrics()
      res.json(metrics)
    })

    // Cache management endpoints
    this.app.delete('/cache/:domain?', (req, res) => {
      try {
        const {domain} = req.params
        this.clearCache(domain)
        
        res.json({ 
          message: domain ? `Cache cleared for domain: ${domain}` : 'All cache cleared', 
          success: true
        })
      } catch (error) {
        res.status(500).json({ 
          details: error instanceof Error ? error.message : String(error),
          error: 'Failed to clear cache'
        })
      }
    })

    // Main proxy endpoint
    this.app.all('/proxy/*', async (req, res) => {
      try {
        await this.handleProxyRequest(req, res)
      } catch (error) {
        this.handleProxyError(error, req, res)
      }
    })

    // Catch-all for unsupported endpoints
    this.app.all('*', (_req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'Use /proxy/<url> for proxied requests, /health for health checks, /metrics for metrics'
      })
    })
  }
}