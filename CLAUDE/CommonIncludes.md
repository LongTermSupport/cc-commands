# Common Includes Reference (_inc)

This document provides a comprehensive reference of all include files in the `scripts/_common/_inc/` directory. These files contain functions meant to be sourced (included) into other scripts, not executed directly.

Last Updated: 2025-07-22

## Table of Contents

- [Overview](#overview)
- [Include Files](#include-files)
  - [error_handler.inc.bash](#error_handlerincbash)
  - [helpers.inc.bash](#helpersincbash)
- [Usage Guidelines](#usage-guidelines)
- [Best Practices](#best-practices)

## Overview

Include files provide:
- **Shared functions** - Used across multiple scripts
- **Error handling** - Consistent error management
- **Utility functions** - Common operations and validations
- **Message functions** - Standardized output formatting
- **Temp file management** - Safe temporary file handling

## Include Files

### error_handler.inc.bash

Critical error handling functions for script reliability.

**Purpose**: Provides standardized error handling with clear stop patterns for Claude Code.

**Usage**:
```bash
# Source after setting shell options
set -euo pipefail
source "$COMMON_DIR/_inc/error_handler.inc.bash"
```

**Functions**:

#### error_exit()
Stops all execution with clear visual indicators for Claude Code.

**Usage**: `error_exit "Error message"`

**Parameters**:
- `$1` - Error message (optional, defaults to "Unknown error occurred")

**Behavior**:
- Outputs error message to stderr
- Displays bordered "COMMAND EXECUTION MUST STOP" message
- Exits with status 1
- Provides clear signal to Claude Code that execution cannot continue

**Example**:
```bash
error_exit "Git repository not found"
# Output:
# ERROR: Git repository not found
# ================== COMMAND EXECUTION MUST STOP ==================
# An unexpected error has occurred. Claude Code should not continue.
# ================================================================
```

#### run_with_output()
Executes commands with noise suppression - only shows output on failure.

**Usage**: `run_with_output "command" "Error message on failure"`

**Parameters**:
- `$1` - Command to execute
- `$2` - Error message to show on failure (optional, defaults to "Command failed")

**Behavior**:
- Captures all command output to temporary file
- On success: Silent (no output), returns 0
- On failure: Shows error message and command output, returns command's exit code
- Automatically cleans up temporary files

**Example**:
```bash
run_with_output "npm install" "Failed to install dependencies"
# Silent on success, shows full output only if npm install fails
```

#### silent_run()
Suppresses all output unless DEBUG is set.

**Usage**: `silent_run "command"`

**Parameters**:
- `$1` - Command to execute

**Behavior**:
- Suppresses stdout and stderr unless DEBUG environment variable is set
- Useful for commands where you only care about exit code
- Returns the command's exit code

**Example**:
```bash
if silent_run "git diff --quiet"; then
    echo "No changes"
else
    echo "Changes detected"
fi
```

### helpers.inc.bash

Comprehensive helper functions for common operations.

**Purpose**: Provides utility functions for validation, messaging, temp files, and orchestration.

**Usage**:
```bash
# Source after setting shell options  
set -euo pipefail
source "$COMMON_DIR/_inc/helpers.inc.bash"
```

**Functions**:

#### safe_source()
Safely source include files with validation.

**Usage**: `safe_source "filename.inc.bash"`

**Parameters**:
- `$1` - Include filename (not full path, just filename)

**Requirements**:
- `COMMON_DIR` must be set and point to valid `scripts/_common/` directory

**Behavior**:
- Validates COMMON_DIR is set and contains _inc directory
- Checks that target include file exists
- Sources the file with proper error handling
- Provides clear error messages if validation fails

**Example**:
```bash
COMMON_DIR="$SCRIPT_DIR/../../../_common"
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"
```

#### get_var_path()
Gets the cc-commands var directory path from any script location.

**Usage**: `VAR_PATH=$(get_var_path)`

**Returns**: Absolute path to cc-commands/var directory

**Requirements**:
- `COMMON_DIR` must be set and valid

**Behavior**:
- Calculates var directory path relative to COMMON_DIR
- Validates that var directory exists
- Returns absolute path for consistent temp file locations

**Example**:
```bash
VAR_PATH=$(get_var_path)
echo "Temp files will be created in: $VAR_PATH"
```

#### Message Functions

Standard messaging functions with consistent formatting.

**warn()** - Warning message (continues execution)
```bash
warn "This might be a problem"
# Output: ⚠️  WARNING: This might be a problem
```

**info()** - Informational output
```bash
info "Processing files..."
# Output: ℹ️  Processing files...
```

**success()** - Success message
```bash
success "Operation completed"
# Output: ✓ Operation completed  
```

**debug()** - Debug message (only shows if DEBUG environment variable is set)
```bash
debug "Internal state: $variable"
# Output: [DEBUG] Internal state: value (only if DEBUG is set)
```

#### Validation Functions

Functions to check prerequisites and validate inputs.

**require_command()** - Check if command exists
```bash
require_command "git" "Git is required but not installed"
# Exits with error if git command not found
```

**require_directory()** - Check if directory exists  
```bash
require_directory "/path/to/dir" "Custom error message"
# Exits with error if directory doesn't exist
```

**require_file()** - Check if file exists
```bash  
require_file "/path/to/file" "Custom error message"
# Exits with error if file doesn't exist
```

**require_arg()** - Check if required argument is provided
```bash
require_arg "$1" "command name"
# Exits with error if $1 is empty
```

**require_git_repo()** - Validate git repository
```bash
require_git_repo "This script must be run in a git repository"
# Exits with error if not in git repository
```

#### Temp File Management

Safe temporary file handling using the var/ directory.

**create_temp_file()** - Create tracked temporary file
```bash
temp_file=$(create_temp_file "operation_name")
echo "data" > "$temp_file"
# File created in cc-commands/var/ with unique name
# Automatically tracked for cleanup
```

**cleanup_temp_file()** - Clean up specific temp file
```bash
cleanup_temp_file "$temp_file"
# Removes file and removes from tracking
```

**cleanup_temp_files()** - Clean up all tracked temp files
```bash
cleanup_temp_files
# Usually called in EXIT trap
```

**setup_temp_cleanup()** - Set up automatic temp file cleanup
```bash
setup_temp_cleanup
# Sets up trap to clean temp files on script exit
```

#### Orchestrator Functions

Functions for coordinating multiple script operations.

**capture_script_output()** - Capture and parse script outputs
```bash
declare -A SCRIPT_OUTPUTS
capture_script_output "$SCRIPT_PATH" [args...]
# Runs script, captures output, parses KEY=value pairs into SCRIPT_OUTPUTS array
# Access results: echo "Branch is: ${SCRIPT_OUTPUTS[BRANCH]}"
```

**Usage Requirements**:
- Must declare associative array: `declare -A SCRIPT_OUTPUTS`  
- Stores parsed KEY=value pairs as `SCRIPT_OUTPUTS["KEY"]="value"`
- Shows visual progress with bordered script names
- Handles script failures gracefully

**Example**:
```bash
declare -A SCRIPT_OUTPUTS
capture_script_output "$COMMON_DIR/git/git_state_analysis.bash" summary
if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]}" == "true" ]]; then
    echo "Changes detected in branch: ${SCRIPT_OUTPUTS[BRANCH]}"
fi
```

## Usage Guidelines

### Sourcing Pattern

All includes must be sourced after setting shell options:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")"

# Source includes
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"

# Now use functions
require_git_repo "This script needs a git repository"
```

### Error Handling Pattern

Combine includes for comprehensive error handling:

```bash
# Set up error handling and temp cleanup
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"
setup_temp_cleanup

# Use throughout script
require_command "git" "Git is required for this operation"
temp_file=$(create_temp_file "git_output")
run_with_output "git fetch --all" "Failed to fetch from remotes"
```

### Orchestrator Pattern

Use includes for coordinating multiple operations:

```bash
# Set up orchestrator
declare -A SCRIPT_OUTPUTS
source "$COMMON_DIR/_inc/helpers.inc.bash"

# Run multiple scripts and collect results
capture_script_output "$COMMON_DIR/env/env_validate.bash" all
capture_script_output "$COMMON_DIR/git/git_state_analysis.bash" summary

# Make decisions based on collected outputs
if [[ "${SCRIPT_OUTPUTS[GIT_REPO]}" != "true" ]]; then
    error_exit "Not in a git repository"
fi

if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]}" == "true" ]]; then
    info "Found ${SCRIPT_OUTPUTS[STAGED_COUNT]} staged changes"
fi
```

## Best Practices

### 1. Include Guards
All includes use guards to prevent multiple inclusion:
```bash
if [[ "${HELPERS_INC_INCLUDED:-}" == "true" ]]; then
    return 0
fi
HELPERS_INC_INCLUDED=true
```

### 2. Path Validation  
Always validate paths before using:
```bash
# Always define and validate COMMON_DIR
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR" >&2
    exit 1
}
```

### 3. Error Propagation
Use consistent error handling:
```bash
# Good - clear error with context
require_file "$config_file" "Configuration file missing: $config_file"

# Good - operation with noise suppression  
run_with_output "composer install" "Failed to install PHP dependencies"
```

### 4. Temp File Management
Always use tracked temp files:
```bash
# Set up cleanup first
setup_temp_cleanup

# Create tracked temp files
temp_file=$(create_temp_file "operation")
echo "data" > "$temp_file"
# Automatic cleanup on exit
```

### 5. Function Dependencies
Document and check function dependencies:
```bash
# Functions that depend on others should check
if ! declare -f create_temp_file >/dev/null 2>&1; then
    echo "ERROR: helpers.inc.bash must be sourced first" >&2
    exit 1
fi
```

---

*This document is automatically maintained by the sync command and reflects the current state of include files.*