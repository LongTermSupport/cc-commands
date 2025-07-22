#!/usr/bin/env bash
# Script: push_workflow_monitor.bash
# Purpose: Monitor GitHub workflows to completion
# Usage: push_workflow_monitor.bash "monitoring_needed" "pushed_commit" "timeout_seconds"
# Output: Workflow monitoring results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    local monitoring_needed="$1"
    local pushed_commit="$2"
    local timeout_seconds="${3:-300}"
    
    echo "✓ Processing workflow monitoring"
    
    if [ "$monitoring_needed" = "true" ]; then
        echo "Monitoring workflows for commit: $pushed_commit (timeout: ${timeout_seconds}s)"
        
        # Use common workflow monitoring script
        if bash "$COMMON_DIR/gh/gh_workflow_ops.bash" wait "$pushed_commit" "$timeout_seconds"; then
            echo "MONITORING_SUCCESS=true"
            echo "WORKFLOWS_COMPLETED=true"
        else
            echo "MONITORING_SUCCESS=false"
            echo "WORKFLOWS_COMPLETED=false"
        fi
    else
        echo "No workflow monitoring needed"
        echo "MONITORING_SUCCESS=true"
        echo "WORKFLOWS_COMPLETED=not_applicable"
    fi
    
    echo "MONITORING_NEEDED=$monitoring_needed"
    echo "PUSHED_COMMIT=$pushed_commit"
    echo "TIMEOUT_SECONDS=$timeout_seconds"
    echo "✓ Workflow monitoring complete"
}

# Check if required arguments provided
if [ $# -lt 2 ]; then
    error_exit "Monitoring needed flag and pushed commit required as arguments"
fi

main "$1" "$2" "$3"
