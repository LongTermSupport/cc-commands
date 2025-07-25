# Claude Code Commands (TypeScript)

A TypeScript framework for building orchestrator commands that provide rapid, reliable functionality for Claude Code LLM interactions.

## Quick Start

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Run tests
npm test

# Run full QA (typecheck + lint + test)
npm run qa
```

## Architecture Overview

This project follows a strict type-safe architecture designed for maintainability and reliability:

- **Commands**: Thin OCLIF layer that handles CLI interaction
- **Orchestrators**: Coordinate multiple services and return `LLMInfo`
- **Orchestrator Services**: Domain-specific service coordinators
- **Services**: Business logic that returns DTOs
- **DTOs**: Data Transfer Objects implementing `ILLMDataDTO`

### Type Safety First

We enforce strict type safety through custom ESLint rules:

- ✅ No `as unknown as` type casting
- ✅ **NO string-based argument passing between services** (use typed interfaces)
- ✅ No direct use of abstract types as parameters
- ✅ No `any` types for API responses
- ✅ Safe property access with null checks

## Example: Creating a New Command

### 1. Define Your Service Types

```typescript
// src/orchestrator-services/myservice/types/ServiceTypes.ts
import { IDataCollectorService } from '../interfaces/IDataCollectorService'
import { IValidatorService } from '../interfaces/IValidatorService'

export type TMyCommandServices = {
  dataCollector: IDataCollectorService
  validator: IValidatorService
}
```

### 2. Create the Orchestrator

```typescript
// src/orchestrators/my/command/myOrch.ts
import { IOrchestrator } from '../../../core/interfaces/IOrchestratorService'
import { LLMInfo } from '../../../core/LLMInfo'
import { TMyCommandServices } from '../../../orchestrator-services/myservice/types/ServiceTypes'

export const myOrch: IOrchestrator<TMyCommandServices> = async (
  commandArgs: string,
  services: TMyCommandServices  // Fully typed - no casting needed!
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  
  // Services are properly typed
  const data = await services.dataCollector.collectData()
  const validation = await services.validator.validate(data)
  
  result.addDataFromDTO(data)
  result.addData('VALIDATION_STATUS', validation.isValid ? 'VALID' : 'INVALID')
  
  return result
}
```

### 3. Create the Command

```typescript
// src/commands/my/command.ts
import { Command, Flags } from '@oclif/core'
import { myOrch } from '../../orchestrators/my/command/myOrch'
import { createServices } from '../../orchestrator-services/myservice/ServiceFactory'

export default class MyCommand extends Command {
  static override description = 'My command description'
  
  static override args = {
    arguments: Args.string({
      description: 'Arguments from LLM',
      required: false
    })
  }

  async run(): Promise<void> {
    const { args } = await this.parse(MyCommand)
    const services = await createServices()
    
    const result = await myOrch(args.arguments || '', services)
    
    process.stdout.write(result.toString())
    this.exit(result.getExitCode())
  }
}
```

## Key Principles

### 1. No Magic Strings
All data keys must be defined as constants in DTOs:

```typescript
// ❌ BAD
result.addData('REPOSITORY_NAME', repo.name)

// ✅ GOOD
const repoData = new RepositoryDataDTO(repo)
result.addDataFromDTO(repoData)
```

### 2. Explicit Dependencies
Every orchestrator declares its exact service dependencies:

```typescript
// ❌ BAD - Using abstract type
function myOrch(services: TAbstractOrchestratorServiceMap) { }

// ✅ GOOD - Specific typed services
function myOrch(services: TMySpecificServices) { }
```

### 3. Type-Safe Communication
**CRITICAL**: Services communicate ONLY via typed objects, NEVER strings:

```typescript
// ❌ BAD - String arguments (NEVER ALLOWED)
const args = `${projectId} ${commandArgs}`
const params = "owner:foo|repo:bar|days:30"

// ✅ GOOD - Typed arguments (REQUIRED PATTERN)
interface ProjectArgs {
  projectId: string
  commandArgs: string
}

interface ActivityArgs {
  owner: string
  repo: string
  timeWindowDays: number
}

// All orchestrators and services use typed interfaces
const args: ProjectArgs = { projectId, commandArgs }
const params: ActivityArgs = { owner: 'foo', repo: 'bar', timeWindowDays: 30 }
```

## Documentation

- [Architecture Guide](./CLAUDE.md) - Comprehensive architecture documentation
- [ESLint Rules](./docs/ESLint.md) - Code quality patterns and custom rules
- [Testing Guide](./docs/Testing.md) - TDD practices and testing strategy
- [DTO Architecture](./docs/DTOArchitecture.md) - DTO patterns and guidelines

## Quality Assurance

The project enforces quality through:

1. **TypeScript**: Strict type checking with no implicit any
2. **ESLint**: 5 custom rules for type safety + standard rules
3. **Testing**: 3-tier testing strategy (unit, integration, e2e)
4. **CI/CD**: Automated quality gates on every commit

Run full QA before committing:

```bash
npm run qa
```

## Custom ESLint Rules

We enforce type safety through custom rules:

- `no-direct-abstract-types` - Prevents using abstract types as parameters
- `no-unsafe-type-casting` - Prevents `as unknown as` patterns
- `no-string-based-service-args` - Enforces typed service communication
- `require-typed-data-access` - Ensures safe property access
- `no-api-response-any` - Requires proper API response typing

## Contributing

1. Follow TDD - write tests first
2. Run `npm run qa` after every change
3. No bulk file updates - edit files individually
4. Follow the architecture patterns in CLAUDE.md
5. Ensure all code passes the custom ESLint rules

## License

[Your License Here]