# Claude Code Command Scripts Standards

This directory contains bash scripts used by Claude Code commands to ensure consistent, reliable, and maintainable command execution.

## Directory Structure

```
cc-commands/
├── var/                      # Temporary files directory (gitignored except .gitignore)
├── scripts/
│   ├── CLAUDE.md            # This file - coding standards and documentation
│   ├── _common/             # Shared DELEGATED scripts (run in own process)
│   │   ├── CLAUDE.md        # Common scripts documentation
│   │   ├── _inc/            # SOURCED includes (run in caller's context)
│   │   │   ├── CLAUDE.md    # Include documentation  
│   │   │   ├── helpers.inc.bash  # Safe sourcing helpers
│   │   │   └── error_handler.inc.bash  # Error handling functions
│   │   ├── env/             # Environment validation scripts
│   │   ├── git/             # Git operations scripts
│   │   ├── file/            # File discovery scripts
│   │   └── gh/              # GitHub CLI scripts
│   ├── g/                   # Scripts for 'g:' namespace commands
│   │   └── gh/              # Scripts for 'g:gh:' commands
│   └── [other-namespaces]/  # Additional namespace-specific scripts
└── export/commands/         # Exported command files
```

### Temporary Files Convention

**All temporary files MUST use the `var/` directory:**
- `var/` contains a `.gitignore` that ignores everything except itself (gitkeep pattern)
- Temporary scripts, logs, backups should be created in `var/`
- Clean up temporary files when operations complete
- Example: `var/fix_script.bash`, `var/backup_data.txt`

## Include vs Delegate Pattern

### 🚨 CRITICAL EXECUTION RULES 🚨

1. **_inc files are ONLY sourced, NEVER executed**
   ```bash
   # ✅ CORRECT
   source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"
   
   # ❌ WRONG - NEVER DO THIS
   bash "$SCRIPT_DIR/../_inc/error_handler.inc.bash"
   ```

2. **_common files are ONLY executed, NEVER sourced**
   ```bash
   # ✅ CORRECT
   bash "$COMMON_DIR/git/status_analysis.bash"
   
   # ❌ WRONG - NEVER DO THIS
   source "$COMMON_DIR/git/status_analysis.bash"
   ```

**CI ENFORCED**: The CI script will fail if these rules are violated!

### Sourced Includes (`_inc/` directory)
Scripts that are **sourced** run in the calling script's context and can:
- Access and modify caller's variables
- Exit the calling script
- Define functions for the caller to use
- Share state with the caller

**IMPORTANT**: Include files must NOT set shell options (set -e, etc) or modify IFS!

```bash
# Source an include file (adjust path based on script location)
source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"
# Now use its functions directly
error_exit "Something went wrong"  # This will exit the calling script
```

### Delegated Scripts (`_common/` and other directories)
Scripts that are **executed** run in their own process and:
- Have isolated variable scope
- Communicate via stdout (KEY=value format)
- Exit only themselves, not the caller
- Perform specific, contained operations

```bash
# Execute a delegated script
bash "$COMMON_DIR/git/status_analysis.bash"
# Read its output
# BRANCH=main
# CHANGES_EXIST=true
```

## Coding Standards

### 1. File Naming Convention

Scripts MUST follow this naming pattern:
- **Command scripts**: `{command}_{step_name}.bash`
  - Example: `push_workflow_monitor.bash`, `create_req_check.bash`
- **Common scripts**: `{function_group}_{operation}.bash`
  - Example: `env_validate.bash`, `git_operations.bash`

**File Permissions**: All `.bash` scripts MUST be executable:
```bash
chmod +x script_name.bash
```

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

### 3. Script Directory References - CRITICAL PATTERN

All scripts MUST use realpath and safe_source for robust path resolution:

```bash
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation
```

**Why this pattern is required:**
- `realpath` eliminates manual relative path calculation errors
- `safe_source` function provides fail-fast validation before sourcing
- Both COMMON_DIR and include files are validated before use
- Makes debugging much easier with absolute paths in error messages

**Path Examples**:
- From `scripts/g/command/script.bash` → `../../../_common`
- From `scripts/g/command/sync/sub/script.bash` → `../../../../_common`
- From `scripts/g/gh/issue/plan/pre/script.bash` → `../../../../../_common`

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

### 6. Error Messages - Critical Stop Pattern

When errors occur that require immediate termination, use the **COMMAND EXECUTION MUST STOP** pattern. This provides clear, unmistakable signals to both users and Claude that execution cannot continue:

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

**Why This Pattern Works:**
- The bordered message with equals signs creates visual separation
- "COMMAND EXECUTION MUST STOP" is unambiguous
- Clear instruction that "Claude Code should not continue"
- Helps Claude understand this is a terminal error, not a warning

**Use This Pattern For:**
- Missing required files or directories
- Failed authentication
- Missing prerequisites
- Critical validation failures
- Any error that makes continuing dangerous or impossible

**Example Usage:**
```bash
# Check critical prerequisites
if [ ! -d ".git" ]; then
    error_exit "Not in a git repository - cannot proceed with git operations"
fi

# Validate required tools
if ! command -v gh &> /dev/null; then
    error_exit "GitHub CLI (gh) is required but not installed"
fi

# Handle operation failures
if ! git push origin main; then
    error_exit "Failed to push to remote repository"
fi
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

**IMPORTANT**: These outputs are for Claude Code (the LLM) to read and understand, not for other bash scripts to parse. Claude Code will read these values and use them in subsequent Task blocks or decisions.

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
#!/usr/bin/env bash
# Check for required tools and environment

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"

# Execute common validation scripts
bash "$SCRIPT_DIR/../_common/env/env_validate.bash" all || error_exit "Environment validation failed"
bash "$SCRIPT_DIR/../_common/env/env_check_tools.bash" git gh || error_exit "Required tools missing"
```

### Orchestrator Pattern Example

For complex commands, use an orchestrator to coordinate multiple operations:

```bash
#!/usr/bin/env bash
# Script: sync_orchestrate.bash
# Purpose: Orchestrate complete sync workflow
# Usage: sync_orchestrate.bash [mode]
# Output: Structured output with execution results

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture and parse script outputs
capture_script_output() {
    local script_path="$1"
    shift
    local args="$@"
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" $args > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                SCRIPT_OUTPUTS["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
            fi
        done < "$temp_file"
    else
        local exit_code=$?
        cat "$temp_file" >&2
        rm -f "$temp_file"
        return $exit_code
    fi
    
    rm -f "$temp_file"
    echo ""
}

# Main orchestration logic
MODE="${1:-analyze}"

case "$MODE" in
    analyze)
        capture_script_output "$SCRIPT_DIR/pre/env_validate.bash" || error_exit "Environment validation failed"
        capture_script_output "$SCRIPT_DIR/analysis/status_analysis.bash" || error_exit "Status analysis failed"
        echo "ANALYSIS_COMPLETE=true"
        ;;
    execute)
        # Execute based on previous analysis
        if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
            capture_script_output "$SCRIPT_DIR/git/commit_execute.bash" "${2:-}" || error_exit "Commit failed"
        fi
        capture_script_output "$SCRIPT_DIR/git/push_execute.bash" || error_exit "Push failed"
        echo "EXECUTION_COMPLETE=true"
        ;;
esac

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

### KEY=value Output Pattern

**CRITICAL**: Scripts output `KEY=value` pairs that Claude Code reads directly. Do NOT parse these in bash - they're for the LLM.

```markdown
# In command file:
!bash .claude/cc-commands/scripts/_common/git/git_state_analysis.bash summary

# Script outputs:
# CHANGES_EXIST=true
# PUSH_NEEDED=false
# BRANCH=main

<Task>
Based on the output above, I can see that CHANGES_EXIST is true, so we need to commit.
</Task>

# Then use values in subsequent bash calls:
!bash .claude/cc-commands/scripts/g/gh/push_decision.bash "$CHANGES_EXIST" "$PUSH_NEEDED"
```

**WRONG**: Trying to parse output in bash
```bash
# DON'T DO THIS:
CHANGES=$(bash script.bash | grep "CHANGES_EXIST" | cut -d= -f2)
```

**RIGHT**: Let Claude Code read the output
```bash
# DO THIS:
bash script.bash  # Claude Code reads the KEY=value output
```

### Help Documentation Pattern

**CRITICAL**: Help documentation is ALWAYS provided by Claude Code (the LLM), never by bash scripts.

```markdown
<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **COMMAND NAME - Brief Description**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Help content here...]
</help>
```

**BEST PRACTICE**: Claude Code checks `$ARGUMENTS` directly
```markdown
# No bash needed - LLM checks arguments directly:
<Task>
If the user's arguments are "--help", provide help and stop.
</Task>
```

**ACCEPTABLE**: For complex argument parsing
```bash
# Only use bash when parsing complex arguments:
!echo "=== ARGUMENT PARSING ==="; \
if [ "$ARGUMENTS" = "--help" ]; then \
  echo "HELP_REQUESTED=true"; \
  exit 0; \
fi; \
# Parse other complex arguments...
echo "MODE=$MODE"
echo "TARGET=$TARGET"
```

**WRONG**: Using bash just to check help
```bash
# DON'T DO THIS - unnecessary bash call:
!bash check_help.bash "$ARGUMENTS"
```

**WRONG**: Outputting help text from bash
```bash
# DON'T DO THIS - help should come from LLM:
if [ "$ARGUMENTS" = "--help" ]; then
  echo "Usage: command [options]"
  echo "Options:"
  # ... lots of echo statements
fi
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

## Orchestrator Pattern

For commands with multiple operations, use the orchestrator pattern to minimize bash calls. See [/CLAUDE/CommandStructure.md](/CLAUDE/CommandStructure.md) for the complete guide.

### Quick Example
Instead of multiple bash calls in a command:
```markdown
!bash validate.bash
!bash analyze.bash  
!bash commit.bash
!bash push.bash
```

Use a single orchestrator:
```markdown
!bash sync_orchestrate.bash
```

The orchestrator handles all operations internally, reducing user approval prompts from 4 to 1.

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

# Source error handler from _inc
source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"

# Arguments
PLAN_NAME="${1:-}"

# Validate environment with noise suppression
info "Validating environment..."
if run_with_output "bash $SCRIPT_DIR/../_common/env/env_validate.bash all" "Environment validation failed"; then
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

## Migration Notes

### Old Patterns → New Patterns

1. **Error Handling**
   - Old: `source "$COMMON_DIR/error/error_handlers.bash"`
   - New: `source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"`

2. **Git Status**
   - Old: `git_status.bash`
   - New: `git_state_analysis.bash`

3. **Multiple Bash Calls**
   - Old: Multiple individual script calls in commands
   - New: Single orchestrator script that coordinates operations

For detailed migration guidance, see the Conversion Guide section in [/CLAUDE/CommandStructure.md](/CLAUDE/CommandStructure.md).