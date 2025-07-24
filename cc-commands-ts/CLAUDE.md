# Claude Code Commands (Typescript)

This project provides orchestrators which can be utilized by custom slash commands in claude code.

The role of an cc-command is to provide rapid, reliable functionality that the LLM can utilize with simple CLI call

A single custom slash command may call relevant the cc-command multiple times as it progresses through it's process.

Generally this will be in the form of
LLM -> setup
    - parse arguments
    - check environment, confirm required tools etc set up
    - anything else that needs to be done or checked before proceeding
LLM -> execution
    - actually doing things
        - API Calls
        - Collecting data
        - Performing Actions
LLM -> other execution steps as required
    - based on previous execution outcomes, the LLM might decide to call other execution steps

# Development Practice

You are a top tier typescript developer with a passion for best practice, strong types, test driven development, clear API, strong and clear organisation.

We have this basic topography:

## Command

oclif command - very thin, handles CLI interaction. Passes off work to the orchestrator and then handles final output. 

Very thin, only tested with end to end tests (no mocks)

**IMPORTANT**: Commands must use OCLIF exit methods, never direct `process.exit()`:
- `this.exit(code)` - Silent exit with specific code
- `this.error(message, {exit: code})` - Error exit with message
- `return` - Normal success completion

Will receive an $ARGUMENTS argument when called from the LLM. This is a simple string. It might represent multiple arguments. Arguments might include quoted strings. This to be passed verbatim to the orchestrator for parsing and processing.

The Orchestrator will return an [@src/core/LLMInfo.ts](./src/core/LLMInfo.ts) object as a result. 

LLMInfo has a toString method which should be called and sent to stdout.

LLMInfo has a getExitCode method which should be called and then the command should exit with that code.

### Orchestrator
Akin to a controller in MVC. Has dependencies that do work, hinted by interfaces as much as possible. No functionality beyond returning LLMInfo.

Should be very thin, only tested with integration tests (some mocking allowed for third party APIs), real functionality should be handled by services

Orchestrator is an exported async function implementing the IOrchestrator interface

```typescript
// Orchestrator service function type - coordinates regular services
export type IOrchestratorService = (
  args: string,
  services: TOrchestratorServiceMap
) => Promise<LLMInfo>

// Regular services return DTOs (used by orchestrator services)
export interface IDataCollectorService {
  collectRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>
  collectReleaseData(owner: string, repo: string): Promise<ReleaseDataDTO | null>
}

// Collection of orchestrator services, each implementing IOrchestratorService
export type TOrchestratorServiceMap = {
  [serviceName: string]: IOrchestratorService;
}

// The orchestrator function type: must be a function returning a Promise<LLMInfo>
export type IOrchestrator = (
  commandArgs: string, // this is the $ARGUMENTS string that the LLM passes to the command, which then passes it down to the orchestrator for parsing
  services: TOrchestratorServiceMap, 
) => Promise<LLMInfo>;
```

The Orchestrator in the form of a function in the functional dependency injection pattern.

```typescript
// Strictly typed project summary services
export type TProjectSummaryServices = {
  dataCollector: IDataCollectorService;
  dataFileService?: IDataFileService;
  envValidator: IEnvValidatorService;
  projectDetector: IProjectDetectorService;
  projectDiscovery?: IProjectDiscoveryService;
} & TOrchestratorServiceMap;

// Example service interfaces (illustrative only)
export interface IDataCollectorService extends IOrchestratorService {
  // methods
}
export interface IDataFileService extends IOrchestratorService {
  // methods
}
export interface IEnvValidatorService extends IOrchestratorService {
  // methods
}
export interface IProjectDetectorService extends IOrchestratorService {
  // methods
}
export interface IProjectDiscoveryService extends IOrchestratorService {
  // methods
}

// Usage in orchestrator:
export const executeProjectSummary: IOrchestrator = async(
  commandArgs: string,
  services: TProjectSummaryServices,  // Injected
): Promise<LLMInfo> => {
  // Pure orchestration logic
}
```

#### Orchestrator Services

Orchestrator services are exported functions (like orchestrators) that sit between orchestrators and regular services. They follow the same functional pattern as orchestrators but focus on specific domains.

```typescript
// Orchestrator service function signature
export type IOrchestratorService = (
  args: string,  // Parsed arguments specific to this service
  services: TServiceMap  // Regular services that return DTOs
) => Promise<LLMInfo>

// Example orchestrator service - coordinates multiple regular services
export const executeGitHubProjectSummary: IOrchestratorService = async (
  args: string,
  services: TGitHubServices
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  
  // Parse arguments
  const { owner, repo } = parseGitHubArgs(args)
  
  // Coordinate multiple regular services
  const repoData = await services.dataCollector.collectRepositoryData(owner, repo)
  const releaseData = await services.dataCollector.collectReleaseData(owner, repo)
  const issueStats = await services.issueAnalyzer.analyzeIssues(owner, repo)
  
  // Combine all DTOs into single LLMInfo
  result.addDataBulk(repoData.toLLMData())
  if (releaseData) result.addDataBulk(releaseData.toLLMData())
  result.addDataBulk(issueStats.toLLMData())
  
  result.addInstruction('Generate a comprehensive project summary report')
  
  return result
}
```

**Key Principles:**
- Single-purpose functions that do one thing well
- Always return LLMInfo (never DTOs or mixed types)
- Use regular services (that return DTOs) for actual work
- Follow same functional DI pattern as orchestrators

**Testing**: Integration tests with some mocking allowed for third-party APIs. Test the coordination logic and LLMInfo assembly.

**Organization**: Each orchestrator service resides in its own subdirectory with its dependencies, errors, types etc. When working on a service, you should only need files within that directory plus src/core.

## Folder Structure & Naming Conventions

### Project Structure
```
src/
├── core/                                    # Shared core types
│   ├── LLMInfo.ts
│   └── error/
│       └── OrchestratorError.ts
├── commands/                                # Command + Orchestrator pairs (co-located)
│   └── g/
│       └── gh/
│           └── project/
│               ├── summaryCmd.ts            # OCLIF command
│               └── summaryOrch.ts           # Orchestrator function
└── orchestrator-services/                  # Domain services
    └── github/                              # Domain namespace
        ├── dataCollectionOrchServ.ts        # Orchestrator service function
        ├── issueAnalysisOrchServ.ts         # Orchestrator service function
        ├── services/                        # Regular services (return DTOs)
        │   ├── RepositoryService.ts         # Class with dependencies
        │   ├── IssueService.ts              # Class with dependencies
        │   └── ApiClientService.ts          # External API wrapper
        ├── dto/                             # Domain DTOs
        │   ├── RepositoryDataDTO.ts
        │   └── IssueStatsDTO.ts
        ├── types/                           # Domain-specific types
        │   ├── GitHubApiTypes.ts
        │   └── GitHubDataTypes.ts
        ├── errors/                          # Domain-specific errors
        │   ├── GitHubApiError.ts
        │   └── GitHubValidationError.ts
        ├── interfaces/                      # Service contracts
        │   ├── IRepositoryService.ts
        │   └── IApiClientService.ts
        └── constants/                       # Domain constants
            └── GitHubConstants.ts
```

### Naming Conventions

**Commands**: 
- File: `summaryCmd.ts`
- Class: `export default class SummaryCmd extends Command`
- CLI: `g:gh:project:summary`

**Orchestrators**: 
- File: `summaryOrch.ts` 
- Function: `export const summaryOrch: IOrchestrator`

**Orchestrator Services**:
- File: `dataCollectionOrchServ.ts`
- Function: `export const dataCollectionOrchServ: IOrchestratorService`

**Regular Services**:
- File: `services/RepositoryService.ts`
- Class: `export class RepositoryService` (dependency injection ready)
- Constructor: `constructor(private apiClient: IApiClient, private parser: IDataParser)`

    

# Core Architecture Principles

## Data vs Decision Separation

**Orchestrators provide raw data, LLMs make decisions.**

TypeScript code (orchestrators) performs deterministic operations and returns raw KEY=value data. The LLM interprets commands and decides how to format output based on audience needs.

## Dependency Injection & Testability

**No `new` calls anywhere** except for DTO creation (`new RepositoryDataDTO(...)`)

- All services receive dependencies via constructor injection for maximum testability
- Services can depend on other services - no restrictions, but must be unit testable
- Everything is designed for easy mocking and isolated testing

## 🚨 CRITICAL DISTINCTION: TypeScript vs LLM Responsibilities

### What TypeScript Orchestrators (and their services) DO:
- ✅ Fetch raw data from APIs
- ✅ Return LLMInfo object that largely is used to store data in KEY=value pairs

### What TypeScript Orchestrators (and their services) DO NOT DO:
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
//result=LLMInfo
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

### NO MAGIC STRINGS

All data keys must be defined as constants. See [`docs/DTOArchitecture.md`](../docs/DTOArchitecture.md) for the complete guide.

```typescript
// ❌ BAD - Magic string
result.addData('REPOSITORY_NAME', repo.name)

// ✅ GOOD - Using DTO
const repoData = new RepositoryDataDTO(...)
result.addDataFromDTO(repoData)
```

### FAIL FAST

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

### TYPE SAFETY EVERYWHERE

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

### NAMESPACING / FOLDER ORGANISATION

taking inspiration from domain driven design, modular architecture etc

code to be heavily namespaced, orchestrator services to be the "front controller" for a particular namespaced set of functionality

examples of orchestrator services:
 - GithubAPI
 - Filesystem
 - Git

### STRICT NAMING CONVENTIONS

#### Naming Conventions for Types and Interfaces

- **Interfaces:** Prefix with `I` (e.g., `IOrchestratorService`, `IDataCollectorService`).
- **Types:** Prefix with `T` (e.g., `TProjectSummaryServices`, `TOrchestratorServiceMap`).
- This convention makes it clear at a glance whether a symbol is an interface or a type alias, improving code readability and maintainability.

# Project Summary Services: Strict Typing and Structure

- `TProjectSummaryServices` is a strictly typed object: each property is a specific service interface (not just the base `IOrchestratorService`).
- Each service interface (e.g., `IDataCollectorService`, `IEnvValidatorService`) extends `IOrchestratorService` and can add its own methods if needed.
- `TProjectSummaryServices` also conforms to the generic service map type `TOrchestratorServiceMap`, allowing dynamic access if needed.




- This ensures:
  - Each property is a specific, testable, and composable service.
  - The object is compatible with the generic orchestrator service map for dynamic lookups.
  - The naming convention is clear and consistent throughout the codebase.

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

### Git Commit Workflow Rules

**🚨 CRITICAL: Commit on QA State Transitions**

When working on development tasks, follow these commit rules:

1. **QA Failing → QA Passing**: ALWAYS commit immediately
   - This captures working state transitions
   - Prevents losing progress when QA breaks again
   - Creates checkpoints for reliable rollback points

2. **Branch-based Development**: Apply commit rules when working in feature branches
   - Main branch commits should be more deliberate
   - Feature branches benefit from frequent checkpoint commits

3. **Commit Message Format**:
   ```bash
   git commit -m "✅ QA passing: [brief description of changes]
   
   - Fixed ESLint errors in core test files
   - Resolved OrchestratorError complexity warnings
   - All 118 tests passing
   
   🤖 Generated with Claude Code"
   ```

**Why This Matters:**
- Prevents work loss when refactoring breaks QA
- Creates reliable restore points during development
- Maintains development momentum by preserving working states

## Testing Strategy

See [@docs/Testing.md](docs/Testing.md) for complete testing guide including TDD practices, three-tier testing approach, mocking strategies, and coverage requirements.

## Error Handling and CLI Integration

### How Errors Surface Through the System

Errors flow through the architecture in a structured way that ensures proper CLI exit codes and clear LLM feedback:

```typescript
// 1. Services throw OrchestratorError when things fail
async collectData(): Promise<LLMInfo> {
  try {
    const data = await this.api.fetch()
    return LLMInfo.create().addData('RESULT', data)
  } catch (error) {
    throw new OrchestratorError(
      'DATA_COLLECTION_FAILED',
      'Failed to fetch data from API',
      ['Check API credentials', 'Verify network connectivity'],
      { apiUrl: this.apiUrl, statusCode: error.status }
    )
  }
}

// 2. Orchestrators catch errors and add them to LLMInfo
export const executeCommand: IOrchestrator = async (args, services) => {
  const result = LLMInfo.create()
  
  try {
    const data = await services.dataCollector.collectData()
    result.merge(data)
  } catch (error) {
    if (error instanceof OrchestratorError) {
      result.setError(error)
    } else {
      // Wrap unexpected errors
      result.setError(new OrchestratorError(
        'UNEXPECTED_ERROR',
        error.message || 'Unknown error occurred',
        ['Check debug logs', 'Retry the operation']
      ))
    }
  }
  
  return result
}

// 3. Commands use LLMInfo methods to determine CLI behavior
export default class MyCommand extends Command {
  async run(): Promise<void> {
    const { args } = await this.parse(MyCommand)
    
    const result = await executeCommand(args.arguments, services)
    
    // Explicit stdout output (preferred over this.log for data)
    process.stdout.write(result.toString())
    
    // Exit code is determined by LLMInfo - use OCLIF method, not process.exit()
    this.exit(result.getExitCode()) // 0 for success, 1 for error
  }
}
```

### Error Flow Summary

1. **Services**: Throw `OrchestratorError` with structured error info and recovery instructions
2. **Orchestrators**: Catch errors and call `result.setError(error)` 
3. **LLMInfo**: Formats error into `STOP PROCESSING` output with recovery instructions
4. **Commands**: Use `result.getExitCode()` to set proper CLI exit code
5. **CLI**: Non-zero exit codes signal failure to calling processes

### Key Benefits

- **Fail Fast**: Errors stop processing immediately
- **Structured**: All errors follow the same OrchestratorError format  
- **Recoverable**: Every error includes specific recovery instructions
- **CLI Compatible**: Proper exit codes for script/automation usage
- **LLM Friendly**: Clear `STOP PROCESSING` signals prevent LLM confusion
