#!/usr/bin/env bash
# Script: status.sh
# Purpose: Get git repository status information
# Usage: bash status.sh
# Output: Structured git status data

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define path to common directory
COMMON_DIR="$SCRIPT_DIR/.."
source "$COMMON_DIR/_inc/error_handler.inc.bash"
source "$SCRIPT_DIR/git_operations.bash"

# Main status gathering
info "Checking git status..."

# Get branch info
git_get_current_branch

# Get change info
git_check_changes

# Get remote status
if git remote -v | grep -q origin; then
    echo "REMOTE_EXISTS=true"
    
    # Try to get ahead/behind info
    if [ "$DETACHED" != "true" ]; then
        local upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
        
        if [ -n "$upstream" ]; then
            echo "UPSTREAM_SET=true"
            echo "UPSTREAM=$upstream"
            
            local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
            local behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
            
            echo "COMMITS_AHEAD=$ahead"
            echo "COMMITS_BEHIND=$behind"
        else
            echo "UPSTREAM_SET=false"
            echo "COMMITS_AHEAD=0"
            echo "COMMITS_BEHIND=0"
        fi
    fi
else
    echo "REMOTE_EXISTS=false"
fi

# Get last commit info
if git rev-parse HEAD >/dev/null 2>&1; then
    local last_commit=$(git rev-parse --short HEAD)
    local last_message=$(git log -1 --pretty=%B | head -1)
    local last_author=$(git log -1 --pretty=%an)
    local last_date=$(git log -1 --pretty=%ar)
    
    echo "LAST_COMMIT=$last_commit"
    echo "LAST_MESSAGE=$last_message"
    echo "LAST_AUTHOR=$last_author"
    echo "LAST_DATE=$last_date"
else
    echo "LAST_COMMIT="
    warn "No commits in repository"
fi

# Summary message
if [ "$CHANGES_EXIST" = "true" ]; then
    info "Working tree has $CHANGES_COUNT uncommitted changes"
else
    success "Working tree is clean"
fi

