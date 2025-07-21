#!/usr/bin/env bash
# Script: push_workflow_detect.bash
# Purpose: Detect and analyze GitHub workflows after push
# Usage: push_workflow_detect.bash "push_result" "pushed_commit"
# Output: Workflow detection results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

main() {
    local push_result="$1"
    local pushed_commit="$2"
    
    echo "✓ Detecting GitHub workflows"
    
    if [ "$push_result" = "success" ]; then
        echo "Push successful - detecting workflows for commit: $pushed_commit"
        
        # Use common workflow detection script
        if bash "$COMMON_DIR/gh/gh_workflow_ops.bash" detect "$pushed_commit"; then
            echo "WORKFLOW_DETECTION_SUCCESS=true"
            echo "MONITORING_NEEDED=true"
        else
            echo "WORKFLOW_DETECTION_SUCCESS=false"
            echo "MONITORING_NEEDED=false"
        fi
    else
        echo "No push occurred - skipping workflow detection"
        echo "WORKFLOW_DETECTION_SUCCESS=false"
        echo "MONITORING_NEEDED=false"
    fi
    
    echo "PUSH_RESULT=$push_result"
    echo "PUSHED_COMMIT=$pushed_commit"
    echo "✓ Workflow detection complete"
}

# Check if required arguments provided
if [ $# -lt 2 ]; then
    error_exit "Push result and pushed commit required as arguments"
fi

main "$1" "$2"
echo "Script success: ${0##*/}"