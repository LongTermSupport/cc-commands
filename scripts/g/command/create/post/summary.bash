#!/usr/bin/env bash
# Script: summary.bash
# Purpose: Generate summary after command creation
# Usage: summary.bash <command_name>
# Output: Summary information and next steps

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
COMMAND_NAME="${1:-}"

main() {
    if [ -z "$COMMAND_NAME" ]; then
        error_exit "Usage: summary.bash <command_name>"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Command Created Successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "COMMAND_NAME=$COMMAND_NAME"
    
    # Check what was created
    if [[ "$COMMAND_NAME" == *:* ]]; then
        FOLDER_PATH="${COMMAND_NAME//:://}"
        COMMAND_PATH=".claude/commands/${FOLDER_PATH}.md"
    else
        COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"
    fi
    
    if [ -f "$COMMAND_PATH" ]; then
        echo "COMMAND_FILE=$COMMAND_PATH"
        FILE_SIZE=$(wc -c < "$COMMAND_PATH")
        echo "FILE_SIZE=$FILE_SIZE bytes"
    fi
    
    # Check if scripts were created
    local namespace=""
    local command=""
    
    if [[ "$COMMAND_NAME" == *:* ]]; then
        namespace="${COMMAND_NAME%:*}"
        command="${COMMAND_NAME##*:}"
        SCRIPTS_BASE=".claude/cc-commands/scripts/${namespace//://}/${command}"
    else
        command="$COMMAND_NAME"
        SCRIPTS_BASE=".claude/cc-commands/scripts/$COMMAND_NAME"
    fi
    
    if [ -d "$SCRIPTS_BASE" ]; then
        echo "SCRIPTS_CREATED=true"
        echo "SCRIPTS_DIRECTORY=$SCRIPTS_BASE"
        
        # Count scripts created
        SCRIPT_COUNT=$(find "$SCRIPTS_BASE" -name "*.bash" -type f | wc -l)
        echo "SCRIPT_COUNT=$SCRIPT_COUNT"
    else
        echo "SCRIPTS_CREATED=false"
    fi
    
    echo ""
    echo "NEXT_STEPS=true"
    echo "RESTART_REQUIRED=true"
    echo "TAB_COMPLETION_NOTE=true"
}

main
