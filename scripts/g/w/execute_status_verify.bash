#!/usr/bin/env bash
# Script: execute_status_verify.bash
# Purpose: Analyze and verify plan task status
# Usage: execute_status_verify.bash "PLAN_PATH"
# Output: Task status analysis in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    local plan_path="${1:-}"
    
    echo "✓ Analyzing plan task status"
    echo "=== TASK STATUS ANALYSIS ==="
    
    if [ -z "$plan_path" ]; then
        echo "ERROR: PLAN_PATH not provided"
        error_exit "Plan path required"
    fi
    
    if [ ! -f "$plan_path" ]; then
        echo "ERROR: Plan file not found: $plan_path"
        error_exit "Plan file not found"
    fi
    
    # Extract all task data in one awk pass
    awk '
        BEGIN {
            total=0; completed=0; inprogress=0; pending=0; has_done=0;
            print "Analyzing plan progress..."
        }
        /^\[[ ✓⏳]\]/ {
            total++;
            if(/^\[✓\]/) completed++;
            else if(/^\[⏳\]/) inprogress++;
            else if(/^\[ \]/) pending++;
            # Store first 20 tasks with line numbers
            if(total <= 20) tasks[total] = NR ": " $0
        }
        /^## Progress/ { if(getline && /ALL DONE!/) has_done=1 }
        END {
            print "TOTAL_TASKS=" total;
            print "COMPLETED_TASKS=" completed;
            print "INPROGRESS_TASKS=" inprogress;
            print "PENDING_TASKS=" pending;
            print "HAS_ALL_DONE=" (has_done ? "true" : "false");
            if(total > 0) {
                print "";
                print "=== FIRST 20 TASKS ===";
                for(i=1; i<=total && i<=20; i++) print tasks[i]
            }
        }' "$plan_path"
    
    echo "✓ Task status analysis complete"
}

# Check if plan path provided
if [ $# -eq 0 ]; then
    error_exit "Plan path required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"