#!/usr/bin/env bash
# Script: plan_verify.bash
# Purpose: Verify plan file creation and analyze contents
# Usage: plan_verify.bash "plan_file_path"
# Output: Plan verification results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

main() {
    local plan_file="$1"
    
    echo "✓ Verifying plan file creation"
    echo "=== Plan File Verification ==="
    
    if [ -f "$plan_file" ]; then
        echo "✓ Plan file created successfully"
        echo "Location: $plan_file"
        
        local line_count
        line_count=$(wc -l < "$plan_file")
        echo "Size: $line_count lines"
        echo "PLAN_FILE_LINES=$line_count"
        
        echo ""
        echo "Tasks in plan:"
        # Show first 10 task lines
        if grep -E "^(\[ \]|\[✓\]|\[⏳\])" "$plan_file" | head -10; then
            local task_count
            task_count=$(grep -E "^(\[ \]|\[✓\]|\[⏳\])" "$plan_file" | wc -l)
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
