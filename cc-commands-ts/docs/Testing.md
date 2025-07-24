# Testing Guide

> **Scope**: This document covers testing strategy, principles, and patterns. For architecture details, see [CLAUDE.md](../CLAUDE.md).

## Core Testing Principles

### Test-Driven Development (TDD)

**Write tests before implementation, always.**

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

```typescript
// 1. RED - Write failing test first
describe('RepositoryService', () => {
  it('should transform API response into DTO', async () => {
    const service = new RepositoryService(mockApiClient)
    const result = await service.collectRepositoryData('owner', 'repo')
    expect(result).toBeInstanceOf(RepositoryDataDTO)
  })
})

// 2. GREEN - Implement minimal code to pass
// 3. REFACTOR - Improve implementation
```

### No Tautological Testing

**Never test that mocks return what you told them to return.**

```typescript
// ❌ WRONG - Tautological test (testing the mock)
const expectedData = new RepositoryDataDTO('test-repo', 'test-owner')
mockService.getData.mockResolvedValue(expectedData)
const result = await mockService.getData()
expect(result).toEqual(expectedData) // This proves nothing

// ✅ CORRECT - Test actual behavior
const mockApiResponse = { name: 'test-repo', owner: { login: 'test-owner' } }
mockApiClient.getRepository.mockResolvedValue(mockApiResponse)
const service = new RepositoryService(mockApiClient)
const result = await service.collectRepositoryData('test-owner', 'test-repo')
expect(result.name).toBe('test-repo') // Tests actual transformation logic
```

### Mock Real Dependencies, Test Real Code

**Mocks exist to provide controlled inputs to real code being tested.**

```typescript
// ✅ CORRECT - Mock external dependency, test real service
describe('RepositoryService', () => {
  it('should handle API errors gracefully', async () => {
    // Mock external dependency to force error scenario
    mockApiClient.getRepository.mockRejectedValue(new Error('API Error'))
    
    // Test real service logic
    const service = new RepositoryService(mockApiClient)
    
    // Verify real error handling behavior
    await expect(service.collectRepositoryData('owner', 'repo'))
      .rejects.toThrow('Failed to fetch repository data')
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

## Three-Tier Testing Strategy

### Commands (End-to-End Tests)

**Test the complete CLI workflow with no mocks.**

```typescript
describe('SummaryCmd', () => {
  it('should output project summary for valid repository', async () => {
    // No mocks - test against real orchestrator and services
    const result = await runCommand('g:gh:project:summary', ['owner/repo'])
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('PROJECT_NAME=repo')
    expect(result.stdout).toContain('OWNER=owner')
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
describe('summaryOrch', () => {
  it('should coordinate services and return LLMInfo', async () => {
    // Mock external APIs, use real services
    mockGitHubApi.getRepository.mockResolvedValue(repoApiResponse)
    
    const result = await summaryOrch('owner/repo', services)
    
    expect(result).toBeInstanceOf(LLMInfo)
    expect(result.getData()).toHaveProperty('REPOSITORY_NAME', 'repo')
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
describe('dataCollectionOrchServ', () => {
  it('should combine multiple service results into LLMInfo', async () => {
    // Mock regular services
    const mockRepoData = new RepositoryDataDTO('repo', 'owner', ...)
    const mockIssueStats = new IssueStatsDTO(10, 5, ...)
    
    mockRepositoryService.collectRepositoryData.mockResolvedValue(mockRepoData)
    mockIssueService.analyzeIssues.mockResolvedValue(mockIssueStats)
    
    // Test orchestrator service coordination
    const result = await dataCollectionOrchServ('owner/repo', services)
    
    // Verify LLMInfo assembly
    expect(result).toBeInstanceOf(LLMInfo)
    expect(result.getData()).toHaveProperty('REPOSITORY_NAME', 'repo')
    expect(result.getData()).toHaveProperty('TOTAL_ISSUES', '10')
  })
})
```

#### Regular Services

```typescript
describe('RepositoryService', () => {
  let service: RepositoryService
  let mockApiClient: jest.Mocked<IApiClient>

  beforeEach(() => {
    mockApiClient = createMock<IApiClient>()
    service = new RepositoryService(mockApiClient)
  })

  it('should transform API response into DTO', async () => {
    // Mock external dependency
    const mockApiResponse = {
      name: 'test-repo',
      owner: { login: 'test-owner' },
      description: 'Test description',
      language: 'TypeScript'
    }
    mockApiClient.getRepository.mockResolvedValue(mockApiResponse)
    
    // Test real service logic
    const result = await service.collectRepositoryData('test-owner', 'test-repo')
    
    // Verify proper DTO construction from API response
    expect(result).toBeInstanceOf(RepositoryDataDTO)
    expect(result.name).toBe('test-repo')
    expect(result.owner).toBe('test-owner')
    expect(mockApiClient.getRepository).toHaveBeenCalledWith('test-owner', 'test-repo')
  })

  it('should handle API errors with meaningful messages', async () => {
    mockApiClient.getRepository.mockRejectedValue(new Error('Not Found'))
    
    await expect(service.collectRepositoryData('invalid', 'repo'))
      .rejects.toThrow('Failed to fetch repository data')
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
describe('GitHubDataCollectionOrchServ', () => {
  it('should collect comprehensive project data', async () => {
    // ✅ Mock external boundary (GitHub API)
    mockGitHubApi.getRepository.mockResolvedValue(repoResponse)
    mockGitHubApi.getIssues.mockResolvedValue(issuesResponse)
    
    // ✅ Use real domain services
    const repositoryService = new RepositoryService(mockGitHubApi)
    const issueService = new IssueService(mockGitHubApi)
    const services = { repositoryService, issueService }
    
    // Test real orchestrator service logic
    const result = await dataCollectionOrchServ('owner/repo', services)
    
    expect(result.getData()).toMatchObject({
      REPOSITORY_NAME: 'repo',
      TOTAL_ISSUES: '15',
      OPEN_ISSUES: '10'
    })
  })
})
```

### Force Error Scenarios with Minimal Mocking

```typescript
it('should handle repository service failures', async () => {
  // Mock internal service ONLY to force error scenario
  const mockRepositoryService = createMock<RepositoryService>()
  mockRepositoryService.collectRepositoryData.mockRejectedValue(
    new Error('Repository not found')
  )
  
  // Use real issue service
  const realIssueService = new IssueService(mockGitHubApi)
  const services = { 
    repositoryService: mockRepositoryService, 
    issueService: realIssueService 
  }
  
  const result = await dataCollectionOrchServ('owner/repo', services)
  
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
│   └── g/gh/project/
│       └── summaryCmd.e2e.test.ts
├── orchestrators/               # Integration tests
│   └── g/gh/project/
│       └── summaryOrch.test.ts
└── orchestrator-services/       # Unit tests
    └── github/
        ├── dataCollectionOrchServ.test.ts
        └── services/
            ├── RepositoryService.test.ts
            └── IssueService.test.ts
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
export function createMockGitHubServices(): TMockGitHubServices {
  return {
    repositoryService: createMock<RepositoryService>(),
    issueService: createMock<IssueService>(),
    apiClient: createMock<IGitHubApiClient>()
  }
}

// test/utils/createTestData.ts
export function createTestRepositoryDTO(): RepositoryDataDTO {
  return new RepositoryDataDTO('test-repo', 'test-owner', ...)
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