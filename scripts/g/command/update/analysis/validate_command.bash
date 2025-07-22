#!/usr/bin/env bash
# Script: update_validate.bash
# Purpose: Validate command exists for g:command:update command
# Usage: update_validate.bash "$ARGUMENTS"
# Output: Command validation results in KEY=value format

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

# Arguments
ARGUMENTS="${1:-}"

main() {
    echo "✓ Validating command existence"
    
    # Re-extract command name since variables don't persist
    COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
    COMMAND_PATH=""
    
    if [[ "$COMMAND_NAME" == *:* ]]; then
        # Handle namespace format
        FOLDER_PATH="${COMMAND_NAME//:://}.md"
        if [ -f ".claude/commands/${FOLDER_PATH}" ]; then
            COMMAND_PATH=".claude/commands/${FOLDER_PATH}"
            echo "✓ Found command: ${FOLDER_PATH}"
            echo "COMMAND_PATH=$COMMAND_PATH"
        else
            echo "✗ Command not found: ${COMMAND_NAME}"
            echo "Available commands:"
            find .claude/commands -follow -name "*.md" -type f 2>/dev/null | \
                sed 's|.claude/commands/||' | \
                sed 's|\.md$||' | \
                sed 's|/|:|g' | \
                sort
            error_exit "Command not found: ${COMMAND_NAME}"
        fi
    else
        # Handle simple format
        if [[ "$COMMAND_NAME" == *.md ]]; then
            STRIPPED="${COMMAND_NAME%.md}"
        else
            STRIPPED="$COMMAND_NAME"
        fi
        
        if [ -f ".claude/commands/${STRIPPED}.md" ]; then
            COMMAND_PATH=".claude/commands/${STRIPPED}.md"
            echo "✓ Found command: ${STRIPPED}.md"
            echo "COMMAND_PATH=$COMMAND_PATH"
        elif [ -f ".claude/commands/${STRIPPED//:///}.md" ]; then
            COMMAND_PATH=".claude/commands/${STRIPPED//:///}.md"
            echo "✓ Found command: ${STRIPPED//:///}.md"
            echo "COMMAND_PATH=$COMMAND_PATH"
        else
            echo "✗ Command not found: ${COMMAND_NAME}"
            echo "Available commands:"
            find .claude/commands -follow -name "*.md" -type f 2>/dev/null | \
                sed 's|.claude/commands/||' | \
                sed 's|\.md$||' | \
                sed 's|/|:|g' | \
                sort
            error_exit "Command not found: ${COMMAND_NAME}"
        fi
    fi
    
    echo "✓ Command validation complete"
}

main
