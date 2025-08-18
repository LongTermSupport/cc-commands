#!/usr/bin/env node

/**
 * @file Proxy Demo Script
 * 
 * Demonstrates the production-first caching proxy system with real GitHub API calls.
 * Shows cache hits, rate limiting, and performance improvements.
 */

import { performance } from 'node:perf_hooks'

import { createProxyAwareGitHubClient , ProxyUtils } from '../../../infrastructure/http/ProxyAwareClient.js'

interface DemoResults {
  directRequests: {
    cached: boolean
    duration: number
  }[]
  proxiedRequests: {
    cached: boolean
    duration: number
  }[]
  proxyMetrics: any
}

/**
 * Demo script to showcase proxy functionality
 */
async function runProxyDemo(): Promise<void> {
  console.log('🚀 Starting Proxy Infrastructure Demo\n')

  // Check if GitHub token is available
  const token = process.env['GITHUB_TOKEN'] || process.env['GH_TOKEN']
  if (!token) {
    console.log('❌ GitHub token required. Set GITHUB_TOKEN or GH_TOKEN environment variable.')
    console.log('   Example: export GITHUB_TOKEN="your-token-here"')
    process.exit(1)
  }

  try {
    // Initialize proxy system
    console.log('🔧 Starting proxy server...')
    const proxyStarted = await ProxyUtils.startProxy()
    
    if (!proxyStarted) {
      console.log('❌ Failed to start proxy server')
      process.exit(1)
    }

    console.log('✅ Proxy server started successfully')
    console.log('🌐 Server running at http://127.0.0.1:3001')
    console.log('')

    // Create API client
    console.log('📡 Creating GitHub API client with proxy awareness...')
    const client = await createProxyAwareGitHubClient(token)
    console.log('✅ API client initialized')
    console.log('')

    // Demo test repository
    const testRepos = [
      'microsoft/TypeScript',
      'nodejs/node',
      'facebook/react'
    ]

    console.log('🧪 Running proxy performance tests...\n')

    const results: DemoResults = {
      directRequests: [],
      proxiedRequests: [],
      proxyMetrics: null
    }

    // Test multiple requests to show caching benefits
    for (let i = 0; i < 2; i++) {
      console.log(`📊 Test Round ${i + 1}/2`)
      
      for (const repo of testRepos) {
        const [owner, name] = repo.split('/')
        console.log(`   Testing: ${repo}`)
        
        const startTime = performance.now()
        try {
          const response = await client.get(`/repos/${owner}/${name}`)
          const duration = performance.now() - startTime
          
          console.log(`   ⏱️  Duration: ${Math.round(duration)}ms | Cache: ${response.fromCache ? '🟢 HIT' : '🔴 MISS'}`)
          
          results.proxiedRequests.push({
            cached: response.fromCache,
            duration: Math.round(duration)
          })
        } catch (error) {
          console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      
      console.log('')
    }

    // Get proxy metrics
    console.log('📈 Retrieving proxy metrics...')
    try {
      results.proxyMetrics = await ProxyUtils.getProxyMetrics()
      console.log('✅ Metrics retrieved successfully')
    } catch {
      console.log('⚠️  Could not retrieve proxy metrics')
    }

    // Display results
    displayResults(results)

    // Cleanup
    console.log('\n🧹 Cleaning up...')
    await ProxyUtils.stopProxy()
    console.log('✅ Proxy server stopped')
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

/**
 * Display comprehensive demo results
 */
function displayResults(results: DemoResults): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 PROXY DEMO RESULTS')
  console.log('='.repeat(60))

  // Performance Analysis
  const totalRequests = results.proxiedRequests.length
  const cacheHits = results.proxiedRequests.filter(r => r.cached).length
  const cacheMisses = totalRequests - cacheHits
  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0

  console.log('\n🎯 Performance Summary:')
  console.log(`   Total Requests: ${totalRequests}`)
  console.log(`   Cache Hits: ${cacheHits} (${hitRate.toFixed(1)}%)`)
  console.log(`   Cache Misses: ${cacheMisses}`)

  // Timing Analysis
  if (results.proxiedRequests.length > 0) {
    const durations = results.proxiedRequests.map(r => r.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const minDuration = Math.min(...durations)
    const maxDuration = Math.max(...durations)

    console.log(`\n⏱️  Response Times:`)
    console.log(`   Average: ${Math.round(avgDuration)}ms`)
    console.log(`   Fastest: ${minDuration}ms`)
    console.log(`   Slowest: ${maxDuration}ms`)

    // Show cache performance benefit
    const cacheHitTimes = results.proxiedRequests.filter(r => r.cached).map(r => r.duration)
    const cacheMissTimes = results.proxiedRequests.filter(r => !r.cached).map(r => r.duration)
    
    if (cacheHitTimes.length > 0 && cacheMissTimes.length > 0) {
      const avgCacheHit = cacheHitTimes.reduce((a, b) => a + b, 0) / cacheHitTimes.length
      const avgCacheMiss = cacheMissTimes.reduce((a, b) => a + b, 0) / cacheMissTimes.length
      const improvement = ((avgCacheMiss - avgCacheHit) / avgCacheMiss) * 100

      console.log(`\n🚀 Cache Performance:`)
      console.log(`   Cache Hit Avg: ${Math.round(avgCacheHit)}ms`)
      console.log(`   Cache Miss Avg: ${Math.round(avgCacheMiss)}ms`)
      console.log(`   Speed Improvement: ${improvement.toFixed(1)}%`)
    }
  }

  // Proxy Health
  const proxyHealth = ProxyUtils.getProxyHealth()
  console.log(`\n🏥 Proxy Health:`)
  console.log(`   Status: ${proxyHealth?.healthy ? '✅ Healthy' : '❌ Unhealthy'}`)
  
  if (proxyHealth?.components) {
    console.log(`   Cache: ${proxyHealth.components.cache.healthy ? '✅' : '❌'}`)
    console.log(`   Rate Limiter: ${proxyHealth.components.rateLimiter.healthy ? '✅' : '❌'}`)
    console.log(`   Server: ${proxyHealth.components.server.healthy ? '✅' : '❌'}`)
  }

  // Detailed Metrics
  if (results.proxyMetrics) {
    console.log(`\n📈 Detailed Metrics:`)
    console.log(`   Total Requests: ${results.proxyMetrics.totalRequests}`)
    console.log(`   Successful: ${results.proxyMetrics.successfulRequests}`)
    console.log(`   Failed: ${results.proxyMetrics.failedRequests}`)
    
    if (results.proxyMetrics.cache) {
      console.log(`   Cache Hit Ratio: ${(results.proxyMetrics.cache.hitRatio * 100).toFixed(1)}%`)
      console.log(`   Cache Size: ${results.proxyMetrics.cache.size} entries`)
    }
    
    if (results.proxyMetrics.performance) {
      console.log(`   Avg Response Time: ${results.proxyMetrics.performance.averageResponseTime}ms`)
      console.log(`   Requests/sec: ${results.proxyMetrics.performance.requestsPerSecond}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Demo completed successfully!')
  console.log('\n💡 Key Benefits Demonstrated:')
  console.log('   • Automatic caching with configurable TTL')
  console.log('   • Transparent proxy integration')
  console.log('   • Rate limiting protection')
  console.log('   • Performance monitoring')
  console.log('   • Production-ready error handling')
  console.log('')
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProxyDemo().catch(error => {
    console.error('Demo failed:', error)
    process.exit(1)
  })
}

export { runProxyDemo }