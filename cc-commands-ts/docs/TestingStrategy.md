# Testing Strategy

## Overview

Due to oclif's subprocess isolation, we use a three-tier testing approach:

1. **Unit Tests** - Test pure functions directly
2. **Integration Tests** - Test commands with TEST_MODE
3. **Real Integration Tests** - Test against actual APIs

## The oclif Challenge

### Problem

`@oclif/test` runs commands in a subprocess, which means:
- Vitest mocks don't work
- Dependency injection is bypassed
- stdout/stderr capture is broken

### Solution

We use environment variables to inject test behavior:

```typescript
// In ServiceFactory
if (process.env['TEST_MODE'] === 'true') {
  return createTestDoubles()
}
```

## Testing Tiers

### 1. Unit Tests (Preferred)

Test orchestrators and services directly:

```typescript
describe('executeProjectSummary', () => {
  it('should handle success case', async () => {
    // Create mock services
    const mockServices: ProjectSummaryServices = {
      dataCollector: {
        execute: vi.fn().mockResolvedValue(
          LLMInfo.create()
            .addDataFromDTO(new RepositoryDataDTO(...))
        )
      }
    }
    
    // Test pure function directly
    const result = await executeProjectSummary(
      mockServices,
      { url: 'https://github.com/test/repo' },
      { audience: 'dev' }
    )
    
    expect(result.hasError()).toBe(false)
    expect(mockServices.dataCollector.execute).toHaveBeenCalled()
  })
})
```

### 2. Integration Tests (Limited)

Test command parsing and basic flow:

```typescript
describe('command integration', () => {
  beforeEach(() => {
    process.env['TEST_MODE'] = 'true'  // Enable test doubles
  })

  it('should parse arguments correctly', async () => {
    const { error } = await runCommand([
      'g:gh:project:summary',
      'https://github.com/test/repo'
    ])
    
    // Can only verify no error (stdout not captured)
    expect(error).toBeUndefined()
  })
})
```

### 3. Real Integration Tests

Test against actual APIs (skipped in CI):

```typescript
describe('real integration', () => {
  const skipInCI = process.env['CI'] ? it.skip : it

  skipInCI('should work with real GitHub API', async () => {
    const { error } = await runCommand([
      'g:gh:project:summary',
      'https://github.com/facebook/react'
    ])
    
    expect(error).toBeUndefined()
  }, 30_000)  // Longer timeout for API calls
})
```

## Testing DTOs

DTOs are perfect for testing:

```typescript
describe('RepositoryDataDTO', () => {
  it('should convert to LLM data format', () => {
    const dto = new RepositoryDataDTO(
      'test-repo',
      'test-owner',
      'Description',
      'TypeScript',
      'public',
      'main',
      'MIT',
      new Date('2025-01-01'),
      new Date('2025-01-02'),
      false,
      false,
      ['typescript', 'testing']
    )
    
    const data = dto.toLLMData()
    
    expect(data).toEqual({
      REPOSITORY_NAME: 'test-repo',
      REPOSITORY_OWNER: 'test-owner',
      DESCRIPTION: 'Description',
      PRIMARY_LANGUAGE: 'TypeScript',
      VISIBILITY: 'public',
      DEFAULT_BRANCH: 'main',
      LICENSE: 'MIT',
      CREATED_AT: '2025-01-01T00:00:00.000Z',
      UPDATED_AT: '2025-01-02T00:00:00.000Z',
      IS_FORK: 'false',
      IS_ARCHIVED: 'false',
      TOPICS: 'typescript, testing'
    })
  })
})
```

## Mocking Services

### With DTOs

```typescript
const mockDataService: IDataCollectionService = {
  async collectRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO> {
    return new RepositoryDataDTO(
      repo,
      owner,
      'Mock description',
      'TypeScript',
      'public',
      'main',
      'MIT',
      new Date(),
      new Date(),
      false,
      false,
      []
    )
  },
  
  async collectReleaseData(): Promise<ReleaseDataDTO | null> {
    return null  // No releases
  }
}
```

### With Vitest

```typescript
const mockService = {
  collectRepositoryData: vi.fn().mockResolvedValue(
    new RepositoryDataDTO(...)
  )
}

// Verify calls
expect(mockService.collectRepositoryData).toHaveBeenCalledWith('owner', 'repo')
```

## Test Organization

```
test/
├── unit/                    # Pure function tests
│   ├── orchestrators/       # Orchestrator tests
│   ├── services/           # Service tests
│   └── dto/               # DTO tests
├── integration/           # Command tests with TEST_MODE
│   └── commands/         
└── real-integration/     # Real API tests
    └── commands/
```

## Best Practices

1. **Prefer unit tests** - Faster, more reliable
2. **Test DTOs thoroughly** - They're the data contract
3. **Mock at service boundary** - Not internal methods
4. **Use TEST_MODE sparingly** - Only for command integration
5. **Skip real tests in CI** - Avoid rate limits

## Coverage Goals

- **Unit tests**: 90%+ coverage
- **Integration tests**: Basic command parsing
- **Real tests**: Key user workflows

## Common Patterns

### Testing Error Cases

```typescript
it('should handle API errors', async () => {
  const mockServices = {
    dataCollector: {
      execute: vi.fn().mockRejectedValue(
        new Error('API rate limit exceeded')
      )
    }
  }
  
  const result = await executeProjectSummary(mockServices, args, flags)
  
  expect(result.hasError()).toBe(true)
  expect(result.getError()?.message).toContain('rate limit')
})
```

### Testing with DTOs

```typescript
it('should transform GitHub response to DTO', () => {
  const githubResponse = {
    name: 'repo',
    owner: { login: 'owner' },
    description: 'desc',
    language: 'TypeScript',
    private: false,
    // ... other fields
  }
  
  const dto = RepositoryDataDTO.fromGitHubResponse(githubResponse)
  
  expect(dto.name).toBe('repo')
  expect(dto.owner).toBe('owner')
  expect(dto.visibility).toBe('public')
})
```

## Troubleshooting

### "Cannot find module" in tests
- Check import paths use `.js` extension
- Verify tsconfig paths are correct

### Mocks not working
- Remember: oclif runs in subprocess
- Use TEST_MODE for integration tests
- Prefer unit tests over integration

### Test timeouts
- Increase timeout for API tests: `it('...', async () => {}, 30_000)`
- Mock slow operations in unit tests