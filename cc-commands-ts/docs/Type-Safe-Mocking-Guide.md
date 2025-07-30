# Type-Safe Mocking Guide

> **Philosophy**: "Mocking is like hot sauce - a little bit is all you need."

## The Problem

Traditional mocking approaches use `any` types, which breaks type safety and hides potential issues:

```typescript
// ❌ WRONG - Unsafe and brittle
vi.mocked(service.getData).mockResolvedValue(mockData as any)
const mockRepo = { name: 'test' } as any
```

## The Solution: Production Type Casting

Use actual production DTOs and interfaces with minimal type casting:

```typescript
// ✅ CORRECT - Type-safe with production types
import { CommitDataDTO, RepositoryDataDTO } from '@/dto'

const mockCommits = [{ sha: 'abc123' }] as CommitDataDTO[]
const mockRepo = { name: 'test-repo', stargazersCount: 42 } as RepositoryDataDTO

vi.mocked(service.searchCommits).mockResolvedValue(mockCommits)
vi.mocked(service.getRepository).mockResolvedValue(mockRepo)
```

## Benefits

1. **Type Safety**: TypeScript enforces compatibility with production interfaces
2. **Minimal Mocking**: Only provide what the test needs
3. **Real Contracts**: Tests validate against actual production types
4. **IDE Support**: Full autocomplete and error checking
5. **Refactor Safe**: Type changes break tests appropriately

## Patterns

### ✅ Arrays of DTOs
```typescript
const mockCommits = [
  { sha: 'abc123', message: 'Initial commit' },
  { sha: 'def456', message: 'Fix bug' }
] as CommitDataDTO[]

vi.mocked(service.searchCommits).mockResolvedValue(mockCommits)
```

### ✅ Complex Objects
```typescript
const mockRepo = {
  name: 'test-repo',
  stargazersCount: 42,
  getAgeInDays: vi.fn().mockReturnValue(365),
  getDaysSinceUpdate: vi.fn().mockReturnValue(7)
} as RepositoryDataDTO

vi.mocked(service.getRepository).mockResolvedValue(mockRepo)
```

### ✅ Empty Arrays
```typescript
vi.mocked(service.searchIssues).mockResolvedValue([] as IssueDataDTO[])
```

### ✅ Service Interfaces
```typescript
const mockService: vi.Mocked<IDataService> = {
  getData: vi.fn(),
  processData: vi.fn()
}
```

## Anti-Patterns

### ❌ Using `any`
```typescript
// NEVER DO THIS
const mockData = { field: 'value' } as any
vi.mocked(service.process).mockResolvedValue(data as any)
```

### ❌ Using `unknown`
```typescript
// AVOID - No better than any for mocking
const mockData = { field: 'value' } as unknown
```

### ❌ Over-Mocking
```typescript
// DON'T CREATE ELABORATE MOCK TYPES
type ComplexMockType = {
  // 50 lines of mock-specific types
}
```

### ❌ Mock Types Instead of Production Types
```typescript
// WRONG - Use actual production types, not mock types
type MockCommit = { sha: string } // Don't create this
const mock = {} as MockCommit     // Use CommitDataDTO instead
```

## Testing Strategy

Tests should validate production behavior, not mock behavior:

```typescript
// ✅ GOOD - Test real behavior
it('should process commit data correctly', async () => {
  const mockCommits = [{ sha: 'abc123' }] as CommitDataDTO[]
  vi.mocked(service.getCommits).mockResolvedValue(mockCommits)
  
  const result = await processor.analyzeCommits('owner', 'repo')
  
  expect(result.TOTAL_COMMITS).toBe('1')
  expect(result.COMMIT_SHA_LIST).toContain('abc123')
})
```

## ESLint Enforcement

The custom rule `cc-commands/prefer-production-types-in-mocks` enforces this pattern:

- **Detects**: `as any` and `as unknown` in test files
- **Suggests**: Use specific production types instead
- **Scope**: Only applies to `test/**/*.ts` files

## Migration Guide

### From `any` to Production Types

```typescript
// Before
const mockData = { name: 'test' } as any
vi.mocked(service.getData).mockResolvedValue(mockData as any)

// After  
const mockData = { name: 'test' } as RepositoryDataDTO
vi.mocked(service.getData).mockResolvedValue(mockData)
```

### From `unknown` to Production Types

```typescript
// Before
vi.mocked(service.getItems).mockResolvedValue([{}] as unknown[])

// After
vi.mocked(service.getItems).mockResolvedValue([{} as ItemDTO])
```

## Rule Configuration

```javascript
// eslint.config.mjs
{
  files: ['test/**/*.ts'],
  rules: {
    'cc-commands/prefer-production-types-in-mocks': 'error'
  }
}
```

## Conclusion

Type-safe mocking ensures tests validate real contracts while maintaining development velocity. Use production types, mock minimally, and let TypeScript catch compatibility issues early.