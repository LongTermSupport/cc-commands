# Git Domain Migration Plan

**Date**: 2025-01-29  
**Status**: Planning Mode  
**Priority**: High  
**Domain**: Git repository operations, status collection, commit handling

## Summary

Migrate bash git functionality to a focused **Git Domain** in TypeScript. This domain handles git repository operations, status collection, and commit management - pure git operations with **no commit message generation** (that stays with LLM).

**Scope**: Medium domain (3-4 days implementation)  
**Dependencies**: None - uses only core TypeScript infrastructure

## Bash Functionality Analysis

### Current Bash Scripts:
```
scripts/_common/git/
├── git_operations.bash        # Basic git operations (add, commit, push, pull)
├── git_smart_commit.bash      # ⚠️ VIOLATION: Generates commit messages  
├── git_state_analysis.bash    # Git status and state collection
└── git_status.bash           # Git working directory status

scripts/g/command/sync/git/    # Git operations for command sync
├── commit_execute.bash        # Commit operations
├── pull_execute.bash         # Pull operations  
└── push_execute.bash         # Push operations

scripts/g/gh/push/execute/
└── execute_git.bash          # Git operations for GitHub workflows
```

### Key Functionality:
- **Repository Operations**: Init, clone, fetch, pull, push
- **Working Directory**: Status, add files, reset
- **Branch Operations**: Create, switch, merge, delete
- **Commit Operations**: Create commits (message provided by caller)
- **Remote Operations**: Add/remove remotes, sync with remotes
- **State Collection**: Working directory status, staging area, branch info

### ⚠️ **Responsibility Violation to Fix:**
- `git_smart_commit.bash` generates commit messages - **MOVE TO LLM**

## TypeScript Domain Architecture

### Service Organization:
```typescript
src/orchestrator-services/git/
├── interfaces/
│   ├── IGitOperationsService.ts
│   ├── IGitStateService.ts
│   ├── IGitCommitService.ts
│   └── IGitBranchService.ts
├── services/
│   ├── GitOperationsService.ts
│   ├── GitStateService.ts
│   ├── GitCommitService.ts
│   └── GitBranchService.ts
├── dto/
│   ├── GitRepositoryStatusDTO.ts
│   ├── GitCommitResultDTO.ts
│   ├── GitBranchInfoDTO.ts
│   ├── GitRemoteStatusDTO.ts
│   └── GitOperationResultDTO.ts
├── types/
│   └── GitTypes.ts
├── constants/
│   └── GitConstants.ts
└── errors/
    └── GitOperationError.ts
```

## Implementation

### Core Interfaces:

```typescript
interface IGitOperationsService {
  // Repository management
  initRepository(path?: string): Promise<GitOperationResultDTO>
  cloneRepository(url: string, targetPath: string): Promise<GitOperationResultDTO>
  
  // Remote operations
  fetch(remote?: string): Promise<GitOperationResultDTO>
  pull(remote?: string, branch?: string): Promise<GitOperationResultDTO>
  push(remote?: string, branch?: string, force?: boolean): Promise<GitOperationResultDTO>
  
  // Working directory
  addFiles(files: string[]): Promise<GitOperationResultDTO>
  addAllFiles(): Promise<GitOperationResultDTO>
  resetFiles(files?: string[]): Promise<GitOperationResultDTO>
}

interface IGitStateService {
  getRepositoryStatus(): Promise<GitRepositoryStatusDTO>
  getWorkingDirectoryStatus(): Promise<GitWorkingDirectoryStatusDTO>
  getStagingAreaStatus(): Promise<GitStagingAreaStatusDTO>
  getBranchInfo(): Promise<GitBranchInfoDTO>
  getRemoteStatus(): Promise<GitRemoteStatusDTO>
  getCommitHistory(count?: number): Promise<GitCommitHistoryDTO>
}

interface IGitCommitService {
  // ✅ TypeScript: Create commits with provided messages
  createCommit(message: string, files?: string[]): Promise<GitCommitResultDTO>
  amendCommit(message?: string): Promise<GitCommitResultDTO>
  getChangedFiles(): Promise<GitChangedFilesDTO>
  getDiffSummary(): Promise<GitDiffSummaryDTO>
  
  // ❌ NO MESSAGE GENERATION - LLM responsibility
}

interface IGitBranchService {
  getCurrentBranch(): Promise<string>
  createBranch(name: string, startPoint?: string): Promise<GitOperationResultDTO>
  switchBranch(name: string): Promise<GitOperationResultDTO>
  deleteBranch(name: string, force?: boolean): Promise<GitOperationResultDTO>
  listBranches(): Promise<GitBranchListDTO>
  mergeBranch(branch: string): Promise<GitOperationResultDTO>
}
```

### Key DTOs:

```typescript
export class GitRepositoryStatusDTO {
  constructor(
    public readonly isRepository: boolean,
    public readonly currentBranch: string,
    public readonly isClean: boolean,
    public readonly hasUnstagedChanges: boolean,
    public readonly hasStagedChanges: boolean,
    public readonly untrackedFiles: string[],
    public readonly modifiedFiles: string[],
    public readonly stagedFiles: string[]
  ) {}

  toLLMData(): Record<string, string> {
    return {
      IS_GIT_REPOSITORY: this.isRepository.toString(),
      CURRENT_BRANCH: this.currentBranch,
      WORKING_DIRECTORY_CLEAN: this.isClean.toString(),
      UNTRACKED_FILES: this.untrackedFiles.join(','),
      MODIFIED_FILES: this.modifiedFiles.join(','),
      STAGED_FILES: this.stagedFiles.join(',')
    }
  }
}

export class GitCommitResultDTO {
  constructor(
    public readonly success: boolean,
    public readonly commitHash?: string,
    public readonly message?: string,
    public readonly filesCommitted?: string[],
    public readonly error?: string
  ) {}

  toLLMData(): Record<string, string> {
    return {
      COMMIT_SUCCESS: this.success.toString(),
      COMMIT_HASH: this.commitHash || '',
      COMMIT_MESSAGE: this.message || '',
      FILES_COMMITTED: this.filesCommitted?.join(',') || ''
    }
  }
}
```

## Major Refactoring Required

### Commit Message Generation (Critical Fix):
```typescript
// ❌ WRONG: Current bash does this
// git_smart_commit.bash generates commit messages based on git diff

// ✅ CORRECT: TypeScript provides data, LLM generates message
interface IGitCommitService {
  // TypeScript: Collect git diff data
  getDiffSummary(): Promise<GitDiffSummaryDTO>
  getChangedFilesList(): Promise<GitChangedFilesDTO>
  
  // TypeScript: Create commit with LLM-provided message
  createCommit(message: string): Promise<GitCommitResultDTO>
}

// ✅ LLM Command Logic will:
// 1. Call getDiffSummary() and getChangedFilesList()
// 2. Analyze changes and generate appropriate commit message
// 3. Call createCommit(generatedMessage)
```

## Bash Scripts Being Replaced:

- `_common/git/git_operations.bash` → GitOperationsService
- `_common/git/git_state_analysis.bash` → GitStateService  
- `_common/git/git_status.bash` → GitStateService
- `_common/git/git_smart_commit.bash` → GitCommitService (message generation → LLM)
- `g/command/sync/git/*.bash` → Respective domain services
- `g/gh/push/execute/execute_git.bash` → GitOperationsService

## Testing Strategy:

- **Unit Tests**: Mock git commands, test error scenarios
- **Integration Tests**: Real git operations in test repositories
- **Cross-platform**: Git behavior consistency across platforms
- **Error Handling**: Network failures, permission issues, merge conflicts
- **Responsibility Compliance**: No message generation in TypeScript

## Success Criteria:

1. **Complete Git Operations**: All bash git functionality preserved
2. **Clean Separation**: Commit message generation moved to LLM
3. **Robust Error Handling**: Git failures handled gracefully  
4. **Performance**: Efficient git operations
5. **Type Safety**: Full TypeScript typing
6. **Cross-platform**: Consistent behavior across environments

---

**Critical Success Factor**: Successfully extracting commit message generation from TypeScript services and integrating it into LLM command logic while preserving all git operational functionality.