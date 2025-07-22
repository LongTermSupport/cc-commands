#!/usr/bin/env bash
# Script: update_env_check.bash
# Purpose: Environment validation for g:command:update command
# Usage: update_env_check.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

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
