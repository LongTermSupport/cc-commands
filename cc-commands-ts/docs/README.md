# CC Commands TypeScript Documentation

## Critical Understanding: TypeScript vs LLM Division of Labor

Before diving into the technical details, it's crucial to understand the fundamental separation of responsibilities:

### TypeScript Orchestrators: Data Collection Only
- Fetch raw data from APIs
- Return KEY=value pairs
- Perform calculations
- Handle authentication
- **DO NOT**: Generate reports, make decisions about importance, or create formatted output

### LLM (Command Markdown): Intelligence Layer
- Interprets the raw data
- Generates summaries and reports
- Makes decisions about importance
- Adapts output for different audiences
- Provides insights and recommendations

### Key Principle
TypeScript code should never make subjective decisions or generate human-readable content. It only collects and presents raw data. The LLM handles all interpretation and presentation.

```typescript
// ✅ GOOD: Provide data and instructions
result.addData('ERROR_COUNT', '15')
result.addInstruction('Generate an error analysis report')

// ❌ BAD: Making decisions for the LLM
if (errorCount > 10) {
  result.addInstruction('Emphasize this as critical')
}
```

## Quick Start

This is the TypeScript implementation of CC Commands, providing orchestrators and services for Claude Code commands.

### Key Concepts

1. **Commands are thin wrappers** - They only parse CLI arguments and call orchestrators
2. **Orchestrators are pure functions** - They coordinate services and return LLMInfo
3. **Services handle business logic** - They interact with external APIs and return DTOs
4. **DTOs ensure type safety** - All data exchange uses strongly-typed Data Transfer Objects
5. **No magic strings** - All data keys are defined as constants

### Architecture

```
Command → Orchestrator → Services → External APIs
   ↓           ↓            ↓
 Args      LLMInfo        DTOs
```

## Documentation Structure

- [`DTOArchitecture.md`](./DTOArchitecture.md) - DTO patterns and no-magic-strings policy
- [`TestingStrategy.md`](./TestingStrategy.md) - Testing approach with oclif limitations
- [`DevelopmentGuide.md`](./DevelopmentGuide.md) - Day-to-day development workflow
- [`CommandPatterns.md`](./CommandPatterns.md) - Creating new commands
- [`ServicePatterns.md`](./ServicePatterns.md) - Creating new services

## Core Principles

### 1. Fail Fast

Never hide errors. When something is wrong, throw immediately with clear context:

```typescript
if (!repoOwner || !repoName) {
  throw new Error('Project detection did not return owner/name')
}
```

### 2. Functional Dependency Injection

No `new` keyword in orchestrators. All dependencies injected via parameters:

```typescript
export async function executeProjectSummary(
  services: ProjectSummaryServices,  // Injected
  args: ProjectSummaryArgs,
  flags: ProjectSummaryFlags
): Promise<LLMInfo> {
  // Pure orchestration logic
}
```

### 3. Type Safety Everywhere

All methods have explicit return types. All data uses DTOs:

```typescript
async collectRepositoryData(
  owner: string, 
  repo: string
): Promise<RepositoryDataDTO> {  // Clear return type
  const response = await this.api.getRepository(owner, repo)
  return RepositoryDataDTO.fromGitHubResponse(response)
}
```

## Quick Examples

### Creating a Command

```typescript
export default class MyCommand extends BaseCommand {
  static override args = {
    input: Args.string({ required: true })
  }
  
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(MyCommand)
    const services = ServiceFactory.createMyCommandServices()
    return executeMyCommand(services, args, flags)
  }
}
```

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

### Using in Orchestrator

```typescript
const repoData = await dataService.collectRepositoryData(owner, repo)
const result = LLMInfo.create()
  .addDataFromDTO(repoData)  // Type-safe data addition
  .addAction('Data collected', 'success')
```

## Development Workflow

1. **Always run QA after changes**: `npm run qa`
2. **Write tests first**: `npm run test:watch`
3. **Use DTOs for all data**: No magic strings
4. **Keep orchestrators pure**: No side effects
5. **Document with JSDoc**: All public APIs

## Getting Help

- See [`DevelopmentGuide.md`](./DevelopmentGuide.md) for detailed workflows
- Check [`../CLAUDE.md`](../CLAUDE.md) for quality standards
- Review [`CommandPatterns.md`](./CommandPatterns.md) for examples