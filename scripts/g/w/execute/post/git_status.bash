#!/usr/bin/env bash
# Script: execute_git_status.bash
# Purpose: Check git status during plan execution
# Usage: execute_git_status.bash
# Output: Git status information in KEY=value format

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
    echo "✓ Checking git status"
    echo "=== GIT STATUS CHECK ==="
    
    # Check if git is available
    if ! which git >/dev/null 2>&1; then
        echo "GIT_AVAILABLE=false"
        echo "⚠ Git not available"
        echo "MODIFIED_COUNT=0"
        return 0
    fi
    
    echo "GIT_AVAILABLE=true"
    
    # Check if in git repo
    if [ ! -d .git ]; then
        echo "IN_GIT_REPO=false"
        echo "⚠ Not in git repository"
        echo "MODIFIED_COUNT=0"
        return 0
    fi
    
    echo "IN_GIT_REPO=true"
    
    # Get git status efficiently in one pass
    git_output=$(git status --porcelain)
    modified_count=$(echo "$git_output" | grep -c . || echo "0")
    
    echo "MODIFIED_COUNT=$modified_count"
    
    if [ "$modified_count" -gt 0 ]; then
        echo ""
        echo "Modified files (first 20):"
        echo "$git_output" | head -20
        echo ""
        echo "GIT_STATUS=modified"
    else
        echo "GIT_STATUS=clean"
        echo "✓ Working tree is clean"
    fi
    
    echo "✓ Git status check complete"
}

main
