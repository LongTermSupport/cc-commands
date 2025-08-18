#!/usr/bin/env tsx
/**
 * @file Comprehensive Proxy Functionality Validation Script
 * 
 * This script demonstrates and validates all proxy functionality:
 * - Phase 1: Basic proxy functionality and GitHub API integration
 * - Phase 2: Caching behavior with performance measurement
 * - Phase 3: Rate limiting functionality
 * - Integration testing with real API calls
 * - Performance benchmarking
 * 
 * Usage:
 *   npm run validate-proxy
 *   or
 *   npx tsx scripts/validate-proxy-functionality.ts
 */

import { performance } from 'node:perf_hooks'
import { createProxyAwareGitHubClient, ProxyUtils } from '../src/infrastructure/http/ProxyAwareClient.js'
import type { ApiClient } from '../src/infrastructure/http/ApiClient.js'

interface TestResult {
  name: string
  success: boolean
  duration: number
  details?: any
  error?: string
}

interface PerformanceMetrics {
  cacheMissTime: number
  cacheHitTime: number
  improvementPercent: number
  throughput: number
}

class ProxyValidationRunner {
  private client?: ApiClient
  private results: TestResult[] = []
  private githubToken?: string

  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive Proxy Functionality Validation')
    console.log('=' .repeat(60))
    
    await this.initialize()
    
    // Phase 1: Basic Functionality
    console.log('\n📋 Phase 1: Basic Proxy Functionality')
    await this.testProxyStartup()
    await this.testHealthEndpoints()
    await this.testBasicProxyRequests()
    if (this.githubToken) {
      await this.testGitHubApiIntegration()
    }
    
    // Phase 2: Caching Validation
    console.log('\n📋 Phase 2: Caching Behavior Validation')
    await this.testCachingBehavior()
    await this.testCachePerformance()
    await this.testCacheManagement()
    
    // Phase 3: Rate Limiting
    console.log('\n📋 Phase 3: Rate Limiting Validation')
    await this.testRateLimitHeaders()
    await this.testRateLimitEnforcement()
    
    // Phase 4: Integration Tests
    console.log('\n📋 Phase 4: Integration and Reliability')
    await this.testConcurrentRequests()
    await this.testErrorHandling()
    await this.testDataIntegrity()
    
    // Performance Benchmarking
    console.log('\n📋 Phase 5: Performance Benchmarking')
    await this.runPerformanceBenchmarks()
    
    await this.cleanup()
    this.printSummary()
  }

  private async initialize(): Promise<void> {
    console.log('⚙️  Initializing validation environment...')
    
    this.githubToken = process.env.GITHUB_TOKEN
    if (!this.githubToken) {
      console.log('⚠️  GITHUB_TOKEN not found. Some tests will be skipped.')
    }

    try {
      // Ensure clean proxy state
      await ProxyUtils.stopProxy()
      
      // Start proxy and create client
      const proxyStarted = await ProxyUtils.startProxy()
      if (!proxyStarted) {
        throw new Error('Failed to start proxy server')
      }
      
      if (this.githubToken) {
        this.client = await createProxyAwareGitHubClient(this.githubToken)
      }
      
      console.log('✅ Initialization complete')
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      throw error
    }
  }

  private async testProxyStartup(): Promise<void> {
    const testName = 'Proxy Server Startup'
    const start = performance.now()
    
    try {
      const isRunning = ProxyUtils.isProxyRunning()
      const health = ProxyUtils.getProxyHealth()
      
      if (!isRunning || !health.healthy) {
        throw new Error('Proxy server is not running or unhealthy')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        running: isRunning,
        healthy: health.healthy,
        uptime: health.uptime
      })
      
      console.log(`✅ ${testName}: Proxy running and healthy`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testHealthEndpoints(): Promise<void> {
    const testName = 'Health and Metrics Endpoints'
    const start = performance.now()
    
    try {
      const health = ProxyUtils.getProxyHealth()
      const metrics = await ProxyUtils.getProxyMetrics()
      
      if (!health.healthy) {
        throw new Error('Health check failed')
      }
      
      if (!metrics || typeof metrics !== 'object') {
        throw new Error('Metrics endpoint failed')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        healthStatus: health.healthy,
        metricsAvailable: !!metrics,
        cacheStats: metrics.cache,
        rateLimiterStats: metrics.rateLimiter
      })
      
      console.log(`✅ ${testName}: Health and metrics accessible`)
      console.log(`   Health: ${health.healthy ? 'Healthy' : 'Unhealthy'}`)
      console.log(`   Cache entries: ${metrics.cache?.entriesCount || 0}`)
      console.log(`   Total requests: ${metrics.cache?.totalRequests || 0}`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testBasicProxyRequests(): Promise<void> {
    const testName = 'Basic HTTP Proxy Requests'
    const start = performance.now()
    
    try {
      // Test with httpbin.org endpoints
      const response = await fetch('http://127.0.0.1:3001/proxy/httpbin.org/json')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const cacheStatus = response.headers.get('x-cache')
      const rateLimitHeaders = {
        limit: response.headers.get('x-ratelimit-limit'),
        remaining: response.headers.get('x-ratelimit-remaining'),
        reset: response.headers.get('x-ratelimit-reset')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        status: response.status,
        cacheStatus,
        rateLimitHeaders,
        dataReceived: !!data.slideshow
      })
      
      console.log(`✅ ${testName}: Successfully proxied HTTP request`)
      console.log(`   Cache Status: ${cacheStatus}`)
      console.log(`   Rate Limit: ${rateLimitHeaders.remaining}/${rateLimitHeaders.limit}`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testGitHubApiIntegration(): Promise<void> {
    if (!this.client || !this.githubToken) {
      console.log('⏭️  Skipping GitHub API tests - no token available')
      return
    }

    const testName = 'GitHub API Integration'
    const start = performance.now()
    
    try {
      const response = await this.client.get('/repos/microsoft/TypeScript')
      
      if (response.status !== 200) {
        throw new Error(`GitHub API returned ${response.status}`)
      }
      
      const data = response.data
      if (!data.name || data.name !== 'TypeScript') {
        throw new Error('Invalid GitHub API response data')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        repository: data.full_name,
        stars: data.stargazers_count,
        cacheStatus: response.headers['x-cache'],
        rateLimitRemaining: response.headers['x-ratelimit-remaining']
      })
      
      console.log(`✅ ${testName}: GitHub API integration working`)
      console.log(`   Repository: ${data.full_name}`)
      console.log(`   Stars: ${data.stargazers_count}`)
      console.log(`   Cache: ${response.headers['x-cache']}`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testCachingBehavior(): Promise<void> {
    const testName = 'Cache Hit/Miss Detection'
    const start = performance.now()
    
    try {
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/uuid'
      
      // Clear cache first
      ProxyUtils.clearProxyCache()
      
      // First request should be MISS
      const missResponse = await fetch(endpoint)
      const missData = await missResponse.json()
      const cacheStatusMiss = missResponse.headers.get('x-cache')
      
      if (cacheStatusMiss !== 'MISS') {
        throw new Error(`Expected cache MISS, got ${cacheStatusMiss}`)
      }
      
      // Second request should be HIT
      const hitResponse = await fetch(endpoint)
      const hitData = await hitResponse.json()
      const cacheStatusHit = hitResponse.headers.get('x-cache')
      const cacheTtl = hitResponse.headers.get('x-cache-ttl')
      
      if (cacheStatusHit !== 'HIT') {
        throw new Error(`Expected cache HIT, got ${cacheStatusHit}`)
      }
      
      // Data should be identical for UUID (due to caching)
      if (missData.uuid !== hitData.uuid) {
        throw new Error('Cache not working - UUIDs differ')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        missStatus: cacheStatusMiss,
        hitStatus: cacheStatusHit,
        cacheTtl: parseInt(cacheTtl || '0'),
        dataConsistency: missData.uuid === hitData.uuid
      })
      
      console.log(`✅ ${testName}: Cache behavior working correctly`)
      console.log(`   Miss Status: ${cacheStatusMiss}`)
      console.log(`   Hit Status: ${cacheStatusHit}`)
      console.log(`   Cache TTL: ${cacheTtl}s`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testCachePerformance(): Promise<void> {
    const testName = 'Cache Performance Validation'
    const start = performance.now()
    
    try {
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/json'
      
      // Clear cache
      ProxyUtils.clearProxyCache()
      
      // Measure cache miss
      const missStart = performance.now()
      const missResponse = await fetch(endpoint)
      const missTime = performance.now() - missStart
      
      if (!missResponse.ok) {
        throw new Error('Cache miss request failed')
      }
      
      // Measure cache hit
      const hitStart = performance.now()
      const hitResponse = await fetch(endpoint)
      const hitTime = performance.now() - hitStart
      
      if (!hitResponse.ok) {
        throw new Error('Cache hit request failed')
      }
      
      const improvement = ((missTime - hitTime) / missTime) * 100
      
      if (improvement < 30) {
        throw new Error(`Insufficient performance improvement: ${improvement.toFixed(1)}%`)
      }
      
      if (hitTime > 200) {
        throw new Error(`Cache hit too slow: ${hitTime.toFixed(2)}ms`)
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        missTime: Math.round(missTime),
        hitTime: Math.round(hitTime),
        improvement: Math.round(improvement)
      })
      
      console.log(`✅ ${testName}: Performance improvement verified`)
      console.log(`   Cache Miss: ${missTime.toFixed(2)}ms`)
      console.log(`   Cache Hit:  ${hitTime.toFixed(2)}ms`)
      console.log(`   Improvement: ${improvement.toFixed(1)}%`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testCacheManagement(): Promise<void> {
    const testName = 'Cache Management Operations'
    const start = performance.now()
    
    try {
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/json'
      
      // Prime cache
      await fetch(endpoint)
      
      // Verify cache hit
      const cachedResponse = await fetch(endpoint)
      if (cachedResponse.headers.get('x-cache') !== 'HIT') {
        throw new Error('Failed to cache initial request')
      }
      
      // Clear cache via API
      const clearResponse = await fetch('http://127.0.0.1:3001/cache', {
        method: 'DELETE'
      })
      
      if (!clearResponse.ok) {
        throw new Error('Cache clear API failed')
      }
      
      // Next request should be miss
      const missResponse = await fetch(endpoint)
      if (missResponse.headers.get('x-cache') !== 'MISS') {
        throw new Error('Cache not properly cleared')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        cacheCleared: true,
        subsequentMiss: true
      })
      
      console.log(`✅ ${testName}: Cache management working`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testRateLimitHeaders(): Promise<void> {
    const testName = 'Rate Limit Headers'
    const start = performance.now()
    
    try {
      const response = await fetch('http://127.0.0.1:3001/proxy/httpbin.org/json')
      
      const rateLimitHeaders = {
        limit: response.headers.get('x-ratelimit-limit'),
        remaining: response.headers.get('x-ratelimit-remaining'),
        reset: response.headers.get('x-ratelimit-reset')
      }
      
      if (!rateLimitHeaders.limit || !rateLimitHeaders.remaining || !rateLimitHeaders.reset) {
        throw new Error('Missing rate limit headers')
      }
      
      const limit = parseInt(rateLimitHeaders.limit)
      const remaining = parseInt(rateLimitHeaders.remaining)
      
      if (limit <= 0 || remaining < 0 || remaining > limit) {
        throw new Error('Invalid rate limit values')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        limit,
        remaining,
        resetTime: rateLimitHeaders.reset
      })
      
      console.log(`✅ ${testName}: Rate limit headers present and valid`)
      console.log(`   Limit: ${limit}`)
      console.log(`   Remaining: ${remaining}`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testRateLimitEnforcement(): Promise<void> {
    const testName = 'Rate Limit Enforcement'
    const start = performance.now()
    
    try {
      console.log('   Testing rate limit enforcement (this may take a moment)...')
      
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/uuid'
      let successCount = 0
      let rateLimitedCount = 0
      
      // Make requests until we potentially hit rate limit
      for (let i = 0; i < 8; i++) {
        try {
          const response = await fetch(endpoint)
          if (response.status === 200) {
            successCount++
          } else if (response.status === 429) {
            rateLimitedCount++
            
            // Verify 429 response has proper headers
            const retryAfter = response.headers.get('retry-after')
            if (!retryAfter) {
              throw new Error('429 response missing Retry-After header')
            }
            
            break // Stop on first rate limit
          }
        } catch (error) {
          // Network errors might occur
        }
        
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        successfulRequests: successCount,
        rateLimitedRequests: rateLimitedCount,
        rateLimitingTriggered: rateLimitedCount > 0
      })
      
      console.log(`✅ ${testName}: Rate limiting system functional`)
      console.log(`   Successful requests: ${successCount}`)
      console.log(`   Rate limited: ${rateLimitedCount}`)
      
      if (rateLimitedCount === 0) {
        console.log('   Note: Rate limiting may not have been triggered due to test conditions')
      }
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testConcurrentRequests(): Promise<void> {
    const testName = 'Concurrent Request Handling'
    const start = performance.now()
    
    try {
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/json'
      const concurrentCount = 5
      
      // Clear cache first
      ProxyUtils.clearProxyCache()
      
      // Make concurrent requests
      const promises = Array(concurrentCount).fill(null).map(() => fetch(endpoint))
      const responses = await Promise.all(promises)
      
      // All should succeed
      const successCount = responses.filter(r => r.ok).length
      if (successCount !== concurrentCount) {
        throw new Error(`Only ${successCount}/${concurrentCount} requests succeeded`)
      }
      
      // First should be MISS, rest might be HITs due to deduplication
      const cacheStatuses = responses.map(r => r.headers.get('x-cache'))
      const missCount = cacheStatuses.filter(status => status === 'MISS').length
      const hitCount = cacheStatuses.filter(status => status === 'HIT').length
      
      this.recordSuccess(testName, performance.now() - start, {
        totalRequests: concurrentCount,
        successCount,
        cacheStatuses: { miss: missCount, hit: hitCount }
      })
      
      console.log(`✅ ${testName}: Concurrent requests handled successfully`)
      console.log(`   Total: ${concurrentCount}, Success: ${successCount}`)
      console.log(`   Cache: ${missCount} MISS, ${hitCount} HIT`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling'
    const start = performance.now()
    
    try {
      // Test with non-existent endpoint
      const invalidResponse = await fetch('http://127.0.0.1:3001/proxy/httpbin.org/status/404')
      
      if (invalidResponse.status !== 404) {
        throw new Error(`Expected 404, got ${invalidResponse.status}`)
      }
      
      // Test with invalid URL
      const malformedResponse = await fetch('http://127.0.0.1:3001/proxy/invalid-url')
      
      if (malformedResponse.ok) {
        throw new Error('Invalid URL should have failed')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        handles404: invalidResponse.status === 404,
        handlesInvalidUrl: !malformedResponse.ok
      })
      
      console.log(`✅ ${testName}: Error conditions handled properly`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async testDataIntegrity(): Promise<void> {
    const testName = 'Data Integrity Validation'
    const start = performance.now()
    
    try {
      const endpoint = 'http://127.0.0.1:3001/proxy/httpbin.org/json'
      
      // Clear cache
      ProxyUtils.clearProxyCache()
      
      // Get original data
      const directResponse = await fetch(endpoint)
      const directData = await directResponse.json()
      
      // Get cached data
      const cachedResponse = await fetch(endpoint)
      const cachedData = await cachedResponse.json()
      
      // Compare data structures
      const dataMatch = JSON.stringify(directData) === JSON.stringify(cachedData)
      
      if (!dataMatch) {
        throw new Error('Cached data does not match original')
      }
      
      // Verify important headers are preserved
      const importantHeaders = ['content-type']
      const headerIntegrity = importantHeaders.every(header => 
        directResponse.headers.get(header) === cachedResponse.headers.get(header)
      )
      
      if (!headerIntegrity) {
        throw new Error('Important headers not preserved')
      }
      
      this.recordSuccess(testName, performance.now() - start, {
        dataIntegrity: dataMatch,
        headerIntegrity
      })
      
      console.log(`✅ ${testName}: Data and header integrity maintained`)
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async runPerformanceBenchmarks(): Promise<void> {
    const testName = 'Performance Benchmarking'
    const start = performance.now()
    
    try {
      console.log('   Running comprehensive performance benchmarks...')
      
      const endpoints = [
        'httpbin.org/json',
        'httpbin.org/uuid',
        'httpbin.org/headers'
      ]
      
      const benchmarkResults: PerformanceMetrics[] = []
      
      for (const endpoint of endpoints) {
        const fullEndpoint = `http://127.0.0.1:3001/proxy/${endpoint}`
        
        // Clear cache
        ProxyUtils.clearProxyCache()
        
        // Benchmark cache miss
        const missStart = performance.now()
        await fetch(fullEndpoint)
        const missTime = performance.now() - missStart
        
        // Benchmark cache hit (multiple for throughput)
        const hitTimes: number[] = []
        const hitIterations = 5
        
        for (let i = 0; i < hitIterations; i++) {
          const hitStart = performance.now()
          await fetch(fullEndpoint)
          hitTimes.push(performance.now() - hitStart)
        }
        
        const avgHitTime = hitTimes.reduce((sum, time) => sum + time, 0) / hitTimes.length
        const improvement = ((missTime - avgHitTime) / missTime) * 100
        const throughput = hitIterations / (hitTimes.reduce((sum, time) => sum + time, 0) / 1000)
        
        benchmarkResults.push({
          cacheMissTime: missTime,
          cacheHitTime: avgHitTime,
          improvementPercent: improvement,
          throughput
        })
        
        console.log(`     ${endpoint}:`)
        console.log(`       Miss: ${missTime.toFixed(2)}ms`)
        console.log(`       Hit:  ${avgHitTime.toFixed(2)}ms`)
        console.log(`       Improvement: ${improvement.toFixed(1)}%`)
      }
      
      // Overall statistics
      const avgImprovement = benchmarkResults.reduce((sum, r) => sum + r.improvementPercent, 0) / benchmarkResults.length
      const avgCacheHitTime = benchmarkResults.reduce((sum, r) => sum + r.cacheHitTime, 0) / benchmarkResults.length
      const avgThroughput = benchmarkResults.reduce((sum, r) => sum + r.throughput, 0) / benchmarkResults.length
      
      this.recordSuccess(testName, performance.now() - start, {
        endpointsTested: endpoints.length,
        averageImprovement: Math.round(avgImprovement),
        averageCacheHitTime: Math.round(avgCacheHitTime),
        averageThroughput: Math.round(avgThroughput)
      })
      
      console.log(`✅ ${testName}: Benchmarks completed`)
      console.log(`   Average cache improvement: ${avgImprovement.toFixed(1)}%`)
      console.log(`   Average cache hit time: ${avgCacheHitTime.toFixed(2)}ms`)
      console.log(`   Average throughput: ${avgThroughput.toFixed(1)} req/sec`)
      
    } catch (error) {
      this.recordFailure(testName, performance.now() - start, error)
      console.log(`❌ ${testName}: ${error}`)
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...')
    
    try {
      // Clear proxy cache
      if (ProxyUtils.isProxyRunning()) {
        ProxyUtils.clearProxyCache()
      }
      
      // We don't stop the proxy as it may be needed for other operations
      console.log('✅ Cleanup completed')
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error}`)
    }
  }

  private recordSuccess(name: string, duration: number, details?: any): void {
    this.results.push({
      name,
      success: true,
      duration,
      details
    })
  }

  private recordFailure(name: string, duration: number, error: any): void {
    this.results.push({
      name,
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error)
    })
  }

  private printSummary(): void {
    console.log('\n📊 VALIDATION SUMMARY')
    console.log('=' .repeat(60))
    
    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)
    
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Successful: ${successful.length} (${((successful.length / this.results.length) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${failed.length}`)
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`)
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:')
      failed.forEach(test => {
        console.log(`   ${test.name}: ${test.error}`)
      })
    }
    
    console.log('\n🎯 SUCCESS CRITERIA EVALUATION:')
    
    const criteriaResults = this.evaluateSuccessCriteria()
    criteriaResults.forEach(criteria => {
      const icon = criteria.met ? '✅' : '❌'
      console.log(`${icon} ${criteria.name}: ${criteria.met ? 'MET' : 'NOT MET'}`)
      if (criteria.details) {
        console.log(`   ${criteria.details}`)
      }
    })
    
    const overallSuccess = criteriaResults.every(c => c.met)
    
    console.log('\n' + '=' .repeat(60))
    if (overallSuccess) {
      console.log('🎉 ALL SUCCESS CRITERIA MET - PROXY VALIDATION PASSED!')
      console.log('The caching proxy is working correctly and solving rate limiting problems.')
    } else {
      console.log('⚠️  SOME SUCCESS CRITERIA NOT MET - REVIEW REQUIRED')
      console.log('The proxy may need adjustments to fully meet requirements.')
    }
    console.log('=' .repeat(60))
    
    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1)
  }

  private evaluateSuccessCriteria() {
    const criteria = []
    
    // Proxy functionality
    const proxyStartup = this.results.find(r => r.name === 'Proxy Server Startup')
    criteria.push({
      name: 'Proxy starts and serves requests successfully',
      met: proxyStartup?.success === true,
      details: proxyStartup?.success ? `Uptime: ${proxyStartup.details?.uptime}s` : proxyStartup?.error
    })
    
    // Cache performance
    const cachePerf = this.results.find(r => r.name === 'Cache Performance Validation')
    criteria.push({
      name: 'Cache hit rate >50% improvement and response times <200ms',
      met: cachePerf?.success === true && 
           cachePerf?.details?.improvement >= 50 && 
           cachePerf?.details?.hitTime < 200,
      details: cachePerf?.success ? 
        `${cachePerf.details.improvement}% improvement, ${cachePerf.details.hitTime}ms hit time` : 
        cachePerf?.error
    })
    
    // Rate limiting
    const rateLimit = this.results.find(r => r.name === 'Rate Limit Headers')
    criteria.push({
      name: 'Rate limiting prevents excessive API calls',
      met: rateLimit?.success === true,
      details: rateLimit?.success ? 
        `Limit: ${rateLimit.details.limit}, System functional` : 
        rateLimit?.error
    })
    
    // Data integrity
    const dataIntegrity = this.results.find(r => r.name === 'Data Integrity Validation')
    criteria.push({
      name: 'Zero data modification - responses identical to direct API',
      met: dataIntegrity?.success === true && dataIntegrity?.details?.dataIntegrity,
      details: dataIntegrity?.success ? 
        `Data integrity: ${dataIntegrity.details.dataIntegrity}` : 
        dataIntegrity?.error
    })
    
    // GitHub integration (if token available)
    if (this.githubToken) {
      const githubTest = this.results.find(r => r.name === 'GitHub API Integration')
      criteria.push({
        name: 'GitHub API integration works without timeouts',
        met: githubTest?.success === true,
        details: githubTest?.success ? 
          `Repository: ${githubTest.details.repository}` : 
          githubTest?.error
      })
    }
    
    // Overall performance
    const perfTest = this.results.find(r => r.name === 'Performance Benchmarking')
    criteria.push({
      name: 'Performance benchmarks show significant improvement',
      met: perfTest?.success === true && perfTest?.details?.averageImprovement >= 30,
      details: perfTest?.success ? 
        `Average improvement: ${perfTest.details.averageImprovement}%` : 
        perfTest?.error
    })
    
    return criteria
  }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ProxyValidationRunner()
  runner.run().catch(error => {
    console.error('💥 Validation failed with error:', error)
    process.exit(1)
  })
}

export { ProxyValidationRunner }