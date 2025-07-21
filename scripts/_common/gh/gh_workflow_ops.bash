#!/usr/bin/env bash
# Script: gh_workflow_ops.bash
# Purpose: Advanced GitHub workflow operations and analysis
# Usage: gh_workflow_ops.bash [detect|analyze|wait] [commit-sha] [timeout]
# Output: Structured workflow data

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Operation
OPERATION="${1:-detect}"
COMMIT_SHA="${2:-HEAD}"
TIMEOUT="${3:-300}"

# Resolve commit SHA if needed
resolve_commit_sha() {
    local sha="$1"
    
    if [ "$sha" = "HEAD" ]; then
        sha=$(git rev-parse HEAD 2>/dev/null || echo "")
    fi
    
    if [ -z "$sha" ]; then
        error_exit "Cannot resolve commit SHA"
    fi
    
    echo "$sha"
}

# Detect workflows for a commit
detect_workflows_for_commit() {
    local commit_sha="$1"
    local runs_json
    local workflow_count=0
    
    debug "Detecting workflows for commit: $commit_sha"
    
    # Get workflow runs with error handling
    runs_json=$(mktemp)
    trap "rm -f '$runs_json'" RETURN
    
    if ! gh run list --limit 50 --json headSha,status,conclusion,workflowName,createdAt,url > "$runs_json" 2>/dev/null; then
        echo "DETECTION_SUCCESS=false"
        echo "WORKFLOW_COUNT=0"
        warn "Failed to fetch workflow runs"
        return 1
    fi
    
    # Filter for our commit
    local matching_runs=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select(.headSha == $sha or (.headSha | startswith($sha)))] | length' "$runs_json")
    
    echo "DETECTION_SUCCESS=true"
    echo "WORKFLOW_COUNT=$matching_runs"
    echo "COMMIT_SHA=$commit_sha"
    
    if [ "$matching_runs" -eq 0 ]; then
        echo "WORKFLOWS_FOUND=false"
        debug "No workflows found for commit $commit_sha"
        return 0
    fi
    
    echo "WORKFLOWS_FOUND=true"
    
    # List workflows
    echo "WORKFLOWS<<EOF"
    jq -r --arg sha "$commit_sha" \
        '.[] | select(.headSha == $sha or (.headSha | startswith($sha))) | 
        "\(.status)|\(.conclusion // "pending")|\(.workflowName)|\(.url)"' "$runs_json"
    echo "EOF"
    
    # Count by status
    local running=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
        (.status == "in_progress" or .status == "queued"))] | length' "$runs_json")
    local completed=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
        .status == "completed")] | length' "$runs_json")
    
    echo "WORKFLOWS_RUNNING=$running"
    echo "WORKFLOWS_COMPLETED=$completed"
    
    # Check if monitoring needed
    if [ "$running" -gt 0 ]; then
        echo "MONITORING_NEEDED=true"
    else
        echo "MONITORING_NEEDED=false"
    fi
}

# Analyze workflow results
analyze_workflow_results() {
    local commit_sha="$1"
    local runs_json
    
    debug "Analyzing workflow results for commit: $commit_sha"
    
    # Get workflow runs
    runs_json=$(mktemp)
    trap "rm -f '$runs_json'" RETURN
    
    if ! gh run list --limit 50 --json headSha,status,conclusion,workflowName,url > "$runs_json" 2>/dev/null; then
        echo "ANALYSIS_SUCCESS=false"
        return 1
    fi
    
    echo "ANALYSIS_SUCCESS=true"
    
    # Count conclusions
    local success=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
        .conclusion == "success")] | length' "$runs_json")
    local failure=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
        .conclusion == "failure")] | length' "$runs_json")
    local cancelled=$(jq -r --arg sha "$commit_sha" \
        '[.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
        .conclusion == "cancelled")] | length' "$runs_json")
    
    echo "WORKFLOWS_SUCCESS=$success"
    echo "WORKFLOWS_FAILURE=$failure"
    echo "WORKFLOWS_CANCELLED=$cancelled"
    
    # Overall status
    if [ "$failure" -gt 0 ]; then
        echo "OVERALL_STATUS=failure"
        echo "ALL_PASSED=false"
        
        # List failed workflows
        echo "FAILED_WORKFLOWS<<EOF"
        jq -r --arg sha "$commit_sha" \
            '.[] | select((.headSha == $sha or (.headSha | startswith($sha))) and 
            .conclusion == "failure") | "\(.workflowName)|\(.url)"' "$runs_json"
        echo "EOF"
    elif [ "$success" -gt 0 ] && [ "$failure" -eq 0 ]; then
        echo "OVERALL_STATUS=success"
        echo "ALL_PASSED=true"
    else
        echo "OVERALL_STATUS=pending"
        echo "ALL_PASSED=false"
    fi
}

# Wait for workflows to complete
wait_for_workflows() {
    local commit_sha="$1"
    local timeout="$2"
    local start_time=$(date +%s)
    local elapsed=0
    
    info "Waiting for workflows to complete (timeout: ${timeout}s)"
    
    while [ "$elapsed" -lt "$timeout" ]; do
        # Check current status
        local status_output=$(detect_workflows_for_commit "$commit_sha")
        eval "$status_output"
        
        if [ "${MONITORING_NEEDED:-false}" = "false" ]; then
            echo "WAIT_RESULT=completed"
            echo "WAIT_TIME=$elapsed"
            success "All workflows completed in ${elapsed}s"
            return 0
        fi
        
        # Show progress
        debug "Still running: ${WORKFLOWS_RUNNING:-0} workflows (${elapsed}s elapsed)"
        
        # Wait before next check
        sleep 10
        
        # Update elapsed time
        local current_time=$(date +%s)
        elapsed=$((current_time - start_time))
    done
    
    echo "WAIT_RESULT=timeout"
    echo "WAIT_TIME=$timeout"
    warn "Workflow monitoring timed out after ${timeout}s"
    return 1
}

# Main execution
main() {
    # Resolve commit SHA
    local sha=$(resolve_commit_sha "$COMMIT_SHA")
    
    case "$OPERATION" in
        detect)
            detect_workflows_for_commit "$sha"
            ;;
            
        analyze)
            analyze_workflow_results "$sha"
            ;;
            
        wait)
            wait_for_workflows "$sha" "$TIMEOUT"
            # After waiting, analyze results
            echo ""
            analyze_workflow_results "$sha"
            ;;
            
        *)
            error_exit "Unknown operation: $OPERATION. Valid: detect, analyze, wait"
            ;;
    esac
}

# Run main function
main

