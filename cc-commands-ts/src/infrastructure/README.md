# Production-First API Caching Proxy

A comprehensive, production-ready caching proxy system designed to improve API performance and manage rate limits intelligently.

## Features

### 🚀 Performance
- **Advanced Caching**: LRU cache with ETag/Last-Modified support
- **Request Deduplication**: Prevents duplicate concurrent requests
- **Smart TTL**: Domain-specific cache lifetimes
- **Compression**: Optional response compression

### 🛡️ Rate Limiting
- **Token Bucket Algorithm**: Smooth rate limiting with burst allowance
- **Safety Margins**: Configurable safety buffers (e.g., use 80% of actual limits)
- **Domain-Specific**: Different limits per API domain
- **Production-Safe**: Prevents API limit violations

### 🔧 Production Ready
- **Multi-Environment**: Different configs for prod/dev/test
- **Health Monitoring**: Comprehensive health checks and metrics
- **Error Handling**: Graceful degradation with fallbacks
- **Lifecycle Management**: Proper startup/shutdown handling

### 📊 Monitoring
- **Real-time Metrics**: Request counts, cache hit rates, response times
- **Health Checks**: Component-level health monitoring
- **Performance Tracking**: P95/P99 response times, throughput
- **Alerting**: Configurable health issue detection

## Quick Start

### 1. Basic Usage

```typescript
import { createProxyAwareGitHubClient } from './infrastructure/http/ProxyAwareClient.js'

// Create API client with automatic proxy support
const client = await createProxyAwareGitHubClient('your-github-token')

// Make requests - proxy is transparent
const response = await client.get('/repos/owner/repo')

console.log(`Response time: ${response.cached ? 'cached' : 'fresh'}`)
```

### 2. Manual Proxy Control

```typescript
import { ProxyUtils } from './infrastructure/http/ProxyAwareClient.js'

// Start proxy server
await ProxyUtils.startProxy()

// Check health
const health = ProxyUtils.getProxyHealth()
console.log(`Proxy healthy: ${health.healthy}`)

// Get metrics
const metrics = await ProxyUtils.getProxyMetrics()
console.log(`Cache hit rate: ${metrics.cache.hitRatio}`)

// Clear cache
ProxyUtils.clearProxyCache('api.github.com')

// Stop proxy
await ProxyUtils.stopProxy()
```

### 3. Run Demo

```bash
# Set GitHub token
export GITHUB_TOKEN="your-token-here"

# Run demonstration
npx tsx src/infrastructure/proxy/examples/proxy-demo.ts
```

## Configuration

The proxy automatically detects environment and loads appropriate config:

- **Production**: `config/proxy.production.json` - Conservative caching, rate limiting enabled
- **Development**: `config/proxy.development.json` - Aggressive caching, rate limiting disabled  
- **Test**: `config/proxy.test.json` - Maximum caching, minimal logging

### Example Configuration

```json
{
  "server": {
    "port": 3001,
    "host": "127.0.0.1",
    "timeout": 30000
  },
  "cache": {
    "defaultTtlSeconds": 120,
    "maxSizeBytes": 104857600,
    "etagSupport": true,
    "domains": {
      "api.github.com": {
        "ttlSeconds": 120,
        "conditional": true
      }
    }
  },
  "rateLimit": {
    "enabled": true,
    "domains": {
      "api.github.com": {
        "requestsPerHour": 4000,
        "burstAllowance": 100,
        "safetyMarginPercent": 20
      }
    }
  }
}
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ApiClient     │───▶│  CachingProxy    │───▶│   GitHub API    │
│                 │    │                  │    │                 │
│ - Retry logic   │    │ - LRU Cache      │    │ - Rate limited  │
│ - Error handling│    │ - Rate limiting  │    │ - Real responses│
│ - Transparent   │    │ - Health checks  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

#### ProxyConfigService
- Environment auto-detection
- Configuration validation
- Multi-environment support

#### CacheStore
- LRU eviction with size limits
- ETag/Last-Modified conditional requests
- Request deduplication
- Performance metrics

#### RateLimiter
- Token bucket algorithm
- Domain-specific limits
- Safety margins
- Burst allowance

#### CachingProxyServer
- Express-based HTTP server
- Health check endpoints
- Metrics collection
- Graceful shutdown

#### ApiClient
- Proxy-aware HTTP client
- Automatic retry logic
- Error handling
- Response transformation

## Performance Benefits

### Cache Performance
- **Cache Hits**: ~10-50ms response time
- **Cache Misses**: ~200-800ms response time  
- **Typical Improvement**: 70-95% faster responses

### Rate Limiting Protection
- **Safety Margins**: Prevent limit violations
- **Burst Handling**: Handle traffic spikes
- **Automatic Backoff**: Smart retry behavior

### Resource Efficiency
- **Memory**: ~100MB typical usage
- **CPU**: Minimal overhead
- **Network**: Reduced API calls

## Monitoring & Health

### Health Check Endpoint
```bash
curl http://localhost:3001/health
```

### Metrics Endpoint  
```bash
curl http://localhost:3001/metrics
```

### Cache Management
```bash
# Clear all cache
curl -X DELETE http://localhost:3001/cache

# Clear domain-specific cache
curl -X DELETE http://localhost:3001/cache/api.github.com
```

## Production Deployment

### Requirements
- Node.js 22+
- Available port (default 3001)
- Network access to target APIs

### Environment Variables
```bash
NODE_ENV=production        # Environment detection
GITHUB_TOKEN=token        # API authentication
```

### Monitoring
- Monitor `/health` endpoint
- Track cache hit rates
- Watch for rate limit warnings
- Monitor response times

### Scaling
- Single process handles 1000+ req/sec
- Horizontal scaling via load balancer
- Shared cache layer for multi-instance

## Testing

```bash
# Run proxy infrastructure tests
npm test test/infrastructure/

# Run specific component tests
npm test test/infrastructure/proxy/cache/
npm test test/infrastructure/proxy/rate-limiting/

# Integration tests
npm test test/infrastructure/http/
```

## Development

### Adding New Domains

1. Update proxy configuration:
```json
{
  "cache": {
    "domains": {
      "api.newservice.com": {
        "ttlSeconds": 300,
        "conditional": true
      }
    }
  },
  "rateLimit": {
    "domains": {
      "api.newservice.com": {
        "requestsPerHour": 1000,
        "burstAllowance": 50,
        "safetyMarginPercent": 30
      }
    }
  }
}
```

2. Create domain-specific client:
```typescript
export function createNewServiceClient(token: string): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.newservice.com',
    defaultHeaders: { 'Authorization': `Bearer ${token}` },
    useProxy: true
  })
}
```

### Custom Configurations

Extend configuration types in `ProxyConfig.ts` and add validation logic.

## Troubleshooting

### Common Issues

**Proxy won't start**
- Check port availability
- Verify configuration files
- Check permissions

**Low cache hit rate**
- Review TTL settings
- Check ETag support
- Monitor cache size limits

**Rate limiting too aggressive**
- Adjust safety margins
- Increase burst allowance
- Review domain configuration

**Memory usage high**
- Reduce cache size limits
- Check for memory leaks
- Monitor request patterns

### Debug Mode

Set `NODE_ENV=development` for detailed logging and debug information.

## License

This proxy system is part of the cc-commands-ts project and follows the same license terms.