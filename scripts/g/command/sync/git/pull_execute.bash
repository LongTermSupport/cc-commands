#!/usr/bin/env bash
# Script: sync_pull_execute.bash
# Purpose: Execute git pull operations for sync
# Usage: sync_pull_execute.bash "branch_name"
# Output: Pull operation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    local branch_name="$1"
    
    echo "✓ Executing pull operations"
    echo "=== Git Pull ==="
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    echo "Pulling latest changes from remote on branch: $branch_name"
    
    # Attempt to pull with rebase to keep history clean
    if git pull --rebase origin "$branch_name" 2>&1; then
        echo "✓ Successfully pulled and rebased changes"
        echo "PULL_SUCCESS=true"
        echo "PULL_METHOD=rebase"
    else
        # If rebase fails, fall back to merge
        echo "⚠️  Rebase failed, attempting merge..."
        git rebase --abort 2>/dev/null || true
        
        if git pull origin "$branch_name"; then
            echo "✓ Successfully pulled and merged changes"
            echo "PULL_SUCCESS=true"
            echo "PULL_METHOD=merge"
        else
            echo "ERROR: Pull failed. Manual intervention required."
            echo "Hints:"
            echo "  1. Check for merge conflicts with: git status"
            echo "  2. Resolve conflicts manually"
            echo "  3. Complete merge with: git add . && git commit"
            echo "PULL_SUCCESS=false"
            error_exit "Git pull failed"
        fi
    fi
    
    echo "✓ Pull operations complete"
}

# Check if branch name provided
if [ $# -eq 0 ]; then
    error_exit "Branch name required as argument"
fi

main "$1"
