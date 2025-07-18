#!/usr/bin/env bash
# Script: git_state_analysis.bash
# Purpose: Analyze git repository state, changes, and push status
# Usage: git_state_analysis.bash [detailed|summary]
# Output: Structured repository state data

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

# Mode: detailed or summary
MODE="${1:-summary}"

# Get current branch with error handling
get_current_branch() {
    local branch
    if branch=$(git branch --show-current 2>/dev/null); then
        echo "BRANCH=$branch"
        echo "DETACHED=false"
    else
        # Might be in detached HEAD state
        if branch=$(git rev-parse --short HEAD 2>/dev/null); then
            echo "BRANCH=$branch"
            echo "DETACHED=true"
        else
            echo "BRANCH=unknown"
            echo "DETACHED=unknown"
            return 1
        fi
    fi
}

# Analyze changes
analyze_changes() {
    local porcelain_output
    local change_count=0
    
    # Capture git status output
    if porcelain_output=$(git status --porcelain 2>/dev/null); then
        if [ -n "$porcelain_output" ]; then
            change_count=$(echo "$porcelain_output" | wc -l)
            echo "CHANGES_EXIST=true"
            echo "CHANGES_COUNT=$change_count"
            
            # Count different types of changes
            local added=$(echo "$porcelain_output" | grep -c "^A" || true)
            local modified=$(echo "$porcelain_output" | grep -c "^ M" || true)
            local deleted=$(echo "$porcelain_output" | grep -c "^ D" || true)
            local untracked=$(echo "$porcelain_output" | grep -c "^??" || true)
            local staged=$(echo "$porcelain_output" | grep -c "^[MADRC]" || true)
            
            echo "CHANGES_ADDED=$added"
            echo "CHANGES_MODIFIED=$modified"
            echo "CHANGES_DELETED=$deleted"
            echo "CHANGES_UNTRACKED=$untracked"
            echo "CHANGES_STAGED=$staged"
            
            # In detailed mode, show file list
            if [ "$MODE" = "detailed" ]; then
                echo "CHANGES_FILES<<EOF"
                echo "$porcelain_output" | head -20
                echo "EOF"
            fi
        else
            echo "CHANGES_EXIST=false"
            echo "CHANGES_COUNT=0"
        fi
    else
        echo "CHANGES_EXIST=unknown"
        echo "CHANGES_COUNT=0"
    fi
}

# Check push status
check_push_status() {
    local branch="$1"
    local local_commit
    local remote_commit
    local ahead=0
    local behind=0
    
    # Get local commit
    if local_commit=$(git rev-parse HEAD 2>/dev/null); then
        echo "LOCAL_COMMIT=$local_commit"
    else
        echo "LOCAL_COMMIT=unknown"
        return 1
    fi
    
    # Check if we have a remote
    if ! git remote -v | grep -q origin; then
        echo "REMOTE_EXISTS=false"
        echo "PUSH_NEEDED=unknown"
        return 0
    fi
    
    echo "REMOTE_EXISTS=true"
    
    # Get remote commit
    if remote_commit=$(git rev-parse "origin/$branch" 2>/dev/null); then
        echo "REMOTE_COMMIT=$remote_commit"
        
        # Check ahead/behind status
        ahead=$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo "0")
        behind=$(git rev-list --count "HEAD..origin/$branch" 2>/dev/null || echo "0")
        
        echo "COMMITS_AHEAD=$ahead"
        echo "COMMITS_BEHIND=$behind"
        
        if [ "$ahead" -gt 0 ]; then
            echo "PUSH_NEEDED=true"
        else
            echo "PUSH_NEEDED=false"
        fi
        
        if [ "$local_commit" = "$remote_commit" ]; then
            echo "SYNC_STATUS=synced"
        elif [ "$ahead" -gt 0 ] && [ "$behind" -eq 0 ]; then
            echo "SYNC_STATUS=ahead"
        elif [ "$ahead" -eq 0 ] && [ "$behind" -gt 0 ]; then
            echo "SYNC_STATUS=behind"
        else
            echo "SYNC_STATUS=diverged"
        fi
    else
        echo "REMOTE_COMMIT=unknown"
        echo "PUSH_NEEDED=true"
        echo "SYNC_STATUS=no_remote_branch"
    fi
}

# Get repository info
get_repository_info() {
    local remote_url
    local repo_name
    
    # Get remote URL quietly
    if remote_url=$(git remote get-url origin 2>/dev/null); then
        echo "REMOTE_URL=$remote_url"
        
        # Try to get repo name from GitHub CLI
        if command -v gh >/dev/null 2>&1; then
            if repo_name=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
                echo "REPO_NAME=$repo_name"
            else
                # Extract from URL as fallback
                repo_name=$(echo "$remote_url" | sed -E 's|.*[:/]([^/]+/[^/]+)\.git$|\1|')
                echo "REPO_NAME=$repo_name"
            fi
        fi
    else
        echo "REMOTE_URL=none"
        echo "REPO_NAME=unknown"
    fi
}

# Main execution
main() {
    debug "Starting git state analysis (mode: $MODE)"
    
    # Get branch info
    get_current_branch
    
    # Get repository info
    get_repository_info
    
    # Analyze changes
    analyze_changes
    
    # Get branch name for push status check
    local branch
    branch=$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # Check push status
    if [ "$branch" != "unknown" ]; then
        check_push_status "$branch"
    fi
    
    # In detailed mode, add more info
    if [ "$MODE" = "detailed" ]; then
        # Recent commits
        echo "RECENT_COMMITS<<EOF"
        git log --oneline -5 2>/dev/null || echo "No commits found"
        echo "EOF"
        
        # Unpushed commits
        if [ "${PUSH_NEEDED:-false}" = "true" ] && [ "${REMOTE_EXISTS:-false}" = "true" ]; then
            echo "UNPUSHED_COMMITS<<EOF"
            git log --oneline "origin/$branch..HEAD" 2>/dev/null | head -10 || echo "No unpushed commits"
            echo "EOF"
        fi
    fi
}

# Run main function
main

echo "Script success: ${0##*/}"