# DTO Architecture Guide

## Core Principle: No Magic Strings

This codebase follows a strict "no magic strings" policy. All data keys must be defined as constants, and all data exchange between services and orchestrators must use strongly-typed DTOs (Data Transfer Objects).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Commands     │     │  Orchestrators  │     │    Services     │
│  (Thin Wrappers)│────▶│ (Pure Functions)│────▶│ (Business Logic)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────┐           ┌─────────────┐
                        │   LLMInfo   │◀──────────│     DTOs    │
                        │ (Data Bag)  │           │ (Typed Data)│
                        └─────────────┘           └─────────────┘
```

## DTO Structure

### 1. Base Interface

All DTOs must implement the `ILLMDataDTO` interface:

```typescript
// src/interfaces/ILLMDataDTO.ts
export interface ILLMDataDTO {
  /**
   * Convert the DTO to key-value pairs for LLMInfo
   * @returns Record of data keys to string values
   */
  toLLMData(): Record<string, string>
}
```

### 2. DTO Implementation Pattern

Each DTO follows this pattern:

```typescript
export class MyDataDTO implements ILLMDataDTO {
  // 1. Define keys as private static constants
  private static readonly Keys = {
    FIELD_ONE: 'FIELD_ONE',
    FIELD_TWO: 'FIELD_TWO',
  } as const

  // 2. Constructor with strongly-typed properties
  constructor(
    public readonly fieldOne: string,
    public readonly fieldTwo: number
  ) {}

  // 3. Convert to LLMInfo data format
  toLLMData(): Record<string, string> {
    return {
      [MyDataDTO.Keys.FIELD_ONE]: this.fieldOne,
      [MyDataDTO.Keys.FIELD_TWO]: String(this.fieldTwo)
    }
  }

  // 4. Factory methods for common creation patterns
  static fromApiResponse(response: any): MyDataDTO {
    return new MyDataDTO(response.field1, response.field2)
  }
}
```

## Key Management

### Generic Keys (Minimal Set)

Only truly generic keys belong in `DataKeys`:

```typescript
// src/constants/DataKeys.ts
export const DataKeys = {
  // Generic validation/status
  VALID: 'VALID',
  STATUS: 'STATUS',
  MODE: 'MODE',
  
  // Generic identifiers
  NAME: 'NAME',
  OWNER: 'OWNER',
  TYPE: 'TYPE',
  URL: 'URL',
  
  // Error related
  ERROR_TYPE: 'ERROR_TYPE',
  ERROR_MESSAGE: 'ERROR_MESSAGE',
} as const
```

### DTO-Specific Keys

Each DTO defines its own keys as private static constants:

```typescript
private static readonly Keys = {
  REPOSITORY_NAME: 'REPOSITORY_NAME',
  REPOSITORY_OWNER: 'REPOSITORY_OWNER',
  // ... other DTO-specific keys
} as const
```

## Service Return Types

All service methods must have explicit return types using DTOs:

```typescript
export interface IDataCollectionService {
  /**
   * Collect repository data
   * @returns Strongly-typed repository data
   */
  collectRepositoryData(
    owner: string, 
    repo: string
  ): Promise<RepositoryDataDTO>
  
  /**
   * Collect release data
   * @returns Release data or null if no releases
   */
  collectReleaseData(
    owner: string, 
    repo: string
  ): Promise<ReleaseDataDTO | null>
}
```

## LLMInfo Integration

### Adding DTO Data

Use `addDataFromDTO()` instead of `addData()`:

```typescript
const repoData = await service.collectRepositoryData(owner, repo)
const result = LLMInfo.create()
  .addDataFromDTO(repoData)  // Preferred
  .addAction('Data collected', 'success')
```

### Direct Data Addition (Deprecated)

Direct `addData()` calls should only use generic DataKeys:

```typescript
// Only for truly generic data
result.addData(DataKeys.STATUS, 'complete')
```

## Testing with DTOs

DTOs make testing cleaner and more maintainable:

```typescript
describe('DataCollectionService', () => {
  it('should return repository data', async () => {
    // Create test DTO
    const expectedData = new RepositoryDataDTO(
      'test-repo',
      'test-owner',
      'Test description',
      'TypeScript',
      'public',
      'main',
      'MIT',
      new Date('2025-01-01'),
      new Date('2025-01-02'),
      false,
      false,
      ['testing', 'typescript']
    )
    
    // Mock service to return DTO
    mockService.collectRepositoryData.mockResolvedValue(expectedData)
    
    // Test expects DTO
    const result = await service.collectRepositoryData('test-owner', 'test-repo')
    expect(result).toEqual(expectedData)
  })
})
```

## ESLint Enforcement

Custom ESLint rules enforce this architecture:

1. **no-magic-strings-in-dto**: DTOs must use const keys in `toLLMData()`
2. **prefer-dto-over-adddata**: Warn when using `addData()` instead of `addDataFromDTO()`
3. **require-explicit-return-types**: All methods must declare return types
4. **dto-must-implement-interface**: DTOs must implement `ILLMDataDTO`

## Migration Guide

### Converting Existing Code

1. **Identify Magic Strings**
   ```typescript
   // Before
   result.addData('REPOSITORY_NAME', repo.name)
   
   // After
   const repoData = new RepositoryDataDTO(...)
   result.addDataFromDTO(repoData)
   ```

2. **Create DTOs for Data Structures**
   ```typescript
   // Before
   return {
     name: repo.name,
     owner: repo.owner.login,
     description: repo.description
   }
   
   // After
   return RepositoryDataDTO.fromGitHubResponse(repo)
   ```

3. **Update Service Interfaces**
   ```typescript
   // Before
   collectData(owner: string, repo: string): Promise<any>
   
   // After
   collectRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>
   ```

## Benefits

1. **Type Safety**: Can't misspell keys or return wrong data types
2. **Refactoring**: Change keys in one place
3. **Testing**: DTOs are easy to create and mock
4. **Documentation**: Method signatures clearly show what data is returned
5. **Validation**: DTOs ensure data consistency
6. **Maintainability**: Clear contracts between layers

## Examples

See the following files for implementation examples:
- `src/dto/RepositoryDataDTO.ts` - Basic DTO structure
- `src/dto/ProjectDetectionResultDTO.ts` - DTO with factory methods
- `src/dto/ActivityMetricsDTO.ts` - DTO with complex data transformation
- `src/services/github/DataCollectionService.ts` - Service returning DTOs
- `src/orchestrators/g/gh/project/executeProjectSummary.ts` - Orchestrator using DTOs