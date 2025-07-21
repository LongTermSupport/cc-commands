#!/usr/bin/env bash
# Script: sync_push_execute.bash
# Purpose: Execute git push operations for sync
# Usage: sync_push_execute.bash "branch_name"
# Output: Push operation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local branch_name="$1"
    
    echo "✓ Executing push operations"
    echo "=== Git Push ==="
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    echo "Pushing changes to remote on branch: $branch_name"
    
    if git push origin "$branch_name"; then
        echo "✓ Successfully pushed changes to remote"
        echo "PUSH_SUCCESS=true"
    else
        echo "ERROR: Push failed"
        echo "Possible reasons:"
        echo "  - You don't have push access to the repository"
        echo "  - The remote has diverged (try pulling again)"
        echo "  - Network connectivity issues"
        echo "PUSH_SUCCESS=false"
        error_exit "Git push failed"
    fi
    
    echo "✓ Push operations complete"
}

# Check if branch name provided
if [ $# -eq 0 ]; then
    error_exit "Branch name required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"