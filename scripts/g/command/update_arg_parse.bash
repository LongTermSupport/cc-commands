#!/usr/bin/env bash
# Script: update_arg_parse.bash
# Purpose: Parse arguments for g:command:update command
# Usage: update_arg_parse.bash "$ARGUMENTS"
# Output: Parsed arguments in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

# Arguments
ARGUMENTS="${1:-}"

main() {
    echo "✓ Parsing command arguments"
    
    # Check if no arguments provided
    if [ -z "$ARGUMENTS" ]; then
        echo "=== Available Commands ==="
        find .claude/commands -follow -name "*.md" -type f 2>/dev/null | \
            grep -v "command/create.md" | \
            grep -v "command/update.md" | \
            sed 's|.claude/commands/||' | \
            sed 's|\.md$||' | \
            sed 's|/|:|g' | \
            sort | \
            nl -w2 -s". "
        echo ""
        echo "Usage: /g:command:update <command-name> [additional-requirements]"
        echo ""
        echo "Examples:"
        echo "  /g:command:update test:integration"
        echo "  /g:command:update test:integration \"Add --coverage flag and parallel test support\""
        exit 0
    fi
    
    # Extract command name (first word)
    COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
    
    # Extract additional requirements (everything after first word)
    ADDITIONAL_REQS=$(echo "$ARGUMENTS" | cut -d' ' -f2-)
    
    # If command name is the same as additional requirements, there are no additional requirements
    if [ "$COMMAND_NAME" = "$ADDITIONAL_REQS" ]; then
        ADDITIONAL_REQS=""
    fi
    
    # Output parsed data
    echo "COMMAND_NAME=$COMMAND_NAME"
    echo "ADDITIONAL_REQUIREMENTS=$ADDITIONAL_REQS"
    
    # Determine update mode
    if [ -n "$ADDITIONAL_REQS" ]; then
        echo "UPDATE_MODE=ENHANCE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo " Enhancement Mode - Adding New Features"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Additional requirements: $ADDITIONAL_REQS"
    else
        echo "UPDATE_MODE=REFRESH"
        echo "Updating to latest standards only"
    fi
    
    echo "✓ Argument parsing complete"
}

main
echo "Script success: ${0##*/}"