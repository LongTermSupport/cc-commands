#!/usr/bin/env bash
# Script: execute_list_plans.bash
# Purpose: List recent plans with status information
# Usage: execute_list_plans.bash
# Output: Plan listing with status and progress

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
    echo "✓ Discovering available plans"
    echo "=== DISCOVERING PLANS ==="
    
    # Find project root (where .git is)
    PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    
    # Find plan directory (case-insensitive) from project root
    PLAN_DIR=$(find "$PROJECT_ROOT" -maxdepth 3 -iname "plan" -type d | grep -i "claude/plan" | head -1 || echo "")
    
    if [ -n "$PLAN_DIR" ]; then
        cd "$PLAN_DIR"
        echo "Found plan directory: $PLAN_DIR"
        echo ""
        echo "PLAN_NAME|STATUS|PROGRESS|SUMMARY"
        echo "---------|------|--------|-------"
        
        # Process all .md files in one pass, extracting all needed info
        while IFS=" " read -r timestamp filepath; do
            planname=$(basename "$filepath" .md)
            
            # Simple status checks using grep
            total=$(grep -E '^\[[ ✓⏳]\]' "$filepath" 2>/dev/null | wc -l)
            completed=$(grep '^\[✓\]' "$filepath" 2>/dev/null | wc -l)
            inprogress=$(grep '^\[⏳\]' "$filepath" 2>/dev/null | wc -l)
            
            # Check for ALL DONE
            if grep -A1 '^## Progress' "$filepath" 2>/dev/null | grep -q 'ALL DONE!'; then
                status="COMPLETED"
            elif [ "$inprogress" -gt 0 ]; then
                status="IN_PROGRESS"
            elif [ "$completed" -gt 0 ]; then
                status="PARTIAL"
            else
                status="NOT_STARTED"
            fi
            
            # Get summary - look for lines after ## Summary
            summary=$(grep -A3 '^## Summary' "$filepath" 2>/dev/null | tail -n +2 | grep -v '^#' | grep -v '^$' | head -1 | cut -c1-60 || echo "No summary")
            # Clean up summary - remove special chars
            summary=$(echo "$summary" | tr '|' '-' | tr -d '`$')
            
            echo "$planname|$status|$completed/$total|$summary"
        done < <(find . -name "*.md" -type f -printf "%T@ %P\n" 2>/dev/null | sort -rn | head -10)
        
        echo ""
        echo "LIST_SUCCESS=true"
    else
        echo "ERROR: No CLAUDE/plan directory found (searched case-insensitively)"
        echo "LIST_SUCCESS=false"
        exit 1
    fi
    
    echo "✓ Plan listing complete"
}

main
echo "Script success: ${0##*/}"
