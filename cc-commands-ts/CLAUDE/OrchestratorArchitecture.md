# Orchestrator Architecture

## Core Concepts

### Commands vs Orchestrators vs Services

1. **Commands** - Markdown files (`.claude/commands/g/gh/project/summary.md`)
   - Interpreted by the LLM
   - Contain instructions for the LLM
   - Decide how to use data

2. **Orchestrators** - TypeScript classes that coordinate operations
   - Do NOT make decisions
   - Coordinate services to gather data
   - Return LLMInfo with raw KEY=value data
   - Use dependency injection for all services

3. **Services** - Reusable components that do specific work
   - Have clear interfaces
   - Return typed results
   - Are injected into orchestrators
   - Are easily mockable for testing

## Architecture Pattern

```typescript
// Service interfaces define contracts
interface IEnvironmentValidator {
  validate(requirements: EnvironmentRequirements): Promise<ValidationResult>
}

interface IRepositoryDetector {
  detectFromDirectory(): Promise<RepositoryInfo>
  detectFromUrl(url: string): Promise<RepositoryInfo>
}

interface IDataCollector {
  collectRepositoryData(repo: RepositoryInfo): Promise<RepositoryData>
}

// Result types are specific to each service
interface ValidationResult {
  isValid: boolean
  missingTools: string[]
  missingVars: string[]
}

interface RepositoryInfo {
  owner: string
  name: string
  url: string
}

// Orchestrator uses injected services
class ProjectSummaryOrchestrator {
  constructor(
    private envValidator: IEnvironmentValidator,
    private repoDetector: IRepositoryDetector,
    private dataCollector: IDataCollector
  ) {}
  
  async execute(args: CommandArgs): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    // Step 1: Validate environment
    const validation = await this.envValidator.validate({
      tools: ['git', 'gh'],
      vars: ['GITHUB_TOKEN']
    })
    
    if (!validation.isValid) {
      result.addData('ENVIRONMENT_VALID', 'false')
      result.addData('MISSING_TOOLS', validation.missingTools.join(','))
      return result
    }
    
    // Step 2: Detect repository
    const repo = await this.repoDetector.detectFromDirectory()
    result.addData('REPOSITORY_OWNER', repo.owner)
    result.addData('REPOSITORY_NAME', repo.name)
    
    // Step 3: Collect data
    const data = await this.dataCollector.collectRepositoryData(repo)
    result.addData('STARS_COUNT', String(data.stars))
    // ... etc
    
    return result
  }
}
```

## Dependency Injection Pattern

### 1. Factory Pattern for Orchestrators

```typescript
// Factory creates orchestrators with proper dependencies
class OrchestratorFactory {
  static createProjectSummaryOrchestrator(): ProjectSummaryOrchestrator {
    // Create real services
    const envValidator = new EnvironmentValidator()
    const repoDetector = new RepositoryDetector()
    const dataCollector = new DataCollector(
      new GitHubApiService({ auth: process.env.GITHUB_TOKEN })
    )
    
    // Inject into orchestrator
    return new ProjectSummaryOrchestrator(
      envValidator,
      repoDetector,
      dataCollector
    )
  }
}
```

### 2. Testing with Mocks

```typescript
describe('ProjectSummaryOrchestrator', () => {
  it('should collect repository data', async () => {
    // Create mocks
    const mockEnvValidator: IEnvironmentValidator = {
      validate: async () => ({ isValid: true, missingTools: [], missingVars: [] })
    }
    
    const mockRepoDetector: IRepositoryDetector = {
      detectFromDirectory: async () => ({ 
        owner: 'test', 
        name: 'repo',
        url: 'https://github.com/test/repo'
      })
    }
    
    const mockDataCollector: IDataCollector = {
      collectRepositoryData: async () => ({ stars: 100, forks: 20 })
    }
    
    // Inject mocks
    const orchestrator = new ProjectSummaryOrchestrator(
      mockEnvValidator,
      mockRepoDetector,
      mockDataCollector
    )
    
    // Test
    const result = await orchestrator.execute({ mode: 'auto' })
    expect(result.getData()).toEqual({
      REPOSITORY_OWNER: 'test',
      REPOSITORY_NAME: 'repo',
      STARS_COUNT: '100'
    })
  })
})
```

## Key Principles

1. **No `new` in orchestrators** - All dependencies injected
2. **Interfaces over implementations** - Depend on abstractions
3. **Single responsibility** - Each service does one thing
4. **Typed results** - No string parsing, use proper types
5. **Testable** - Easy to mock any service
6. **No decisions** - Orchestrators just coordinate, don't interpret

## Service Guidelines

### What Makes a Good Service

1. **Clear purpose** - "Validates environment", "Detects repository"
2. **Reusable** - Can be used by multiple orchestrators
3. **Stateless** - No internal state between calls
4. **Async** - All methods return promises
5. **Error handling** - Throws typed errors with context

### Example Service Implementation

```typescript
class EnvironmentValidator implements IEnvironmentValidator {
  async validate(requirements: EnvironmentRequirements): Promise<ValidationResult> {
    const missingTools: string[] = []
    const missingVars: string[] = []
    
    // Check tools
    for (const tool of requirements.tools || []) {
      if (!await this.isToolAvailable(tool)) {
        missingTools.push(tool)
      }
    }
    
    // Check vars
    for (const varName of requirements.vars || []) {
      if (!process.env[varName]) {
        missingVars.push(varName)
      }
    }
    
    return {
      isValid: missingTools.length === 0 && missingVars.length === 0,
      missingTools,
      missingVars
    }
  }
  
  private async isToolAvailable(tool: string): Promise<boolean> {
    // Implementation
  }
}
```

## Orchestrator Lifecycle

1. **Creation** - Factory creates with dependencies
2. **Execution** - oclif calls the orchestrator
3. **Coordination** - Orchestrator calls services in sequence
4. **Data collection** - Results converted to LLMInfo
5. **Output** - LLMInfo returned for LLM processing

## Anti-patterns to Avoid

❌ **Creating services inside orchestrator**
```typescript
// WRONG
class BadOrchestrator {
  execute() {
    const validator = new EnvironmentValidator() // NO!
  }
}
```

❌ **Making decisions based on data**
```typescript
// WRONG
if (audience === 'dev') {
  result.addData('INCLUDE_TECHNICAL', 'true') // NO!
}
```

❌ **Returning formatted output**
```typescript
// WRONG
return `# Project Summary\nStars: ${stars}` // NO!
```

✅ **Correct pattern**
```typescript
// RIGHT
class GoodOrchestrator {
  constructor(private validator: IEnvironmentValidator) {}
  
  execute() {
    const validation = await this.validator.validate(...)
    result.addData('ENVIRONMENT_VALID', String(validation.isValid))
    return result // Just data, no formatting
  }
}
```