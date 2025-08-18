/**
 * @file Proxy-Aware HTTP Client
 * 
 * Drop-in replacement for fetch() that automatically uses proxy when available
 * and falls back to direct requests when proxy is unavailable.
 */

import { getProxyConfig } from '../proxy/config/ProxyConfig.js'
import { CachingProxyServer } from '../proxy/server/CachingProxyServer.js'
import { ApiClient, type ApiRequestConfig } from './ApiClient.js'

/**
 * Proxy server manager for lifecycle management
 */
class ProxyServerManager {
  private static instance?: ProxyServerManager
  private isStarting = false
  private server?: CachingProxyServer
  private startPromise?: Promise<void>

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ProxyServerManager {
    if (!ProxyServerManager.instance) {
      ProxyServerManager.instance = new ProxyServerManager()
    }

    return ProxyServerManager.instance
  }

  /**
   * Start proxy server if not already running
   */
  async ensureProxyRunning(): Promise<boolean> {
    if (this.server?.isRunning()) {
      return true
    }

    if (this.isStarting && this.startPromise) {
      await this.startPromise
      return this.server?.isRunning() ?? false
    }

    this.isStarting = true
    this.startPromise = this.startProxyServer()

    try {
      await this.startPromise
      return this.server?.isRunning() ?? false
    } catch (error) {
      console.warn('Failed to start proxy server:', error)
      return false
    } finally {
      this.isStarting = false
      this.startPromise = undefined
    }
  }

  /**
   * Get proxy server instance
   */
  getServer(): CachingProxyServer | undefined {
    return this.server
  }

  /**
   * Stop proxy server
   */
  async stopProxy(): Promise<void> {
    if (this.server) {
      await this.server.stop()
      this.server = undefined
    }
  }

  /**
   * Start proxy server with configuration
   */
  private async startProxyServer(): Promise<void> {
    try {
      // Load proxy configuration
      const config = await getProxyConfig()
      
      // Create and start server
      this.server = new CachingProxyServer(config)
      
      // Set up event listeners
      this.server.on('started', (port) => {
        console.log(`Proxy server started on port ${port}`)
      })
      
      this.server.on('error', (error) => {
        console.error('Proxy server error:', error)
      })
      
      this.server.on('stopped', () => {
        console.log('Proxy server stopped')
      })

      await this.server.start()
    } catch (error) {
      this.server = undefined
      throw error
    }
  }
}

/**
 * Global proxy-aware API client instance
 */
let globalApiClient: ApiClient | undefined

/**
 * Get or create global API client
 */
async function getApiClient(): Promise<ApiClient> {
  if (!globalApiClient) {
    const proxyManager = ProxyServerManager.getInstance()
    const proxyAvailable = await proxyManager.ensureProxyRunning()
    
    globalApiClient = new ApiClient({
      proxyBaseUrl: proxyAvailable ? 'http://127.0.0.1:3001' : undefined,
      useProxy: proxyAvailable
    })
  }
  
  return globalApiClient
}

/**
 * Proxy-aware fetch function that automatically uses caching proxy when available
 * 
 * @param url - Request URL
 * @param init - Fetch init options
 * @returns Promise resolving to Response
 */
export async function proxyAwareFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    const apiClient = await getApiClient()
    
    // Convert fetch init to our API config format
    const config: ApiRequestConfig = {
      body: init?.body,
      fetchOptions: init,
      headers: init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {},
      method: (init?.method as any) || 'GET',
      url
    }

    const response = await apiClient.request(config)
    
    // Convert our response back to fetch Response format
    return new Response(
      typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      {
        headers: new Headers(response.headers),
        status: response.status,
        statusText: response.statusText
      }
    )
  } catch (error) {
    // If proxy request fails, fall back to direct fetch
    console.warn('Proxy request failed, falling back to direct fetch:', error)
    return fetch(url, init)
  }
}

/**
 * Create a GitHub API client that automatically uses proxy
 * 
 * @param token - GitHub API token
 * @returns Promise resolving to configured API client
 */
export async function createProxyAwareGitHubClient(token: string): Promise<ApiClient> {
  const proxyManager = ProxyServerManager.getInstance()
  const proxyAvailable = await proxyManager.ensureProxyRunning()
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  }

  return new ApiClient({
    baseUrl: 'https://api.github.com',
    defaultHeaders: headers,
    proxyBaseUrl: proxyAvailable ? 'http://127.0.0.1:3001' : undefined,
    retry: {
      backoffMultiplier: 2,
      initialDelay: 2000,
      maxAttempts: 3,
      maxDelay: 30_000,
      retryOnStatus: [502, 503, 504, 429]
    },
    useProxy: proxyAvailable
  })
}

/**
 * Utility functions for proxy management
 */
export const ProxyUtils = {
  /**
   * Clear proxy cache
   */
  clearProxyCache(domain?: string): void {
    const manager = ProxyServerManager.getInstance()
    const server = manager.getServer()
    server?.clearCache(domain)
  },

  /**
   * Get proxy server health status
   */
  getProxyHealth(): any {
    const manager = ProxyServerManager.getInstance()
    const server = manager.getServer()
    return server?.getHealthStatus()
  },

  /**
   * Get proxy server metrics
   */
  async getProxyMetrics(): Promise<any> {
    const manager = ProxyServerManager.getInstance()
    const server = manager.getServer()
    return server?.getMetrics()
  },

  /**
   * Check if proxy is running
   */
  isProxyRunning(): boolean {
    const manager = ProxyServerManager.getInstance()
    return manager.getServer()?.isRunning() ?? false
  },

  /**
   * Start proxy server manually
   */
  async startProxy(): Promise<boolean> {
    const manager = ProxyServerManager.getInstance()
    return manager.ensureProxyRunning()
  },

  /**
   * Stop proxy server
   */
  async stopProxy(): Promise<void> {
    const manager = ProxyServerManager.getInstance()
    await manager.stopProxy()
  }
}

/**
 * Initialize proxy system with proper shutdown handling
 */
export function initializeProxySystem(): void {
  // Handle graceful shutdown
  const cleanup = async () => {
    console.log('Shutting down proxy system...')
    await ProxyUtils.stopProxy()
    process.exit(0)
  }

  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
  process.on('exit', () => {
    // Synchronous cleanup only
    ProxyUtils.stopProxy().catch(() => {
      // Ignore errors during shutdown
    })
  })
}

// Auto-initialize when module is loaded
initializeProxySystem()