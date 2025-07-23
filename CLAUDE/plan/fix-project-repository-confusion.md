# Fix Project vs Repository Confusion in g:gh:project:summary

## Problem Statement

We have fundamentally misunderstood what the `g:gh:project:summary` command is supposed to do. 

**What we built:** A repository analyzer that collects data from a single GitHub repository
**What was needed:** A GitHub Projects v2 analyzer that works with organization-level kanban boards

### Key Differences

| Aspect | What We Built | What's Needed |
|--------|--------------|---------------|
| **Target** | GitHub Repository | GitHub Project (kanban board) |
| **Scope** | Single repo | Multiple repos in a project |
| **URL Pattern** | `github.com/owner/repo` | `github.com/orgs/ORG/projects/NUMBER` |
| **Data Source** | Repository API | Projects v2 GraphQL API |
| **Output** | Single repo metrics | Cross-repo project analysis |

## Root Cause Analysis

The confusion arose from:
1. **Ambiguous terminology** - "project" can mean:
   - A software project (repository) 
   - A GitHub Project (kanban board for project management)
2. **Incomplete analysis** of the bash implementation
3. **Assumptions** based on common usage patterns

## Implementation Plan

### Phase 1: Update Documentation and Issues
- [x] Create this detailed plan document
- [ ] Update GitHub issue #22 with findings and plan
- [ ] Add clarification to CLAUDE.md about GitHub issues management
- [ ] Update command documentation to clarify GitHub Projects vs repositories

### Phase 2: Fix ESLint Issues (Quick Wins)
- [ ] Configure ESLint to allow DTOs with many constructor parameters
- [ ] Add ESLint exception for GitHub API parameter names (per_page, etc.)
- [ ] Fix remaining `any` types with proper interfaces
- [ ] Complete missing JSDoc documentation

### Phase 3: Refactor Core Implementation

#### 3.1 Create New Orchestrator Flow

**CRITICAL: Orchestrator Pattern Clarifications**

1. **Thin Orchestrator** - Like MVC controllers, orchestrators ONLY coordinate services
   - NO business logic in orchestrator
   - ALL functionality comes from services
   - Orchestrator just wires services together

2. **Multi-Step LLM Interaction** - NOT a one-shot process
   ```
   LLM → Orchestrator (step 1: detect org/project)
   Orchestrator → LLM (returns project info)
   LLM → Orchestrator (step 2: collect repo data)
   Orchestrator → LLM (returns data file paths)
   LLM → (reads files, generates summary)
   ```

3. **Data Files Strategy**
   - Save complete, unabridged data to JSON files
   - Use `LLMInfo.addFile()` to reference them
   - Let LLM read full data for summary generation
   - Example: `var/project-data/github-project-123-2024-01-15.json`

```typescript
/**
 * THIN ORCHESTRATOR - Coordinates services, contains NO business logic
 * 
 * Multi-step interaction pattern:
 * 1. LLM calls with mode='detect' → returns project info
 * 2. LLM calls with mode='collect' → returns data file paths
 * 3. LLM reads files directly → generates summaries
 * 
 * This orchestrator is like an MVC controller - it only coordinates,
 * all actual work is done by services.
 */
export async function executeProjectSummary(
  services: ProjectSummaryServices,
  args: ProjectSummaryArgs,
  flags: ProjectSummaryFlags
): Promise<LLMInfo> {
  const result = LLMInfo.create()
  
  // Orchestrator flow:
  // 1. Detect organization from git remote (or use provided)
  // 2. Use ProjectDataService to find GitHub Projects v2
  // 3. Get the most recent project (or use provided project ID)
  // 4. Fetch project items (issues, PRs, draft issues)
  // 5. Extract unique repositories from items
  // 6. For each repository:
  //    - Use RepoDetectionService
  //    - Use DataCollectionService (with PR/Issue services)
  // 7. Save full data to file
  // 8. Return file path for LLM to read
}
```

#### 3.2 Update Orchestrator Documentation
- [ ] Update executeProjectSummary.ts header comments
- [ ] Add multi-step interaction pattern explanation
- [ ] Clarify thin orchestrator principle (MVC controller analogy)
- [ ] Document mode parameter for step-by-step execution
- [ ] Add example of LLM interaction flow

#### 3.3 Update Service Integration
- [ ] Wire ProjectDataService into the orchestrator
- [ ] Integrate PullRequestService into DataCollectionService
- [ ] Integrate IssueService into DataCollectionService
- [ ] Create aggregation logic for multi-repo data

#### 3.3 Create Data File Service
- [ ] Create DataFileService to save structured JSON data
- [ ] Save complete, unabridged API responses
- [ ] Generate timestamped filenames in `var/` directory
- [ ] Return file paths for LLMInfo.addFile()

```typescript
// Example data file structure
{
  "timestamp": "2024-01-15T10:30:00Z",
  "project": {
    "id": "PVT_kwDOAM_tHc4AKy2q",
    "number": 123,
    "title": "Q1 Development Tasks",
    "itemCount": 45,
    "repositories": ["org/repo1", "org/repo2"]
  },
  "repositories": {
    "org/repo1": {
      "metadata": { /* full repo data */ },
      "activity": { /* full activity metrics */ },
      "pullRequests": [ /* full PR data */ ],
      "issues": [ /* full issue data */ ],
      "releases": [ /* full release data */ ]
    },
    "org/repo2": { /* same structure */ }
  },
  "aggregated": {
    "totalCommits": 523,
    "totalPRs": 89,
    "totalIssues": 134,
    "mostActiveRepo": "org/repo1"
  }
}
```

#### 3.4 Update DTOs
- [ ] Create ProjectSummaryDTO that combines:
  - ProjectDataDTO (GitHub Project info)
  - Multiple RepoDataCollectionDTO instances
  - Aggregated metrics across repos

### Phase 4: Implement Missing Features

#### 4.1 Organization Detection
- [ ] Add method to detect org from git remote
- [ ] Support various remote URL formats
- [ ] Fallback to manual input

#### 4.2 Project Discovery
- [ ] Implement "most recent project" logic
- [ ] Support project URL parsing
- [ ] Support manual org/project specification

#### 4.3 Cross-Repository Analysis
- [ ] Aggregate metrics across all repos in project
- [ ] Calculate project-wide statistics
- [ ] Track which repos have most activity

### Phase 5: Fix Tests
- [ ] Update test expectations for new functionality
- [ ] Fix error message format expectations
- [ ] Add tests for GitHub Projects functionality
- [ ] Add tests for multi-repo aggregation

### Phase 6: Audience-Specific Formatting
- [ ] Move formatting logic to command (not orchestrator)
- [ ] Implement client/technical/management/product-owner views
- [ ] Ensure orchestrator only provides raw data

## Technical Decisions

### ESLint Configuration

#### DTO Constructor Parameters
DTOs legitimately need many parameters. We'll configure ESLint to allow this:
```javascript
// .eslintrc.js
{
  overrides: [
    {
      files: ['src/dto/**/*.ts'],
      rules: {
        'max-params': 'off' // DTOs need many params
      }
    }
  ]
}
```

#### GitHub API Parameters
GitHub's API uses snake_case. We'll handle this by:
```typescript
// Option 1: Disable for specific lines
// eslint-disable-next-line camelcase
per_page: limit,

// Option 2: Create type-safe wrapper
interface GitHubQueryParams {
  // eslint-disable-next-line camelcase
  per_page?: number
  // ... other GitHub params
}
```

### Architecture Principles
1. **Orchestrator provides data only** - No formatting or interpretation
2. **Orchestrators are thin** - Like MVC controllers, they coordinate but don't implement
3. **Multi-step interaction** - LLM calls orchestrator multiple times, not once
4. **Full data in files** - Save complete data to files, reference via LLMInfo.addFile()
5. **Services are composable** - Can analyze single repo or multiple
6. **DTOs handle all data transfer** - No magic strings
7. **Clear separation** - GitHub Projects vs Repositories

#### Orchestrator Documentation Template
```typescript
/**
 * Project Summary Orchestrator - THIN coordination layer
 * 
 * This orchestrator follows the multi-step LLM interaction pattern:
 * 
 * Step 1 (detect mode):
 *   - Input: URL or org/project identifiers
 *   - Process: Detect organization and find GitHub Project
 *   - Output: PROJECT_ID, PROJECT_TITLE, REPO_COUNT
 *   - Next: LLM decides whether to proceed
 * 
 * Step 2 (collect mode):
 *   - Input: Project ID from step 1
 *   - Process: Collect all repository data
 *   - Output: DATA_FILE path with complete JSON
 *   - Next: LLM reads file to generate summary
 * 
 * IMPORTANT: This orchestrator contains NO business logic.
 * All work is delegated to services. Think MVC controller.
 * 
 * @see ProjectDataService - Finds GitHub Projects
 * @see RepoDataCollectionService - Collects repository data
 * @see DataFileService - Saves structured data to files
 */
```

## Success Criteria

1. **Feature Parity**: All bash command features implemented
2. **Correct Functionality**: Works with GitHub Projects v2, not just repos
3. **Clean Code**: No ESLint errors (except justified exceptions)
4. **Full Test Coverage**: All paths tested
5. **Clear Documentation**: No ambiguity about Projects vs repos

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| GraphQL complexity | Use existing ProjectDataService as template |
| Breaking changes | Keep repo-only mode as fallback option |
| Test data | Use public GitHub Projects for testing |
| API rate limits | Implement caching for project data |

## Timeline Estimate

- Phase 1-2: 1 day (documentation and quick fixes)
- Phase 3: 2-3 days (core refactoring)
- Phase 4: 2 days (missing features)
- Phase 5-6: 1-2 days (tests and formatting)

**Total: 6-8 days**

## Notes

- The architecture we built is solid, just solving the wrong problem
- Most of the code can be reused, just needs reorganization
- The new PR/Issue services will be valuable for the cross-repo analysis
- This is a good example of why understanding requirements is critical

---

*Created: 2025-07-23*
*Status: Planning*
*Related Issue: #22*