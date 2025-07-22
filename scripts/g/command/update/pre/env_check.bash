#!/usr/bin/env bash
# Script: update_env_check.bash
# Purpose: Environment validation for g:command:update command
# Usage: update_env_check.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

main() {
    echo "✓ Validating environment for command update"
    
    # Check commands directory
    if [ -d ".claude/commands" ]; then
        echo "COMMANDS_DIR=found"
        echo "✓ Commands directory found"
    else
        echo "COMMANDS_DIR=missing" 
        error_exit "Commands directory not found"
    fi
    
    # Check for command:create
    if [ -f ".claude/commands/command/create.md" ]; then
        echo "COMMAND_CREATE=available"
        echo "✓ command:create available"
    else
        echo "COMMAND_CREATE=missing"
        error_exit "command:create not found - required for updates"
    fi
    
    echo "✓ Environment validation complete"
}

main
