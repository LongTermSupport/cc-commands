/**
 * @file Centralized API Client
 * 
 * Provides a unified interface for all HTTP requests with transparent proxy support,
 * automatic retry logic, and comprehensive error handling.
 */

import { OrchestratorError } from '../../core/error/OrchestratorError.js'
import { ProxyConfigService } from '../proxy/config/ProxyConfig.js'

/**
 * HTTP request methods
 */
export type HttpMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  /** Request body */
  body?: any
  /** Custom fetch options */
  fetchOptions?: RequestInit
  /** Whether to follow redirects */
  followRedirects?: boolean
  /** Request headers */
  headers?: Record<string, string>
  /** HTTP method (default: GET) */
  method?: HttpMethod
  /** Query parameters */
  params?: Record<string, string>
  /** Request timeout in milliseconds */
  timeout?: number
  /** Request URL */
  url: string
}

/**
 * API response
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T
  /** Whether response came from cache */
  fromCache: boolean
  /** Response headers */
  headers: Record<string, string>
  /** Response status code */
  status: number
  /** Response status text */
  statusText: string
  /** Request URL */
  url: string
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Backoff multiplier */
  backoffMultiplier: number
  /** Initial delay in milliseconds */
  initialDelay: number
  /** Maximum retry attempts */
  maxAttempts: number
  /** Maximum delay in milliseconds */
  maxDelay: number
  /** HTTP status codes to retry on */
  retryOnStatus: number[]
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for all requests */
  baseUrl?: string
  /** Default headers for all requests */
  defaultHeaders?: Record<string, string>
  /** Default timeout in milliseconds */
  defaultTimeout?: number
  /** Proxy server base URL */
  proxyBaseUrl?: string
  /** Retry configuration */
  retry?: RetryConfig
  /** Whether to use proxy when available */
  useProxy?: boolean
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxAttempts: 3,
  maxDelay: 10_000,
  retryOnStatus: [502, 503, 504, 429] // Bad Gateway, Service Unavailable, Gateway Timeout, Too Many Requests
}

/**
 * Centralized API client with proxy awareness and error handling
 */
export class ApiClient {
  private readonly config: ApiClientConfig
  private readonly retryConfig: RetryConfig

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      defaultTimeout: 30_000,
      proxyBaseUrl: 'http://127.0.0.1:3001',
      useProxy: true,
      ...config
    }
    
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retry
    }
  }

  /**
   * Clear proxy cache for specific domain
   * 
   * @param domain - Domain to clear cache for (optional)
   * @returns Promise resolving to success status
   */
  async clearProxyCache(domain?: string): Promise<boolean> {
    if (!this.config.useProxy || !this.config.proxyBaseUrl) {
      return false
    }

    try {
      const cacheUrl = `${this.config.proxyBaseUrl}/cache${domain ? `/${domain}` : ''}`
      const response = await fetch(cacheUrl, { 
        method: 'DELETE',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Make a DELETE request
   * 
   * @param url - Request URL
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  async delete<T = any>(url: string, config: Omit<ApiRequestConfig, 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  /**
   * Make a GET request
   * 
   * @param url - Request URL
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  async get<T = any>(url: string, config: Omit<ApiRequestConfig, 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  /**
   * Get proxy server metrics (if available)
   * 
   * @returns Promise resolving to proxy metrics or undefined
   */
  async getProxyMetrics(): Promise<any> {
    if (!this.config.useProxy || !this.config.proxyBaseUrl) {
      return undefined
    }

    try {
      const metricsUrl = `${this.config.proxyBaseUrl}/metrics`
      const response = await fetch(metricsUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        return response.json()
      }
    } catch {
      // Ignore errors - metrics are optional
    }
    
    return undefined
  }

  /**
   * Check if proxy server is available
   * 
   * @returns Promise resolving to whether proxy is available
   */
  async isProxyAvailable(): Promise<boolean> {
    if (!this.config.useProxy || !this.config.proxyBaseUrl) {
      return false
    }

    try {
      const healthUrl = `${this.config.proxyBaseUrl}/health`
      const response = await fetch(healthUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Make a PATCH request
   * 
   * @param url - Request URL
   * @param body - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  async patch<T = any>(url: string, body?: any, config: Omit<ApiRequestConfig, 'body' | 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, body, method: 'PATCH', url })
  }

  /**
   * Make a POST request
   * 
   * @param url - Request URL
   * @param body - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  async post<T = any>(url: string, body?: any, config: Omit<ApiRequestConfig, 'body' | 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, body, method: 'POST', url })
  }

  /**
   * Make a PUT request
   * 
   * @param url - Request URL
   * @param body - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  async put<T = any>(url: string, body?: any, config: Omit<ApiRequestConfig, 'body' | 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, body, method: 'PUT', url })
  }

  /**
   * Make a generic HTTP request with automatic retry and proxy detection
   * 
   * @param requestConfig - Request configuration
   * @returns Promise resolving to API response
   */
  async request<T = any>(requestConfig: ApiRequestConfig): Promise<ApiResponse<T>> {
    const config = this.mergeConfig(requestConfig)
    
    let lastError: Error | undefined
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.makeRequest<T>(config, attempt)
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on the last attempt or non-retryable errors
        if (attempt === this.retryConfig.maxAttempts || !this.shouldRetry(error, attempt)) {
          break
        }
        
        // Wait before retry
        const delay = this.calculateRetryDelay(attempt)
        await this.sleep(delay)
      }
    }
    
    // All attempts failed
    throw new OrchestratorError(
      lastError || new Error('Request failed after all retry attempts'),
      [
        'Check network connectivity',
        'Verify API endpoint URL',
        'Check authentication credentials',
        'Verify proxy server is running if using proxy'
      ],
      {
        attempts: this.retryConfig.maxAttempts,
        method: config.method || 'GET',
        url: config.url,
        useProxy: this.shouldUseProxy(config.url)
      }
    )
  }

  /**
   * Build request headers
   */
  private buildHeaders(config: ApiRequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'cc-commands-ts/api-client/1.0.0',
      ...this.config.defaultHeaders,
      ...config.headers
    }

    return headers
  }

  /**
   * Build proxy URL
   */
  private buildProxyUrl(originalUrl: string): string {
    if (!this.config.proxyBaseUrl) {
      throw new Error('Proxy base URL not configured')
    }

    // Remove protocol from original URL for proxy path
    const pathUrl = originalUrl.replace(/^https?:\/\//, '')
    return `${this.config.proxyBaseUrl}/proxy/${pathUrl}`
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.initialDelay * this.retryConfig.backoffMultiplier**(attempt - 1)
    return Math.min(delay, this.retryConfig.maxDelay)
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(config: ApiRequestConfig, _attempt: number): Promise<ApiResponse<T>> {
    const shouldUseProxy = this.shouldUseProxy(config.url)
    const requestUrl = shouldUseProxy ? this.buildProxyUrl(config.url) : config.url
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      headers: this.buildHeaders(config),
      method: config.method || 'GET',
      redirect: config.followRedirects === false ? 'manual' : 'follow',
      signal: AbortSignal.timeout(config.timeout || this.config.defaultTimeout || 30_000),
      ...config.fetchOptions
    }

    // Add body if present and method supports it
    if (config.body && ['PATCH', 'POST', 'PUT'].includes(config.method || 'GET')) {
      if (typeof config.body === 'string' || Buffer.isBuffer(config.body)) {
        fetchOptions.body = config.body
      } else {
        fetchOptions.body = JSON.stringify(config.body)
        // Ensure content-type is set for JSON
        if (!fetchOptions.headers) fetchOptions.headers = {}
        ;(fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
      }
    }

    try {
      const response = await fetch(requestUrl, fetchOptions)
      return await this.processResponse<T>(response, config.url, shouldUseProxy)
    } catch (error) {
      // Handle different types of fetch errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${config.timeout || this.config.defaultTimeout}ms`)
        }

        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          throw new Error(`Network error: ${error.message}`)
        }
      }

      throw error
    }
  }

  /**
   * Merge request config with defaults
   */
  private mergeConfig(requestConfig: ApiRequestConfig): ApiRequestConfig {
    const url = this.config.baseUrl 
      ? new URL(requestConfig.url, this.config.baseUrl).toString()
      : requestConfig.url

    // Add query parameters to URL if provided
    let finalUrl = url
    if (requestConfig.params) {
      const urlObj = new URL(finalUrl)
      for (const [key, value] of Object.entries(requestConfig.params)) {
        urlObj.searchParams.set(key, value)
      }

      finalUrl = urlObj.toString()
    }

    return {
      followRedirects: true,
      method: 'GET',
      timeout: this.config.defaultTimeout,
      ...requestConfig,
      url: finalUrl
    }
  }

  /**
   * Process fetch response
   */
  private async processResponse<T>(response: Response, originalUrl: string, _viaProxy: boolean): Promise<ApiResponse<T>> {
    // Convert headers to plain object
    const headers: Record<string, string> = {}
    for (const [key, value] of response.headers.entries()) {
      headers[key.toLowerCase()] = value
    }

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }

    // Parse response body
    let data: T
    const contentType = headers['content-type'] || ''
    
    try {
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else if (contentType.includes('text/')) {
        data = await response.text() as T
      } else {
        // For binary content, return as ArrayBuffer
        data = await response.arrayBuffer() as T
      }
    } catch (error) {
      throw new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {
      data,
      fromCache: headers['x-cache'] === 'HIT',
      headers,
      status: response.status,
      statusText: response.statusText,
      url: originalUrl
    }
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    // Don't retry on last attempt
    if (attempt >= this.retryConfig.maxAttempts) {
      return false
    }

    // Check if error indicates a retryable condition
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // Network errors are retryable
      if (message.includes('network') || 
          message.includes('timeout') ||
          message.includes('econnrefused') ||
          message.includes('enotfound')) {
        return true
      }

      // Check for HTTP status codes
      for (const status of this.retryConfig.retryOnStatus) {
        if (message.includes(`http ${status}`)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Determine if request should use proxy
   */
  private shouldUseProxy(url: string): boolean {
    if (!this.config.useProxy || !this.config.proxyBaseUrl) {
      return false
    }

    try {
      const proxyConfigService = ProxyConfigService.getInstance()
      return proxyConfigService.shouldUseProxy(url)
    } catch {
      // If proxy config is not loaded, don't use proxy
      return false
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Factory function to create API client with default configuration
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}

/**
 * Create API client specifically configured for GitHub API
 */
export function createGitHubApiClient(token?: string): ApiClient {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new ApiClient({
    baseUrl: 'https://api.github.com',
    defaultHeaders: headers,
    retry: {
      backoffMultiplier: 2,
      initialDelay: 2000,
      maxAttempts: 3,
      maxDelay: 30_000,
      retryOnStatus: [502, 503, 504, 429]
    },
    useProxy: true
  })
}