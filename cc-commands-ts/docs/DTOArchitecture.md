# DTO Architecture Guide

> **Scope**: This document covers DTO structure and usage patterns. For complete service architecture, see [CLAUDE.md](../CLAUDE.md).

## Core Principle: No Magic Strings

This codebase follows a strict "no magic strings" policy. All data keys must be defined as constants, and all data exchange between services must use strongly-typed DTOs (Data Transfer Objects).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Commands     │     │  Orchestrators  │     │ Orchestrator     │     │    Services     │
│  (Thin Wrappers)│────▶│ (Pure Functions)│────▶│   Services       │────▶│ (Return DTOs)   │
└─────────────────┘     └─────────────────┘     │ (Functions that  │     │                 │
                               │                 │  Return LLMInfo) │     │                 │
                               ▼                 └──────────────────┘     │                 │
                        ┌─────────────┐                  │                │                 │
                        │   LLMInfo   │◀─────────────────┘                │                 │
                        │ (Data Bag)  │◀──────────────────────────────────┘                 │
                        └─────────────┘        DTOs → toLLMData() → addDataBulk()
```

## DTO Structure

### Core DTO Rules

1. **Immutability**: All DTO properties must be `readonly` - DTOs are immutable once created
2. **Interface Compliance**: All DTOs must implement `ILLMDataDTO`
3. **Constructor Parameters**: DTOs can have unlimited constructor parameters (ESLint exception for `*DTO.ts` files)
4. **No Magic Strings**: All data keys must be defined as private static constants
5. **Factory Methods**: Provide static factory methods for common creation patterns

### 1. Base Interface

All DTOs must implement the `ILLMDataDTO` interface:

```typescript
// Snippet from src/core/interfaces/ILLMDataDTO.ts
export interface ILLMDataDTO {
  toLLMData(): Record<string, string>
  // ... see full file for complete interface
}
```

See [src/core/interfaces/ILLMDataDTO.ts](../src/core/interfaces/ILLMDataDTO.ts) for the complete interface.

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
    // All keys must be UPPER_SNAKE_CASE (validated by LLMInfo.addData)
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
// Snippet from src/core/constants/DataKeys.ts
export const DataKeys = {
  VALID: 'VALID',
  STATUS: 'STATUS',
  MODE: 'MODE',
  // ... see full file for all generic keys
} as const
```

See [src/core/constants/DataKeys.ts](../src/core/constants/DataKeys.ts) for all available generic keys.

### DTO-Specific Keys

Each DTO defines its own keys as private static constants:

```typescript
private static readonly Keys = {
  REPOSITORY_NAME: 'REPOSITORY_NAME',
  REPOSITORY_OWNER: 'REPOSITORY_OWNER',
  // ... other DTO-specific keys
} as const
```

## Service Integration with DTOs

Regular services return DTOs that are consumed by orchestrator services. See [CLAUDE.md](../CLAUDE.md) for the complete service architecture.

DTOs are organized by domain within orchestrator service folders:

```
orchestrator-services/github/
├── dto/
│   ├── RepositoryDataDTO.ts        # Domain-specific DTOs
│   └── IssueStatsDTO.ts
└── services/
    ├── RepositoryService.ts        # Regular services return DTOs
    └── IssueService.ts
```

```typescript
// Example: Regular services return strongly-typed DTOs
export class RepositoryService {
  constructor(private readonly apiClient: IApiClient) {}
  
  async collectRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO> {
    const response = await this.apiClient.getRepository(owner, repo)
    return new RepositoryDataDTO(response.name, response.owner.login, ...)
  }
}
```

## LLMInfo Integration

### Adding DTO Data

Use `addDataBulk()` with DTO's `toLLMData()` method:

```typescript
const repoData = await service.collectRepositoryData(owner, repo)
const result = LLMInfo.create()
  .addDataBulk(repoData.toLLMData())  // Converts DTO to key-value pairs
  .addAction('Data collected', 'success')
```

### Direct Data Addition

Direct `addData()` calls should use generic DataKeys or be minimal:

```typescript
// For generic data
result.addData(DataKeys.STATUS, 'complete')

// Individual keys (validated as UPPER_SNAKE_CASE)
result.addData('PROJECT_COUNT', '5')
```


## ESLint Enforcement

<!-- TODO: Implement custom ESLint rules to enforce this architecture:
1. **no-magic-strings-in-dto**: DTOs must use const keys in `toLLMData()`
2. **prefer-dto-bulk-data**: Warn when using individual `addData()` calls instead of `addDataBulk(dto.toLLMData())`
3. **require-explicit-return-types**: All methods must declare return types
4. **dto-must-implement-interface**: DTOs must implement `ILLMDataDTO`
-->

## Migration Guide

### Converting Existing Code

1. **Identify Magic Strings**
   ```typescript
   // Before
   result.addData('REPOSITORY_NAME', repo.name)
   
   // After  
   const repoData = new RepositoryDataDTO(...)
   result.addDataBulk(repoData.toLLMData())
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

DTOs will be implemented following the patterns described in this document within domain-specific folders:

<!-- TODO: Add references to real DTO implementations once they exist:
- orchestrator-services/github/dto/RepositoryDataDTO.ts - Basic DTO structure
- orchestrator-services/github/services/RepositoryService.ts - Service returning DTOs
-->

For complete folder structure, orchestrator and orchestrator service examples, see [CLAUDE.md](../CLAUDE.md).