#!/usr/bin/env bash
# Script: workflow-monitor.sh
# Purpose: Monitor GitHub Actions workflows
# Usage: workflow-monitor.sh [check-commit|watch-latest|list-runs] [args]
# Output: Workflow status information

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_inc/error_handler.inc.bash"

# Check workflows for a specific commit
check_commit_workflows() {
    local commit="${1:-}"
    require_arg "$commit" "commit SHA"
    
    info "Checking workflows for commit: $commit"
    
    # Get runs for this commit
    local runs_json=$(gh run list --limit 50 --json headSha,status,conclusion,workflowName,createdAt,url 2>/dev/null) || {
        error_exit "Failed to fetch workflow runs"
    }
    
    # Filter for our commit
    local matches=$(echo "$runs_json" | jq -r --arg sha "$commit" '.[] | select(.headSha | startswith($sha))')
    
    if [ -z "$matches" ]; then
        echo "WORKFLOWS_FOUND=false"
        echo "WORKFLOW_COUNT=0"
        warn "No workflows found for commit: $commit"
        return 0
    fi
    
    # Count and process matches
    local count=$(echo "$matches" | jq -s 'length')
    echo "WORKFLOWS_FOUND=true"
    echo "WORKFLOW_COUNT=$count"
    
    # Process each workflow
    local i=0
    echo "$matches" | jq -r '. | [.workflowName, .status, .conclusion, .createdAt, .url] | @tsv' | \
    while IFS=$'\t' read -r name status conclusion created url; do
        echo "WORKFLOW_${i}_NAME=$name"
        echo "WORKFLOW_${i}_STATUS=$status"
        echo "WORKFLOW_${i}_CONCLUSION=$conclusion"
        echo "WORKFLOW_${i}_URL=$url"
        
        # Show status
        case "$status" in
            completed)
                case "$conclusion" in
                    success)
                        success "✓ $name: $conclusion"
                        ;;
                    failure)
                        warn "✗ $name: $conclusion"
                        ;;
                    cancelled)
                        info "⊘ $name: $conclusion"
                        ;;
                    *)
                        info "? $name: $conclusion"
                        ;;
                esac
                ;;
            in_progress)
                info "⏳ $name: in progress"
                ;;
            queued)
                info "⏸ $name: queued"
                ;;
            *)
                info "? $name: $status"
                ;;
        esac
        
        ((i++))
    done
}

# Watch latest workflow runs
watch_latest_workflows() {
    local limit="${1:-10}"
    
    info "Fetching latest $limit workflow runs..."
    
    # Get latest runs
    local runs_json=$(gh run list --limit "$limit" --json number,status,conclusion,workflowName,event,headBranch,createdAt 2>/dev/null) || {
        error_exit "Failed to fetch workflow runs"
    }
    
    # Count runs
    local count=$(echo "$runs_json" | jq 'length')
    echo "RUN_COUNT=$count"
    
    if [ "$count" -eq 0 ]; then
        warn "No workflow runs found"
        return 0
    fi
    
    # Process each run
    echo ""
    info "Recent workflow runs:"
    echo "$runs_json" | jq -r '.[] | [.number, .workflowName, .headBranch, .status, .conclusion // "pending", .event] | @tsv' | \
    while IFS=$'\t' read -r number name branch status conclusion event; do
        # Format status
        local status_icon
        case "$status" in
            completed)
                case "$conclusion" in
                    success) status_icon="✓" ;;
                    failure) status_icon="✗" ;;
                    cancelled) status_icon="⊘" ;;
                    *) status_icon="?" ;;
                esac
                ;;
            in_progress) status_icon="⏳" ;;
            queued) status_icon="⏸" ;;
            *) status_icon="?" ;;
        esac
        
        echo "$status_icon Run #$number: $name"
        echo "  Branch: $branch | Event: $event | Status: $status/$conclusion"
    done
}

# List workflow runs with filtering
list_workflow_runs() {
    local workflow_name="${1:-}"
    local branch="${2:-}"
    local limit="${3:-20}"
    
    info "Listing workflow runs..."
    
    # Build gh command
    local gh_args="--limit $limit --json number,status,conclusion,workflowName,headBranch,event,createdAt"
    
    if [ -n "$workflow_name" ]; then
        gh_args="$gh_args --workflow \"$workflow_name\""
    fi
    
    if [ -n "$branch" ]; then
        gh_args="$gh_args --branch \"$branch\""
    fi
    
    # Get runs
    local runs_json=$(eval "gh run list $gh_args" 2>/dev/null) || {
        error_exit "Failed to list workflow runs"
    }
    
    # Output count
    local count=$(echo "$runs_json" | jq 'length')
    echo "TOTAL_RUNS=$count"
    
    # Count by status
    local success_count=$(echo "$runs_json" | jq '[.[] | select(.conclusion == "success")] | length')
    local failure_count=$(echo "$runs_json" | jq '[.[] | select(.conclusion == "failure")] | length')
    local in_progress=$(echo "$runs_json" | jq '[.[] | select(.status == "in_progress")] | length')
    
    echo "SUCCESS_COUNT=$success_count"
    echo "FAILURE_COUNT=$failure_count"
    echo "IN_PROGRESS_COUNT=$in_progress"
    
    # Summary
    echo ""
    info "Workflow run summary:"
    echo "  Total: $count runs"
    echo "  Success: $success_count"
    echo "  Failed: $failure_count"
    echo "  In Progress: $in_progress"
}

# Get workflow names
get_workflow_names() {
    info "Fetching available workflows..."
    
    # List workflow files
    local workflows=$(gh workflow list --json name,state 2>/dev/null) || {
        error_exit "Failed to list workflows"
    }
    
    local count=$(echo "$workflows" | jq 'length')
    echo "WORKFLOW_DEFINITIONS=$count"
    
    # List each workflow
    echo ""
    info "Available workflows:"
    echo "$workflows" | jq -r '.[] | [.name, .state] | @tsv' | \
    while IFS=$'\t' read -r name state; do
        if [ "$state" = "active" ]; then
            echo "  ✓ $name"
        else
            echo "  ⊘ $name (disabled)"
        fi
    done
}

# Main script logic
OPERATION="${1:-}"

case "$OPERATION" in
    check-commit)
        COMMIT="${2:-}"
        check_commit_workflows "$COMMIT"
        ;;
    watch-latest)
        LIMIT="${2:-10}"
        watch_latest_workflows "$LIMIT"
        ;;
    list-runs)
        WORKFLOW="${2:-}"
        BRANCH="${3:-}"
        LIMIT="${4:-20}"
        list_workflow_runs "$WORKFLOW" "$BRANCH" "$LIMIT"
        ;;
    list-workflows)
        get_workflow_names
        ;;
    *)
        error_exit "Unknown operation: $OPERATION. Valid operations: check-commit, watch-latest, list-runs, list-workflows"
        ;;
esac

echo "Script success: ${0##*/}"