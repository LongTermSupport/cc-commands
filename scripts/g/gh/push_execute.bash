#!/usr/bin/env bash
# Script: push_execute.bash
# Purpose: Git push with GitHub Actions monitoring
# Usage: push_execute.bash [commit-message|--smart]
# Output: Push status and workflow monitoring

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"
source "$COMMON_DIR/env/env_validate.bash"
source "$COMMON_DIR/git/git_operations.bash"

# Parse arguments
ARG="${1:-}"
SMART_COMMIT=false

if [ "$ARG" = "--smart" ]; then
    SMART_COMMIT=true
    COMMIT_MESSAGE=""
else
    COMMIT_MESSAGE="$ARG"
fi

# Validate environment with noise suppression
validate_environment() {
    info "Validating environment..."
    
    # Run validations quietly, capture results
    local git_valid=false
    local gh_valid=false
    
    if run_with_output "validate_git_environment" "Git environment validation failed"; then
        git_valid=true
    fi
    
    if run_with_output "validate_github_environment" "GitHub environment validation failed"; then
        gh_valid=true
    fi
    
    if [ "$git_valid" = "true" ] && [ "$gh_valid" = "true" ]; then
        echo "ENVIRONMENT_VALID=true"
        success "Environment validated"
        return 0
    else
        echo "ENVIRONMENT_VALID=false"
        return 1
    fi
}

# Analyze repository state
analyze_repository() {
    info "Analyzing repository state..."
    
    # Get detailed state analysis
    local state_output=$("$COMMON_DIR/git/git_state_analysis.bash" detailed)
    echo "$state_output"
    
    # Parse key values
    eval "$state_output"
    
    # Determine action needed
    if [ "${CHANGES_EXIST:-false}" = "true" ]; then
        echo "ACTION_NEEDED=commit_and_push"
        info "Found $CHANGES_COUNT uncommitted changes"
    elif [ "${PUSH_NEEDED:-false}" = "true" ]; then
        echo "ACTION_NEEDED=push_only"
        info "Found ${COMMITS_AHEAD:-0} unpushed commits"
    else
        echo "ACTION_NEEDED=none"
        success "Repository is up to date"
    fi
}

# Handle smart commit
handle_smart_commit() {
    info "Generating smart commit message..."
    
    # Generate commit message based on changes
    local commit_output=$("$COMMON_DIR/git/git_smart_commit.bash" generate)
    eval "$commit_output"
    
    if [ -z "${COMMIT_MESSAGE:-}" ]; then
        error_exit "Failed to generate commit message"
    fi
    
    echo "SMART_MESSAGE=$COMMIT_MESSAGE"
    success "Generated message: $COMMIT_MESSAGE"
}

# Execute commit
execute_commit() {
    local message="$1"
    
    info "Committing changes..."
    
    # Use smart commit script
    local commit_result=$("$COMMON_DIR/git/git_smart_commit.bash" commit "$message")
    echo "$commit_result"
    eval "$commit_result"
    
    if [ "${COMMIT_SUCCESS:-false}" != "true" ]; then
        error_exit "Failed to commit changes"
    fi
}

# Execute push
execute_push() {
    info "Pushing to remote..."
    
    # Use git operations for push
    local push_output
    push_output=$(git_push_with_checks)
    echo "$push_output"
    eval "$push_output"
    
    case "${PUSH_RESULT:-}" in
        success|success_new_upstream|force_pushed)
            echo "PUSH_SUCCESS=true"
            success "Successfully pushed to remote"
            ;;
        no_commits)
            echo "PUSH_SUCCESS=false"
            info "No new commits to push"
            return 0
            ;;
        *)
            echo "PUSH_SUCCESS=false"
            error_exit "Push failed: ${PUSH_RESULT:-unknown}"
            ;;
    esac
}

# Monitor workflows
monitor_workflows() {
    local commit_sha="${1:-HEAD}"
    
    info "Checking for GitHub Actions workflows..."
    
    # Brief pause for workflows to register
    sleep 2
    
    # Detect workflows
    local detect_output=$("$COMMON_DIR/gh/gh_workflow_ops.bash" detect "$commit_sha")
    echo "$detect_output"
    eval "$detect_output"
    
    if [ "${WORKFLOWS_FOUND:-false}" != "true" ]; then
        info "No workflows triggered for this push"
        echo "WORKFLOW_MONITORING=skipped"
        return 0
    fi
    
    info "Found $WORKFLOW_COUNT workflow(s) to monitor"
    
    # Wait for workflows with timeout
    local wait_output=$("$COMMON_DIR/gh/gh_workflow_ops.bash" wait "$commit_sha" 300)
    echo "$wait_output"
    eval "$wait_output"
    
    # Summarize results
    if [ "${ALL_PASSED:-false}" = "true" ]; then
        success "All workflows completed successfully!"
        echo "WORKFLOW_MONITORING=success"
    elif [ "${WAIT_RESULT:-}" = "timeout" ]; then
        warn "Workflow monitoring timed out"
        echo "WORKFLOW_MONITORING=timeout"
    else
        warn "Some workflows failed"
        echo "WORKFLOW_MONITORING=failed"
    fi
}

# Main execution
main() {
    info "Starting git push workflow..."
    
    # Step 1: Validate environment
    validate_environment || error_exit "Environment validation failed"
    
    # Step 2: Analyze repository
    analyze_repository
    
    # Check if action needed
    if [ "${ACTION_NEEDED:-none}" = "none" ]; then
        success "Nothing to do - repository is up to date"
        echo "Script success: ${0##*/}"
        exit 0
    fi
    
    # Step 3: Handle commits if needed
    if [ "${ACTION_NEEDED:-}" = "commit_and_push" ]; then
        # Check commit message
        if [ -z "$COMMIT_MESSAGE" ] && [ "$SMART_COMMIT" = "true" ]; then
            handle_smart_commit
            COMMIT_MESSAGE="${SMART_MESSAGE:-}"
        elif [ -z "$COMMIT_MESSAGE" ]; then
            # Show changes for context
            echo ""
            info "Uncommitted changes:"
            git status --short | head -20
            echo ""
            error_exit "Uncommitted changes found. Provide a commit message or use --smart"
        fi
        
        # Execute commit
        execute_commit "$COMMIT_MESSAGE"
    fi
    
    # Step 4: Push to remote
    execute_push
    
    # Step 5: Monitor workflows if push succeeded
    if [ "${PUSH_SUCCESS:-false}" = "true" ]; then
        monitor_workflows "${COMMIT_HASH:-HEAD}"
    fi
    
    # Final summary
    echo ""
    success "Push workflow completed!"
    echo ""
    echo "Summary:"
    echo "  Repository: ${REPO_NAME:-unknown}"
    echo "  Branch: ${BRANCH:-unknown}"
    [ -n "${COMMIT_HASH:-}" ] && echo "  Commit: ${COMMIT_SHORT:-$COMMIT_HASH}"
    echo "  Push status: ${PUSH_RESULT:-not attempted}"
    echo "  Workflow status: ${WORKFLOW_MONITORING:-not monitored}"
    
    # Show any failed workflows
    if [ -n "${FAILED_WORKFLOWS:-}" ] && [ "${FAILED_WORKFLOWS}" != "" ]; then
        echo ""
        warn "Failed workflows:"
        echo "$FAILED_WORKFLOWS" | while IFS='|' read -r name url; do
            echo "  ❌ $name - $url"
        done
    fi
}

# Run main function
main

echo "Script success: ${0##*/}"