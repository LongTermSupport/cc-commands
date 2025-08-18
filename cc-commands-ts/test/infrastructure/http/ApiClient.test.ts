/**
 * @file Tests for ApiClient
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClient, createGitHubApiClient } from '../../../src/infrastructure/http/ApiClient.js'

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    apiClient = new ApiClient({
      baseUrl: 'https://api.example.com',
      defaultTimeout: 5000,
      useProxy: false // Disable proxy for unit tests
    })
  })

  describe('basic HTTP methods', () => {
    it('should make GET requests', async () => {
      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'test' }),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.get('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'cc-commands-ts/api-client/1.0.0'
          }),
          method: 'GET'
        })
      )

      expect(response.status).toBe(200)
      expect(response.data).toEqual({ id: 1, name: 'test' })
      expect(response.fromCache).toBe(false)
    })

    it('should make POST requests with body', async () => {
      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 2, name: 'created' }),
        ok: true,
        status: 201,
        statusText: 'Created'
      }
      mockFetch.mockResolvedValue(mockResponse)

      const postData = { name: 'new user' }
      const response = await apiClient.post('/users', postData)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          method: 'POST'
        })
      )

      expect(response.status).toBe(201)
      expect(response.data).toEqual({ id: 2, name: 'created' })
    })

    it('should make PUT requests', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({ updated: true }),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.put('/users/1', { name: 'updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })

    it('should make DELETE requests', async () => {
      const mockResponse = {
        headers: new Headers(),
        ok: true,
        status: 204,
        statusText: 'No Content',
        text: vi.fn().mockResolvedValue('')
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.delete('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )

      expect(response.status).toBe(204)
    })

    it('should make PATCH requests', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({ patched: true }),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.patch('/users/1', { name: 'patched' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })
  })

  describe('request configuration', () => {
    it('should merge base URL with relative paths', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.get('https://other-api.com/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://other-api.com/test',
        expect.any(Object)
      )
    })

    it('should add query parameters', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.get('/search', {
        params: { limit: '10', q: 'test query' }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/search?q=test+query&limit=10',
        expect.any(Object)
      )
    })

    it('should merge custom headers with defaults', async () => {
      const mockResponse = {
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await apiClient.get('/test', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom': 'value'
        }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Authorization': 'Bearer token123',
            'User-Agent': 'cc-commands-ts/api-client/1.0.0',
            'X-Custom': 'value'
          })
        })
      )
    })
  })

  describe('response handling', () => {
    it('should handle JSON responses', async () => {
      const jsonData = { data: [1, 2, 3], message: 'success' }
      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(jsonData),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.get('/data')

      expect(response.data).toEqual(jsonData)
      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('application/json')
    })

    it('should handle text responses', async () => {
      const textData = 'plain text response'
      const mockResponse = {
        headers: new Headers({ 'content-type': 'text/plain' }),
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue(textData)
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.get('/text')

      expect(response.data).toBe(textData)
    })

    it('should handle binary responses', async () => {
      const binaryData = new ArrayBuffer(8)
      const mockResponse = {
        arrayBuffer: vi.fn().mockResolvedValue(binaryData),
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.get('/binary')

      expect(response.data).toBe(binaryData)
    })

    it('should detect cache hits from headers', async () => {
      const mockResponse = {
        headers: new Headers({ 'x-cache': 'HIT' }),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      const response = await apiClient.get('/cached')

      expect(response.fromCache).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      const mockResponse = {
        headers: new Headers(),
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('Resource not found')
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(apiClient.get('/nonexistent')).rejects.toThrow('HTTP 404: Not Found - Resource not found')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Request failed after all retry attempts')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

      await expect(apiClient.get('/test')).rejects.toThrow('Request failed after all retry attempts')
    })

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        ok: true,
        status: 200,
        statusText: 'OK'
      }
      mockFetch.mockResolvedValue(mockResponse)

      await expect(apiClient.get('/invalid-json')).rejects.toThrow('Failed to parse response')
    })
  })

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({ success: true }),
          ok: true,
          status: 200,
          statusText: 'OK'
        })

      const response = await apiClient.get('/flaky-endpoint')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(response.data).toEqual({ success: true })
    })

    it('should retry on specific HTTP status codes', async () => {
      // First call returns 503, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          headers: new Headers(),
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          text: vi.fn().mockResolvedValue('')
        })
        .mockResolvedValueOnce({
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({ success: true }),
          ok: true,
          status: 200,
          statusText: 'OK'
        })

      const response = await apiClient.get('/service')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(response.data).toEqual({ success: true })
    })

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValue({
        headers: new Headers(),
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid request')
      })

      await expect(apiClient.get('/bad-request')).rejects.toThrow('HTTP 400')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should respect maximum retry attempts', async () => {
      const retryClient = new ApiClient({
        retry: {
          backoffMultiplier: 2,
          initialDelay: 10,
          maxAttempts: 2,
          maxDelay: 100,
          retryOnStatus: [503]
        },
        useProxy: false
      })

      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(retryClient.get('/test')).rejects.toThrow()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('proxy support', () => {
    it('should check proxy availability', async () => {
      const proxyClient = new ApiClient({
        proxyBaseUrl: 'http://localhost:3001',
        useProxy: true
      })

      // Mock proxy health check
      mockFetch.mockResolvedValue({
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({}),
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      const available = await proxyClient.isProxyAvailable()

      expect(available).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should handle proxy unavailability gracefully', async () => {
      const proxyClient = new ApiClient({
        proxyBaseUrl: 'http://localhost:3001',
        useProxy: true
      })

      mockFetch.mockRejectedValue(new Error('Connection refused'))

      const available = await proxyClient.isProxyAvailable()

      expect(available).toBe(false)
    })
  })
})

describe('createGitHubApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create client with GitHub-specific configuration', () => {
    const client = createGitHubApiClient('token123')

    expect(client).toBeInstanceOf(ApiClient)
    // Can't easily test internal config, but we can test it doesn't throw
  })

  it('should create client without token', () => {
    const client = createGitHubApiClient()

    expect(client).toBeInstanceOf(ApiClient)
  })
})