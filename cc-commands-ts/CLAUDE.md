# Claude Code Commands (TypeScript)

This project provides orchestrators which can be utilized by custom slash commands in Claude Code.

The role of a cc-command is to provide rapid, reliable functionality that the LLM can utilize with simple CLI calls. A single custom slash command may call the relevant cc-command multiple times as it progresses through its process.

## Development Philosophy

You are a top-tier TypeScript developer with a passion for best practices, strong types, test-driven development, clear APIs, and strong organization.

## Command Execution Flow

Generally this will be in the form of:

1. **LLM → Setup**
   - Parse arguments
   - Check environment, confirm required tools are set up
   - Perform any prerequisite validation before proceeding

2. **LLM → Execution**
   - Actually doing things:
     - API Calls
     - Collecting data
     - Performing Actions

3. **LLM → Additional execution steps as required**
   - Based on previous execution outcomes, the LLM might decide to call other execution steps

## CRITICAL: File Editing Policy

**ALL FILE EDITS MUST BE DONE MANUALLY - NO BULK UPDATE SCRIPTS**

- **NO automated bulk update scripts** - they consistently cause syntax errors and file corruption
- **NO scripts that modify multiple files** - each file must be edited individually with care
- **Manual editing only** - use Edit/MultiEdit tools directly on each file
- **Test after each change** - verify each file works before moving to the next
- **One file at a time** - never batch file modifications

**Why this rule exists:**
- Bulk update scripts have repeatedly caused function definitions to be mangled
- Complex regex replacements often miss edge cases and create syntax errors  
- Manual editing allows for verification and context-aware changes
- Individual file edits can be tested immediately

**Approved methods:**
- ✅ Edit tool for single changes
- ✅ MultiEdit tool for multiple changes in ONE file
- ✅ Manual review and testing of each change
- ❌ Scripts that modify multiple files automatically
- ❌ Bulk find-and-replace operations across files
- ❌ Automated refactoring scripts

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

**⚠️ CRITICAL RULE: Every orchestrator MUST define its own strictly typed service parameter. NEVER use the generic TOrchestratorServiceMap type. See the "🚨 CRITICAL: Orchestrator Service Typing Rules" section below for details.**

Akin to a controller in MVC. Has dependencies that do work, hinted by interfaces as much as possible. No functionality beyond returning LLMInfo.

Should be very thin, only tested with integration tests (some mocking allowed for third party APIs), real functionality should be handled by services

Orchestrator is an exported async function implementing the IOrchestrator interface

**Core Interfaces**: See [src/core/interfaces/IOrchestratorService.ts](src/core/interfaces/IOrchestratorService.ts) for the actual interface definitions.

The Orchestrator in the form of a function in the functional dependency injection pattern.

```typescript
// ✅ CORRECT: Strictly typed project summary services
// Each orchestrator defines exactly which services it needs
export type TProjectSummaryServices = {
  dataCollector: IDataCollectorService;
  dataFileService?: IDataFileService;
  envValidator: IEnvValidatorService;
  projectDetector: IProjectDetectorService;
  projectDiscovery?: IProjectDiscoveryService;
}  // NOTE: No inheritance from TAbstractOrchestratorServiceMap!

// Example service interfaces (illustrative only)
export interface IDataCollectorService {
  collectRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>
  collectReleaseData(owner: string, repo: string): Promise<ReleaseDataDTO | null>
}
export interface IDataFileService {
  readDataFile(path: string): Promise<DataFileDTO>
  writeDataFile(path: string, data: DataFileDTO): Promise<void>
}
export interface IEnvValidatorService {
  validateEnvironment(): Promise<EnvironmentDTO>
  checkRequiredTools(tools: string[]): Promise<ToolCheckDTO>
}
export interface IProjectDetectorService {
  detectProjectType(path: string): Promise<ProjectTypeDTO>
  getProjectMetadata(path: string): Promise<ProjectMetadataDTO>
}
export interface IProjectDiscoveryService {
  discoverProjects(rootPath: string): Promise<ProjectListDTO>
}

// ✅ CORRECT: Usage in orchestrator with specific type
export const executeProjectSummary: IOrchestrator<TProjectSummaryServices> = async(
  commandArgs: string,
  services: TProjectSummaryServices,  // Specific type, NOT TAbstractOrchestratorServiceMap
): Promise<LLMInfo> => {
  // Now you have full type safety and IDE support
  const repoData = await services.dataCollector.collectRepositoryData(owner, repo)
  // TypeScript knows exactly which services are available
}
```

#### Orchestrator Services

Orchestrator services are exported functions (like orchestrators) that sit between orchestrators and regular services. They follow the same functional pattern as orchestrators but focus on specific domains.

```typescript
// Define specific service types for GitHub domain
export type TGitHubServices = {
  dataCollector: IDataCollectorService;
  issueAnalyzer: IIssueAnalyzerService;
  releaseManager: IReleaseManagerService;
}

// Example orchestrator service - coordinates multiple regular services
export const executeGitHubProjectSummary: IOrchestratorService<TGitHubServices> = async (
  args: string,
  services: TGitHubServices  // Strictly typed services
): Promise<LLMInfo> => {
  const result = LLMInfo.create()
  
  // Parse arguments
  const { owner, repo } = parseGitHubArgs(args)
  
  // Coordinate multiple regular services with full type safety
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
- CLI: `g-gh-project-summary` (set via `static override id = 'g-gh-project-summary'`)
- Pattern: Class/file names include `Cmd` suffix, CLI commands use flat structure with hyphens

**Orchestrators**: 
- File: `summaryOrch.ts` 
- Function: `export const summaryOrch: IOrchestrator`

**Orchestrator Services**:
- File: `dataCollectionOrchServ.ts`
- Function: `export const dataCollectionOrchServ: IOrchestratorService<TArgsInterface, TDataCollectionServices>`
- Pattern: Use typed argument interfaces, not strings

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

// ✅ CORRECT - Providing raw data via DTOs:
const projectData = new ProjectSummaryDTO(repositories, issues, pullRequests)
result.addDataBulk(projectData.toLLMData())
result.addData(DataKeys.AUDIENCE, 'technical')

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
- **Abstract Types:** Prefix with `TAbstract` (e.g., `TAbstractServiceMap`, `TAbstractBaseConfig`).
  - Abstract types are meant to be extended, never used directly as parameter or return types
  - `TAbstractOrchestratorServiceMap` is an abstract type that should only be used for type composition
- This convention makes it clear at a glance whether a symbol is an interface, type alias, or abstract type, improving code readability and maintainability.

#### Abstract Types Pattern

Abstract types are type aliases that define a base structure meant to be extended by concrete types. They should NEVER be used directly as function parameters or return types.

```typescript
// Abstract type - only for type composition via intersection
export type TAbstractOrchestratorServiceMap = {
  [serviceName: string]: IOrchestratorService<any>
}

// ✅ CORRECT - Define concrete service type without extending abstract
export type TMyServices = {
  specificService: ISpecificService;
  anotherService: IAnotherService;
}

// ❌ WRONG - Use abstract type directly
function myFunc(services: TAbstractOrchestratorServiceMap) { } // ESLint error!

// ✅ CORRECT - Use concrete type
function myFunc(services: TMyServices) { }
```

## 🚨 CRITICAL: Orchestrator Service Typing Rules

**FUNDAMENTAL ARCHITECTURE PRINCIPLE: Every orchestrator MUST define its own strictly typed service interface.**

### ❌ NEVER DO THIS - GENERIC TYPING IS FORBIDDEN

```typescript
// ❌ WRONG - Using abstract TAbstractOrchestratorServiceMap
export const myOrchestrator: IOrchestrator = async (
  commandArgs: string,
  services: TAbstractOrchestratorServiceMap  // ❌ NEVER USE THIS ABSTRACT TYPE
): Promise<LLMInfo> => {
  // This violates core architecture principles
}

// ❌ WRONG - Using 'any' type
export const myOrchestrator: IOrchestrator = async (
  commandArgs: string,
  services: any  // ❌ NEVER USE 'any' TYPE
): Promise<LLMInfo> => {
  // This loses all type safety
}
```

### ✅ ALWAYS DO THIS - SPECIFIC TYPED SERVICES

```typescript
// ✅ CORRECT - Define specific service types for each orchestrator
export type TMyOrchestratorServices = {
  dataCollector: IDataCollectorService;
  envValidator: IEnvValidatorService;
  projectDetector: IProjectDetectorService;
  // Add other required services with their specific interfaces
}

export const myOrchestrator: IOrchestrator<TMyOrchestratorServices> = async (
  commandArgs: string,
  services: TMyOrchestratorServices  // ✅ ALWAYS USE SPECIFIC TYPES
): Promise<LLMInfo> => {
  // Now you have type safety and IDE support
  const envData = await services.envValidator.validateEnvironment()
  const projectType = await services.projectDetector.detectProjectType('.')
  // TypeScript knows exactly which methods are available
}
```

### Why This Rule Exists

1. **Type Safety**: Generic typing loses all compile-time guarantees about which services are available
2. **IDE Support**: Specific types enable autocomplete and IntelliSense for service methods
3. **Self-Documenting**: The service type explicitly declares the orchestrator's dependencies
4. **Testability**: Mocking and testing require knowing exactly which services are needed
5. **Maintainability**: Changes to service interfaces are caught at compile time

### Service Type Composition Pattern

When orchestrators need to share common service sets:

```typescript
// Define reusable service groups
export type TGitHubServices = {
  githubApi: IGitHubApiService;
  githubAuth: IGitHubAuthService;
}

export type TFileSystemServices = {
  fileReader: IFileReaderService;
  fileWriter: IFileWriterService;
}

// Compose service types for specific orchestrators
export type TProjectAnalysisServices = TGitHubServices & TFileSystemServices & {
  projectAnalyzer: IProjectAnalyzerService;
  codeParser: ICodeParserService;
}

// Use the composed type
export const analyzeProject: IOrchestrator<TProjectAnalysisServices> = async (
  commandArgs: string,
  services: TProjectAnalysisServices  // Strictly typed with all needed services
): Promise<LLMInfo> => {
  // Implementation with full type safety
  const repoData = await services.githubApi.getRepository('owner', 'repo')
  const fileContent = await services.fileReader.readFile('/path/to/file')
  const analysis = await services.projectAnalyzer.analyze(repoData, fileContent)
}
```

### Enforcement Rules

1. **Code Review**: Any PR with `services: TAbstractOrchestratorServiceMap` or `services: any` in an orchestrator MUST be rejected
2. **ESLint Rules**: Custom rules enforce type safety (see ESLint Rules section below)
3. **Testing**: Tests should verify that orchestrators declare their specific service dependencies
4. **Documentation**: Every orchestrator must document its service dependencies via its type

# Project Summary Services: Strict Typing and Structure

- `TProjectSummaryServices` is a strictly typed object: each property is a specific service interface.
- Each service interface (e.g., `IDataCollectorService`, `IEnvValidatorService`) defines methods that return DTOs.
- Service types should never use abstract types like `TAbstractOrchestratorServiceMap` directly.

- This ensures:
  - Each property is a specific, testable, and composable service.
  - Full type safety and IDE support for all service methods.
  - The naming convention is clear and consistent throughout the codebase.

## Custom ESLint Rules for Type Safety

The project includes 5 custom ESLint rules to enforce type safety and prevent common mistakes:

### 1. `no-abstract-type-in-params`
Prevents using abstract types (prefixed with `TAbstract`) as function parameters or return types.

```typescript
// ❌ ESLint Error
function process(services: TAbstractOrchestratorServiceMap) { }

// ✅ Correct
function process(services: TSpecificServices) { }
```

### 2. `no-any-services-param`
Prevents using `any` type for services parameters in orchestrators and orchestrator services.

```typescript
// ❌ ESLint Error
export const myOrchestrator: IOrchestrator = async (
  args: string,
  services: any  // Error: Services parameter must have a specific type
) => { }

// ✅ Correct
export const myOrchestrator: IOrchestrator<TMyServices> = async (
  args: string,
  services: TMyServices
) => { }
```

### 3. `orchestrator-service-typing`
Enforces that all orchestrator services use the generic `IOrchestratorService<T>` type with proper service typing.

```typescript
// ❌ ESLint Error
export const myService: IOrchestratorService = async (args, services) => { }

// ✅ Correct
export const myService: IOrchestratorService<TMyServices> = async (args, services) => { }
```

### 4. `orchestrator-typing`
Enforces that all orchestrators use the generic `IOrchestrator<T>` type with proper service typing.

```typescript
// ❌ ESLint Error
export const myOrch: IOrchestrator = async (args, services) => { }

// ✅ Correct
export const myOrch: IOrchestrator<TMyServices> = async (args, services) => { }
```

### 5. `no-direct-orchestrator-service-map`
Prevents direct usage of `TAbstractOrchestratorServiceMap` (formerly `TOrchestratorServiceMap`) in type annotations.

```typescript
// ❌ ESLint Error
const services: TAbstractOrchestratorServiceMap = { }
function process(map: TAbstractOrchestratorServiceMap) { }

// ✅ Correct - Define specific service types
const services: TMyServices = { }
function process(map: TMyServices) { }
```

These rules work together to ensure:
- All orchestrators and services have proper type safety
- No abstract types leak into function signatures
- Services are always strictly typed for their specific use case
- Full IDE support and compile-time type checking

# Code Quality & Standards

## Documentation Standards

**Documentation declares current best practices and guidelines only.**

- All documentation should reflect the current, correct way to implement patterns
- Never include "legacy" patterns or "old way vs new way" comparisons in main documentation
- Migration instructions belong in separate plan documents (CLAUDE/plan/ directory)
- Focus on clarity and actionable guidance for current development
- Remove outdated patterns immediately when better approaches are adopted
- Examples should demonstrate real, working patterns from the current codebase

### Plan Workflow

The CLAUDE/plan/ directory contains implementation and migration plans:

- **Implementation Plans**: Step-by-step guides for new features or major changes
- **Migration Plans**: Detailed procedures for updating existing code to new patterns
- **Architecture Decisions**: Documentation of major architectural changes and rationale
- **Temporary Guidelines**: Instructions that will be integrated into main docs once complete

Plans are temporary documents that guide transitions. Once migrations are complete, successful patterns move to main documentation and plan documents are archived.

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

**ESLint Quality Patterns**: For DTO-specific ESLint patterns including complexity management and external API handling, see [`docs/DTOArchitecture.md`](docs/DTOArchitecture.md#code-quality-patterns).

**Custom Type Safety Rules**: The project includes 5 custom ESLint rules that enforce strict typing for orchestrators and prevent usage of abstract types. See the "Custom ESLint Rules for Type Safety" section above.

### ESLint Configuration (2025)

**🚨 CRITICAL: This project uses ESLint 9.x flat configuration format**

#### Verify ESLint Version and Configuration

```bash
# Check ESLint version (should be 9.x+)
npx eslint --version

# Verify configuration file exists (NOT .eslintrc.json)
ls -la eslint.config.mjs

# Debug configuration for specific file
npx eslint --print-config src/path/to/file.ts

# Debug configuration with verbose output  
npx eslint --debug src/path/to/file.ts
```

#### Configuration File Structure

- **Correct**: `eslint.config.mjs` (ESLint 9.x flat config)
- **Incorrect**: `.eslintrc.json`, `.eslintrc.js`, etc. (legacy format)

#### Adding File-Specific Overrides

When adding new file patterns that need special ESLint rules:

```javascript
// In eslint.config.mjs - add new override object to export array
{
  // Example: Allow snake_case for API response mapping
  files: [
    'src/orchestrator-services/github/services/GitHubRestApiService.ts',
    'src/orchestrator-services/github/types/GitHubApiTypes.ts'
  ],
  rules: {
    'camelcase': 'off' // GitHub API responses use snake_case properties
  }
}
```

#### Common ESLint Issues

1. **Configuration Not Applied**: Using legacy `.eslintrc.*` files with ESLint 9.x
   - **Solution**: Remove legacy config files, use `eslint.config.mjs`
   
2. **File Overrides Not Working**: Incorrect file pattern matching
   - **Solution**: Use `npx eslint --debug` to verify patterns match target files
   
3. **Camelcase Violations**: External API responses with snake_case properties
   - **Solution**: Add file-specific `camelcase: 'off'` overrides

### Git Commit Workflow Rules

**🚨 CRITICAL: Commit and Push on QA State Transitions**

When working on development tasks, follow these commit rules:

1. **QA Failing → QA Passing**: ALWAYS commit and push immediately
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
   
   🤖 Generated with Claude Code" && git push 
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
