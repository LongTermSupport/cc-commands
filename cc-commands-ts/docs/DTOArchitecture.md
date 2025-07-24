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


## Code Quality Patterns

### ESLint Compliance for External APIs

#### GitHub API Snake_Case Properties

When working with external APIs (like GitHub) that use `snake_case` properties, use the "GitHubData" naming convention to manage ESLint camelcase violations:

```typescript
// ✅ CORRECT - Use "GitHubData" suffix and eslint-disable comments
describe('fromGitHubApiResponse', () => {
  it('should handle GitHub API response', () => {
    /* eslint-disable camelcase */
    const apiResponseGitHubData = {
      full_name: 'owner/repo',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T12:00:00Z',
      default_branch: 'main'
    }
    /* eslint-enable camelcase */

    const dto = MyDTO.fromGitHubApiResponse(apiResponseGitHubData)
    expect(dto.name).toBe('repo')
  })
})
```

**Key Rules:**
1. **Naming Convention**: Use `*GitHubData` suffix for variables containing GitHub API responses
2. **Scoped Disable**: Use `/* eslint-disable camelcase */` around the object definition only
3. **Re-enable**: Always follow with `/* eslint-enable camelcase */`
4. **Minimal Scope**: Keep the disable/enable as close to the violating code as possible

#### Why This Works
- Clear naming convention signals intent to other developers
- Scoped disabling doesn't affect other code
- ESLint violations are contained and manageable
- Maintains code quality while accommodating external API constraints

### Complexity Management in Factory Methods

DTO factory methods often become complex due to extensive data transformation. Use the **Data Extraction Pattern** to maintain complexity under ESLint limits (≤20):

#### Problem: Complex Factory Method
```typescript
// ❌ BAD - Complexity > 20
static fromGitHubApiResponse(apiResponse: GitHubResponse): PullRequestDataDTO {
  return new PullRequestDataDTO(
    String(apiResponse.id || 0),
    apiResponse.number || 0,
    apiResponse.title || 'Untitled',
    apiResponse.body || '',
    apiResponse.state?.toLowerCase() === 'closed' ? 'closed' : 'open',
    Boolean(apiResponse.draft),
    Boolean(apiResponse.locked),
    Boolean(apiResponse.merged),
    apiResponse.mergeable || null,
    apiResponse.assignees?.map(a => a.login || '').filter(Boolean) || [],
    apiResponse.requested_reviewers?.map(r => r.login || '').filter(Boolean) || [],
    apiResponse.labels?.map(l => l.name || '').filter(Boolean) || [],
    apiResponse.milestone?.title || null,
    apiResponse.user?.login || 'unknown',
    apiResponse.merged_by?.login || null,
    this.extractRepository(apiResponse.repository?.full_name, apiResponse.repository_url),
    apiResponse.html_url || '',
    apiResponse.head?.ref || 'unknown',
    apiResponse.base?.ref || 'main',
    apiResponse.comments || 0,
    apiResponse.review_comments || 0,
    apiResponse.commits || 0,
    apiResponse.additions || 0,
    apiResponse.deletions || 0,
    apiResponse.changed_files || 0,
    new Date(apiResponse.created_at || Date.now()),
    new Date(apiResponse.updated_at || Date.now()),
    apiResponse.closed_at ? new Date(apiResponse.closed_at) : null,
    apiResponse.merged_at ? new Date(apiResponse.merged_at) : null
  )
}
```

#### Solution: Data Extraction Pattern
```typescript
// ✅ GOOD - Complexity ≤20, clear separation of concerns
static fromGitHubApiResponse(apiResponse: GitHubResponse): PullRequestDataDTO {
  this.validateApiResponse(apiResponse)
  
  const basicData = this.extractApiBasicData(apiResponse)
  const relationships = this.extractApiRelationships(apiResponse)
  const dates = this.extractApiDates(apiResponse)
  
  return new PullRequestDataDTO(
    basicData.id, basicData.number, basicData.title, basicData.body,
    basicData.state, basicData.draft, basicData.locked, basicData.merged,
    basicData.mergeable, relationships.assignees, relationships.requestedReviewers,
    relationships.labels, relationships.milestone, relationships.creator,
    relationships.mergedBy, relationships.repository, basicData.url,
    basicData.headBranch, basicData.baseBranch, basicData.commentsCount,
    basicData.reviewCommentsCount, basicData.commitsCount, basicData.additions,
    basicData.deletions, basicData.changedFiles, dates.createdAt,
    dates.updatedAt, dates.closedAt, dates.mergedAt
  )
}

// Extract grouped data with clear return types
private static extractApiBasicData(apiResponse: GitHubResponse): {
  id: string
  number: number
  title: string
  body: string
  state: 'closed' | 'open'
  draft: boolean
  locked: boolean
  merged: boolean
  mergeable: boolean | null
  url: string
  headBranch: string
  baseBranch: string
  commentsCount: number
  reviewCommentsCount: number
  commitsCount: number
  additions: number
  deletions: number
  changedFiles: number
} {
  return {
    id: String(apiResponse.id || 0),
    number: apiResponse.number || 0,
    title: apiResponse.title || 'Untitled Pull Request',
    body: apiResponse.body || '',
    state: this.normalizeState(apiResponse.state),
    draft: Boolean(apiResponse.draft),
    locked: Boolean(apiResponse.locked),
    merged: Boolean(apiResponse.merged),
    mergeable: apiResponse.mergeable || null,
    url: apiResponse.html_url || '',
    headBranch: apiResponse.head?.ref || 'unknown',
    baseBranch: apiResponse.base?.ref || 'main',
    commentsCount: apiResponse.comments || 0,
    reviewCommentsCount: apiResponse.review_comments || 0,
    commitsCount: apiResponse.commits || 0,
    additions: apiResponse.additions || 0,
    deletions: apiResponse.deletions || 0,
    changedFiles: apiResponse.changed_files || 0
  }
}

private static extractApiRelationships(apiResponse: GitHubResponse): {
  assignees: string[]
  requestedReviewers: string[]
  labels: string[]
  milestone: string | null
  creator: string
  mergedBy: string | null
  repository: string
} {
  return {
    assignees: this.extractAssignees(apiResponse.assignees),
    requestedReviewers: this.extractRequestedReviewers(apiResponse.requested_reviewers),
    labels: this.extractLabels(apiResponse.labels),
    milestone: apiResponse.milestone?.title || null,
    creator: apiResponse.user?.login || 'unknown',
    mergedBy: apiResponse.merged_by?.login || null,
    repository: this.extractRepository(apiResponse.repository?.full_name, apiResponse.repository_url)
  }
}

private static extractApiDates(apiResponse: GitHubResponse): {
  createdAt: Date
  updatedAt: Date
  closedAt: Date | null
  mergedAt: Date | null
} {
  return {
    createdAt: new Date(apiResponse.created_at || Date.now()),
    updatedAt: new Date(apiResponse.updated_at || Date.now()),
    closedAt: apiResponse.closed_at ? new Date(apiResponse.closed_at) : null,
    mergedAt: apiResponse.merged_at ? new Date(apiResponse.merged_at) : null
  }
}
```

#### Data Extraction Pattern Benefits

1. **Complexity Management**: Each method stays under ESLint complexity limit (≤20)
2. **Separation of Concerns**: 
   - Basic data (IDs, strings, numbers)
   - Relationships (users, labels, references)
   - Dates (parsing and null handling)
3. **Type Safety**: Each extraction method has explicit return types
4. **Testability**: Helper methods can be tested independently
5. **Readability**: Intent is clear from method names
6. **Maintainability**: Changes isolated to specific data types
7. **Reusability**: Helper patterns work across CLI, REST API, and GraphQL factories

#### When to Apply
- Factory methods approaching complexity limit (>15)
- Large constructor calls with >10 parameters
- Multiple data source transformations (API + CLI + GraphQL)
- Complex conditional logic in data mapping

## ESLint Integration

For ESLint configuration and additional rules, see the **DTO Quality Patterns** section in the main project documentation. The patterns documented here work within the existing ESLint configuration without requiring rule changes.

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