#!/usr/bin/env bash
# Script: update_backup.bash
# Purpose: Create backup of existing command before update
# Usage: update_backup.bash "$ARGUMENTS"
# Output: Backup operation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

# Arguments
ARGUMENTS="${1:-}"

main() {
    echo "✓ Creating backup of existing command"
    
    # Re-extract command name and path since variables don't persist
    COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
    
    if [[ "$COMMAND_NAME" == *:* ]]; then
        COMMAND_PATH=".claude/commands/${COMMAND_NAME//:://}.md"
    else
        COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"
    fi
    
    # Create backup with timestamp
    BACKUP_PATH="${COMMAND_PATH%.md}-backup-$(date +%Y%m%d-%H%M%S).md"
    
    echo "Creating backup..."
    if cp "$COMMAND_PATH" "$BACKUP_PATH"; then
        echo "✓ Backup created: $BACKUP_PATH"
        echo "BACKUP_PATH=$BACKUP_PATH"
        echo "COMMAND_PATH=$COMMAND_PATH"
    else
        echo "✗ Failed to create backup"
        error_exit "Failed to create backup of command"
    fi
    
    echo "✓ Backup operation complete"
}

main
echo "Script success: ${0##*/}"