#!/usr/bin/env bash
# Script: push_execute_git.bash
# Purpose: Execute git staging, commit, and push operations
# Usage: push_execute_git.bash <action> [commit_message]
# Output: Operation status and results

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"
source "$COMMON_DIR/git/git_smart_commit.bash"

# Arguments
ACTION="${1:-}"
CUSTOM_MESSAGE="${2:-}"

# Validate arguments
if [ -z "$ACTION" ]; then
    error_exit "Missing required argument: action"
fi

# Handle different actions
case "$ACTION" in
    "commit_and_push")
        info "Executing commit and push..."
        
        # Stage all changes
        info "Staging all changes..."
        if run_with_output "git add ." "Failed to stage changes"; then
            echo "STAGING_RESULT=success"
            
            # Show staged changes summary
            STAGED_FILES=$(git diff --cached --name-only | wc -l)
            echo "STAGED_FILES=$STAGED_FILES"
            
            if [ "$STAGED_FILES" -gt 0 ]; then
                debug "Files staged: $STAGED_FILES"
                
                # Generate or use commit message
                if [ -n "$CUSTOM_MESSAGE" ]; then
                    COMMIT_MSG="$CUSTOM_MESSAGE"
                else
                    # Use smart commit message generation
                    info "Generating commit message..."
                    COMMIT_MSG=$(generate_smart_commit_message)
                fi
                
                echo "COMMIT_MESSAGE=$COMMIT_MSG"
                
                # Create commit with Claude Code attribution
                info "Creating commit..."
                COMMIT_OUTPUT=$(mktemp)
                
                if git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" > "$COMMIT_OUTPUT" 2>&1; then
                    echo "COMMIT_RESULT=success"
                    COMMIT_HASH=$(git rev-parse HEAD)
                    echo "COMMIT_HASH=$COMMIT_HASH"
                    rm -f "$COMMIT_OUTPUT"
                else
                    echo "COMMIT_RESULT=failed"
                    cat "$COMMIT_OUTPUT" >&2
                    rm -f "$COMMIT_OUTPUT"
                    exit 1
                fi
            else
                echo "COMMIT_RESULT=no_changes"
                info "No changes to commit"
            fi
        else
            echo "STAGING_RESULT=failed"
            exit 1
        fi
        ;;
        
    "push_only")
        info "Preparing to push existing commits..."
        echo "STAGING_RESULT=skipped"
        echo "COMMIT_RESULT=skipped"
        ;;
        
    "none")
        echo "STAGING_RESULT=not_needed"
        echo "COMMIT_RESULT=not_needed"
        echo "PUSH_RESULT=not_needed"
        echo "Script success: ${0##*/}"
        exit 0
        ;;
        
    *)
        error_exit "Unknown action: $ACTION"
        ;;
esac

# Push to remote (for both commit_and_push and push_only)
if [ "$ACTION" != "none" ]; then
    info "Pushing to remote repository..."
    
    BRANCH=$(git branch --show-current)
    echo "PUSH_BRANCH=$BRANCH"
    
    PUSH_OUTPUT=$(mktemp)
    if git push origin "$BRANCH" > "$PUSH_OUTPUT" 2>&1; then
        echo "PUSH_RESULT=success"
        echo "PUSHED_COMMIT=$(git rev-parse HEAD)"
        rm -f "$PUSH_OUTPUT"
    else
        echo "PUSH_RESULT=failed"
        echo "Push failed with output:" >&2
        cat "$PUSH_OUTPUT" >&2
        rm -f "$PUSH_OUTPUT"
        exit 1
    fi
fi

echo "Script success: ${0##*/}"
exit 0