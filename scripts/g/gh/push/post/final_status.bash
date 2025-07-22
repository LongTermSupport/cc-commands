#!/usr/bin/env bash
# Script: push_final_status.bash
# Purpose: Analyze final push results and workflow outcomes
# Usage: push_final_status.bash <pushed_commit> <push_successful>
# Output: Final status summary and workflow results

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

# Set up temp file cleanup
setup_temp_cleanup

# Arguments
PUSHED_COMMIT="${1:-}"
PUSH_SUCCESSFUL="${2:-}"

# Validate arguments
if [ -z "$PUSH_SUCCESSFUL" ]; then
    error_exit "Missing required argument: push_successful"
fi

info "Analyzing final results and workflow outcomes..."

# Verify push status
BRANCH=$(git branch --show-current)
LOCAL_COMMIT=$(git rev-parse HEAD)

echo "FINAL_BRANCH=$BRANCH"
echo "FINAL_LOCAL_COMMIT=$LOCAL_COMMIT"

if silent_run "git rev-parse origin/$BRANCH"; then
    REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH" 2>/dev/null)
    echo "FINAL_REMOTE_COMMIT=$REMOTE_COMMIT"
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo "SYNC_STATUS=in_sync"
        echo "SYNC_DESC=Local and remote branches are in sync"
    else
        echo "SYNC_STATUS=out_of_sync"
        echo "SYNC_DESC=Local and remote branches may be out of sync"
    fi
else
    echo "SYNC_STATUS=unknown"
    echo "SYNC_DESC=Could not verify remote branch status"
fi

# Check workflow results if push was successful
if [ "$PUSH_SUCCESSFUL" = "true" ] && [ -n "$PUSHED_COMMIT" ]; then
    info "Checking workflow results for pushed commit..."
    
    # Check for failed workflows
    FAILED_COUNT=0
    SUCCESS_COUNT=0
    
    # Use gh to check workflow runs for this commit
    if command -v gh >/dev/null 2>&1; then
        WORKFLOW_CHECK=$(create_temp_file "WORKFLOW_CHECK")
        
        if gh run list --json headSha,conclusion,workflowName --limit 20 > "$WORKFLOW_CHECK" 2>&1; then
            # Count failed and successful workflows for this commit
            FAILED_COUNT=$(jq -r --arg sha "$PUSHED_COMMIT" \
                '[.[] | select(.headSha == $sha and .conclusion == "failure")] | length' \
                "$WORKFLOW_CHECK" 2>/dev/null || echo "0")
            
            SUCCESS_COUNT=$(jq -r --arg sha "$PUSHED_COMMIT" \
                '[.[] | select(.headSha == $sha and .conclusion == "success")] | length' \
                "$WORKFLOW_CHECK" 2>/dev/null || echo "0")
            
            # Get failed workflow details
            if [ "$FAILED_COUNT" -gt 0 ]; then
                echo "FAILED_WORKFLOWS<<EOF"
                jq -r --arg sha "$PUSHED_COMMIT" \
                    '.[] | select(.headSha == $sha and .conclusion == "failure") | 
                    "  ❌ \(.workflowName)"' "$WORKFLOW_CHECK" 2>/dev/null || true
                echo "EOF"
            fi
        fi
        
        rm -f "$WORKFLOW_CHECK"
    fi
    
    echo "WORKFLOW_FAILED_COUNT=$FAILED_COUNT"
    echo "WORKFLOW_SUCCESS_COUNT=$SUCCESS_COUNT"
    
    if [ "$FAILED_COUNT" -gt 0 ]; then
        echo "OVERALL_STATUS=failed"
        echo "OVERALL_DESC=Push succeeded but $FAILED_COUNT workflow(s) failed"
    elif [ "$SUCCESS_COUNT" -gt 0 ]; then
        echo "OVERALL_STATUS=success"
        echo "OVERALL_DESC=Push succeeded with all workflows passing"
    else
        echo "OVERALL_STATUS=pending"
        echo "OVERALL_DESC=Push succeeded, workflows may still be running"
    fi
else
    echo "OVERALL_STATUS=no_push"
    echo "OVERALL_DESC=No push occurred"
fi

echo "Script success: ${0##*/}"
