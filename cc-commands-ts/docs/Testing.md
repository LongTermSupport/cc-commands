# Testing Guide

> **Scope**: This document covers testing strategy, principles, and patterns. For architecture details, see [CLAUDE.md](../CLAUDE.md).

## Testing Framework

This project uses **Vitest** as the testing framework. Vitest provides Jest compatibility while being faster and more modern.

### Vitest Imports

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock types
let mockApiClient: vi.Mocked<IApiClient>

// Mock creation
mockApiClient = vi.mocked(createMock<IApiClient>())
```

## Core Testing Principles

### Test-Driven Development (TDD)

**Write tests before implementation, always.**

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

```typescript
// 1. RED - Write failing test first
describe('ExampleService', () => {
  it('should transform API response into DTO', async () => {
    const service = new ExampleService(mockApiClient)
    const result = await service.collectSampleData('owner', 'repo')
    expect(result).toBeInstanceOf(ExampleDataDTO)
  })
})

// 2. GREEN - Implement minimal code to pass
// 3. REFACTOR - Improve implementation
```

### No Tautological Testing

**Never test that mocks return what you told them to return.**

```typescript
// ❌ WRONG - Tautological test (testing the mock)
const expectedData = new ExampleDataDTO('test-sample', 'test-owner')
mockService.getSampleData.mockResolvedValue(expectedData)
const result = await mockService.getSampleData()
expect(result).toEqual(expectedData) // This proves nothing

// ✅ CORRECT - Test actual behavior
const mockApiResponse = { name: 'test-sample', owner: { login: 'test-owner' } }
mockApiClient.getSampleData.mockResolvedValue(mockApiResponse)
const service = new ExampleService(mockApiClient)
const result = await service.collectSampleData('test-owner', 'test-sample')
expect(result.name).toBe('test-sample') // Tests actual transformation logic
```

### Mock Real Dependencies, Test Real Code

**Mocks exist to provide controlled inputs to real code being tested.**

```typescript
// ✅ CORRECT - Mock external dependency, test real service
describe('ExampleService', () => {
  it('should handle API errors gracefully', async () => {
    // Mock external dependency to force error scenario
    mockApiClient.getSampleData.mockRejectedValue(new Error('API Error'))
    
    // Test real service logic
    const service = new ExampleService(mockApiClient)
    
    // Verify real error handling behavior
    await expect(service.collectSampleData('owner', 'sample'))
      .rejects.toThrow('Failed to fetch sample data')
  })
})
```

### Additional Testing Rules

1. **Test Behavior, Not Implementation**: Test what the code does, not how it does it
2. **One Assertion Per Test**: Each test should verify one specific behavior
3. **Descriptive Test Names**: Test names should clearly describe the expected behavior
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
5. **No Test Code in Production**: Tests should never influence production behavior
6. **Fast and Reliable**: Tests should run quickly and produce consistent results
7. **Don't Test TypeScript Compiler**: Never test code paths that TypeScript prevents at compile time

### Testing TypeScript-Enforced Constraints

**❌ Wrong: Testing Impossible Runtime Scenarios**
```typescript
// DON'T test scenarios that TypeScript prevents
it('should handle null input', () => {
  expect(() => {
    // @ts-expect-error or as any casting just to test
    MyService.processData(null)
  }).toThrow('Invalid input')
})
```

**✅ Correct: Test Real Runtime Scenarios**
```typescript
// DO test scenarios that can actually occur at runtime
it('should handle malformed API response', () => {
  // This can happen from a real API call
  const dto = MyDTO.fromApiResponse({})
  expect(dto.name).toBe('unknown')
})

it('should handle missing optional fields', () => {
  // This is a valid, typed scenario that can occur
  const response = { id: 1 } // missing other optional fields
  const dto = MyDTO.fromApiResponse(response)
  expect(dto.description).toBe('')
})
```

**Why This Matters:**
- TypeScript prevents invalid calls at compile time
- Testing these scenarios just tests the TypeScript compiler, not your code
- Focus testing effort on scenarios that can actually occur in production
- Test defensive handling of malformed but validly-typed inputs instead

## Three-Tier Testing Strategy

### Commands (End-to-End Tests)

**Test the complete CLI workflow with no mocks.**

```typescript
describe('ExampleSummaryCmd', () => {
  it('should output project summary for valid repository', async () => {
    // No mocks - test against real orchestrator and services
    const result = await runCommand('example:project:summary', ['owner/repo'])
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('EXAMPLE_NAME=repo')
    expect(result.stdout).toContain('SAMPLE_OWNER=owner')
  })
})
```

**Testing Focus:**
- CLI argument parsing
- LLMInfo output formatting  
- Exit codes
- Complete integration flow

**Coverage:** 100% of critical paths (success/error flows)

### Orchestrators (Integration Tests)

**Test service coordination with some external mocking allowed.**

```typescript
describe('exampleSummaryOrch', () => {
  it('should coordinate services and return LLMInfo', async () => {
    // Mock external APIs, use real services
    mockExternalApi.getSampleData.mockResolvedValue(sampleApiResponse)
    
    const result = await exampleSummaryOrch('owner/repo', services)
    
    expect(result).toBeInstanceOf(LLMInfo)
    expect(result.getData()).toHaveProperty('EXAMPLE_NAME', 'repo')
    expect(result.getExitCode()).toBe(0)
  })
})
```

**Testing Focus:**
- Service coordination logic
- Error handling across services
- LLMInfo assembly from multiple sources

**Coverage:** 90% with focus on error handling paths

### Services (Unit Tests)

**Test business logic with full mocking of dependencies.**

#### Orchestrator Services

```typescript
describe('exampleDataCollectionOrchServ', () => {
  it('should combine multiple service results into LLMInfo', async () => {
    // Mock regular services
    const mockSampleData = new ExampleDataDTO('sample', 'owner', ...)
    const mockStats = new SampleStatsDTO(10, 5, ...)
    
    mockExampleService.collectSampleData.mockResolvedValue(mockSampleData)
    mockStatsService.analyzeData.mockResolvedValue(mockStats)
    
    // Test orchestrator service coordination
    const result = await exampleDataCollectionOrchServ('owner/sample', services)
    
    // Verify LLMInfo assembly
    expect(result).toBeInstanceOf(LLMInfo)
    expect(result.getData()).toHaveProperty('EXAMPLE_NAME', 'sample')
    expect(result.getData()).toHaveProperty('TOTAL_COUNT', '10')
  })
})
```

#### Regular Services

```typescript
describe('ExampleService', () => {
  let service: ExampleService
  let mockApiClient: vi.Mocked<IExampleApiClient>

  beforeEach(() => {
    mockApiClient = vi.mocked(createMock<IExampleApiClient>())
    service = new ExampleService(mockApiClient)
  })

  it('should transform API response into DTO', async () => {
    // Mock external dependency
    const mockApiResponse = {
      name: 'test-sample',
      owner: { login: 'test-owner' },
      description: 'Test description',
      language: 'TypeScript'
    }
    mockApiClient.getSampleData.mockResolvedValue(mockApiResponse)
    
    // Test real service logic
    const result = await service.collectSampleData('test-owner', 'test-sample')
    
    // Verify proper DTO construction from API response
    expect(result).toBeInstanceOf(ExampleDataDTO)
    expect(result.name).toBe('test-sample')
    expect(result.owner).toBe('test-owner')
    expect(mockApiClient.getSampleData).toHaveBeenCalledWith('test-owner', 'test-sample')
  })

  it('should handle API errors with meaningful messages', async () => {
    mockApiClient.getSampleData.mockRejectedValue(new Error('Not Found'))
    
    await expect(service.collectSampleData('invalid', 'sample'))
      .rejects.toThrow('Failed to fetch sample data')
  })
})
```

**Testing Focus:**
- Pure business logic
- Error conditions and edge cases  
- Data transformation accuracy
- DTO creation and validation

**Coverage:** 90% with comprehensive edge case testing

## Mock at the Boundary Pattern

### What to Mock

**Mock external systems and infrastructure:**
- HTTP clients (GitHub API, etc.)
- File system operations
- Database connections
- External services
- Time/date functions (when testing time-sensitive logic)

### What NOT to Mock

**Use real objects within the same domain:**
- DTOs and data structures
- Domain services within the same namespace
- Utility functions and helpers
- Pure functions without side effects

### Example: GitHub Domain Service Testing

```typescript
describe('ExampleDataCollectionOrchServ', () => {
  it('should collect comprehensive project data', async () => {
    // ✅ Mock external boundary (External API)
    mockExternalApi.getSampleData.mockResolvedValue(sampleResponse)
    mockExternalApi.getStats.mockResolvedValue(statsResponse)
    
    // ✅ Use real domain services
    const exampleService = new ExampleService(mockExternalApi)
    const statsService = new StatsService(mockExternalApi)
    const services = { exampleService, statsService }
    
    // Test real orchestrator service logic
    const result = await exampleDataCollectionOrchServ('owner/sample', services)
    
    expect(result.getData()).toMatchObject({
      EXAMPLE_NAME: 'sample',
      TOTAL_COUNT: '15',
      ACTIVE_COUNT: '10'
    })
  })
})
```

### Force Error Scenarios with Minimal Mocking

```typescript
it('should handle example service failures', async () => {
  // Mock internal service ONLY to force error scenario
  const mockExampleService = createMock<ExampleService>()
  mockExampleService.collectSampleData.mockRejectedValue(
    new Error('Sample not found')
  )
  
  // Use real stats service
  const realStatsService = new StatsService(mockExternalApi)
  const services = { 
    exampleService: mockExampleService, 
    statsService: realStatsService 
  }
  
  const result = await exampleDataCollectionOrchServ('owner/sample', services)
  
  expect(result.hasError()).toBe(true)
  expect(result.getExitCode()).toBe(1)
})
```

## Testing Anti-Patterns to Avoid

### 1. Testing Implementation Details

```typescript
// ❌ WRONG - Testing internal implementation
expect(service.internalHelper).toHaveBeenCalled()

// ✅ CORRECT - Testing observable behavior
expect(result.getData()).toHaveProperty('PROCESSED', 'true')
```

### 2. Overly Complex Test Setup

```typescript
// ❌ WRONG - Complex setup that's hard to understand
const setupComplexMockChain = () => { /* 50 lines of setup */ }

// ✅ CORRECT - Clear, focused setup
const mockApiResponse = { name: 'repo', owner: { login: 'owner' } }
mockApi.getRepository.mockResolvedValue(mockApiResponse)
```

### 3. Testing Multiple Behaviors in One Test

```typescript
// ❌ WRONG - Testing multiple things
it('should do everything correctly', async () => {
  // Tests validation AND transformation AND error handling
})

// ✅ CORRECT - One behavior per test  
it('should validate input parameters', async () => { /* ... */ })
it('should transform API response to DTO', async () => { /* ... */ })
it('should handle API errors gracefully', async () => { /* ... */ })
```

## Test Organization

### File Structure

```
test/
├── commands/                    # E2E tests
│   └── example/domain/
│       └── exampleSummaryCmd.e2e.test.ts
├── orchestrators/               # Integration tests
│   └── example/domain/
│       └── exampleSummaryOrch.test.ts
└── orchestrator-services/       # Unit tests
    └── example-domain/
        ├── exampleDataCollectionOrchServ.test.ts
        └── services/
            ├── ExampleService.test.ts
            └── StatsService.test.ts
```

### Naming Conventions

- **E2E Tests**: `*.e2e.test.ts`
- **Integration Tests**: `*.test.ts` 
- **Unit Tests**: `*.test.ts`
- **Test Doubles**: `Mock*.ts` (in test/doubles/)

### Test Utilities

Create reusable test utilities for common patterns:

```typescript
// test/utils/createMockServices.ts
export function createMockExampleServices(): TMockExampleServices {
  return {
    exampleService: createMock<ExampleService>(),
    statsService: createMock<StatsService>(),
    apiClient: createMock<IExampleApiClient>()
  }
}

// test/utils/createTestData.ts
export function createTestExampleDTO(): ExampleDataDTO {
  return new ExampleDataDTO('test-sample', 'test-owner', ...)
}
```

## Coverage Requirements

- **Overall Target**: 90% across all layers
- **Commands**: 100% of critical paths (success/error flows)
- **Orchestrators**: 90% with focus on error handling
- **Services**: 90% with comprehensive edge cases

## Running Tests

```bash
# Full test suite
npm test

# Watch mode (TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test patterns
npm test -- --testNamePattern="RepositoryService"
npm test -- orchestrator-services/github/
```

## Quality Gates

**All tests must pass before any merge:**

```bash
npm run qa  # Includes: typecheck + lint + test
```

**Tests are part of the build pipeline and will block deployment if failing.**