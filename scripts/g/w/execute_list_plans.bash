#!/usr/bin/env bash
# Script: execute_list_plans.bash
# Purpose: List recent plans with status information
# Usage: execute_list_plans.bash
# Output: Plan listing with status and progress

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
        find . -name "*.md" -type f -printf "%T@ %P\n" 2>/dev/null | sort -rn | head -10 | while IFS=" " read -r timestamp filepath; do
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
        done
        
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