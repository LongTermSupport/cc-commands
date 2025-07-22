# g:w:execute - Execute Previously Created Plans

## Overview

The `g:w:execute` command executes workflow plans created by `g:w:plan`. It has two distinct modes:
- **List Mode** (no arguments): Lists available plans and exits
- **Execute Mode** (with plan name): Finds and executes a specific plan

This command follows a careful, workflow-based approach to plan execution with quality checks and progress tracking.

## Command Structure

```
export/commands/g/w/execute.md      # Main command documentation
scripts/g/w/execute/
├── execute_orchestrate.bash        # Main orchestrator script
├── pre/
│   ├── arg_parse.bash             # Argument parsing (MODE determination)
│   └── env_validate.bash         # Environment validation
├── analysis/
│   ├── list_plans.bash           # (Missing - handled by common script)
│   ├── plan_search.bash          # (Missing - handled by common script)  
│   └── status_verify.bash        # Plan task status verification
├── execute/
│   ├── allcs.bash               # Code standards check (bin/qa -t allCS)
│   └── static_analysis.bash     # Static analysis (bin/qa -t allStatic)
└── post/
    └── git_status.bash          # Git status check

Common scripts used:
- _common/file/file_find_plans.bash  # Plan listing and searching
```

## Workflow Pattern

### 1. Orchestrator-Based Execution

The command uses a two-phase orchestrator pattern:

**Phase 1: Analysis Mode**
```bash
execute_orchestrate.bash analyze "$ARGUMENTS"
```
- Parses arguments to determine MODE (LIST or EXECUTE)
- Validates environment
- Lists plans or searches for specific plan
- Verifies plan status if found

**Phase 2: Execute Mode**
```bash
execute_orchestrate.bash execute "$PLAN_PATH" [action]
```
- Runs specific execution actions (allcs, static_analysis, git_status)
- Each action is a separate script call

### 2. Mode-Based Flow Control

**Critical Design Pattern**: The command has strict mode-based flow control:

```markdown
## 🚦 Mode Router

<Task>
CRITICAL: Check the MODE variable from argument parsing above.
- If MODE=LIST: Execute ONLY Section A below (List Plans), then STOP
- If MODE=EXECUTE: Skip to Section B below (Execute Plan)
Do not proceed through both sections.
</Task>
```

This prevents accidentally executing plans when the user just wanted to list them.

### 3. Script Output Capture

The orchestrator uses a `capture_script_output` function to:
- Execute sub-scripts and capture their output
- Parse KEY=value pairs into `SCRIPT_OUTPUTS` associative array
- Enable data passing between script phases

## Key Features

### 1. Plan Discovery and Matching

Uses `file_find_plans.bash` for:
- Exact match: `plan-name.md`
- Fuzzy match: `*plan-name*.md`
- Multiple match handling with user selection

### 2. Task Status Analysis

The `status_verify.bash` script analyzes plan progress:
- Counts tasks by status: `[ ]`, `[✓]`, `[⏳]`
- Detects "ALL DONE!" markers
- Shows first 20 tasks with line numbers

### 3. Quality Assurance Integration

Executes QA tools during plan execution:
- `allCS`: Code standards fixer (output suppressed)
- `allStatic`: Static analysis (output shown)
- Both set `CI=true` environment variable

### 4. Progress Tracking

The command is designed to support:
- Resume from partially completed plans
- Milestone commits during long executions
- Status verification before execution

## Implementation Details

### 1. Environment Validation

```bash
# execute_env_validate.bash checks:
- PLAN_DIR existence (case-insensitive search)
- PlanWorkflow.md presence
- Git availability and repository status
- QA tool availability (bin/qa)
```

### 2. Error Handling

- Uses `set -euo pipefail` for strict error handling
- `error_exit` function for consistent error messages
- Graceful handling of missing tools/directories

### 3. Output Format

All scripts use structured KEY=value output:
```
MODE=LIST
PLAN_COUNT=5
PLAN_0_FILE=CLAUDE/plan/issue-123.md
PLAN_0_NAME=issue-123.md
PLAN_0_MODIFIED=2024-01-15 10:30:00
```

## Bugs and Quirks

### 1. Missing Script References

The command documentation references scripts that don't exist:
- `analysis/list_plans.bash` - functionality in `file_find_plans.bash`
- `analysis/plan_search.bash` - functionality in `file_find_plans.bash`

### 2. Incomplete Plan Execution

The actual plan task execution logic is not implemented in the scripts. The command provides:
- Infrastructure for finding and analyzing plans
- QA tool integration
- Progress tracking setup

But the actual task execution loop is expected to be handled by Claude in the command flow.

### 3. Git Status Output Inconsistency

```bash
# In git_status.bash:
git_output=$(git status --porcelain)
modified_count=$(echo "$git_output" | grep -c . || echo "0")
```

This counts all lines in git status, not just modified files. Should use specific status codes.

### 4. Orchstrator Mode Switching

The orchestrator's `analyze` mode does double duty:
- Parses arguments and determines MODE
- Also performs plan discovery/analysis

This coupling makes the flow harder to follow.

## Best Practices

### 1. Strict Mode Enforcement

Always check MODE before proceeding:
```bash
if [ "$MODE" = "LIST" ]; then
    # List and STOP
    exit 0
fi
```

### 2. Plan Status Verification

Always verify plan status before execution:
- Check for "ALL DONE!" false positives
- Verify in-progress tasks are actually in progress
- Suggest resuming vs. starting fresh

### 3. Quality Gates

Run QA tools at appropriate intervals:
- After file modifications: `allCS`
- After task completion: `allStatic`
- Before milestone commits: both

### 4. Progress Documentation

Update plan document during execution:
- Mark tasks as `[⏳]` when starting
- Mark as `[✓]` when completed
- Add notes for blocked tasks

## Common Patterns

### 1. Plan Discovery Flow

```bash
# List all plans
file_find_plans.bash list

# Find specific plan
file_find_plans.bash find "issue-123"

# Analyze plan progress
file_find_plans.bash analyze "$PLAN_PATH"
```

### 2. QA Tool Execution

```bash
# Suppress output for code standards
export CI=true
bin/qa -t allCS &> /dev/null

# Show output for static analysis
export CI=true
bin/qa -t allStatic
```

### 3. Task Status Parsing

```awk
/^\[[ ✓⏳]\]/ {
    total++;
    if(/^\[✓\]/) completed++;
    else if(/^\[⏳\]/) inprogress++;
    else if(/^\[ \]/) pending++;
}
```

## Error Recovery

The command includes detailed error recovery instructions:

1. **Save Progress**: Update plan document with current status
2. **Note Blockers**: Document what prevented completion
3. **Fix Issues**: Run `export CI=true; bin/qa -t allStatic`
4. **Resume**: Re-run command to continue from last task
5. **Rollback**: Use git to revert if needed

## Workflow Integration

The command embeds default workflow standards when project-specific `PlanWorkflow.md` is missing:

- **Planning Mode**: Research without code changes
- **Execution Mode**: Sequential task completion with QA
- **Progress Tracking**: `[ ]` → `[⏳]` → `[✓]`
- **Completion**: "ALL DONE!" only when truly complete

---

*This command demonstrates sophisticated workflow management with careful mode control and quality integration, though the actual plan execution logic remains in the Claude command flow rather than the bash scripts.*