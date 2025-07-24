# GitHub Project Summary Implementation Plan

## Overview

This plan details the implementation of the `g:gh:project:summary` command following the cc-commands architecture. The command analyzes GitHub Projects v2 and generates comprehensive activity summaries across multiple repositories.

## 🚨 PROGRESS TRACKING RULES

**CRITICAL**: This plan MUST be updated as work progresses. 

**Checkbox States & Rules:**
- `[ ]` **Not Started** - No work has begun on this task
- `[~]` **In Progress** - Work has started but not complete *(MUST include datetime)*
- `[x]` **Complete** - Task is 100% finished with all requirements met *(MUST include completion date)*

**Rules for marking progress:**
- ✅ **In Progress**: Add datetime when work begins: `[~] Task description (Started: 2025-01-15 14:30)`
- ✅ **Complete**: ONLY mark when 100% finished: `[x] Task description ✓ 2025-01-15 - All sub-tasks done, tests passing, qa clean`
- ✅ Include ALL sub-requirements (implementation + tests + qa passing)
- ✅ Task is only complete when `npm run qa` passes for related code
- ✅ Update datetime on in-progress tasks when significant work is done
- ✅ Add completion notes for audit trail

**Example progression:**
```
- [ ] TODO 1.1: Create Base DTOs
- [~] TODO 1.1: Create Base DTOs (Started: 2025-01-15 09:00)
- [~] TODO 1.1: Create Base DTOs (Started: 2025-01-15 09:00, Updated: 2025-01-15 11:30 - 4/8 DTOs done)
- [x] TODO 1.1: Create Base DTOs ✓ 2025-01-15 14:45 - All 8 DTOs implemented, unit tests passing, qa clean
```

**NO CHEATING - Incomplete work stays as `[~]` until 100% finished with tests passing.**

## Development Workflow Requirements

As per CLAUDE.md, this implementation MUST follow:

1. **🚨 CRITICAL QA Rule**: Run `npm run qa` after EVERY file change
   - Includes: `npm run typecheck`, `npm run lint`, `npm run test`
   - If ANY step fails, fix immediately before proceeding

2. **Manual File Editing Only**: 
   - NO bulk update scripts - they cause syntax errors and file corruption
   - Edit files individually using Edit/MultiEdit tools
   - Test after each change
   - One file at a time approach

3. **ESLint Compliance**:
   - Follow patterns documented in `docs/ESLint.md`
   - Respect complexity limits (max: 20) - refactor, don't ignore  
   - DTOs automatically get unlimited constructor parameters via ESLint config
   - Use OCLIF exit methods (`this.exit()`) never `process.exit()`
   - Update ESLint documentation when encountering new patterns

4. **Test-Driven Development (TDD)**:
   - Write failing tests FIRST
   - Then implement minimal code to pass
   - Refactor while keeping tests green
   - No tautological testing (don't test mocks)

4. **Three-Tier Testing Strategy**:
   - Commands: End-to-end tests (no mocks)
   - Orchestrators: Integration tests (external API mocking allowed)
   - Services: Unit tests (full dependency mocking)

## Architecture Analysis

### Service Boundaries Identified

Based on the requirements analysis, the GitHub Project Summary functionality needs:

**Domain**: `orchestrator-services/github/`

**Core Services** (Regular services returning DTOs):
- `GitHubApiService` - Low-level GitHub API wrapper
- `ProjectService` - GitHub Projects v2 operations
- `RepositoryService` - Repository data collection
- `ActivityService` - Cross-repository activity aggregation
- `AuthService` - GitHub authentication handling

**Orchestrator Services** (Functions returning LLMInfo):
- `projectDetectionOrchServ` - Auto-detect projects from git remotes
- `projectDataCollectionOrchServ` - Collect project and repository data
- `activityAnalysisOrchServ` - Analyze and aggregate activity data

**Orchestrator**: `summaryOrch` - Coordinates the multi-phase execution

**Command**: `summaryCmd` - Thin OCLIF wrapper

## Detailed Implementation Plan

### Phase 1: Foundation & Core DTOs ✅ COMPLETE

#### - [x] TODO 1.1: Create Base DTOs ✓ 2025-01-24 15:45 - All 8 DTOs implemented with comprehensive testing
**Priority**: High  
**Dependencies**: None

**Files created and implemented:**
- ✅ `src/orchestrator-services/github/dto/ProjectDataDTO.ts` - Basic project information with factory methods
- ✅ `src/orchestrator-services/github/dto/RepositoryDataDTO.ts` - Individual repository data with GitHub API integration  
- ✅ `src/orchestrator-services/github/dto/ActivityMetricsDTO.ts` - Cross-repository activity aggregation
- ✅ `src/orchestrator-services/github/dto/ProjectItemDTO.ts` - GitHub Projects v2 items with comprehensive field support
- ✅ `src/orchestrator-services/github/dto/IssueDataDTO.ts` - GitHub issue transformation with multi-source support
- ✅ `src/orchestrator-services/github/dto/PullRequestDataDTO.ts` - Pull request data with complexity management
- ✅ `src/orchestrator-services/github/dto/CommitDataDTO.ts` - Repository commit information with verification support
- ✅ `src/orchestrator-services/github/dto/ProjectSummaryDTO.ts` - Final aggregated summary combining all DTOs

**Requirements completed for each DTO:**
- ✅ Implement `ILLMDataDTO` interface
- ✅ Define private static `Keys` constants (no magic strings)
- ✅ Include `toLLMData(): Record<string, string>` method
- ✅ Add three-tier factory methods (CLI, REST API, GraphQL)
- ✅ Include proper TypeScript typing with readonly properties
- ✅ Add comprehensive JSDoc documentation
- ✅ Apply data extraction pattern for complexity management
- ✅ Handle external API camelcase requirements with ESLint overrides

**Testing completed:**
- ✅ Unit tests for all 8 DTOs (306 tests total, all passing)
- ✅ Test `toLLMData()` conversion with consistent key validation
- ✅ Test all factory methods with edge cases
- ✅ Test error handling (null/undefined values, invalid data)
- ✅ Comprehensive coverage including timer-based functionality

#### - [x] TODO 1.2: Create Core Types ✓ 2025-01-24 16:00 - All type files implemented with comprehensive interfaces
**Priority**: High  
**Dependencies**: None

**Files created and implemented:**
- ✅ `src/orchestrator-services/github/types/GitHubApiTypes.ts` - GitHub API response interfaces (existing, validated)
- ✅ `src/orchestrator-services/github/types/ProjectTypes.ts` - Internal project management types and configurations
- ✅ `src/orchestrator-services/github/types/ActivityTypes.ts` - Activity analysis and metrics aggregation types

**Content implemented:**
- ✅ GitHub API response interfaces for all data sources (REST, GraphQL, CLI)
- ✅ Internal data structures for project management and analysis
- ✅ Query parameter types for API interactions
- ✅ Configuration types for analysis settings
- ✅ Activity analysis types with comprehensive metrics support
- ✅ All types pass TypeScript compilation and ESLint validation

#### - [x] TODO 1.3: Create Domain Constants ✓ 2025-01-24 16:10 - All constants implemented with comprehensive coverage
**Priority**: High  
**Dependencies**: None

**Files created and implemented:**
- ✅ `src/orchestrator-services/github/constants/GitHubConstants.ts` - GitHub API constants, endpoints, error messages, GraphQL fragments
- ✅ `src/orchestrator-services/github/constants/ProjectConstants.ts` - Project analysis constants, configuration values, health scoring

**Content implemented:**
- ✅ GitHub API endpoints and base URLs
- ✅ Rate limiting and pagination defaults  
- ✅ Authentication scope requirements
- ✅ API field name constants (no magic strings)
- ✅ CLI command templates for all operations
- ✅ GraphQL query fragments for all entity types
- ✅ Comprehensive error messages with categories
- ✅ GitHub entity state constants
- ✅ URL pattern regex for parsing (ESLint compliant)
- ✅ Project field definitions and analysis configurations
- ✅ Health score calculation constants and thresholds
- ✅ Activity level classification and trend analysis
- ✅ Performance optimization constants (caching, concurrency)
- ✅ All constants pass TypeScript compilation and ESLint validation

#### - [x] TODO 1.4: Create Domain Errors ✓ 2025-01-24 16:35 - All error factory classes implemented with comprehensive coverage
**Priority**: High  
**Dependencies**: None

**Files created and implemented:**
- ✅ `src/orchestrator-services/github/errors/GitHubApiError.ts` - GitHub API error factory with rate limiting, auth, network, and CLI errors
- ✅ `src/orchestrator-services/github/errors/ProjectNotFoundError.ts` - Project detection error factory with auto-detection, access, and validation errors
- ✅ `src/orchestrator-services/github/errors/AuthenticationError.ts` - Authentication error factory with token, CLI, and scope errors

**Content implemented:**
- ✅ Factory classes returning OrchestratorError instances (final class pattern)
- ✅ Comprehensive recovery instructions for each error scenario
- ✅ Structured error context with proper JsonValue typing
- ✅ Domain-specific error creation methods for all common scenarios
- ✅ Rate limiting errors with wait time calculations
- ✅ Authentication errors with scope validation and CLI guidance
- ✅ Project detection errors with git remote parsing
- ✅ Network and API response error handling
- ✅ All error factories pass TypeScript compilation and ESLint validation

### Phase 2: Core Services Layer

#### - [x] TODO 2.1: Implement GitHubApiService ✓ 2025-01-24 18:30 - Complete GitHub API wrapper service with CLI interface, rate limiting, error handling, and DTO transformation
**Priority**: High  
**Dependencies**: DTOs, Types, Constants, Errors

**File**: `src/orchestrator-services/github/services/GitHubApiService.ts`

**Methods to implement:**
```typescript
class GitHubApiService {
  constructor(private ghCliWrapper: IGitHubCliWrapper) {}
  
  async getRepository(owner: string, repo: string): Promise<RepositoryDataDTO>
  async getProjectV2(owner: string, projectId: string): Promise<ProjectDataDTO>
  async getProjectItems(owner: string, projectId: string): Promise<ProjectItemDTO[]>
  async searchIssues(owner: string, repo: string, since: Date): Promise<IssueDataDTO[]>
  async searchPullRequests(owner: string, repo: string, since: Date): Promise<PullRequestDataDTO[]>
  async searchCommits(owner: string, repo: string, since: Date): Promise<CommitDataDTO[]>
  async getIssueComments(owner: string, repo: string, since: Date): Promise<any[]>
  async getRepositoryEvents(owner: string, repo: string, since: Date): Promise<any[]>
}
```

**Testing requirements:**
- Unit tests with mocked GitHub CLI
- Error handling tests
- Rate limiting tests
- Authentication failure tests

#### - [ ] TODO 2.2: Implement ProjectService
**Priority**: High  
**Dependencies**: GitHubApiService, DTOs

**File**: `src/orchestrator-services/github/services/ProjectService.ts`

**Methods to implement:**
```typescript
class ProjectService {
  constructor(private apiService: GitHubApiService) {}
  
  async detectProjectFromGitRemote(remotePath?: string): Promise<ProjectDataDTO | null>
  async findRecentProjects(owner: string): Promise<ProjectDataDTO[]>
  async getProjectWithItems(owner: string, projectId: string): Promise<ProjectDataDTO>
  async getRepositoriesFromProject(owner: string, projectId: string): Promise<string[]>
}
```

#### - [ ] TODO 2.3: Implement RepositoryService  
**Priority**: High  
**Dependencies**: GitHubApiService, DTOs

**File**: `src/orchestrator-services/github/services/RepositoryService.ts`

**Methods to implement:**
```typescript
class RepositoryService {
  constructor(private apiService: GitHubApiService) {}
  
  async getRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>
  async getRepositoryActivity(owner: string, repo: string, since: Date): Promise<ActivityMetricsDTO>
  async validateRepositoryAccess(owner: string, repo: string): Promise<boolean>
}
```

#### - [ ] TODO 2.4: Implement ActivityService
**Priority**: High  
**Dependencies**: RepositoryService, DTOs

**File**: `src/orchestrator-services/github/services/ActivityService.ts`

**Methods to implement:**
```typescript
class ActivityService {
  constructor(private repositoryService: RepositoryService) {}
  
  async aggregateActivityAcrossRepos(repos: string[], owner: string, since: Date): Promise<ActivityMetricsDTO>
  async calculateActivitySummary(activities: ActivityMetricsDTO[]): Promise<ProjectSummaryDTO>
  async identifyMostActiveRepositories(activities: ActivityMetricsDTO[]): Promise<string[]>
}
```

#### - [ ] TODO 2.5: Implement AuthService
**Priority**: Medium  
**Dependencies**: Constants, Errors

**File**: `src/orchestrator-services/github/services/AuthService.ts`

**Methods to implement:**
```typescript
class AuthService {
  async validateGitHubAuth(): Promise<boolean>
  async getAuthenticatedUser(): Promise<string>
  async checkRepositoryAccess(owner: string, repo: string): Promise<boolean>
}
```

### Phase 3: Orchestrator Services Layer

#### - [ ] TODO 3.1: Implement projectDetectionOrchServ
**Priority**: High  
**Dependencies**: ProjectService, AuthService

**File**: `src/orchestrator-services/github/projectDetectionOrchServ.ts`

**Function signature:**
```typescript
export const projectDetectionOrchServ: IOrchestratorService = async (
  args: string,
  services: TGitHubServices
): Promise<LLMInfo>
```

**Responsibilities:**
- Parse input arguments (URL, org/project, or auto-detect)
- Validate GitHub authentication
- Auto-detect organization from git remote if needed
- Find and validate project
- Return project metadata for LLM decision

**Return data:**
- `PROJECT_DETECTION_MODE` (auto|url|manual)
- `ORGANIZATION`
- `PROJECT_ID`
- `PROJECT_TITLE`
- `PROJECT_URL`
- `PROJECT_ITEM_COUNT`
- `REPOSITORY_COUNT`

#### - [ ] TODO 3.2: Implement projectDataCollectionOrchServ  
**Priority**: High  
**Dependencies**: ProjectService, RepositoryService, ActivityService

**File**: `src/orchestrator-services/github/projectDataCollectionOrchServ.ts`

**Function signature:**
```typescript
export const projectDataCollectionOrchServ: IOrchestratorService = async (
  args: string,
  services: TGitHubServices  
): Promise<LLMInfo>
```

**Responsibilities:**
- Collect full project data and items
- Identify all repositories in project
- Collect basic repository information
- Return structured data for activity analysis

**Return data:**
- Full project metadata
- Repository list with basic info
- Project items data
- Instructions for next phase

#### - [ ] TODO 3.3: Implement activityAnalysisOrchServ
**Priority**: High  
**Dependencies**: ActivityService, RepositoryService

**File**: `src/orchestrator-services/github/activityAnalysisOrchServ.ts`

**Function signature:**
```typescript
export const activityAnalysisOrchServ: IOrchestratorService = async (
  args: string,
  services: TGitHubServices
): Promise<LLMInfo>
```

**Responsibilities:**
- Parse time window parameters
- Collect activity data from all repositories
- Aggregate cross-repository statistics
- Calculate summary metrics
- Return comprehensive activity data

**Return data:**
- Individual repository activity metrics
- Aggregated project-level statistics  
- Most active repositories
- Activity trends and percentages
- Time-based analysis

### Phase 4: Orchestrator Layer

#### - [ ] TODO 4.1: Implement summaryOrch
**Priority**: High  
**Dependencies**: All orchestrator services

**File**: `src/orchestrators/g/gh/project/summaryOrch.ts`

**Function signature:**
```typescript
export const summaryOrch: IOrchestrator = async (
  commandArgs: string,
  services: TProjectSummaryServices
): Promise<LLMInfo>
```

**Responsibilities:**
- Parse command arguments and mode
- Coordinate multi-phase execution
- Handle mode transitions (detect → collect → analyze)
- Provide error handling and recovery
- Return appropriate LLMInfo for current phase

**Modes to handle:**
- `detect` - Project detection and validation
- `collect` - Data collection phase  
- `analyze` - Activity analysis phase
- Auto-mode detection from arguments

### Phase 5: Command Layer

#### - [ ] TODO 5.1: Implement summaryCmd
**Priority**: Medium  
**Dependencies**: summaryOrch

**File**: `src/commands/g/gh/project/summaryCmd.ts`

**Class structure:**
```typescript
export default class SummaryCmd extends Command {
  static override args = {
    arguments: Args.string({description: 'Command arguments'})
  }
  
  static override description = 'Generate GitHub project activity summary'
  
  async run(): Promise<void> {
    const {args} = await this.parse(SummaryCmd)
    const result = await summaryOrch(args.arguments, services)
    process.stdout.write(result.toString())
    process.exit(result.getExitCode())
  }
}
```

### Phase 6: Service Interfaces & Dependency Injection

#### - [ ] TODO 6.1: Create Service Interfaces
**Priority**: High  
**Dependencies**: Services

**Files to create:**
- `src/orchestrator-services/github/interfaces/IGitHubApiService.ts`
- `src/orchestrator-services/github/interfaces/IProjectService.ts` 
- `src/orchestrator-services/github/interfaces/IRepositoryService.ts`
- `src/orchestrator-services/github/interfaces/IActivityService.ts`
- `src/orchestrator-services/github/interfaces/IAuthService.ts`

**Requirements:**
- Define contracts for all service methods
- Include proper typing for parameters and returns
- Add JSDoc documentation

#### - [ ] TODO 6.2: Create Service Type Definitions
**Priority**: High  
**Dependencies**: Interfaces

**File**: `src/orchestrator-services/github/types/ServiceTypes.ts`

**Content:**
```typescript
export type TGitHubServices = {
  apiService: IGitHubApiService;
  projectService: IProjectService;
  repositoryService: IRepositoryService;
  activityService: IActivityService;  
  authService: IAuthService;
} & TOrchestratorServiceMap;

export type TProjectSummaryServices = TGitHubServices;
```

### Phase 7: Utilities & Helpers

#### - [ ] TODO 7.1: Create Utility Functions
**Priority**: Medium  
**Dependencies**: Types, Constants

**Files to create:**
- `src/orchestrator-services/github/utils/GitUrlParser.ts`
- `src/orchestrator-services/github/utils/DateUtils.ts`
- `src/orchestrator-services/github/utils/ArgumentParser.ts`
- `src/orchestrator-services/github/utils/GitHubCliWrapper.ts`

**GitUrlParser methods:**
- `parseGitHubProjectUrl(url: string): {owner: string, projectId: string}`
- `parseGitRemoteUrl(remoteUrl: string): {owner: string, repo: string} | null`
- `detectOrganizationFromRemote(path?: string): string | null`

**ArgumentParser methods:**
- `parseProjectSummaryArgs(args: string): ProjectSummaryArgs`
- `detectInputMode(args: string): 'auto' | 'url' | 'manual'`
- `parseTimeWindow(args: string): {since: Date, until?: Date}`

### Phase 8: Comprehensive Testing

#### - [ ] TODO 8.1: Unit Tests for DTOs
**Priority**: High  
**Dependencies**: DTOs implemented

**Test files to create:**
- `test/orchestrator-services/github/dto/ProjectDataDTO.test.ts`
- `test/orchestrator-services/github/dto/RepositoryDataDTO.test.ts`
- `test/orchestrator-services/github/dto/ActivityMetricsDTO.test.ts`
- (etc. for all DTOs)

**Test coverage:**
- Constructor validation
- `toLLMData()` method correctness
- Factory method behavior
- Edge cases and error conditions

#### - [ ] TODO 8.2: Unit Tests for Services
**Priority**: High  
**Dependencies**: Services implemented

**Test files to create:**
- `test/orchestrator-services/github/services/GitHubApiService.test.ts`
- `test/orchestrator-services/github/services/ProjectService.test.ts`
- `test/orchestrator-services/github/services/RepositoryService.test.ts`
- `test/orchestrator-services/github/services/ActivityService.test.ts`
- `test/orchestrator-services/github/services/AuthService.test.ts`

**Test approach:**
- Mock external dependencies (GitHub CLI)
- Test real service logic
- Cover error scenarios
- Test data transformation accuracy

#### - [ ] TODO 8.3: Integration Tests for Orchestrator Services
**Priority**: High  
**Dependencies**: Orchestrator services implemented

**Test files to create:**
- `test/orchestrator-services/github/projectDetectionOrchServ.test.ts`
- `test/orchestrator-services/github/projectDataCollectionOrchServ.test.ts`
- `test/orchestrator-services/github/activityAnalysisOrchServ.test.ts`

**Test approach:**
- Mock external APIs only
- Use real services
- Test LLMInfo assembly
- Verify coordination logic

#### - [ ] TODO 8.4: Integration Tests for Orchestrator
**Priority**: High  
**Dependencies**: Orchestrator implemented

**Test file to create:**
- `test/orchestrators/g/gh/project/summaryOrch.test.ts`

**Test scenarios:**
- Different input modes (auto, URL, manual)
- Multi-phase execution flow
- Error handling and recovery
- Mode transitions

#### - [ ] TODO 8.5: E2E Tests for Command
**Priority**: Medium  
**Dependencies**: Command implemented

**Test file to create:**
- `test/commands/g/gh/project/summaryCmd.e2e.test.ts`

**Test approach:**
- No mocks - full integration
- Test CLI argument parsing
- Verify output formatting
- Test exit codes

### Phase 9: Documentation & Polish

#### - [ ] TODO 9.1: Create API Documentation
**Priority**: Low  
**Dependencies**: All implementation complete

**Files to create:**
- `CLAUDE/plan/github-services-api.md`
- JSDoc comments in all files
- README updates if needed

#### - [ ] TODO 9.2: Performance Optimization
**Priority**: Low  
**Dependencies**: Basic implementation working

**Areas to optimize:**
- Parallel API calls where possible
- Caching of frequently accessed data
- Rate limit handling
- Memory usage optimization

## Implementation Order & Dependencies

### Critical Path:
1. **Phase 1** (DTOs, Types, Constants, Errors) - Foundation
2. **Phase 2** (Services) - Core business logic  
3. **Phase 6** (Interfaces) - Contracts and DI
4. **Phase 3** (Orchestrator Services) - Coordination
5. **Phase 4** (Orchestrator) - Main orchestration
6. **Phase 5** (Command) - CLI interface
7. **Phase 8** (Testing) - Quality assurance
8. **Phase 7** (Utilities) - Helper functions
9. **Phase 9** (Documentation) - Final polish

### Parallel Work Opportunities:
- DTOs can be implemented in parallel
- Services can be implemented in parallel after DTOs are done
- Tests can be written in parallel with implementation (TDD)
- Utilities can be implemented alongside services

## Success Criteria

### Functional Requirements:
- [ ] Command successfully detects projects from git remotes
- [ ] Command handles URL and manual input modes
- [ ] Collects comprehensive activity data from all project repositories
- [ ] Generates audience-specific summaries
- [ ] Handles GitHub API errors gracefully
- [ ] Respects rate limits
- [ ] Provides clear error messages with recovery instructions

### Technical Requirements:
- [ ] All code passes `npm run qa` (typecheck + lint + test)
- [ ] 90% test coverage across all layers
- [ ] No magic strings (all keys defined as constants)
- [ ] All services follow dependency injection pattern
- [ ] All DTOs implement `ILLMDataDTO` interface
- [ ] Error handling follows `OrchestratorError` pattern
- [ ] Follows established naming conventions

### Performance Requirements:
- [ ] Command completes within reasonable time (< 30 seconds for typical project)
- [ ] Handles large projects (50+ repositories) without memory issues
- [ ] Graceful degradation when API limits are reached

## Risk Mitigation

### High-Risk Areas:
1. **GitHub API Rate Limits** - Implement exponential backoff and caching
2. **Large Project Performance** - Add pagination and parallel processing
3. **Authentication Issues** - Clear error messages and validation
4. **Complex Data Aggregation** - Thorough testing of edge cases

### Mitigation Strategies:
- Comprehensive error handling at every layer
- Extensive testing including error scenarios
- Clear documentation and recovery instructions
- Performance monitoring and optimization

This implementation plan provides a structured approach to building the GitHub Project Summary functionality while adhering to the established cc-commands architecture and quality standards.