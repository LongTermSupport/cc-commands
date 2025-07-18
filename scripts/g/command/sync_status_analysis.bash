#!/usr/bin/env bash
# Script: sync_status_analysis.bash
# Purpose: Analyze git repository status for sync operation
# Usage: sync_status_analysis.bash
# Output: Repository status analysis in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    echo "✓ Analyzing repository status"
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    echo "=== Git Status ==="
    
    # Check for uncommitted changes
    TEMP_FILE=$(mktemp)
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
echo "Script success: ${0##*/}"