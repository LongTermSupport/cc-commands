#!/usr/bin/env bash
# Script: git_operations.bash
# Purpose: Common git operations with safety checks
# Usage: source git_operations.bash or bash git_operations.bash <command> [args]
# Output: Structured data and status messages

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_inc/error_handler.inc.bash"

# Get current branch name
git_get_current_branch() {
    local branch=$(git branch --show-current 2>/dev/null || echo "")
    if [ -z "$branch" ]; then
        # Might be in detached HEAD state
        branch=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        echo "BRANCH=$branch"
        echo "DETACHED=true"
    else
        echo "BRANCH=$branch"
        echo "DETACHED=false"
    fi
}

# Check for uncommitted changes
git_check_changes() {
    local porcelain=$(git status --porcelain 2>/dev/null || echo "")
    if [ -n "$porcelain" ]; then
        echo "CHANGES_EXIST=true"
        local count=$(echo "$porcelain" | wc -l)
        echo "CHANGES_COUNT=$count"
        
        # Count different types of changes
        local modified=$(echo "$porcelain" | grep -c "^ M" || true)
        local added=$(echo "$porcelain" | grep -c "^A" || true)
        local deleted=$(echo "$porcelain" | grep -c "^ D" || true)
        local untracked=$(echo "$porcelain" | grep -c "^??" || true)
        
        echo "MODIFIED_COUNT=$modified"
        echo "ADDED_COUNT=$added"
        echo "DELETED_COUNT=$deleted"
        echo "UNTRACKED_COUNT=$untracked"
    else
        echo "CHANGES_EXIST=false"
        echo "CHANGES_COUNT=0"
    fi
}

# Show detailed change summary
git_show_changes() {
    info "Git status summary:"
    git status --short
    echo ""
    info "Changed files:"
    git diff --stat 2>/dev/null || true
}

# Safe commit with validation
git_safe_commit() {
    local message="${1:-}"
    require_arg "$message" "commit message"
    
    # Check for changes
    eval "$(git_check_changes)"
    
    if [ "$CHANGES_EXIST" != "true" ]; then
        warn "No changes to commit"
        echo "COMMIT_RESULT=no_changes"
        return 0
    fi
    
    info "Committing $CHANGES_COUNT changes..."
    
    # Add all changes
    git add -A || error_exit "Failed to stage changes"
    
    # Commit with message
    if git commit -m "$message"; then
        local commit_hash=$(git rev-parse HEAD)
        echo "COMMIT_RESULT=success"
        echo "COMMIT_HASH=$commit_hash"
        success "Committed changes: $commit_hash"
        return 0
    else
        echo "COMMIT_RESULT=failed"
        error_exit "Failed to commit changes"
    fi
}

# Push with pre-flight checks
git_push_with_checks() {
    local force="${1:-false}"
    
    eval "$(git_get_current_branch)"
    
    # Check if branch has upstream
    local upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
    
    if [ -z "$upstream" ]; then
        info "Setting upstream branch: origin/$BRANCH"
        git push -u origin "$BRANCH" || error_exit "Failed to push with upstream"
        echo "PUSH_RESULT=success_new_upstream"
    else
        # Check if we're ahead/behind
        local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
        local behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
        
        echo "COMMITS_AHEAD=$ahead"
        echo "COMMITS_BEHIND=$behind"
        
        if [ "$behind" -gt 0 ] && [ "$force" != "true" ]; then
            error_exit "Branch is $behind commits behind upstream. Pull first or use force=true"
        fi
        
        if [ "$ahead" -eq 0 ]; then
            warn "No commits to push"
            echo "PUSH_RESULT=no_commits"
            return 0
        fi
        
        info "Pushing $ahead commits to $upstream..."
        
        if [ "$force" = "true" ] && [ "$behind" -gt 0 ]; then
            warn "Force pushing (branch is $behind commits behind)"
            git push --force-with-lease || error_exit "Failed to force push"
            echo "PUSH_RESULT=force_pushed"
        else
            git push || error_exit "Failed to push"
            echo "PUSH_RESULT=success"
        fi
    fi
    
    success "Push completed successfully"
}

# Fetch latest changes
git_fetch_updates() {
    info "Fetching latest changes..."
    
    if git fetch --all --prune; then
        echo "FETCH_RESULT=success"
        success "Fetched latest changes"
        
        # Check if current branch has updates
        eval "$(git_get_current_branch)"
        local behind=$(git rev-list --count HEAD..origin/"$BRANCH" 2>/dev/null || echo "0")
        
        if [ "$behind" -gt 0 ]; then
            echo "UPDATES_AVAILABLE=true"
            echo "UPDATES_COUNT=$behind"
            warn "Branch is $behind commits behind origin/$BRANCH"
        else
            echo "UPDATES_AVAILABLE=false"
            echo "UPDATES_COUNT=0"
        fi
    else
        echo "FETCH_RESULT=failed"
        error_exit "Failed to fetch updates"
    fi
}

# Stash changes safely
git_stash_changes() {
    local message="${1:-Auto-stashed by script}"
    
    eval "$(git_check_changes)"
    
    if [ "$CHANGES_EXIST" != "true" ]; then
        echo "STASH_RESULT=no_changes"
        debug "No changes to stash"
        return 0
    fi
    
    info "Stashing $CHANGES_COUNT changes..."
    
    if git stash push -m "$message"; then
        echo "STASH_RESULT=success"
        local stash_ref=$(git stash list -1 --format="%gd")
        echo "STASH_REF=$stash_ref"
        success "Changes stashed: $stash_ref"
    else
        echo "STASH_RESULT=failed"
        error_exit "Failed to stash changes"
    fi
}

# If script is executed directly, run the requested operation
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    OPERATION="${1:-}"
    
    case "$OPERATION" in
        branch)
            git_get_current_branch
            ;;
        changes)
            git_check_changes
            ;;
        show-changes)
            git_show_changes
            ;;
        commit)
            MESSAGE="${2:-}"
            git_safe_commit "$MESSAGE"
            ;;
        push)
            FORCE="${2:-false}"
            git_push_with_checks "$FORCE"
            ;;
        fetch)
            git_fetch_updates
            ;;
        stash)
            MESSAGE="${2:-}"
            git_stash_changes "$MESSAGE"
            ;;
        *)
            error_exit "Unknown operation: $OPERATION. Valid operations: branch, changes, show-changes, commit, push, fetch, stash"
            ;;
    esac
    
    echo "Script success: ${0##*/}"
fi