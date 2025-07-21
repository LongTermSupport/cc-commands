# Implement Command Conventions and Orchestrator Pattern

Ensure all the following have been read:
- @/CLAUDE/CommandStructure.md (PRIMARY REFERENCE - orchestrator pattern guide)
- @/README.md
- @/scripts/CLAUDE.md
- @/scripts/_inc/CLAUDE.md
- @/.github/ci.bash (for CI enforcement rules)

## Progress

[✓] Analyze current command structure and script usage
[✓] Identify commands that need orchestrator pattern
[✓] Create orchestrator scripts for multi-step commands
[✓] Update all script references to use correct conventions
[✓] Migrate error handling to new include structure
[✓] Update g:command:create to minimize bash calls and generate new structure
[✓] Migrate g:gh:push to orchestrator pattern (8→2 calls)
[✓] Migrate g:w:execute to orchestrator pattern
[✓] Run CI and fix any violations (0 errors, only warnings)
[✓] Add debug backtrace and orphan detection to CI
[✓] Update plan document with ACTUAL CI findings (not false positives)
[✓] Move sync_orchestrate.bash to sync/ subdirectory for consistency
[✓] Add CI enforcement for orchestrator directory structure
[✓] Update CommandStructure.md with clear orchestrator location rules
[✓] Update create.md template to generate orchestrator pattern
[✓] Fix CI path normalization and template detection
[✓] Improve CI orphan detection for orchestrator subdirectory scripts
[✓] Migrate g:command:update to orchestrator pattern (4 scripts → 2 calls)
[✓] Migrate g:gh:issue:plan to orchestrator pattern (6 scripts → 3 calls)
[✓] Migrate g:w:plan to orchestrator pattern (4 scripts → 2 calls) 
[✓] Check if symfony:create:command needs orchestrator pattern (No - only 3 _common calls)
[✓] Update all scripts to use new error handler include (39 files migrated)
[ ] Reassess _common script usage for DRY principle
[ ] Refactor proxy scripts - if they just call _common, orchestrator should call _common directly
[✓] Remove legacy error_handlers.bash bridge script
[✓] Fix CI orphan detection to handle COMMON_DIR references
[✓] Fix script naming convention warnings (7 scripts renamed)
[ ] Remove truly orphaned scripts (11 scripts identified) - DEFERRED for DRY analysis
[✓] Move all CI functionality from GitHub workflow into ci.bash
[✓] Add shellcheck integration to ci.bash (with auto-download capability)
[✓] Update GitHub workflow to just call ci.bash
[✓] Fix error handler include paths in all scripts (65 scripts fixed)
    - All scripts must define COMMON_DIR pointing to scripts/_common/
    - All scripts must source from $COMMON_DIR/_inc/error_handler.inc.bash
    - Fixed patterns by location:
      * scripts/_common/*/ → COMMON_DIR="$SCRIPT_DIR/.."
      * scripts/g/command/{name}/ → COMMON_DIR="$SCRIPT_DIR/../../../_common"
      * scripts/g/command/{name}/*/ → COMMON_DIR="$SCRIPT_DIR/../../../../_common"
      * scripts/g/gh/{name}/ → COMMON_DIR="$SCRIPT_DIR/../../../_common"
      * scripts/g/gh/{name}/*/ → COMMON_DIR="$SCRIPT_DIR/../../../../_common"
    - Created automated fix script that updated 63 of 65 scripts
    - Manually fixed remaining 2 scripts
    - Removed temporary fix script after use
[✓] Update ShellCheck filtering in ci.bash to handle SC1091 properly
    - Fixed grep filter to properly exclude SC1091 warnings about non-constant source
    - Reduced ShellCheck errors from 66 to 24
[✓] Fix SC2155 warnings (declare and assign separately)
    - Fixed 14 scripts with automated script
    - Separated variable declaration from command substitution assignments
[✓] Fix SC2124 warnings (array to string assignment)
    - Fixed 5 orchestrator scripts
    - Changed `local args="$@"` to `local args=("$@")`
    - Updated array usage to `"${args[@]}"`
[ ] Fix remaining ShellCheck warnings (18 scripts, down from 24)
    - SC2034: Variable appears unused (5 occurrences)
    - SC2128: Expanding array without index (4 occurrences)
    - SC2155: More declare/assign issues in orchestrators (6 occurrences)
    - SC1083: Literal braces in git upstream references (4 occurrences)
    - SC2064: Variable expansion in trap commands (2 occurrences)
    - SC2168: 'local' outside function (1 occurrence)
    - Miscellaneous: SC2207, SC2126, SC2035, SC2002
[ ] Add missing success messages to scripts (54 warnings)
    - All scripts should end with: echo "Script success: ${0##*/}"
[ ] Clean up git deleted files (old scripts before migration)
[ ] Test all commands to ensure they still work

## Summary

This plan implements the new command conventions across the entire codebase:
1. Orchestrator pattern to reduce bash calls (from many to 1-2 per command)
2. Proper separation of sourced includes (.inc.bash) vs executed scripts
3. Standardized error handling using the new include structure
4. CI-enforced conventions for maintainability

**Reference Implementation**: g:command:sync has already been migrated and serves as the model:
- Reduced from 8 bash calls to 2 calls
- Scripts organized in subdirectories (pre/, analysis/, git/, post/)
- Orchestrator handles all conditional logic
- Clear KEY=value communication between scripts

## Analysis Phase

### Current State Assessment

#### Reference: g:command:sync Migration Success
The sync command has been successfully migrated and demonstrates the pattern:

**Before**: 8 individual script calls
```
!bash sync_env_validate.bash
!bash sync_status_analysis.bash
!bash sync_change_analysis.bash
!bash sync_commit_execute.bash "$MSG"
!bash sync_pull_execute.bash "$BRANCH"
!bash sync_readme_check.bash
!bash sync_push_execute.bash "$BRANCH"
!bash sync_summary.bash
```

**After**: 2 orchestrator calls
```
!bash sync_orchestrate.bash                    # Analysis phase
!bash sync_orchestrate.bash "$COMMIT_MESSAGE"  # Execution phase
```

**Structure Created**:
```
scripts/g/command/sync/
├── sync_orchestrate.bash
├── pre/env_validate.bash
├── analysis/status_analysis.bash
├── analysis/change_analysis.bash
├── analysis/readme_check.bash
├── git/commit_execute.bash
├── git/pull_execute.bash
├── git/push_execute.bash
└── post/summary.bash
```

#### Commands with Multiple Bash Calls
Based on our sync command experience (8 calls → 2 calls), we need to identify similar patterns:

1. **g:command:create** - Likely has multiple validation/creation steps
2. **g:command:update** - Multiple analysis and update steps
3. **g:gh:issue:plan** - GitHub API calls, file operations, plan creation
4. **g:gh:push** - Git operations, GitHub Actions monitoring
5. **g:symfony:create:command** - Multiple file operations and validations
6. **g:w:plan** - Plan creation with multiple steps
7. **g:w:execute** - Plan execution with progress tracking

#### Script Organization Issues
1. Scripts scattered without clear phase organization
2. No orchestration layer for complex multi-step operations
3. Inconsistent error handling across scripts
4. Mixed sourcing/execution patterns

### Orchestrator Pattern Implementation (Per CommandStructure.md)

#### Phase 1: Command Analysis
For each command, identify:
- Number of current bash calls
- Logical groupings of operations
- Conditional execution patterns
- State that needs to be passed between steps

#### Phase 2: Script Reorganization (Following CommandStructure.md)
For commands needing orchestration:
```
scripts/g/command/{command_name}/
├── {command}_orchestrate.bash    # Main orchestrator
├── pre/                          # Precondition checks
│   ├── env_validate.bash
│   └── prereq_check.bash
├── analysis/                     # Analysis scripts
│   ├── status_analysis.bash
│   └── change_detection.bash
├── execute/                      # Execution scripts
│   ├── main_operation.bash
│   └── secondary_operation.bash
└── post/                         # Cleanup/summary
    ├── summary.bash
    └── cleanup.bash
```

#### Phase 3: Orchestrator Implementation (Using CommandStructure.md Template)

**Key Components from CommandStructure.md**:
1. **capture_script_output function** - Captures and parses KEY=value outputs
2. **SCRIPT_OUTPUTS associative array** - Stores outputs from sub-scripts
3. **Visual separators** - Clear execution flow with ━━━ lines
4. **Error handling** - Proper error propagation with context
5. **Source includes correctly** - Use `source "$SCRIPT_DIR/../../../_inc/error_handler.inc.bash"`

**Implementation Pattern**:
- Single orchestrator handles entire flow
- Conditional logic based on SCRIPT_OUTPUTS values
- Clear phases: pre → analysis → execute → post
- Final output section with KEY=value summary

### Include Migration Strategy

#### Current Error Handling Issues
- `_common/error/error_handlers.bash` sources an include (correct)
- But many scripts may be sourcing it incorrectly
- Need to ensure all scripts use proper include path

#### Migration Steps
1. Update all scripts to source from `_inc/error_handler.inc.bash`
2. Remove any direct sourcing of `_common/error/error_handlers.bash`
3. Ensure no script sets options before sourcing includes
4. Verify include guards are working properly

### Command-Specific Implementation Plans

#### 1. g:command:create
**Current Structure**: Multiple validation and creation steps
**Target**: 2 bash calls maximum

**Current Scripts to Migrate**:
- `create_req_check.bash` → `create/pre/requirements_check.bash`
- Need to create orchestrator to combine all operations

**Orchestrator Flow**:
```bash
create_orchestrate.bash [mode] [args]
├── Mode: analyze
│   ├── pre/env_validate.bash
│   ├── pre/arg_parse.bash
│   └── analysis/requirements_check.bash
└── Mode: execute  
    ├── execute/create_command.bash
    ├── execute/create_scripts.bash
    └── post/summary.bash
```

**Key Changes**:
- Combine all validation into single pre-check phase
- Move command creation logic from inline bash to scripts
- Aggregate all outputs for Claude to process once

**Reduction**: 6-8 calls → 2 calls (analyze + execute)

#### 2. g:gh:push
**Current Structure**: Git checks + push + GitHub Actions monitoring
**Target**: 1-2 bash calls

**Orchestrator Flow**:
```bash
push_orchestrate.bash [mode]
├── pre/git_validate.bash
├── analysis/push_requirements.bash
├── execute/git_push.bash
├── monitor/workflow_watch.bash
└── post/results_summary.bash
```

**Special Consideration**: Workflow monitoring may need separate call for real-time updates

#### 3. g:w:execute
**Current Structure**: Plan reading + step execution + progress tracking
**Target**: 1 call with progress streaming

**Orchestrator Flow**:
```bash
execute_orchestrate.bash [plan_name]
├── pre/plan_validate.bash
├── analysis/plan_parse.bash
├── execute/run_steps.bash (with progress output)
└── post/completion_report.bash
```

**Challenge**: Need to handle real-time progress updates within orchestrator

### Error Handling Standardization

#### All Scripts Must:
1. Source error handler at start (after setting shell options)
2. Use standard error_exit for fatal errors
3. Use run_with_output for noisy commands
4. Clean up temp files on exit

#### Template for New Scripts:
```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../../_inc/error_handler.inc.bash"

# Script implementation
```

#### Scripts Still Using Old Error Handler (39 files):
**Unmigrated Commands (priority):**
- All g:command:update scripts (4 files)
- All g:gh:issue:plan scripts (7 files)
- All g:w:plan scripts (4 files)

**Migrated Commands (need cleanup):**
- g:command:sync scripts (8 files) - already migrated but still using old handler
- _common scripts (11 files) - may be needed by unmigrated commands

**Next Steps:**
1. Migrate unmigrated commands to orchestrator pattern
2. Update all scripts to use new include path
3. Remove error_handlers.bash once all scripts are updated

### CI Compliance Strategy

#### Pre-Migration CI Run
1. Run current CI to baseline violations
2. Document all current failures
3. Prioritize fixes by severity

#### CI Findings (Latest Run)

**ACTUAL Missing Scripts (vs CI false positives)**:
- **False positive**: Common scripts exist (`env_check_tools.bash`, `find_docs.bash`, `detect_version.bash`, `detect_project.bash`)
- **False positive**: Template placeholders `scripts/g/[namespace]/[command]_*.bash` are not real files
- **Real issue**: Commands not yet migrated to orchestrator pattern:
  - g:command:update (references 4 non-existent scripts)
  - g:gh:issue:plan (references 6 non-existent scripts)  
  - g:w:plan (references 4 non-existent scripts)
- **Path issue**: sync.md references wrong path (missing /sync/ subdirectory)

**Orphaned Scripts (39 warnings)**:
- These are the deleted scripts in git status (old versions before migration)
- Subdirectory scripts (pre/, analysis/, etc.) are NOT orphaned - they're called by orchestrators
- Real orphans may exist in _common that aren't used anywhere

**Script Convention Issues (1 warning)**:
- `error_handlers.bash` missing `set -euo pipefail` (but it sources an include, so this may be intentional)

**Orchestrator Pattern Violations (6 warnings) - VALID**:
- `update.md`: 4 bash calls, needs orchestrator migration
- `plan.md` (gh:issue): 6 bash calls, needs orchestrator migration
- `plan.md` (g:w): 4 bash calls, needs orchestrator migration
- Multiple sequential git operations detected
- Analysis->Execute patterns without orchestrator

#### Known Violations to Fix

**Include/Source Violations**:
1. Any script executing files from `_inc/` directory
2. Any script sourcing files from `_common/` directory
3. Command files executing include files with `!bash`
4. Missing `.inc.bash` suffix for include files

**Script Convention Violations**:
1. Include files setting shell options (`set -e`, etc.)
2. Include files modifying IFS
3. Scripts missing proper error handling includes
4. Scripts not following the template structure

**Command Structure Violations**:
1. Ad-hoc bash loops in command files
2. Complex git operations inline instead of in scripts
3. Multiple sequential bash calls that could be orchestrated
4. Missing help documentation structure

#### Post-Migration Validation
1. All commands pass CI checks
2. Orchestrator patterns properly implemented
3. Include/delegate separation enforced
4. Bash call reduction verified

### Testing Strategy

#### Unit Testing
- Test each orchestrator in isolation
- Verify state management works correctly
- Ensure error propagation functions

#### Integration Testing
- Run each command end-to-end
- Verify output remains consistent
- Check error handling scenarios

#### Performance Testing
- Measure execution time before/after
- Ensure orchestration doesn't add overhead
- Verify reduced user prompts improve UX

### Migration Priority

#### Completed ✓
1. g:command:create - Core functionality ✓
2. g:gh:push - Complex workflow ✓
3. g:w:execute - Complex state management ✓
4. g:command:sync - Git workflow ✓

#### High Priority (Remaining)
1. **g:gh:issue:plan** - 6 bash calls (most complex remaining)
2. **g:command:update** - 4 bash calls
3. **g:w:plan** - 4 bash calls

#### No Migration Needed
- **g:symfony:create:command** - Only 3 calls to _common scripts (acceptable)

### CI Consolidation Plan

#### Current State
- CI logic may be split between GitHub workflow and ci.bash
- Shellcheck might be run separately
- Workflow may have ad-hoc bash commands

#### Target State
1. **ci.bash becomes single entry point** for all CI checks:
   - Command validation
   - Script conventions
   - Shellcheck integration
   - Orchestrator pattern enforcement
   - Include/delegate separation
   - Orphan detection

2. **GitHub workflow simplification**:
   ```yaml
   - name: Run CI
     run: bash .github/ci.bash
   ```

3. **Shellcheck integration**:
   - Add shellcheck to ci.bash
   - Check all .bash files
   - Respect shellcheck directives
   - Clear error reporting

### Lessons from g:command:sync Migration

1. **Path Depth Matters**: When moving scripts to subdirectories, update COMMON_DIR paths
   - Original: `../../_common`
   - After move: `../../../../_common` (added more ../）
   
2. **Error Handler Bridge**: Created backward-compatible bridge in old location
   - Keeps existing scripts working during transition
   - Sources from new `_inc/error_handler.inc.bash`

3. **Orchestrator Benefits**:
   - Reduced user approval prompts from 8 to 2
   - Deterministic flow handled in bash
   - Claude only handles commit message generation and decisions
   - Clear state passing via SCRIPT_OUTPUTS array

4. **Testing Critical**: Discovered path issues immediately when testing

### Success Metrics

1. **Bash Call Reduction**: Average 60-80% fewer calls per command (sync: 75% reduction)
2. **CI Compliance**: 100% pass rate
3. **Code Organization**: Clear phase-based structure
4. **Error Handling**: Consistent across all scripts
5. **Performance**: No regression in execution time
6. **Maintainability**: Easier to understand and modify

### Risk Mitigation

1. **Backward Compatibility**: Keep old scripts during transition
2. **Incremental Migration**: One command at a time
3. **Thorough Testing**: Before marking complete
4. **Documentation**: Update as we go
5. **Rollback Plan**: Git revert if issues arise

### Implementation Schedule

#### Week 1: Foundation
- Set up orchestrator templates
- Migrate first command (g:command:create)
- Validate pattern works

#### Week 2: Core Commands
- Migrate g:gh:push
- Migrate g:w:execute
- Address any pattern issues

#### Week 3: Remaining Commands
- Complete all migrations
- Run full CI validation
- Update documentation

#### Week 4: Polish
- Performance optimization
- Error handling improvements
- Final testing and validation