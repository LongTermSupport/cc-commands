#!/usr/bin/env bash
# Script: execute_plan_search.bash
# Purpose: Search for specific plan using exact and fuzzy matching
# Usage: execute_plan_search.bash "MODE" "PLAN_NAME"
# Output: Plan search results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    local mode="${1:-}"
    local plan_name="${2:-}"
    
    echo "✓ Searching for plan"
    echo "=== PLAN SEARCH ==="
    
    # Verify we're in EXECUTE mode and have a plan name
    if [ "$mode" != "EXECUTE" ]; then
        echo "ERROR: Section B reached with MODE=$mode - this should not happen"
        error_exit "Invalid mode for plan search"
    fi
    
    if [ -z "$plan_name" ]; then
        echo "ERROR: No plan name provided"
        error_exit "Plan name required"
    fi
    
    # Find plan directory (case-insensitive)
    PLAN_DIR=$(find . -maxdepth 2 -iname "plan" -type d | grep -i "claude/plan" | head -1 || echo "")
    if [ -z "$PLAN_DIR" ]; then
        echo "ERROR: No CLAUDE/plan directory found"
        error_exit "No plan directory found"
    fi
    
    cd "$PLAN_DIR"
    echo "Searching for plan: $plan_name in $PLAN_DIR"
    
    # Try exact match first, then fuzzy match by filename, then content
    if [ -f "${plan_name}.md" ]; then
        echo "MATCH_TYPE=exact"
        echo "PLAN_FILE=${plan_name}.md"
        echo "PLAN_PATH=$PLAN_DIR/${plan_name}.md"
        echo "✓ Found exact match: ${plan_name}.md"
    else
        # Combined search: filename and content
        {
            find . -name "*.md" -type f | grep -i "$plan_name" | sed 's|^\./||'
            grep -l -i "$plan_name" *.md 2>/dev/null || true
        } | sort -u > /tmp/plan_matches
        
        match_count=$(wc -l < /tmp/plan_matches)
        
        if [ "$match_count" -eq 0 ]; then
            echo "MATCH_TYPE=none"
            echo "ERROR: No plans found matching '$plan_name'"
            rm -f /tmp/plan_matches
            error_exit "No matching plans found"
        elif [ "$match_count" -eq 1 ]; then
            match_file=$(cat /tmp/plan_matches)
            echo "MATCH_TYPE=fuzzy_single"
            echo "PLAN_FILE=$match_file"
            echo "PLAN_PATH=$PLAN_DIR/$match_file"
            echo "✓ Found fuzzy match: $match_file"
        else
            echo "MATCH_TYPE=fuzzy_multiple"
            echo "MATCH_COUNT=$match_count"
            echo "⚠ Multiple matches found:"
            cat /tmp/plan_matches | while read -r match; do
                echo "CANDIDATE=$match"
            done
        fi
        
        rm -f /tmp/plan_matches
    fi
    
    echo "✓ Plan search complete"
}

# Check arguments
if [ $# -lt 2 ]; then
    error_exit "MODE and PLAN_NAME required as arguments"
fi

main "$1" "$2"
echo "Script success: ${0##*/}"