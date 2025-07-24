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

5. **Three-Tier Testing Strategy**:
   - Commands: End-to-end tests (no mocks)
   - Orchestrators: Integration tests (external API mocking allowed)
   - Services: Unit tests (full dependency mocking)

## 🚨 CRITICAL ARCHITECTURE CORRECTION

### **FUNDAMENTAL ERRORS DISCOVERED:**

**GitHub Projects v2 API Reality Check:**
- ❌ Projects v2 ONLY available via GraphQL API (not REST)
- ❌ Our `GitHubProjectV2Response` types are completely fictional
- ❌ Real GraphQL responses have nested `nodes`, `fieldValues`, `__typename` structures
- ❌ All Project-related DTOs built on wrong API assumptions

**Dependencies Available:**
- ✅ `@octokit/rest` - For repositories, issues, PRs, commits
- ✅ `@octokit/graphql` - For Projects v2 (REQUIRED)
- ✅ `simple-git` - For git operations
- ✅ GitHub CLI - For token authentication only (`gh auth token`)

### **Corrected Architecture:**

**Domain**: `orchestrator-services/github/`

**Core Services** (Regular services returning DTOs):
- `GitHubRestApiService` - Repository, issues, PRs, commits via Octokit REST
- `GitHubGraphQLService` - Projects v2 via Octokit GraphQL  
- `ProjectService` - High-level Projects v2 operations
- `RepositoryService` - Repository data collection
- `ActivityService` - Cross-repository activity aggregation
- `AuthService` - GitHub authentication via gh CLI token

**Authentication Flow:**
1. Use `gh auth token` to get GitHub token
2. Initialize Octokit REST + GraphQL with token
3. All API calls use Octokit (no direct CLI calls)

## Detailed Implementation Plan

### Phase 0: Aggressive Cleanup (CRITICAL FIRST STEP)

#### - [ ] TODO 0.1: Delete Broken Files
**Priority**: CRITICAL  
**Dependencies**: None

**Files to DELETE completely:**
- ❌ `src/orchestrator-services/github/services/GitHubApiService.ts` - Wrong REST approach
- ❌ `src/orchestrator-services/github/services/ProjectService.ts` - Built on broken foundation
- ❌ `src/orchestrator-services/github/dto/ProjectDataDTO.ts` - Fictional GraphQL methods
- ❌ `src/orchestrator-services/github/dto/ProjectItemDTO.ts` - Fictional GraphQL methods
- ❌ `test/orchestrator-services/github/dto/ProjectDataDTO.test.ts` - Tests for fictional methods
- ❌ `test/orchestrator-services/github/dto/ProjectItemDTO.test.ts` - Tests for fictional methods

**Types to DELETE from GitHubApiTypes.ts:**
- ❌ `GitHubProjectV2Response` - Completely fictional
- ❌ `GitHubCliProjectOutput` - Wrong approach
- ❌ `GitHubProjectRepository` - Incorrect structure

**Rationale**: Better to aggressively delete wrong code than refactor fundamentally flawed approaches.

#### - [ ] TODO 0.2: Research Real GitHub GraphQL Schema
**Priority**: CRITICAL  
**Dependencies**: TODO 0.1

**Research Tasks:**
- Study actual GitHub Projects v2 GraphQL schema
- Document real response structures for:
  - Project queries (`node(id: "PROJECT_ID")`)
  - Project items queries with field values
  - Project field definitions
- Create accurate TypeScript interfaces
- Test real GraphQL queries with `gh api graphql`

**Deliverables:**
- `docs/github-projects-v2-graphql-schema.md` - Real API documentation
- Sample GraphQL queries that actually work
- Accurate TypeScript interfaces for real responses

### Phase 1: Foundation & Core DTOs (PARTIAL - NEEDS MAJOR REVISION)

#### - [~] TODO 1.1: Fix Repository/Issue/PR/Commit DTOs (Started: 2025-01-24 19:30)
**Priority**: High  
**Dependencies**: TODO 0.1

**What's GOOD and stays:**
- ✅ `RepositoryDataDTO.ts` - REST API methods work
- ✅ `IssueDataDTO.ts` - REST API methods work  
- ✅ `PullRequestDataDTO.ts` - REST API methods work
- ✅ `CommitDataDTO.ts` - REST API methods work
- ✅ `ActivityMetricsDTO.ts` - Data aggregation logic is fine
- ✅ `ProjectSummaryDTO.ts` - High-level aggregation is fine

**What needs FIXING:**
- ❌ Remove any references to deleted Project DTOs
- ❌ Update imports after deletions
- ❌ Ensure all factory methods use correct Octokit response types

#### - [ ] TODO 1.2: Create Proper GraphQL Types
**Priority**: High  
**Dependencies**: TODO 0.2

**Files to create:**
- `src/orchestrator-services/github/types/GitHubGraphQLTypes.ts` - Real GraphQL response types
- `src/orchestrator-services/github/types/GitHubProjectsV2Types.ts` - Projects v2 specific types
- `src/orchestrator-services/github/constants/GraphQLQueries.ts` - Actual working queries

**Content:**
- Real GraphQL response interfaces based on research
- Proper handling of `__typename`, `nodes`, `fieldValues`
- Type definitions for field unions (text, select, date, etc.)
- Query constants that actually work with GitHub API

#### - [ ] TODO 1.3: Recreate Projects v2 DTOs from Scratch  
**Priority**: High  
**Dependencies**: TODO 1.2

**Files to create:**
- `src/orchestrator-services/github/dto/ProjectV2DTO.ts` - Based on real GraphQL schema
- `src/orchestrator-services/github/dto/ProjectV2ItemDTO.ts` - Based on real GraphQL schema

**Requirements:**
- Factory methods: `fromGraphQLResponse()` only (no fake CLI methods)
- Handle complex nested GraphQL structures properly
- Support field value unions (text, select, date, iteration, etc.)
- Proper error handling for malformed GraphQL responses

#### - [ ] TODO 1.4: Update Constants for Real APIs
**Priority**: Medium  
**Dependencies**: TODO 0.2

**Files to update:**
- `src/orchestrator-services/github/constants/GitHubConstants.ts` - Remove fake CLI commands
- Add GraphQL-specific constants (node IDs, field types, etc.)
- Update error messages to reflect real API constraints

### Phase 2: API Services Layer (COMPLETE REWRITE)

#### - [x] TODO 2.1: Implement GitHubRestApiService ✓ 2025-01-24 - Real implementation completed with proper error handling
**Priority**: High  
**Dependencies**: TODO 1.1

**File**: `src/orchestrator-services/github/services/GitHubRestApiService.ts`

**Methods:**
```typescript
class GitHubRestApiService {
  constructor(private octokit: Octokit) {}
  
  async getRepository(owner: string, repo: string): Promise<RepositoryDataDTO>
  async searchIssues(owner: string, repo: string, since: Date): Promise<IssueDataDTO[]>
  async searchPullRequests(owner: string, repo: string, since: Date): Promise<PullRequestDataDTO[]>
  async searchCommits(owner: string, repo: string, since: Date): Promise<CommitDataDTO[]>
  async getAuthenticatedUser(): Promise<string>
  async checkRepositoryAccess(owner: string, repo: string): Promise<boolean>
}
```

**Approach:**
- Use `@octokit/rest` exclusively
- Proper error handling with domain errors
- Rate limiting with exponential backoff
- Transform Octokit responses to DTOs

#### - [x] TODO 2.2: Implement GitHubGraphQLService ✓ 2025-01-24 - Real GraphQL implementation with corrected types and proper error handling  
**Priority**: High  
**Dependencies**: TODO 1.2, TODO 1.3

**File**: `src/orchestrator-services/github/services/GitHubGraphQLService.ts`

**Methods:**
```typescript
class GitHubGraphQLService {
  constructor(private graphql: Function) {} // @octokit/graphql
  
  async getProject(projectNodeId: string): Promise<ProjectV2DTO>
  async getProjectItems(projectNodeId: string): Promise<ProjectV2ItemDTO[]>
  async findProjectsByOwner(owner: string): Promise<ProjectV2DTO[]>
  async getProjectFields(projectNodeId: string): Promise<ProjectV2Field[]>
}
```

**Approach:**
- Use `@octokit/graphql` exclusively  
- Handle complex nested GraphQL responses
- Proper error handling for GraphQL errors
- Transform GraphQL responses to DTOs

#### - [x] TODO 2.3: Implement AuthService ✓ 2025-01-24 - Complete implementation with proper error handling, token masking, and comprehensive tests
**Priority**: High  
**Dependencies**: None

**File**: `src/orchestrator-services/github/services/AuthService.ts`

**Methods:**
```typescript
class AuthService {
  async getGitHubToken(): Promise<string> // via `gh auth token`
  async validateToken(token: string): Promise<boolean>
  async getAuthenticatedUser(token: string): Promise<string>
}
```

**Approach:**
- Use `gh auth token` command only for getting token
- All validation via Octokit APIs
- No other CLI dependencies

#### - [ ] TODO 2.4: Implement ProjectService
**Priority**: High  
**Dependencies**: TODO 2.2, TODO 2.3

**File**: `src/orchestrator-services/github/services/ProjectService.ts`

**Methods:**
```typescript
class ProjectService {
  constructor(
    private graphqlService: GitHubGraphQLService,
    private gitService: SimpleGit
  ) {}
  
  async detectProjectFromGitRemote(remotePath?: string): Promise<ProjectV2DTO | null>
  async findRecentProjects(owner: string): Promise<ProjectV2DTO[]>
  async getProjectWithItems(projectNodeId: string): Promise<ProjectV2DTO>
  async getRepositoriesFromProject(projectNodeId: string): Promise<string[]>
}
```

#### - [ ] TODO 2.5: Implement RepositoryService
**Priority**: High  
**Dependencies**: TODO 2.1

**File**: `src/orchestrator-services/github/services/RepositoryService.ts`

**Methods:**
```typescript
class RepositoryService {
  constructor(private restService: GitHubRestApiService) {}
  
  async getRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>
  async getRepositoryActivity(owner: string, repo: string, since: Date): Promise<ActivityMetricsDTO>
  async validateRepositoryAccess(owner: string, repo: string): Promise<boolean>
}
```

#### - [ ] TODO 2.6: Implement ActivityService
**Priority**: High  
**Dependencies**: TODO 2.5

**File**: `src/orchestrator-services/github/services/ActivityService.ts`

**Methods:**
```typescript
class ActivityService {
  constructor(private repositoryService: RepositoryService) {}
  
  async aggregateActivityAcrossRepos(repos: string[], owner: string, since: Date): Promise<ActivityMetricsDTO>
  async calculateActivitySummary(activities: ActivityMetricsDTO[]): Promise<ProjectSummaryDTO>
  async identifyMostActiveRepositories(activities: ActivityMetricsDTO[]): Promise<string[]>
}
```

### Phase 3: Service Interfaces & Dependency Injection

#### - [ ] TODO 3.1: Create Service Interfaces
**Priority**: High  
**Dependencies**: Phase 2 complete

**Files to create:**
- `src/orchestrator-services/github/interfaces/IGitHubRestApiService.ts`
- `src/orchestrator-services/github/interfaces/IGitHubGraphQLService.ts`
- `src/orchestrator-services/github/interfaces/IProjectService.ts` 
- `src/orchestrator-services/github/interfaces/IRepositoryService.ts`
- `src/orchestrator-services/github/interfaces/IActivityService.ts`
- `src/orchestrator-services/github/interfaces/IAuthService.ts`

#### - [ ] TODO 3.2: Create Service Type Definitions
**Priority**: High  
**Dependencies**: TODO 3.1

**File**: `src/orchestrator-services/github/types/ServiceTypes.ts`

**Content:**
```typescript
export type TGitHubServices = {
  restApiService: IGitHubRestApiService;
  graphqlService: IGitHubGraphQLService;
  projectService: IProjectService;
  repositoryService: IRepositoryService;
  activityService: IActivityService;  
  authService: IAuthService;
} & TOrchestratorServiceMap;

export type TProjectSummaryServices = TGitHubServices;
```

### Phase 4: Orchestrator Services Layer

#### - [ ] TODO 4.1: Implement projectDetectionOrchServ
**Priority**: High  
**Dependencies**: Phase 3 complete

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
- Validate GitHub authentication via token
- Auto-detect organization from git remote if needed
- Find and validate project via GraphQL
- Return project metadata for LLM decision

#### - [ ] TODO 4.2: Implement projectDataCollectionOrchServ  
**Priority**: High  
**Dependencies**: Phase 3 complete

**File**: `src/orchestrator-services/github/projectDataCollectionOrchServ.ts`

**Responsibilities:**
- Collect full project data and items via GraphQL
- Identify all repositories in project
- Collect basic repository information via REST
- Return structured data for activity analysis

#### - [ ] TODO 4.3: Implement activityAnalysisOrchServ
**Priority**: High  
**Dependencies**: Phase 3 complete

**File**: `src/orchestrator-services/github/activityAnalysisOrchServ.ts`

**Responsibilities:**
- Parse time window parameters
- Collect activity data from all repositories
- Aggregate cross-repository statistics
- Calculate summary metrics
- Return comprehensive activity data

### Phase 5: Orchestrator Layer

#### - [ ] TODO 5.1: Implement summaryOrch
**Priority**: High  
**Dependencies**: Phase 4 complete

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

### Phase 6: Command Layer

#### - [ ] TODO 6.1: Implement summaryCmd
**Priority**: Medium  
**Dependencies**: TODO 5.1

**File**: `src/commands/g/gh/project/summaryCmd.ts`

### Phase 7: Comprehensive Testing

#### - [ ] TODO 7.1: Unit Tests for Corrected DTOs
**Priority**: High  
**Dependencies**: TODO 1.1

**Test approach:**
- Test only REST API factory methods (remove GraphQL tests for deleted DTOs)
- Focus on valid Octokit response transformations
- Comprehensive edge case testing

#### - [ ] TODO 7.2: Unit Tests for New GraphQL DTOs
**Priority**: High  
**Dependencies**: TODO 1.3

**Test approach:**
- Test real GraphQL response transformations
- Handle complex nested structures
- Test field value union handling

#### - [ ] TODO 7.3: Unit Tests for Services
**Priority**: High  
**Dependencies**: Phase 2 complete

**Test files to create:**
- `test/orchestrator-services/github/services/GitHubRestApiService.test.ts`
- `test/orchestrator-services/github/services/GitHubGraphQLService.test.ts`
- `test/orchestrator-services/github/services/ProjectService.test.ts`
- `test/orchestrator-services/github/services/RepositoryService.test.ts`
- `test/orchestrator-services/github/services/ActivityService.test.ts`
- `test/orchestrator-services/github/services/AuthService.test.ts`

#### - [ ] TODO 7.4: Integration Tests for Orchestrator Services
**Priority**: High  
**Dependencies**: Phase 4 complete

#### - [ ] TODO 7.5: Integration Tests for Orchestrator
**Priority**: High  
**Dependencies**: Phase 5 complete

#### - [ ] TODO 7.6: E2E Tests for Command
**Priority**: Medium  
**Dependencies**: Phase 6 complete

### Phase 8: Utilities & Helpers

#### - [ ] TODO 8.1: Create Utility Functions
**Priority**: Medium  
**Dependencies**: Types, Constants

**Files to create:**
- `src/orchestrator-services/github/utils/GitUrlParser.ts`
- `src/orchestrator-services/github/utils/DateUtils.ts`
- `src/orchestrator-services/github/utils/ArgumentParser.ts`
- `src/orchestrator-services/github/utils/GraphQLQueryBuilder.ts` (NEW)

### Phase 9: Documentation & Polish

#### - [ ] TODO 9.1: Create API Documentation
**Priority**: Low  
**Dependencies**: All implementation complete

## Implementation Order & Dependencies

### Critical Path:
1. **Phase 0** (Cleanup) - Delete wrong code FIRST
2. **Phase 1** (Fixed DTOs, Real Types) - Correct foundation  
3. **Phase 2** (Services) - Core business logic with proper APIs
4. **Phase 3** (Interfaces) - Contracts and DI
5. **Phase 4** (Orchestrator Services) - Coordination
6. **Phase 5** (Orchestrator) - Main orchestration
7. **Phase 6** (Command) - CLI interface
8. **Phase 7** (Testing) - Quality assurance
9. **Phase 8** (Utilities) - Helper functions
10. **Phase 9** (Documentation) - Final polish

### Parallel Work Opportunities:
- REST DTOs can be fixed while GraphQL research happens
- Services can be implemented in parallel after DTOs are done
- Tests can be written in parallel with implementation (TDD)

## Success Criteria

### Functional Requirements:
- [ ] Command successfully detects projects from git remotes using GraphQL
- [ ] Command handles URL and manual input modes with real Project node IDs
- [ ] Collects comprehensive activity data from all project repositories
- [ ] Generates audience-specific summaries
- [ ] Handles GitHub API errors gracefully (both REST and GraphQL)
- [ ] Respects rate limits for both API types
- [ ] Provides clear error messages with recovery instructions

### Technical Requirements:
- [ ] All code passes `npm run qa` (typecheck + lint + test)
- [ ] 90% test coverage across all layers
- [ ] No magic strings (all keys defined as constants)
- [ ] All services follow dependency injection pattern
- [ ] All DTOs implement `ILLMDataDTO` interface
- [ ] Error handling follows `OrchestratorError` pattern
- [ ] Follows established naming conventions
- [ ] Uses proper Octokit REST + GraphQL APIs (no CLI calls for data)

### Performance Requirements:
- [ ] Command completes within reasonable time (< 30 seconds for typical project)
- [ ] Handles large projects (50+ repositories) without memory issues
- [ ] Graceful degradation when API limits are reached

## Risk Mitigation

### High-Risk Areas:
1. **GitHub GraphQL API Complexity** - Projects v2 schema is complex with nested field values
2. **GitHub API Rate Limits** - Both REST and GraphQL have different limits
3. **Large Project Performance** - GraphQL queries can be expensive
4. **Authentication Issues** - Token-based auth vs CLI integration

### Mitigation Strategies:
- Start with thorough GraphQL API research before implementing
- Comprehensive error handling at every layer
- Extensive testing including error scenarios
- Clear documentation and recovery instructions
- Performance monitoring and optimization

## 🚨 LESSONS LEARNED

**Never assume API structure without research** - The Projects v2 GraphQL API is fundamentally different from REST APIs. Always verify actual API responses before implementing DTOs and services.

**Delete wrong code aggressively** - It's better to start fresh with correct understanding than refactor fundamentally flawed approaches.

**Dependencies matter** - Using the right tools (`@octokit/graphql`) is critical for success.

This implementation plan provides a corrected, structured approach to building the GitHub Project Summary functionality while addressing the fundamental API architecture mistakes discovered during initial implementation.