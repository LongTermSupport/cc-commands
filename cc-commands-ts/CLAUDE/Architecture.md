# cc-commands TypeScript Architecture

## Core Principle

**Commands are markdown files. TypeScript code provides orchestrators that do work FOR commands.**

The LLM interprets the command and uses orchestrators to perform deterministic operations.

## Critical Distinctions

### Commands (Markdown Files)
- Located in `.claude/commands/` (e.g., `g/gh/project/summary.md`)
- Interpreted by the LLM
- Contain instructions for the LLM
- Decide how to format output
- Make audience-specific decisions
- Generate human-readable reports

### Orchestrators (TypeScript)
- Located in `cc-commands-ts/src/` 
- Do NOT interpret anything
- Do NOT make formatting decisions
- Do NOT understand audience types
- Only perform deterministic operations
- Return raw KEY=value data via LLMInfo

## Key Components

### Orchestrator Structure
- **Base Class**: @src/commands/BaseCommand.ts (TODO: rename to BaseOrchestrator)
- **Return Type**: @src/types/LLMInfo.ts  
- **Error Type**: @src/errors/CommandError.js

### Architectural Enforcement

1. **Orchestrators MUST extend BaseCommand** (TODO: rename)
   - See abstract `execute()` method
   - Final `run()` method prevents override

2. **Orchestrators MUST return LLMInfo**
   - Private constructor prevents extension
   - Factory method: `LLMInfo.create()`
   - Structured KEY=value output format only

3. **Errors MUST be CommandError**
   - Mandatory recovery instructions
   - Rich debug context
   - See error factories: @src/errors/GitHubErrorFactory.ts

4. **Orchestrators MUST NOT**
   - Generate reports or rich text
   - Make formatting decisions
   - Interpret audience types or preferences
   - Add "instructions" for the LLM
   - Make decisions based on output format

## Example Implementation

```typescript
// WRONG - Orchestrator making LLM decisions
class SummaryCommand {
  execute() {
    // ...collect data...
    
    // WRONG - This is LLM's job!
    if (audience === 'dev') {
      result.addInstruction('Focus on technical details')
    }
  }
}

// RIGHT - Orchestrator just provides data
class SummaryOrchestrator {
  execute() {
    // ...collect data...
    
    // Just pass through raw data
    result.addData('AUDIENCE', flags.audience)
    result.addData('STARS_COUNT', String(repoData.stars))
    
    // No instructions, no formatting hints
    return result
  }
}
```

## Directory Structure

```
src/
├── commands/       # Thin oclif command wrappers
│   └── g/
│       └── gh/
│           └── project/
│               └── summary.ts  # Oclif command (thin wrapper)
├── orchestrators/  # Pure orchestration logic (testable functions)
│   └── g/
│       └── gh/
│           └── project/
│               └── executeProjectSummary.ts  # Pure orchestration function
├── services/       # Reusable service implementations
├── interfaces/     # Service interfaces and contracts
├── types/          # Type definitions (LLMInfo, etc)
├── errors/         # Error factories
├── factories/      # Service factories with DI
└── utils/          # Utilities
```

## Naming Conventions

### Type Naming Strategy

To prevent naming collisions and maintain clarity:

1. **Service Interfaces**: Use `I` prefix for contracts with methods
   - ✅ `IDataCollectionService` - interface defining service methods
   - ✅ `IGitHubApiService` - interface defining service methods
   - ❌ `IProjectData` - NOT a service interface (it's just data)

2. **Data Transfer Objects (DTOs)**: Use `DTO` suffix for pure data structures
   - ✅ `ProjectDataDTO` - pure data structure
   - ✅ `RepositoryInfoDTO` - pure data structure
   - ✅ `ContributorDTO` - pure data structure
   - ❌ `IProjectData` - don't use I prefix for DTOs
   - ❌ `ProjectData` - unclear if it's a class or interface

3. **Why DTOs?**
   - Makes it clear these are data-only structures
   - No methods or behavior
   - Can be safely serialized/deserialized
   - Prevents confusion with service classes

4. **Import Strategy**: Always use type imports
   ```typescript
   import type { ProjectDataDTO } from '../types/ProjectDataDTO.js'
   import type { IDataCollectionService } from '../interfaces/IDataCollectionService.js'
   ```

5. **Location Strategy**:
   - **Shared DTOs**: Place in `src/types/`
   - **Service-specific DTOs**: Can live with the service if only used there
   - **Service interfaces**: Always in `src/interfaces/`

### Examples

```typescript
// src/interfaces/IDataCollectionService.ts
import type { ProjectDataDTO } from '../types/ProjectDataDTO.js'

export interface IDataCollectionService {
  collectData(owner: string, repo: string): Promise<ProjectDataDTO>
}

// src/types/ProjectDataDTO.ts
export interface ProjectDataDTO {
  project: ProjectInfoDTO
  activity: ActivityMetricsDTO
  contributors: ContributorDTO[]
  // ... other fields - data only, no methods
}

// src/services/github/DataCollectionService.ts
import type { IDataCollectionService } from '../../interfaces/IDataCollectionService.js'
import type { ProjectDataDTO } from '../../types/ProjectDataDTO.js'

export class DataCollectionService implements IDataCollectionService {
  async collectData(owner: string, repo: string): Promise<ProjectDataDTO> {
    // implementation
  }
}
```

## Dependency Injection Pattern

### The Problem with Oclif
Oclif controls command instantiation, making traditional DI containers (like InversifyJS) difficult to use. We need a pattern that:
- Allows pure unit testing with mocked dependencies
- Works with oclif's instantiation model
- Maintains clean separation of concerns

### Our Solution: Functional Orchestration

We separate the oclif command (which handles CLI parsing) from the orchestration logic (which is a pure function):

```typescript
// src/orchestrators/g/gh/project/executeProjectSummary.ts
export async function executeProjectSummary(
  services: ProjectSummaryServices,
  args: ParsedArgs,
  flags: ParsedFlags
): Promise<LLMInfo> {
  // Pure orchestration logic
  // Easy to test with mocked services
  // No knowledge of oclif or CLI
}

// src/commands/g/gh/project/summary.ts
export default class Summary extends BaseCommand {
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(Summary)
    
    // Production: use factory
    const services = ServiceFactory.createProjectSummaryServices(flags.token)
    
    // Delegate to pure function
    return executeProjectSummary(services, args, flags)
  }
}
```

### Benefits

1. **Pure Testability**: Test the orchestration function directly with mocked services
2. **No DI Framework**: No decorators, no reflection, no complexity
3. **Clear Separation**: CLI concerns separate from business logic
4. **Type Safety**: Full TypeScript type checking for all dependencies

### Testing Example

```typescript
// Easy to test with mocks
it('should collect project data', async () => {
  const mockServices: ProjectSummaryServices = {
    envValidator: createMock<IOrchestrationService>(),
    projectDetector: createMock<IOrchestrationService>(),
    dataCollector: createMock<IOrchestrationService>()
  }
  
  const result = await executeProjectSummary(
    mockServices,
    { url: 'https://github.com/owner/repo' },
    { token: 'test-token' }
  )
  
  expect(result.hasError()).toBe(false)
})
```

## Orchestrator Pattern

See @CLAUDE/OrchestratorArchitecture.md for additional patterns including:
- Service interface design
- Error handling strategies
- Anti-patterns to avoid

## Testing Architecture

### Core Testing Principles

1. **Commands are ultra-thin wrappers** - They ONLY parse arguments and delegate to orchestrators
2. **Orchestrators are pure functions** - They accept services and return LLMInfo
3. **Unit tests target orchestrators** - Fast, focused tests with mocked dependencies
4. **Integration tests target commands** - Full CLI testing with test doubles

### Command Structure (Ultra-Thin)

```typescript
// src/commands/g/gh/project/summary.ts
export default class Summary extends BaseCommand {
  static override args = {
    url: Args.string({ description: 'GitHub repository URL', required: false })
  }
  
  static override flags = {
    owner: Flags.string({ char: 'o', description: 'Repository owner' }),
    repo: Flags.string({ char: 'r', description: 'Repository name' }),
    token: Flags.string({ char: 't', description: 'GitHub token' })
  }

  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(Summary)
    const services = ServiceFactory.createProjectSummaryServices(flags.token)
    return executeProjectSummary(services, args, flags)
  }
}
```

**NO LOGIC** in commands - they are just the glue between CLI and orchestrator.

### Testing Strategy

#### 1. Unit Tests: Orchestrators
Test the pure orchestration functions with mocked services:

```typescript
// test/orchestrators/g/gh/project/executeProjectSummary.test.ts
describe('executeProjectSummary', () => {
  it('should handle URL input mode', async () => {
    const mockServices: ProjectSummaryServices = {
      envValidator: {
        execute: vi.fn().mockResolvedValue(
          LLMInfo.create().addData('ENV_VALID', 'true')
        )
      },
      projectDetector: {
        execute: vi.fn().mockResolvedValue(
          LLMInfo.create()
            .addData('REPO_OWNER', 'owner')
            .addData('REPO_NAME', 'repo')
        )
      },
      dataCollector: {
        execute: vi.fn().mockResolvedValue(
          LLMInfo.create()
            .addData('STARS', '100')
            .addData('LANGUAGE', 'TypeScript')
        )
      }
    }
    
    const result = await executeProjectSummary(
      mockServices,
      { url: 'https://github.com/owner/repo' },
      { audience: 'dev' }
    )
    
    expect(result.hasError()).toBe(false)
    expect(result.getData()).toMatchObject({
      REPO_OWNER: 'owner',
      STARS: '100'
    })
  })
})
```

#### 2. Integration Tests: Commands
Test the full CLI with test doubles:

```typescript
// test/commands/g/gh/project/summary.integration.test.ts
import { runCommand } from '@oclif/test'
import { TestServiceFactory } from '../../../../test/factories/TestServiceFactory.js'

describe('g:gh:project:summary integration', () => {
  beforeEach(() => {
    // Override the real factory with test factory
    vi.spyOn(ServiceFactory, 'createProjectSummaryServices')
      .mockImplementation(() => TestServiceFactory.createProjectSummaryServices())
  })
  
  it('should parse CLI arguments and execute', async () => {
    const testServices = TestServiceFactory.createProjectSummaryServices()
    testServices.dataCollector.addResponse('owner/repo', 
      LLMInfo.create()
        .addData('REPO_NAME', 'repo')
        .addData('STARS', '100')
    )
    
    const { stdout } = await runCommand([
      'g:gh:project:summary',
      'https://github.com/owner/repo'
    ])
    
    expect(stdout).toContain('REPO_NAME=repo')
    expect(stdout).toContain('STARS=100')
  })
})
```

### Service Factories

#### Production Factory
Creates real service implementations:

```typescript
// src/factories/ServiceFactory.ts
export class ServiceFactory {
  static createProjectSummaryServices(token?: string): ProjectSummaryServices {
    const githubApi = new GitHubApiService({ auth: getGitHubToken(token) })
    const envValidator = new EnvironmentValidationService()
    const projectDetector = new ProjectDetectionOrchestrationService(
      new ProjectDetectionService(githubApi)
    )
    const dataCollector = new DataCollectionOrchestrationService(
      new DataCollectionService(githubApi)
    )
    
    return { envValidator, projectDetector, dataCollector }
  }
}
```

#### Test Factory
Creates test doubles:

```typescript
// test/factories/TestServiceFactory.ts
export class TestServiceFactory {
  static createProjectSummaryServices(): TestProjectSummaryServices {
    return {
      envValidator: new TestEnvironmentValidator(),
      projectDetector: new TestProjectDetector(),
      dataCollector: new TestDataCollector()
    }
  }
}
```

### Test Doubles

Test doubles implement the same interfaces as real services:

```typescript
// test/doubles/TestDataCollector.ts
export class TestDataCollector implements IOrchestrationService {
  private responses = new Map<string, LLMInfo>()
  
  addResponse(key: string, response: LLMInfo) {
    this.responses.set(key, response)
  }
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const key = `${context.params['owner']}/${context.params['repo']}`
    return this.responses.get(key) || 
      LLMInfo.create().setError(new Error('Test data not found'))
  }
}
```

### Why This Architecture?

1. **Fast Unit Tests**: Orchestrator tests run in milliseconds with full control
2. **Reliable Integration Tests**: No real API calls, predictable behavior
3. **Clear Separation**: Business logic (orchestrators) separate from CLI concerns
4. **Type Safety**: Test doubles must implement real interfaces
5. **No Test Pollution**: Production code doesn't know about test code
6. **Easy Maintenance**: Changes to interfaces caught by TypeScript in test doubles

### Test File Organization

```
test/
├── orchestrators/          # Unit tests for pure functions
│   └── g/
│       └── gh/
│           └── project/
│               └── executeProjectSummary.test.ts
├── commands/              # Integration tests for CLI
│   └── g/
│       └── gh/
│           └── project/
│               └── summary.integration.test.ts
├── doubles/               # Test double implementations
│   ├── TestEnvironmentValidator.ts
│   ├── TestProjectDetector.ts
│   └── TestDataCollector.ts
└── factories/            # Test factories
    └── TestServiceFactory.ts
```

## Debug Logging

All orchestrators automatically log to `var/debug/[command]-[timestamp].log`
See @src/commands/BaseCommand.ts `CommandDebugger` class.

## Common Violations to Avoid

1. **Adding audience-specific logic**
   ```typescript
   // WRONG
   if (audience === 'technical') {
     // Add technical data
   }
   ```

2. **Providing formatting hints**
   ```typescript
   // WRONG
   result.addData('REPORT_FORMAT', 'markdown')
   result.addData('EMPHASIS', 'performance metrics')
   ```

3. **Adding LLM instructions**
   ```typescript
   // WRONG
   result.addInstruction('Generate a technical report')
   ```

4. **Making decisions based on parameters**
   ```typescript
   // WRONG
   const reportType = audience === 'exec' ? 'summary' : 'detailed'
   ```

## The Correct Pattern

Orchestrators should be "dumb" - they collect data and return it. All intelligence lives in the LLM interpreting the command markdown file.

```typescript
// Orchestrator: Just the facts
result.addData('REPOSITORY_OWNER', owner)
result.addData('REPOSITORY_NAME', repo)
result.addData('STARS_COUNT', String(stars))
result.addData('AUDIENCE', audienceParam)  // Pass through, don't interpret

// Command (markdown): Makes all the decisions
// The LLM reading the command decides:
// - How to format based on AUDIENCE
// - What data to emphasize
// - How to structure the report
```

## Method Finality and Override Prevention

### Design Decision: @final JSDoc Tag

TypeScript does not have a native `final` keyword like Java or C# to prevent method overriding. After researching various approaches including:
- Private symbols (`#` prefix) - Too restrictive, prevents all access
- Runtime checks - Adds complexity and performance overhead
- Custom ESLint rules - Requires maintaining complex AST analysis
- TypeScript decorators - Not stable, requires experimental features

We've decided to use JSDoc `@final` tags as documentation to indicate methods that should not be overridden:

```typescript
/**
 * Final run method - cannot be overridden by subclasses.
 * 
 * @final
 */
async run(): Promise<void> {
  // Implementation
}
```

### Rationale

1. **Simplicity**: Clear intent without complex implementation
2. **Tool Support**: ESLint's jsdoc plugin can validate the tag
3. **Documentation**: Developers see the intent in their IDE
4. **No Runtime Overhead**: Pure documentation approach
5. **Future Compatible**: Easy to migrate if TypeScript adds `final` keyword

### Configuration

ESLint is configured to recognize `@final` as a valid JSDoc tag:

```javascript
// eslint.config.mjs
'jsdoc/check-tag-names': ['error', {
  definedTags: ['final']
}]
```

This approach balances developer intent communication with practical implementation constraints.

## Integration Testing Limitations and Strategy

### Known Issue: @oclif/test stdout capture

The `@oclif/test` library's `runCommand` function has a limitation where stdout/stderr are not properly captured when testing commands. The command executes in a subprocess, and while output appears in the test console, `result.stdout` and `result.stderr` return empty strings.

### Testing Strategy

Given this limitation, we follow a three-tier testing approach:

#### 1. Unit Tests for Orchestrators (Primary Testing Method)

Test the pure orchestration functions directly with mocked services. This is the preferred approach as it provides fast, deterministic tests without external dependencies.

```typescript
// test/orchestrators/g/gh/project/executeProjectSummary.test.ts
describe('executeProjectSummary', () => {
  it('should handle success case', async () => {
    const mockServices: ProjectSummaryServices = {
      envValidator: { execute: vi.fn().mockResolvedValue(...) },
      projectDetector: { execute: vi.fn().mockResolvedValue(...) },
      dataCollector: { execute: vi.fn().mockResolvedValue(...) }
    }
    
    const result = await executeProjectSummary(mockServices, args, flags)
    
    expect(result.hasError()).toBe(false)
    expect(mockServices.envValidator.execute).toHaveBeenCalled()
    // ... more assertions
  })
})
```

#### 2. Integration Tests with Test Doubles

Use TestServiceFactory to provide test doubles that implement service interfaces. These tests verify command argument parsing and orchestration flow without making real API calls.

```typescript
// test/commands/g/gh/project/summary.integration.test.ts
describe('g:gh:project:summary integration', () => {
  beforeEach(() => {
    vi.spyOn(ServiceFactory, 'createProjectSummaryServices')
      .mockImplementation(() => TestServiceFactory.createProjectSummaryServices())
  })
  
  it('should handle URL input mode', async () => {
    const services = TestServiceFactory.createProjectSummaryServices()
    services.dataCollector.addResponse('owner/repo', mockData)
    
    // Note: stdout capture doesn't work, but command executes
    const { error } = await runCommand(['g:gh:project:summary', 'https://github.com/owner/repo'])
    expect(error).toBeUndefined()
  })
})
```

#### 3. Real API Integration Tests (Optional)

For confidence that commands work with real services, create separate integration tests that make actual API calls. These should be excluded from regular test runs to avoid rate limits and network dependencies.

```typescript
// test/commands/g/gh/project/summary.real-integration.test.ts
describe('g:gh:project:summary real integration', () => {
  // Skip in CI to avoid rate limits
  const skipInCI = process.env.CI ? it.skip : it
  
  skipInCI('should analyze real repository', async () => {
    const { error } = await runCommand([
      'g:gh:project:summary',
      'https://github.com/LongTermSupport/cc-commands'
    ])
    
    // Can only verify no error occurred
    expect(error).toBeUndefined()
  })
})
```

Run real integration tests separately:
```bash
npm run test:real
```

### Summary

- **Primary testing**: Unit test orchestration functions with mocks
- **Secondary testing**: Integration tests with test doubles (limited by stdout capture)
- **Optional testing**: Real API tests run separately
- **Acceptance**: We cannot fully integration test oclif commands due to subprocess isolation

This approach ensures comprehensive testing while working within the constraints of the oclif testing framework.