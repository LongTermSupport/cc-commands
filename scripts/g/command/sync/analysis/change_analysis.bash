#!/usr/bin/env bash
# Script: sync_change_analysis.bash
# Purpose: Analyze detailed changes for sync operation
# Usage: sync_change_analysis.bash
# Output: Detailed change analysis in KEY=value format

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
    echo "✓ Analyzing detailed changes"
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    # Check if changes exist
    if [ "$(git status --porcelain | wc -l)" -eq 0 ]; then
        echo "No changes to analyze"
        echo "HAS_CHANGES=false"
        return 0
    fi
    
    echo "HAS_CHANGES=true"
    echo ""
    echo "=== Change Details ==="
    
    # Show diff statistics
    git diff --stat
    echo ""
    
    # Show list of changed files with their status
    git status --porcelain | while read -r line; do
        STATUS=$(echo "$line" | cut -c1-2)
        FILE=$(echo "$line" | cut -c4-)
        case "$STATUS" in
            "M ") echo "Modified: $FILE" ;;
            "A ") echo "Added: $FILE" ;;
            "D ") echo "Deleted: $FILE" ;;
            "R ") echo "Renamed: $FILE" ;;
            "??") echo "New file: $FILE" ;;
            *) echo "$STATUS: $FILE" ;;
        esac
    done
    
    echo "✓ Change analysis complete"
}

main
