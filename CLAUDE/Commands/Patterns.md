# CC-Commands Patterns and Workflows

This document tracks standardized patterns, workflows, and conventions found across cc-commands.

## Orchestrator Pattern

### Overview
The orchestrator pattern reduces bash calls from many (8-10+) to just 1-2 by having a single bash script coordinate all operations internally.

### Implementation Examples
- **g:command:sync**: Reduced from 8 calls to 2 (analysis + execution)
- **g:command:create**: Uses 2 calls (analyze + create)

### Standard Structure
```
scripts/g/[namespace]/[command]/
├── [command]_orchestrate.bash    # Main orchestrator
├── pre/                          # Precondition checks
│   └── env_validate.bash
├── analysis/                     # Information gathering
│   ├── status_analysis.bash
│   └── change_analysis.bash
├── execute/                      # Main operations
│   └── main_operation.bash
└── post/                         # Cleanup/summary
    └── summary.bash
```

### Orchestrator Modes
- **analyze**: Gather information, validate environment
- **execute**: Perform actual operations
- **create**: Special mode for creation commands

### Key Functions
```bash
# capture_script_output function
capture_script_output() {
    local script_path="$1"
    shift
    local args="$@"
    # Captures output and parses KEY=value pairs into SCRIPT_OUTPUTS array
}
```

## Data Flow Pattern

### KEY=value Output Format
All scripts output structured data for Claude to parse:
```
CHANGES_EXIST=true
CURRENT_BRANCH=main
COMMIT_SUCCESS=false
```

### State Management
- Orchestrator stores outputs in `SCRIPT_OUTPUTS` associative array
- Claude reads these outputs to make decisions
- State passed between phases via arguments

## Error Handling Patterns

### Standard Setup
```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")"
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"
```

### Error Exit Pattern
```bash
error_exit "Environment validation failed"
# Shows error and includes "COMMAND EXECUTION MUST STOP" message
```

## Help Documentation Pattern

### LLM-Based Help
```markdown
<Task>
If the user's arguments are "--help", output the help documentation below and stop.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **command:name - Brief Description**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Documentation content]
</help>
```

### Never Use Bash for Help
Help is always provided directly by Claude, never via bash echo commands.

## User Interaction Pattern

### Non-Interactive Bash Only
```markdown
<Task>
Ask user: "Do you want to proceed? (yes/no)"
Wait for user response.
</Task>

!bash command.bash # Only after approval
```

### Confirmation Points
1. Before making changes
2. When approving bash permissions
3. For destructive operations

## Argument Parsing Pattern

### Two Modes
1. **Interactive**: No arguments provided, gather requirements
2. **Full**: All requirements provided as arguments

### Standard Parsing
```bash
# In arg_parse.bash
COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
FULL_REQUIREMENTS=$(echo "$ARGUMENTS" | cut -d' ' -f2-)
```

## Path Resolution Pattern

### COMMON_DIR Resolution
```bash
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}
```

### Path Depth Examples
- From `scripts/g/command/script.bash` → `../../../_common`
- From `scripts/g/command/sync/script.bash` → `../../../_common`
- From `scripts/g/command/sync/pre/script.bash` → `../../../../_common`

## Script Organization Patterns

### Naming Conventions
- Orchestrators: `[command]_orchestrate.bash`
- Sub-scripts: `[operation].bash` (no command prefix in subdirs)
- Include files: `[name].inc.bash`

### Script Types
1. **Orchestrators**: Coordinate operations
2. **Delegated Scripts**: Run in own process, return KEY=value
3. **Include Files**: Sourced for functions/variables

## Common Script Reuse

### Environment Validation
Most commands use:
- `_common/env/env_validate.bash`
- `_common/env/env_check_tools.bash`

### Git Operations
- `_common/git/git_state_analysis.bash`
- `_common/git/git_operations.bash`

## Progress Indicators

### Standard Messages
```bash
echo "✓ Operation complete"
echo "→ Processing files..."
echo "⚠️ Warning: Non-critical issue"
echo "🔄 Starting operation"
```

## Workflow Phases

### Standard Command Flow
1. **Analysis Phase**: Validate, gather info
2. **Planning Phase**: Show what will happen
3. **Confirmation**: Get user approval
4. **Execution Phase**: Perform operations
5. **Verification**: Check results
6. **Summary**: Report outcomes

## Documentation Discovery Pattern

### Project Structure Check
```bash
test -d CLAUDE && echo "CLAUDE_DIR=true"
test -f README.md && echo "README=true"
test -d docs && echo "DOCS_DIR=true"
```

## Temporary File Management

### Standard Pattern
```bash
setup_temp_cleanup  # From helpers.inc.bash
TEMP_FILE=$(create_temp_file "purpose")
# Use temp file
# Automatic cleanup on exit
```

## Visual Separators

### Section Dividers
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Running: script_name.bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Commit Message Patterns

### Conventional Format
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code restructuring
- `chore:` - Maintenance tasks

## Safety Patterns

### Fail-Fast Validation
```bash
# Check prerequisites first
command -v git >/dev/null 2>&1 || error_exit "Git not found"
[ -d ".git" ] || error_exit "Not a git repository"
```

### Dry-Run Support
Some commands offer preview/dry-run modes before actual execution.

## Performance Patterns

### Noise Suppression
```bash
run_with_output "noisy_command" "Error message if fails"
silent_run "command_for_exit_code_only"
```

### Command Chaining
Combine multiple operations in single bash calls to reduce subprocess overhead.

## Two-Phase Workflow Pattern

### Analysis + Execution
Some commands use two orchestrator calls:
1. **Analysis Phase**: Gather information, no changes
2. **Execution Phase**: Perform operations based on analysis

Example: g:command:sync
- First call: Analyze repository state
- Claude: Generate commit message based on changes
- Second call: Execute with commit message

### Benefits
- Claude can make intelligent decisions based on analysis
- User sees what will happen before execution
- Clean separation of read vs write operations

## Commit Message Generation Pattern

### Intelligent Messages
Claude analyzes actual changes to generate meaningful commits:
```
feat: add orchestrator pattern to reduce bash calls
fix: correct COMMON_DIR paths in moved scripts
docs: update README with new command listings
```

### Conventional Commit Format
- Type prefix (feat, fix, docs, refactor, chore)
- Clear description of what changed
- Based on actual file changes, not assumptions

## Documentation Currency Pattern

### Automatic Detection
Commands can detect when documentation is outdated:
```bash
# Compare actual files with documented lists
# Check function signatures match documentation
# Flag outdated sections
```

### Documentation Types Tracked
- README.md - command listings
- CommonScripts.md - shared script inventory
- CommonIncludes.md - function documentation

## State Management Between Phases

### Orchestrator State Storage
```bash
declare -A SCRIPT_OUTPUTS
# Stores all KEY=value outputs from sub-scripts
```

### Cross-Phase Communication
- Phase 1: Gather information, store in SCRIPT_OUTPUTS
- Claude: Read outputs, make decisions
- Phase 2: Pass decisions as arguments

## Conditional Execution Pattern

### Script-Level Conditions
```bash
if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
    capture_script_output "$SCRIPT_DIR/analysis/change_analysis.bash"
fi
```

### Benefits
- Skip unnecessary operations
- Reduce execution time
- Clear logic flow in orchestrator

## Analysis-Only Pattern

### Read and Advise
Some commands only analyze and provide instructions without executing:
- Read existing state
- Analyze requirements
- Generate instructions
- User executes manually

Example: g:command:update
- Analyzes existing command
- Provides command:create instructions
- Doesn't execute directly

### Benefits
- User maintains control
- Safe exploration
- No accidental changes

## Backup Pattern

### Timestamped Backups
Before modifications, create backups:
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH=".claude/commands/backups/${COMMAND_NAME}_${TIMESTAMP}.md"
```

### Backup Location
- Dedicated backup directory
- Timestamped filenames
- Preserves directory structure

## Command Discovery Pattern

### Dynamic Command Listing
```bash
find .claude/commands -follow -name "*.md" -type f | \
    grep -v "unwanted.md" | \
    sed 's|.claude/commands/||' | \
    sed 's|\.md$||' | \
    sed 's|/|:|g' | \
    sort
```

### Benefits
- Shows available commands
- Helps users discover functionality
- Filters system commands

## Enhancement Mode Pattern

### Update Modes
1. **REFRESH**: Update to latest standards only
2. **ENHANCE**: Add new features while updating

### Mode Detection
```bash
if [ additional requirements provided ]; then
    UPDATE_MODE=ENHANCE
else
    UPDATE_MODE=REFRESH
fi
```

## Self-Contained Output Pattern

### Complete Instructions
Generated commands must be:
- Fully self-contained
- No placeholders
- No context required
- Ready to copy and run

### Example
Instead of: `command [name] "[requirements]"`
Generate: `command test:integration "Run integration tests with MySQL..."`

## Three-Phase Orchestration Pattern

### Beyond Two-Phase
Some complex commands use three phases:
1. **Analyze**: Gather information
2. **Execute**: Perform main operation
3. **Commit**: Post-operation tasks

Example: g:gh:issue:plan
- Analyze: Fetch issue data
- Execute: Create plan file
- Commit: Git commit + GitHub comment

### Benefits
- More granular control
- Optional post-operations
- Clean separation of concerns

## External API Integration Pattern

### GitHub API via CLI
```bash
# Fetch issue data
gh issue view "$ISSUE_NUM" --json body,title,labels

# Post comment
gh issue comment "$ISSUE_NUM" --body "$COMMENT"
```

### Data Storage
- Save API responses to temp files
- Parse JSON with jq
- Pass file paths in KEY=value outputs

## Interactive Selection Pattern

### Numbered List Selection
```bash
# List items with numbers
gh issue list --limit 10 | nl -w2 -s". "

# Show prompt
echo "Enter issue number (or 'q' to quit):"
```

### Benefits
- User-friendly selection
- Works without fzf/dialog
- Clear visual presentation

## Document Discovery Pattern

### Searching for Project Standards
```bash
# Check for specific workflow docs
if [[ -f "CLAUDE/PlanWorkflow.md" ]]; then
    echo "WORKFLOW_DOC=CLAUDE/PlanWorkflow.md"
fi

# Search for relevant docs
find CLAUDE docs -name "*.md" -type f
```

### Precedence Rules
1. Specific workflow docs (PlanWorkflow.md)
2. General project docs (CLAUDE/)
3. Default patterns

## Bug-Specific Workflow Pattern

### Test-Driven Bug Fixes
When bug detected:
1. Form hypothesis about cause
2. First task: Write failing test
3. Verify test reproduces bug
4. Implement fix
5. Verify test passes

### Bug Detection
```bash
# Check labels and title
if [[ "$ISSUE_LABELS" =~ "bug" ]] || [[ "$ISSUE_TITLE" =~ (bug|fix|error) ]]; then
    echo "BUG_MODE=true"
fi
```

## Multi-Step Confirmation Pattern

### Sequential Decisions
Instead of one big confirmation:
1. Confirm plan creation
2. Ask about commit/comment
3. Ask about execution

### Benefits
- User maintains control
- Can skip optional steps
- Clear decision points

## Temporary File Management Pattern

### Structured Temp Files
```bash
ISSUE_BODY_FILE=$(create_temp_file "issue_body")
ISSUE_COMMENTS_FILE=$(create_temp_file "issue_comments")

# Save API data
gh issue view --json body | jq -r '.body' > "$ISSUE_BODY_FILE"
```

### Cleanup
- Automatic via trap
- Named for debugging
- Passed via file paths