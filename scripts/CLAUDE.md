# Claude Code Command Scripts Standards

This directory contains bash scripts used by Claude Code commands to ensure consistent, reliable, and maintainable command execution.

## Directory Structure

```
scripts/
├── CLAUDE.md                 # This file - coding standards and documentation
├── _common/                  # Shared scripts used by multiple commands
│   ├── CLAUDE.md            # Common scripts documentation
│   ├── env/                 # Environment validation scripts
│   ├── git/                 # Git operations scripts
│   ├── file/                # File discovery and manipulation
│   ├── gh/                  # GitHub CLI operations
│   └── arg/                 # Argument parsing utilities
├── g/                       # Scripts for 'g:' namespace commands
│   └── gh/                  # Scripts for 'g:gh:' commands
└── [other-namespaces]/      # Additional namespace-specific scripts
```

## Coding Standards

### 1. File Naming Convention

Scripts MUST follow this naming pattern:
- **Command scripts**: `{command}_{step_name}.bash`
  - Example: `push_workflow_monitor.bash`, `create_req_check.bash`
- **Common scripts**: `{function_group}_{operation}.bash`
  - Example: `env_validate.bash`, `git_operations.bash`

### 2. Script Header

Every script MUST begin with:

```bash
#!/usr/bin/env bash
# Script: [script-name].bash
# Purpose: [Brief description]
# Usage: [script-name].bash [arguments]
# Output: [Description of output format]

set -euo pipefail
IFS=$'\n\t'
```

### 3. Common Directory Reference

All scripts MUST define the path to _common directory at the start:

```bash
# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"  # Adjust path depth as needed

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"
```

### 4. Output Noise Reduction

Scripts MUST minimize context bloat using the capture-on-failure pattern:

```bash
# Pattern 1: Capture output, show only on failure
run_with_output() {
    local cmd="$1"
    local error_msg="${2:-Command failed}"
    local output_file=$(mktemp)
    
    if eval "$cmd" > "$output_file" 2>&1; then
        rm -f "$output_file"
        return 0
    else
        local exit_code=$?
        echo "ERROR: $error_msg" >&2
        echo "Command output:" >&2
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# Usage:
run_with_output "git fetch --all --prune" "Failed to fetch from remotes"

# Pattern 2: Inline capture with error handling
{
    git fetch --all --prune
} 2>&1 | {
    output=$(cat)
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "ERROR: Git fetch failed" >&2
        echo "$output" >&2
        exit 1
    fi
}

# Pattern 3: Simple redirection for non-critical commands
command -v tool >/dev/null 2>&1 && echo "TOOL_AVAILABLE=true"

# Always output structured data that Claude needs
echo "FETCH_RESULT=success"

# Use debug() for optional verbose output
debug "Fetched from 3 remotes"  # Only shows if VERBOSE=true
```

### 5. Error Handling

All scripts MUST operate in strict error mode:

```bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'        # Safe Internal Field Separator
```

### 6. Error Messages

When errors occur:

```bash
error_exit() {
    echo "ERROR: $1" >&2
    echo "================== COMMAND EXECUTION MUST STOP ==================" >&2
    echo "An unexpected error has occurred. Claude Code should not continue." >&2
    echo "================================================================" >&2
    exit 1
}

# Usage
command || error_exit "Failed to execute command: $?"
```

### 7. Progress Output

Scripts MUST output useful information as they execute:

```bash
echo "✓ Environment validation complete"
echo "→ Processing 5 files..."
echo "⚠ Warning: No plan directory found, using default"
```

### 8. Structured Output

When outputting data for Claude Code to parse, use KEY=value format:

```bash
echo "GIT_REPO=true"
echo "BRANCH=main"
echo "CHANGES_COUNT=5"
```

### 9. Non-Interactive

Scripts MUST NEVER prompt for user input:

```bash
# WRONG
read -p "Continue? (y/n) " answer

# RIGHT
# Accept all inputs as arguments or use defaults
CONTINUE="${1:-yes}"
```

### 10. Success Indication

All scripts MUST end with a success message:

```bash
# At the end of script
echo "Script success: ${0##*/}"
exit 0
```

### 11. Argument Handling

Use clear argument parsing:

```bash
# Simple positional arguments
ACTION="${1:-}"
TARGET="${2:-}"

# Validate required arguments
if [ -z "$ACTION" ]; then
    echo "ERROR: Missing required argument: action" >&2
    echo "Usage: $0 <action> [target]" >&2
    exit 1
fi
```

### 12. Temporary Files

Always clean up temporary files:

```bash
TEMP_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE"' EXIT

# Use temp file
echo "data" > "$TEMP_FILE"
```

### 13. Function Naming

Use descriptive function names with underscore separation:

```bash
validate_git_repository() {
    test -d .git || return 1
}

check_github_auth() {
    gh auth status >/dev/null 2>&1
}
```

## Common Script Patterns

### Environment Validation

```bash
#!/bin/bash
# Check for required tools and environment

source "$(dirname "$0")/../_common/env/base-checks.sh"

validate_environment() {
    check_git_repository || error_exit "Not in a git repository"
    check_tool_available "gh" || error_exit "GitHub CLI not installed"
    check_github_auth || error_exit "Not authenticated with GitHub"
}
```

### Composable Scripts

Scripts should be designed to work together:

```bash
#!/usr/bin/env bash
# Main command script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../_common"

# Load common scripts
source "$COMMON_DIR/env/env_validate.bash"
source "$COMMON_DIR/git/git_operations.bash"

# Validate environment first
validate_git_environment

# Perform git operations
git_get_current_branch
git_check_changes

echo "Script success: ${0##*/}"
```

## Code Quality

### ShellCheck Compliance

All scripts MUST pass shellcheck with no warnings:

```bash
# Check individual script
shellcheck .claude/cc-commands/scripts/_common/env/env_validate.bash

# Check all scripts
find .claude/cc-commands/scripts -name "*.bash" -type f -exec shellcheck {} \;
```

Common shellcheck directives when needed:
```bash
# Disable specific warning with justification
# shellcheck disable=SC2154  # Variable is set by sourcing parent
```

## Testing Scripts

Scripts don't need executable permissions since they're called via `!bash` in commands.

Before integrating into commands:

```bash
# Test script directly
bash .claude/cc-commands/scripts/g/command/create_req_check.bash arg1 arg2

# Test with error conditions
bash .claude/cc-commands/scripts/_common/env/env_validate.bash

# Check exit codes
echo $?

# Run shellcheck
shellcheck .claude/cc-commands/scripts/_common/env/env_validate.bash
```

## Integration with Commands

In Claude Code command files:

```markdown
!bash .claude/cc-commands/scripts/g/command/command_process.bash "$ARGUMENTS"
```

Or for multiple operations:

```markdown
!bash .claude/cc-commands/scripts/_common/env/env_validate.bash all
!bash .claude/cc-commands/scripts/g/command/command_execute.bash "$REQUIREMENTS"
```

## Best Practices

### Core Principles

1. **Keep scripts focused** - Each script should do one thing well
2. **Use common scripts** - Don't duplicate functionality
3. **Document outputs** - Make it clear what Claude Code will receive
4. **Handle edge cases** - Empty results, missing files, etc.
5. **Fail fast** - Exit immediately on unexpected conditions
6. **Use meaningful exit codes** - 0 for success, 1-255 for various failures
7. **Quote variables** - Always quote to handle spaces and special characters
8. **Check command success** - Use `||` and `&&` appropriately
9. **Make scripts idempotent** - Running twice should be safe

### Evolved Practices

10. **Granular Functions** - Break complex operations into small, reusable scripts
11. **Progressive Disclosure** - Offer summary/detailed modes to reduce noise
12. **Smart Defaults** - Provide intelligent behavior while allowing overrides
13. **Contextual Errors** - Always include actionable solutions in error messages
14. **Composable Design** - Scripts should naturally chain together
15. **Structured Multi-line Output** - Use heredoc pattern for complex data

### Output Design Patterns

```bash
# Mode-based verbosity
MODE="${1:-summary}"
if [ "$MODE" = "detailed" ]; then
    # Include extra information
fi

# Multi-line with delimiter
echo "CONTENT<<EOF"
cat file.txt
echo "EOF"

# Indexed lists
echo "COUNT=3"
for i in {0..2}; do
    echo "ITEM_${i}=value${i}"
done
```

### Performance Patterns

```bash
# Cache expensive operations
if [ -z "${CACHED_RESULT:-}" ]; then
    CACHED_RESULT=$(expensive_operation)
fi
echo "$CACHED_RESULT"

# Batch operations
{
    operation1
    operation2  
    operation3
} > output.txt 2>&1
```

## Noise Suppression Best Practices

### Using run_with_output

```bash
# Good: Noisy commands wrapped with error context
run_with_output "npm install" "Failed to install dependencies"
run_with_output "composer install" "Failed to install PHP dependencies"
run_with_output "git submodule update --init --recursive" "Failed to update submodules"

# The output is only shown if the command fails
```

### Using silent_run

```bash
# Good: Commands where you only care about the exit code
if silent_run "git diff --quiet"; then
    echo "NO_CHANGES=true"
else
    echo "CHANGES_EXIST=true"
fi
```

### Combining with structured output

```bash
# Validate environment with minimal noise
info "Checking environment..."

# Run checks silently, output only results
silent_run "which git" && echo "GIT_AVAILABLE=true" || echo "GIT_AVAILABLE=false"
silent_run "which gh" && echo "GH_AVAILABLE=true" || echo "GH_AVAILABLE=false"

# More complex validation with error details on failure
if run_with_output "gh auth status" "GitHub CLI not authenticated"; then
    echo "GH_AUTH=true"
else
    echo "GH_AUTH=false"
fi
```

## Example Complete Script

```bash
#!/usr/bin/env bash
# Script: plan_validate_and_process.bash
# Purpose: Validate environment and process plan files
# Usage: plan_validate_and_process.bash [plan-name]
# Output: Structured data about plan status

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"
source "$COMMON_DIR/env/env_validate.bash"

# Arguments
PLAN_NAME="${1:-}"

# Validate environment with noise suppression
info "Validating environment..."
if run_with_output "validate_git_environment" "Environment validation failed"; then
    echo "ENVIRONMENT_VALID=true"
else
    exit 1
fi

# Check for plan directory quietly
if silent_run "test -d CLAUDE/plan"; then
    echo "PLAN_DIR_EXISTS=true"
else
    echo "PLAN_DIR_EXISTS=false"
fi

# Process plan
if [ -n "$PLAN_NAME" ]; then
    debug "Processing plan: $PLAN_NAME"
    # Plan processing logic here
    echo "PLAN_STATUS=processed"
    echo "PLAN_NAME=$PLAN_NAME"
else
    echo "PLAN_STATUS=none"
    debug "No plan name provided"
fi

echo "Script success: ${0##*/}"
exit 0
```