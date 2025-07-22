# g:command:sync - Repository Synchronization

## Overview

The `g:command:sync` command synchronizes the shared cc-commands repository across projects by intelligently committing local changes, pulling updates, and pushing to the remote. It's a model implementation of the orchestrator pattern, reducing bash calls from 8 to 2.

## High-Level Purpose

Keeps cc-commands synchronized across all projects by:
- Automatically generating meaningful commit messages based on actual changes
- Handling git operations (commit, pull, push) safely
- Detecting outdated documentation that needs updating
- Providing clear conflict resolution guidance

## Workflow in Terse Pseudocode

```pseudocode
// Phase 1: Analysis (no commit message)
IF arguments == "--help" THEN
    DISPLAY help documentation
    EXIT
END IF

RUN sync_orchestrate.bash
    -> pre/env_validate.bash: Validate environment
    -> analysis/status_analysis.bash: Check git status
    -> analysis/change_analysis.bash: Analyze changes (if any)
    -> git/pull_execute.bash: Pull from remote
    -> analysis/readme_check.bash: Check documentation currency
    -> OUTPUT: Repository state, changes, doc status

IF COMMIT_MESSAGE_REQUIRED=true THEN
    ANALYZE changes from output
    GENERATE meaningful commit message
    REQUEST user confirmation
END IF

// Phase 2: Execution (with commit message)
IF user confirms THEN
    RUN sync_orchestrate.bash "$COMMIT_MESSAGE"
        -> (same validation steps)
        -> git/commit_execute.bash: Commit with message
        -> git/pull_execute.bash: Pull again
        -> git/push_execute.bash: Push to remote
        -> post/summary.bash: Generate summary
        -> OUTPUT: SYNC_COMPLETE=true
END IF

// Phase 3: Documentation Update (if needed)
IF README_UPDATE_NEEDED=true THEN
    UPDATE README.md with current commands
    UPDATE CommonScripts.md with script list
    UPDATE CommonIncludes.md with function docs
    COMMIT documentation changes
END IF
```

## Scripts Involved and Their Roles

### Main Command File
- **Path**: `export/commands/g/command/sync.md`
- **Role**: Claude Code interface, commit message generation
- **Calls**: `sync_orchestrate.bash` twice (analysis, then execution)

### Orchestrator Script
- **Path**: `scripts/g/command/sync/sync_orchestrate.bash`
- **Role**: Coordinates all operations, manages conditional flow
- **Parameters**: Optional commit message
- **Key Feature**: capture_script_output function for state management

### Sub-Scripts

#### Pre-condition Scripts
- **pre/env_validate.bash**
  - Validates cc-commands directory exists
  - Checks git repository status
  - Verifies remote configuration
  - Outputs: `ENVIRONMENT_VALID`, `CC_DIR`

#### Analysis Scripts
- **analysis/status_analysis.bash**
  - Checks for uncommitted changes
  - Gets current branch
  - Checks remote status
  - Outputs: `CHANGES_EXIST`, `CURRENT_BRANCH`, `REMOTE_STATUS`

- **analysis/change_analysis.bash**
  - Lists modified files
  - Shows diff statistics
  - Categorizes changes by type
  - Outputs: Change details for commit message generation

- **analysis/readme_check.bash**
  - Compares README.md with actual commands
  - Checks CommonScripts.md currency
  - Validates CommonIncludes.md
  - Outputs: `README_OUTDATED`, `COMMON_SCRIPTS_OUTDATED`, `COMMON_INCLUDES_OUTDATED`

#### Git Operation Scripts
- **git/commit_execute.bash**
  - Stages all changes
  - Commits with provided message
  - Handles commit failures
  - Outputs: `COMMIT_SUCCESS`, `COMMIT_HASH`

- **git/pull_execute.bash**
  - Fetches and rebases from remote
  - Handles merge conflicts
  - Outputs: `PULL_SUCCESS`, `CONFLICTS`

- **git/push_execute.bash**
  - Pushes to remote branch
  - Handles push failures
  - Outputs: `PUSH_SUCCESS`

#### Post Scripts
- **post/summary.bash**
  - Generates sync summary
  - Shows current status
  - Lists recent commits
  - Outputs: Summary text

## Data Flow (KEY=value outputs)

### Analysis Phase Outputs
```
ENVIRONMENT_VALID=true
CC_DIR=/path/to/cc-commands
CHANGES_EXIST=true|false
CURRENT_BRANCH=main|branch-name
REMOTE_STATUS=up_to_date|has_updates|ahead
COMMIT_MESSAGE_REQUIRED=true|false
README_OUTDATED=true|false
COMMON_SCRIPTS_OUTDATED=true|false
COMMON_INCLUDES_OUTDATED=true|false
README_UPDATE_NEEDED=true|false
```

### Execution Phase Outputs
```
COMMIT_SUCCESS=true|false
COMMIT_HASH=<hash>
PULL_SUCCESS=true
CONFLICTS=true|false
PUSH_SUCCESS=true|false
SYNC_COMPLETE=true
CHANGES_COMMITTED=true|false
REMOTE_SYNCED=true|false
```

## Error Handling Patterns

1. **Environment Failures**
   - Missing cc-commands directory
   - Not a git repository
   - No remote configured

2. **Git Operation Failures**
   - Commit failures (nothing to commit)
   - Pull conflicts
   - Push rejections
   - Network issues

3. **Recovery Guidance**
   - Clear instructions for each failure type
   - Manual conflict resolution steps
   - Authentication troubleshooting

## User Interaction Points

1. **Help Request**
   - Check for `--help` argument
   - Display comprehensive documentation

2. **Commit Message Generation**
   - Claude analyzes changes
   - Generates conventional commit message
   - Shows changes summary

3. **Sync Confirmation**
   - Lists operations to be performed
   - Requires yes/no confirmation

4. **Documentation Updates**
   - Manual update in Claude
   - Separate commit for docs

## Bugs and Quirks

### **(quirk:)** Two-Phase Execution
The command runs the orchestrator twice - once for analysis, once for execution. This is intentional to allow Claude to generate commit messages based on actual changes.

### **(quirk:)** Documentation Update Detection
The readme_check.bash uses simple line counts and grep patterns which could have false positives/negatives for documentation currency.

### **(bug:)** Missing Merge Strategy
The pull uses rebase by default, but there's no option to use merge strategy for users who prefer it.

### **(quirk:)** All-or-Nothing Commit
The command commits all changes at once. There's no way to selectively stage files.

## TypeScript Migration Considerations

### Input/Output Specifications
- **Inputs**: Optional commit message (generated by Claude)
- **Outputs**: Sync status, documentation update needs

### State Management Requirements
- Repository status between phases
- Change analysis results
- Documentation currency status
- Operation success/failure states

### External Service Dependencies
- Git operations (extensive)
- File system for documentation checks
- No network APIs (git handles network)

### Performance Characteristics
- Fast local operations (< 2 seconds)
- Network operations depend on repository size
- Two orchestrator calls vs original 8 bash calls

### Testing Considerations
- Mock git operations
- Test conflict scenarios
- Verify commit message generation
- Test documentation update detection
- Ensure state management works correctly

## Pattern Contributions

This command demonstrates:
1. **Orchestrator pattern excellence** - Best example of call reduction
2. **Two-phase workflow** - Analysis then execution
3. **Intelligent commit messages** - Claude analyzes actual changes
4. **Documentation awareness** - Auto-detects outdated docs
5. **Comprehensive error handling** - Every git scenario covered