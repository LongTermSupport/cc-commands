#!/usr/bin/env bash
# Script: plan_verify.bash
# Purpose: Verify plan file creation and analyze contents
# Usage: plan_verify.bash "plan_file_path"
# Output: Plan verification results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local plan_file="$1"
    
    echo "✓ Verifying plan file creation"
    echo "=== Plan File Verification ==="
    
    if [ -f "$plan_file" ]; then
        echo "✓ Plan file created successfully"
        echo "Location: $plan_file"
        
        local line_count=$(wc -l < "$plan_file")
        echo "Size: $line_count lines"
        echo "PLAN_FILE_LINES=$line_count"
        
        echo ""
        echo "Tasks in plan:"
        # Show first 10 task lines
        if grep -E "^(\[ \]|\[✓\]|\[⏳\])" "$plan_file" | head -10; then
            local task_count=$(grep -E "^(\[ \]|\[✓\]|\[⏳\])" "$plan_file" | wc -l)
            echo "PLAN_TASK_COUNT=$task_count"
        else
            echo "No tasks found in plan"
            echo "PLAN_TASK_COUNT=0"
        fi
        
        echo "PLAN_FILE_CREATED=true"
        echo "PLAN_FILE_PATH=$plan_file"
    else
        echo "✗ Failed to create plan file"
        echo "PLAN_FILE_CREATED=false"
        error_exit "Failed to create plan file"
    fi
    
    echo "✓ Plan file verification complete"
}

# Check if plan file path provided
if [ $# -eq 0 ]; then
    error_exit "Plan file path required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"