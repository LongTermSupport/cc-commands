# Common Scripts Documentation

This directory contains shared bash scripts that provide reusable functionality for Claude Code commands.

## Directory Organization

```
_common/
├── env/          # Environment validation and checking
├── git/          # Git operations and utilities
├── file/         # File discovery and manipulation
├── gh/           # GitHub CLI wrappers
├── arg/          # Argument parsing utilities
└── error/        # Error handling utilities
```

## Naming Convention

All common scripts follow the pattern: `{category}_{operation}.bash`

Examples:
- `env_validate.bash` - Environment validation
- `git_operations.bash` - Git operations
- `file_find_plans.bash` - Find plan files
- `gh_issue_ops.bash` - GitHub issue operations

## Script Categories

### Environment Scripts (`env/`)

Scripts for validating the execution environment.

#### `env_validate.bash`
Comprehensive environment validation with minimal output.

```bash
# Usage
source env_validate.bash
validate_git_environment    # Check git repo and tools
validate_github_auth       # Check GitHub authentication
validate_claude_structure  # Check CLAUDE directory structure
```

#### `env_check_tools.bash`
Check for required command-line tools.

```bash
# Usage
bash env_check_tools.bash git gh jq
# Output: TOOLS_AVAILABLE=true or exits with error
```

### Git Scripts (`git/`)

Git operations with structured output.

#### `git_status.bash`
Get git repository status information.

```bash
# Usage
bash git_status.bash
# Output:
# BRANCH=main
# CHANGES_EXIST=true
# CHANGES_COUNT=5
```

#### `git_operations.bash`
Common git operations.

```bash
# Usage
source git_operations.bash
git_safe_commit "commit message"
git_push_with_checks
```

### File Scripts (`file/`)

File discovery and manipulation utilities.

#### `file_find_plans.bash`
Locate and analyze plan files (case-insensitive search).

```bash
# Usage
bash file_find_plans.bash list              # List all plans
bash file_find_plans.bash find "issue-123"  # Find specific plan (case-insensitive)
bash file_find_plans.bash analyze "plan.md" # Analyze plan progress
```

#### `file_safe_write.bash`
Safely write files with backup.

```bash
# Usage
bash file_safe_write.bash "path/to/file" "content"
# Creates backup and writes atomically
```

### GitHub Scripts (`gh/`)

GitHub CLI operation wrappers.

#### `gh_issue_ops.bash`
GitHub issue operations.

```bash
# Usage
bash gh_issue_ops.bash fetch 123        # Fetch issue details
bash gh_issue_ops.bash create-plan 123  # Create plan from issue
```

#### `gh_workflow_monitor.bash`
Monitor GitHub Actions workflows.

```bash
# Usage
bash gh_workflow_monitor.bash check-commit abc123
bash gh_workflow_monitor.bash watch-latest
```

### Argument Scripts (`arg/`)

Argument parsing utilities.

#### `arg_parse_standard.bash`
Standard argument parsing for commands.

```bash
# Usage
source arg_parse_standard.bash "$@"
# Sets: HELP_REQUESTED, VERBOSE, ARGS array
```

#### `arg_validate.bash`
Validate and parse specific argument patterns.

```bash
# Usage
bash arg_validate.bash command "arg1 arg2"
# Output: COMMAND=arg1, OPTIONS=arg2
```

### Error Scripts (`error/`)

Error handling utilities.

#### `error_handlers.bash`
Standard error handling functions with noise suppression.

```bash
# Usage
source error_handlers.bash

# Basic error handling
error_exit "Something went wrong"
warn "This might be a problem"
debug "Only shows if VERBOSE=true"

# Noise suppression - output only on failure
run_with_output "git fetch --all --prune" "Failed to fetch remotes"
run_with_output "npm install" "Failed to install dependencies"

# Silent execution - no output on success
silent_run "git status --porcelain"
```

**Noise Suppression Features:**
- `run_with_output`: Captures command output to temp file, only displays on failure
- `silent_run`: Completely silent on success, shows output on failure
- Debug output controlled by `VERBOSE` environment variable
- Automatic temp file cleanup

## Usage Patterns

### 1. Standard Setup

All scripts MUST define the common directory path:

```bash
#!/usr/bin/env bash
# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"  # Adjust depth as needed
```

### 2. Sourcing vs Executing

**Source** when you need functions in current shell:
```bash
source "$COMMON_DIR/env/env_validate.bash"
validate_git_environment
```

**Execute** when you need structured output:
```bash
RESULT=$(bash "$COMMON_DIR/git/git_status.bash")
eval "$RESULT"  # Sets BRANCH, CHANGES_EXIST, etc.
```

### 3. Combining Scripts

Scripts are designed to work together:

```bash
#!/usr/bin/env bash
# Command script combining multiple common scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/_common"

# Load error handlers first
source "$COMMON_DIR/error/error_handlers.bash"

# Validate environment (minimize output noise)
bash "$COMMON_DIR/env/env_check_tools.bash" git gh >/dev/null 2>&1 || error_exit "Missing tools"

# Get git status
eval "$(bash "$COMMON_DIR/git/git_status.bash")"

if [ "$CHANGES_EXIST" = "true" ]; then
    echo "CHANGES_FOUND=true"
    debug "Found $CHANGES_COUNT changes"  # Only shown if VERBOSE=true
fi
```

### 3. Error Propagation

Common scripts propagate errors appropriately:

```bash
# Scripts exit on error
bash "$SCRIPT_DIR/_common/git/operations.sh" commit || {
    echo "ERROR: Commit failed"
    exit 1
}

# Or use error handlers
source "$SCRIPT_DIR/_common/error/handlers.sh"
bash "$SCRIPT_DIR/_common/git/operations.sh" commit || error_exit "Commit failed"
```

## Adding New Common Scripts

When adding new common scripts:

1. **Check existing scripts** - Avoid duplication
2. **Follow naming conventions** - Use descriptive names with hyphens
3. **Document in this file** - Add to appropriate section
4. **Include usage examples** - Show how to use the script
5. **Make it composable** - Design to work with other scripts
6. **Output format** - Use KEY=value for Claude Code parsing
7. **Error handling** - Follow project standards
8. **Test independently** - Ensure script works standalone

## Common Functions Reference

### Frequently Used Functions

```bash
# From env/validate.sh
validate_git_environment()     # Complete git env check
check_git_repository()         # Just check for .git
check_tool_available()         # Check if command exists

# From git/operations.sh  
git_get_current_branch()       # Get branch name
git_check_changes()            # Check for uncommitted changes
git_safe_commit()              # Commit with validation

# From file/find-plans.sh
find_plan_directory()          # Locate CLAUDE/plan directory
list_recent_plans()            # List plans by modification time

# From error/handlers.sh
error_exit()                   # Exit with error message
warn()                         # Show warning but continue
debug()                        # Show debug info if VERBOSE=true
```

## Testing Common Scripts

Test scripts before using in commands:

```bash
# Test error conditions
bash _common/env/validate.sh
echo "Exit code: $?"

# Test with arguments
bash _common/arg/parse-standard.sh --help --verbose arg1 arg2

# Test output parsing
eval "$(bash _common/git/status.sh)"
echo "Branch: $BRANCH"
```

## Best Practices

1. **Single Responsibility** - Each script does one thing well
2. **Clear Output** - Use structured KEY=value format
3. **Exit Codes** - 0 for success, non-zero for failure
4. **No Side Effects** - Scripts shouldn't modify state unless that's their purpose
5. **Idempotent** - Running twice should be safe
6. **Well Documented** - Include usage in script header
7. **Handle Edge Cases** - Empty results, missing files, etc.
8. **Validate Inputs** - Check arguments before using
9. **Consistent Style** - Follow project coding standards
10. **Composable Design** - Work well with other scripts