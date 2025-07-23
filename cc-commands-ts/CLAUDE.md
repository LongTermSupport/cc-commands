# CC Commands TypeScript - CLAUDE Guide

## Core Architecture Principle

**Orchestrators provide raw data, LLMs make decisions.**

TypeScript code (orchestrators) performs deterministic operations and returns raw KEY=value data. The LLM interprets commands and decides how to format output based on audience needs.

## 🚨 CRITICAL DISTINCTION: TypeScript vs LLM Responsibilities

### What TypeScript Orchestrators DO:
- ✅ Fetch raw data from APIs
- ✅ Return simple KEY=value pairs
- ✅ Collect metrics and statistics
- ✅ Perform deterministic calculations
- ✅ Handle authentication and API calls

### What TypeScript Orchestrators DO NOT DO:
- ❌ Generate summaries or reports
- ❌ Format output for humans
- ❌ Make decisions about data importance
- ❌ Create narratives or explanations
- ❌ Adapt output for different audiences

### What the LLM (Command Markdown) DOES:
- ✅ Interprets the raw KEY=value data
- ✅ Generates human-readable summaries
- ✅ Creates formatted reports
- ✅ Adapts content for different audiences
- ✅ Makes decisions about what to emphasize
- ✅ Provides insights and recommendations

### Example:
```typescript
// ✅ CORRECT - Giving LLM instructions on what to do:
result.addInstruction('Generate a project summary report')
result.addInstruction('Adapt the report style based on the AUDIENCE parameter')

// ✅ CORRECT - Providing raw data:
result.addData('REPO_COUNT', '5')
result.addData('TOTAL_ISSUES', '47')
result.addData('TOTAL_PRS', '12')
result.addData('AUDIENCE', 'technical')

// ❌ WRONG - Orchestrator making decisions for the LLM:
if (issueCount > 100) {
  result.addInstruction('Emphasize the high issue count as a concern')
}

// ❌ WRONG - Orchestrator generating content:
const summary = `This project has ${repoCount} repositories with ${issueCount} issues`
result.addData('SUMMARY', summary)
```

## 🚨 Key Principles

### 1. NO MAGIC STRINGS

All data keys must be defined as constants. See [`docs/DTOArchitecture.md`](./docs/DTOArchitecture.md) for the complete guide.

```typescript
// ❌ BAD - Magic string
result.addData('REPOSITORY_NAME', repo.name)

// ✅ GOOD - Using DTO
const repoData = new RepositoryDataDTO(...)
result.addDataFromDTO(repoData)
```

### 2. FAIL FAST

Never hide errors. When something is wrong, throw immediately with a clear error message.

```typescript
// ❌ BAD - Error hiding
const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
return {
  owner: match?.[1] || '',  // Returns empty string if no match
  repo: match?.[2] || ''    // Hides the parsing failure
}

// ✅ GOOD - Fail fast
const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
if (!match || !match[1] || !match[2]) {
  throw new Error(`Invalid GitHub URL format: ${url}`)
}
return { owner: match[1], repo: match[2] }
```

### 3. TYPE SAFETY EVERYWHERE

All methods must have explicit return types. All data exchange uses DTOs.

```typescript
// Service method with clear return type
async collectRepositoryData(
  owner: string, 
  repo: string
): Promise<RepositoryDataDTO> {  // Explicit DTO return type
  const response = await this.api.getRepository(owner, repo)
  return RepositoryDataDTO.fromGitHubResponse(response)
}
```

## Quality Assurance Requirements

### 🚨 CRITICAL: Run QA After Every Change

**After ANY file edit, create, or update, you MUST run:**

```bash
npm run qa
```

This runs:
1. `npm run typecheck` - TypeScript type checking
2. `npm run lint` - ESLint validation with auto-fix
3. `npm run test` - Test suite execution

**If ANY step fails, fix immediately before proceeding.**

## Development Workflow

### 1. Creating New Features

Always follow this order:

1. **Create DTO first** - Define the data structure
2. **Define service interface** - Clear contracts
3. **Implement service** - Business logic with DTO returns
4. **Create orchestrator** - Pure function coordinating services
5. **Create command** - Thin wrapper calling orchestrator
6. **Write tests** - Test orchestrator and services directly

See [`docs/DevelopmentGuide.md`](./docs/DevelopmentGuide.md) for detailed steps.

### 2. Testing Strategy

Due to oclif subprocess isolation:

1. **Prefer unit tests** - Test orchestrators directly with mocked services
2. **Integration tests use TEST_MODE** - Environment variable for test doubles
3. **Real integration tests** - Skip in CI to avoid rate limits

See [`docs/TestingStrategy.md`](./docs/TestingStrategy.md) for complete guide.

## Documentation

All documentation is in the `docs/` folder:

- [`docs/README.md`](./docs/README.md) - Start here
- [`docs/DTOArchitecture.md`](./docs/DTOArchitecture.md) - DTO patterns and no-magic-strings
- [`docs/TestingStrategy.md`](./docs/TestingStrategy.md) - Three-tier testing approach
- [`docs/DevelopmentGuide.md`](./docs/DevelopmentGuide.md) - Day-to-day workflow
- [`docs/CommandPatterns.md`](./docs/CommandPatterns.md) - Creating commands
- [`docs/ServicePatterns.md`](./docs/ServicePatterns.md) - Creating services

Old documentation has been moved to `docs/archive/` for reference.

## Common Commands

```bash
# Full QA suite (ALWAYS run this)
npm run qa

# Individual checks
npm run typecheck
npm run lint        # Always auto-fixes
npm run test

# Development
npm run test:watch  # TDD mode

# Build
npm run build

# Coverage
npm run test:coverage
```

## Architecture Enforcement

ESLint rules enforce our architecture:

1. **No `new` in orchestrators** - Use dependency injection
2. **Explicit return types required** - No implicit any
3. **DTOs must implement ILLMDataDTO** - Type safety
4. **No magic strings in DTOs** - Use const keys
5. **Prefer addDataFromDTO** - Over direct addData

## Quick Reference

### Creating a DTO

```typescript
export class MyDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    FIELD_ONE: 'FIELD_ONE',
    FIELD_TWO: 'FIELD_TWO',
  } as const

  constructor(
    public readonly fieldOne: string,
    public readonly fieldTwo: number
  ) {}

  toLLMData(): Record<string, string> {
    return {
      [MyDataDTO.Keys.FIELD_ONE]: this.fieldOne,
      [MyDataDTO.Keys.FIELD_TWO]: String(this.fieldTwo)
    }
  }
}
```

### Creating a Service

```typescript
export interface IMyService {
  getData(id: string): Promise<MyDataDTO>
}

export class MyService implements IMyService {
  constructor(private readonly api: IApiClient) {}
  
  async getData(id: string): Promise<MyDataDTO> {
    const response = await this.api.get(`/data/${id}`)
    return MyDataDTO.fromApiResponse(response)
  }
}
```

### Creating an Orchestrator

```typescript
export async function executeMyCommand(
  services: MyCommandServices,
  args: MyCommandArgs,
  flags: MyCommandFlags
): Promise<LLMInfo> {
  const result = LLMInfo.create()
  
  try {
    const data = await services.myService.getData(args.id)
    result.addDataFromDTO(data)
    result.addAction('Data retrieval', 'success')
  } catch (error) {
    result.setError(error)
    result.addAction('Data retrieval', 'failed')
  }
  
  return result
}
```

## GitHub Issues Management

**GitHub issues are managed using the `gh` CLI tool, not local files.**

- View issues: `gh issue list`
- Create issue: `gh issue create`
- Update issue: `gh issue edit <number>`
- Comment on issue: `gh issue comment <number> -b "comment"`

Issues live on GitHub.com and should be referenced by number (e.g., #22). Do not create local markdown files for issue tracking.

## Remember

1. **Quality over speed** - Well-tested code is easier to maintain
2. **No magic strings** - Every string should be a const
3. **Fail fast** - Clear errors are better than silent failures
4. **Run QA frequently** - Catch issues early
5. **DTOs everywhere** - Type safety prevents bugs