#!/usr/bin/env bash
# Script: sync_commit_execute.bash
# Purpose: Execute git commit operations for sync
# Usage: sync_commit_execute.bash "commit_message"
# Output: Commit operation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    local commit_message="$1"
    
    echo "✓ Executing commit operations"
    echo "=== Git Commit ==="
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    # Check if there are changes to commit
    if [ "$(git status --porcelain | wc -l)" -eq 0 ]; then
        echo "No changes to commit"
        echo "COMMIT_NEEDED=false"
        return 0
    fi
    
    echo "COMMIT_NEEDED=true"
    echo "Commit message: $commit_message"
    
    # Add all changes
    git add .
    
    # Commit with the provided message
    if git commit -m "$commit_message"; then
        echo "✓ Successfully committed changes"
        echo "COMMIT_SUCCESS=true"
    else
        echo "ERROR: Failed to commit changes"
        echo "COMMIT_SUCCESS=false"
        error_exit "Git commit failed"
    fi
    
    echo "✓ Commit operations complete"
}

# Check if commit message provided
if [ $# -eq 0 ]; then
    error_exit "Commit message required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"