#!/usr/bin/env bash
# Script: sync_status_analysis.bash
# Purpose: Analyze git repository status for sync operation
# Usage: sync_status_analysis.bash
# Output: Repository status analysis in KEY=value format

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

# Set up temp file cleanup
setup_temp_cleanup

main() {
    echo "✓ Analyzing repository status"
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    echo "=== Git Status ==="
    
    # Check for uncommitted changes
    TEMP_FILE=$(create_temp_file "TEMP_FILE")
    git status --porcelain > "$TEMP_FILE"
    
    if [ -s "$TEMP_FILE" ]; then
        echo "✓ Uncommitted changes found:"
        cat "$TEMP_FILE"
        echo "CHANGES_EXIST=true"
    else
        echo "✓ Working directory clean"
        echo "CHANGES_EXIST=false"
    fi
    
    rm -f "$TEMP_FILE"
    
    echo ""
    echo "=== Recent Commits ==="
    git log --oneline -5 || echo "No commits yet"
    
    echo ""
    echo "=== Branch Information ==="
    CURRENT_BRANCH=$(git branch --show-current)
    echo "Current branch: $CURRENT_BRANCH"
    echo "CURRENT_BRANCH=$CURRENT_BRANCH"
    
    # Check if remote is up to date
    if git fetch --dry-run 2>&1 | grep -q "up to date"; then
        echo "✓ Remote is up to date"
        echo "REMOTE_STATUS=up_to_date"
    else
        echo "⚠️ Remote has updates"
        echo "REMOTE_STATUS=has_updates"
    fi
    
    echo "✓ Repository status analysis complete"
}

main
