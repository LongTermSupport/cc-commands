# Service Architecture for cc-commands

## Core Concept

The orchestrator pattern uses **OrchestrationServices** that return `LLMInfo` to maintain the paradigm that TypeScript provides tools for the LLM, not intelligence.

## Architecture Layers

```
┌─────────────────┐
│   Orchestrator  │  Returns: LLMInfo
└────────┬────────┘
         │ uses (directly)
┌────────▼────────┐
│ Orchestration   │  Implements: IOrchestrationService
│    Service      │  Returns: LLMInfo (enforced contract)
└────────┬────────┘
         │ uses (internally)
┌────────▼────────┐
│ Regular Service │  Any interface
│    Classes      │  Any return type
└─────────────────┘
```

**Key Point**: Only services directly used by orchestrators need to implement `IOrchestrationService`. All other services can have any interface and return type that makes sense for their purpose.

## The Formal Contract

### IOrchestrationService Interface

```typescript
/**
 * Standard interface for all orchestration services.
 * These services return LLMInfo to maintain architectural boundaries.
 */
export interface IOrchestrationService {
  /**
   * Execute the service operation
   * @param context - Contextual data needed for the operation
   * @returns LLMInfo with data, files, actions, and instructions
   */
  execute(context: ServiceContext): Promise<LLMInfo>
}

/**
 * Context passed to orchestration services
 */
export interface ServiceContext {
  /** Input parameters */
  params: Record<string, unknown>
  
  /** Shared data from previous service executions */
  sharedData?: Record<string, string>
  
  /** Execution flags */
  flags?: {
    verbose?: boolean
    dryRun?: boolean
  }
}
```

## Implementation Example

### Orchestration Service (Returns LLMInfo)

```typescript
export class DataCollectionService implements IOrchestrationService {
  constructor(
    private githubApi: IGitHubApiService,  // Internal service - any return type
    private fileWriter: IFileWriter,       // Internal service - any return type
    private analyzer: IDataAnalyzer        // Internal service - any return type
  ) {}
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    const { owner, repo } = context.params
    
    try {
      // Use internal services with their native return types
      const repoData = await this.githubApi.getRepository(owner as string, repo as string)
      const analysis = await this.analyzer.analyzeActivity(repoData)
      
      // Write large data to file for optional LLM access
      const dataFile = `/tmp/repo-data-${Date.now()}.json`
      await this.fileWriter.writeJson(dataFile, {
        repository: repoData,
        analysis: analysis
      })
      
      // Return LLMInfo with references
      result.addData('STARS_COUNT', String(repoData.stars))
      result.addData('COMMIT_COUNT', String(analysis.commitCount))
      result.addData('CONTRIBUTOR_COUNT', String(analysis.contributorCount))
      
      // Tell LLM about the detailed data file
      result.addFile(dataFile, 'created', JSON.stringify(repoData).length)
      result.addInstruction('Full repository data available in file if needed for detailed analysis')
      
      result.addAction('Collected repository data', 'success')
      
    } catch (error) {
      result.setError(CommandError.fromError(error, {
        action: 'collecting repository data',
        owner: owner as string,
        repo: repo as string
      }))
    }
    
    return result
  }
}
```

### Internal Service (Flexible Return Types)

```typescript
// This service can return any type - it's internal to the orchestration service
export interface IGitHubApiService {
  getRepository(owner: string, repo: string): Promise<GitHubRepository>
  getCommits(owner: string, repo: string, since: Date): Promise<Commit[]>
}

// Rich typed interfaces for internal use
export interface GitHubRepository {
  name: string
  owner: string
  stars: number
  forks: number
  language: string
  topics: string[]
  // ... many more fields
}
```

## Key Benefits

1. **Paradigm Enforcement**: The LLMInfo boundary ensures orchestrators and their services only provide data and instructions, never formatting or decisions.

2. **File Management**: Large datasets can be written to files and referenced in LLMInfo, letting the LLM decide whether to examine them.

3. **Flexibility**: Internal services can use rich types for better development experience while the boundary maintains the contract.

4. **Testability**: OrchestrationServices can be easily mocked by returning LLMInfo.

5. **Debugging**: Debug files are automatically tracked when added to LLMInfo.

## Orchestrator Pattern

```typescript
export class ProjectSummaryOrchestrator extends BaseCommand {
  constructor(
    private envValidator: IOrchestrationService,
    private projectDetector: IOrchestrationService,
    private dataCollector: IOrchestrationService
  ) {
    super()
  }
  
  async execute(): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    // Step 1: Validate environment
    const envResult = await this.envValidator.execute({
      params: { 
        requiredTools: ['git', 'gh'],
        requiredEnvVars: ['GITHUB_TOKEN']
      }
    })
    result.merge(envResult)
    if (envResult.hasError()) return result
    
    // Step 2: Detect project
    const detectResult = await this.projectDetector.execute({
      params: this.flags,
      sharedData: envResult.getData()
    })
    result.merge(detectResult)
    if (detectResult.hasError()) return result
    
    // Step 3: Collect data
    const dataResult = await this.dataCollector.execute({
      params: {
        owner: detectResult.getData()['REPO_OWNER'],
        repo: detectResult.getData()['REPO_NAME'],
        ...this.flags
      }
    })
    result.merge(dataResult)
    
    // Final instructions
    result.addInstruction('Generate a project summary report from the collected data')
    result.addInstruction('Adapt tone and detail level based on the provided AUDIENCE parameter')
    
    return result
  }
}
```

## Guidelines

1. **OrchestrationServices** (used directly by orchestrators) always return `LLMInfo`
2. **Regular services** (used internally) can return any type for flexibility
3. **Large data** goes to files, with paths in LLMInfo
4. **Debug info** is written to files and referenced
5. **No formatting** or text generation in services
6. **No audience interpretation** - just pass it through
7. **Instructions** guide the LLM on what to do with the data

## Existing Services Classification

### Regular Services (Don't need IOrchestrationService)
- `GitHubApiService` - Returns typed GitHub data
- `ProjectDetectionService` - Returns project info
- `DataCollectionService` - Returns activity data

### Orchestration Services (Need to implement IOrchestrationService)
For the g:gh:project:summary command, we need to create:
- `EnvironmentValidationService` - Validates tools and environment
- `ProjectDetectionOrchestrationService` - Wraps ProjectDetectionService, returns LLMInfo
- `DataCollectionOrchestrationService` - Wraps DataCollectionService, returns LLMInfo

This architecture ensures the TypeScript code remains a tool that provides data and capabilities, while the LLM handles all intelligence, formatting, and decision-making based on the command context.