# Service Patterns

## Service Architecture

Services handle all business logic and external interactions. They:
1. Implement clear interfaces
2. Return strongly-typed DTOs
3. Handle errors with context
4. Are stateless and reusable

## Basic Service Pattern

```typescript
// src/interfaces/IDataService.ts
export interface IDataService {
  /**
   * Fetch data by ID
   * @param id - The resource ID
   * @returns The resource data
   * @throws {CommandError} If resource not found
   */
  fetchData(id: string): Promise<DataDTO>
  
  /**
   * List all data items
   * @param options - Filter options
   * @returns Array of data items
   */
  listData(options?: ListOptions): Promise<DataDTO[]>
}

// src/services/DataService.ts
export class DataService implements IDataService {
  constructor(
    private readonly apiClient: IApiClient,
    private readonly cache?: ICache
  ) {}
  
  async fetchData(id: string): Promise<DataDTO> {
    // Check cache first
    if (this.cache) {
      const cached = await this.cache.get(`data:${id}`)
      if (cached) {
        return DataDTO.fromJSON(cached)
      }
    }
    
    // Fetch from API
    try {
      const response = await this.apiClient.get(`/data/${id}`)
      
      if (!response.data) {
        throw new CommandError(`Data ${id} not found`, {
          recovery: 'Check the ID and try again',
          context: { id }
        })
      }
      
      const dto = DataDTO.fromApiResponse(response.data)
      
      // Cache result
      if (this.cache) {
        await this.cache.set(`data:${id}`, dto.toJSON())
      }
      
      return dto
    } catch (error) {
      if (error instanceof CommandError) {
        throw error
      }
      
      throw new CommandError('Failed to fetch data', {
        cause: error,
        recovery: 'Check your network connection and API key',
        context: { id }
      })
    }
  }
  
  async listData(options?: ListOptions): Promise<DataDTO[]> {
    const response = await this.apiClient.get('/data', {
      params: options
    })
    
    return response.data.map((item: any) => 
      DataDTO.fromApiResponse(item)
    )
  }
}
```

## Common Service Patterns

### 1. API Wrapper Service

```typescript
export class GitHubApiService implements IGitHubApiService {
  private readonly octokit: Octokit
  
  constructor(options: { auth?: string }) {
    this.octokit = new Octokit({
      auth: options.auth,
      userAgent: 'cc-commands/1.0'
    })
  }
  
  async getRepository(owner: string, repo: string): Promise<RepositoryDTO> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo })
      return RepositoryDTO.fromGitHubResponse(data)
    } catch (error: any) {
      if (error.status === 404) {
        throw new CommandError(`Repository ${owner}/${repo} not found`, {
          recovery: 'Check the repository name and your access permissions',
          context: { owner, repo }
        })
      }
      
      if (error.status === 403 && error.message.includes('rate limit')) {
        throw new CommandError('GitHub API rate limit exceeded', {
          recovery: 'Wait an hour or provide a GitHub token with --token',
          context: { resetAt: error.headers['x-ratelimit-reset'] }
        })
      }
      
      throw new CommandError('GitHub API error', {
        cause: error,
        recovery: 'Check your network and GitHub status',
        context: { owner, repo, status: error.status }
      })
    }
  }
}
```

### 2. Data Collection Service

```typescript
export class DataCollectionService implements IDataCollectionService {
  constructor(
    private readonly apiService: IApiService,
    private readonly logger?: ILogger
  ) {}
  
  async collectProjectData(
    projectId: string,
    options: CollectionOptions
  ): Promise<ProjectDataDTO> {
    this.logger?.debug('Starting data collection', { projectId, options })
    
    // Parallel data fetching
    const [basicData, metrics, activity] = await Promise.all([
      this.apiService.getProject(projectId),
      this.apiService.getProjectMetrics(projectId, options.days),
      this.apiService.getProjectActivity(projectId, options.days)
    ])
    
    // Transform to DTO
    const projectData = new ProjectDataDTO(
      basicData.name,
      basicData.description,
      metrics.totalCommits,
      metrics.activeContributors,
      activity.recentEvents
    )
    
    this.logger?.debug('Data collection complete', { 
      projectId,
      dataPoints: projectData.toLLMData()
    })
    
    return projectData
  }
}
```

### 3. Orchestration Service

```typescript
export class ValidationOrchestrationService implements IOrchestrationService {
  constructor(
    private readonly validator: IValidator,
    private readonly envChecker: IEnvironmentChecker
  ) {}
  
  async execute(input: OrchestrationInput): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    try {
      // Check environment
      const envResult = await this.envChecker.checkRequirements(
        input.params.requiredTools || [],
        input.params.requiredEnvVars || []
      )
      
      const envDto = new EnvironmentValidationDTO(
        envResult.isValid,
        envResult.missingTools,
        envResult.missingEnvVars
      )
      
      result.addDataFromDTO(envDto)
      
      if (!envResult.isValid) {
        result.addError('Environment validation failed')
        result.addInstruction('Install missing tools and set required environment variables')
      }
      
      result.addAction('Environment validation', 
        envResult.isValid ? 'success' : 'failed'
      )
      
    } catch (error) {
      result.setError(error)
      result.addAction('Environment validation', 'error')
    }
    
    return result
  }
}
```

### 4. Caching Service

```typescript
export class CacheService implements ICacheService {
  private cache: Map<string, CacheEntry> = new Map()
  
  async get<T extends ILLMDataDTO>(
    key: string,
    dtoClass: new (...args: any[]) => T
  ): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return dtoClass.fromJSON(entry.data)
  }
  
  async set(
    key: string,
    dto: ILLMDataDTO,
    ttlSeconds: number = 3600
  ): Promise<void> {
    this.cache.set(key, {
      data: dto.toJSON(),
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }
}
```

## Error Handling Patterns

### 1. Wrap External Errors

```typescript
async callExternalApi(): Promise<DataDTO> {
  try {
    const response = await fetch(url)
    return DataDTO.fromResponse(response)
  } catch (error) {
    // Don't leak internal errors
    throw new CommandError('External API call failed', {
      cause: error,
      recovery: 'Check your network connection',
      context: { url }
    })
  }
}
```

### 2. Fail Fast with Context

```typescript
async processData(input: unknown): Promise<ProcessedDTO> {
  // Validate input immediately
  if (!isValidInput(input)) {
    throw new CommandError('Invalid input format', {
      recovery: 'Provide input in JSON format',
      context: { receivedType: typeof input }
    })
  }
  
  // Process with confidence
  return ProcessedDTO.fromInput(input)
}
```

### 3. Rate Limit Handling

```typescript
async fetchWithRetry(url: string): Promise<any> {
  let attempts = 0
  const maxAttempts = 3
  
  while (attempts < maxAttempts) {
    try {
      return await this.fetch(url)
    } catch (error: any) {
      attempts++
      
      if (error.status === 429) {
        const resetTime = error.headers['x-ratelimit-reset']
        const waitTime = resetTime ? resetTime - Date.now() : 60000
        
        if (attempts < maxAttempts) {
          await this.delay(waitTime)
          continue
        }
        
        throw new CommandError('Rate limit exceeded', {
          recovery: `Wait ${Math.ceil(waitTime / 1000)} seconds or provide an API token`,
          context: { resetTime, attempts }
        })
      }
      
      throw error
    }
  }
}
```

## Testing Services

### 1. Mock External Dependencies

```typescript
describe('DataService', () => {
  it('should fetch and cache data', async () => {
    const mockApiClient: IApiClient = {
      get: vi.fn().mockResolvedValue({
        data: { id: '123', name: 'Test', value: 42 }
      })
    }
    
    const mockCache: ICache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn()
    }
    
    const service = new DataService(mockApiClient, mockCache)
    const result = await service.fetchData('123')
    
    expect(result).toBeInstanceOf(DataDTO)
    expect(result.id).toBe('123')
    expect(mockCache.set).toHaveBeenCalledWith(
      'data:123',
      expect.any(Object)
    )
  })
})
```

### 2. Test Error Scenarios

```typescript
it('should handle 404 errors', async () => {
  const mockApiClient: IApiClient = {
    get: vi.fn().mockRejectedValue({
      status: 404,
      message: 'Not found'
    })
  }
  
  const service = new DataService(mockApiClient)
  
  await expect(service.fetchData('999')).rejects.toThrow(
    'Data 999 not found'
  )
})
```

### 3. Test DTO Transformations

```typescript
it('should transform API response to DTO', () => {
  const apiResponse = {
    id: '123',
    attributes: {
      name: 'Test',
      created_at: '2025-01-01T00:00:00Z'
    }
  }
  
  const dto = DataDTO.fromApiResponse(apiResponse)
  
  expect(dto.id).toBe('123')
  expect(dto.name).toBe('Test')
  expect(dto.createdAt).toBeInstanceOf(Date)
})
```

## Service Best Practices

1. **Single Responsibility** - Each service does one thing well
2. **Interface First** - Define the contract before implementation
3. **DTO Returns** - Always return DTOs, not raw data
4. **Error Context** - Include recovery instructions and context
5. **Stateless** - Services should not maintain state between calls
6. **Testable** - Accept dependencies via constructor
7. **Async by Default** - All methods return promises

## Anti-Patterns to Avoid

❌ **Returning raw API responses**
```typescript
// Bad
async getData() {
  return await this.api.get('/data')
}

// Good
async getData(): Promise<DataDTO> {
  const response = await this.api.get('/data')
  return DataDTO.fromApiResponse(response)
}
```

❌ **Swallowing errors**
```typescript
// Bad
try {
  return await this.api.call()
} catch {
  return null  // Lost error context!
}

// Good
try {
  return await this.api.call()
} catch (error) {
  throw new CommandError('API call failed', {
    cause: error,
    recovery: 'Check your API key'
  })
}
```

❌ **Mixed concerns**
```typescript
// Bad - service doing too much
class DataService {
  async fetchAndDisplay(id: string) {
    const data = await this.fetch(id)
    console.log(data)  // Display is not service concern!
    return data
  }
}

// Good - separation of concerns
class DataService {
  async fetchData(id: string): Promise<DataDTO> {
    const response = await this.api.get(`/data/${id}`)
    return DataDTO.fromApiResponse(response)
  }
}
```