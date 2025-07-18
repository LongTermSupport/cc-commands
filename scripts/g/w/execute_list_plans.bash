#!/usr/bin/env bash
# Script: execute_list_plans.bash
# Purpose: List recent plans with status information
# Usage: execute_list_plans.bash
# Output: Plan listing with status and progress

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    echo "✓ Discovering available plans"
    echo "=== DISCOVERING PLANS ==="
    
    # Find plan directory (case-insensitive)
    PLAN_DIR=$(find . -maxdepth 2 -iname "plan" -type d | grep -i "claude/plan" | head -1 || echo "")
    
    if [ -n "$PLAN_DIR" ]; then
        cd "$PLAN_DIR"
        echo "Found plan directory: $PLAN_DIR"
        echo ""
        echo "PLAN_NAME|STATUS|PROGRESS|SUMMARY"
        echo "---------|------|--------|-------"
        
        # Process all .md files in one pass, extracting all needed info
        find . -name "*.md" -type f -printf "%T@ %P\n" | sort -rn | head -10 | while read -r timestamp filepath; do
            planname=$(basename "$filepath" .md)
            
            # Extract all needed data in one grep pass using awk
            eval $(awk '
                BEGIN { total=0; completed=0; inprogress=0; has_done=0; summary="No summary" }
                /^\[[ ✓⏳]\]/ { total++ }
                /^\[✓\]/ { completed++ }
                /^\[⏳\]/ { inprogress++ }
                /^## Progress/ { if(getline && /ALL DONE!/) has_done=1 }
                /^## Summary/ { if(getline && getline) { summary=substr($0,1,60); gsub(/[|]/, "-", summary) } }
                END {
                    if(has_done) status="COMPLETED";
                    else if(inprogress>0) status="IN_PROGRESS";
                    else if(completed>0) status="PARTIAL";
                    else status="NOT_STARTED";
                    print "total="total"; completed="completed"; status=\""status"\"; summary=\""summary"\""
                }' "$filepath")
            
            echo "$planname|$status|$completed/$total|$summary"
        done
        
        echo ""
        echo "LIST_SUCCESS=true"
    else
        echo "ERROR: No CLAUDE/plan directory found (searched case-insensitively)"
        echo "LIST_SUCCESS=false"
        error_exit "No plan directory found"
    fi
    
    echo "✓ Plan listing complete"
}

main
echo "Script success: ${0##*/}"