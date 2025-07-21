#!/usr/bin/env bash
# Script: env_validate.bash
# Purpose: Comprehensive environment validation functions
# Usage: source env_validate.bash && validate_git_environment
# Output: Status messages and structured KEY=value data

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define path to common directory
COMMON_DIR="$SCRIPT_DIR/.."
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Check if we're in a git repository
check_git_repository() {
    if [ -d .git ]; then
        echo "GIT_REPO=true"
        return 0
    else
        echo "GIT_REPO=false"
        return 1
    fi
}

# Check if a tool is available
check_tool_available() {
    local tool="${1:-}"
    require_arg "$tool" "tool name"
    
    if command -v "$tool" >/dev/null 2>&1; then
        echo "${tool^^}_AVAILABLE=true"
        return 0
    else
        echo "${tool^^}_AVAILABLE=false"
        return 1
    fi
}

# Check GitHub CLI authentication
check_github_auth() {
    if gh auth status >/dev/null 2>&1; then
        echo "GH_AUTH=true"
        local user
        user=$(gh api user --jq .login 2>/dev/null || echo "unknown")
        echo "GH_USER=$user"
        return 0
    else
        echo "GH_AUTH=false"
        echo "GH_USER="
        return 1
    fi
}

# Check CLAUDE directory structure
check_claude_structure() {
    local issues=0
    
    # Check main CLAUDE directory
    if [ -d "CLAUDE" ]; then
        echo "CLAUDE_DIR=true"
    else
        echo "CLAUDE_DIR=false"
        ((issues++))
    fi
    
    # Check critical files
    local critical_files=(
        "CLAUDE/PlanWorkflow.md"
        "CLAUDE/Core/CodeStandards.md"
        "CLAUDE/Tools/Commands.md"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            debug "Found: $file"
        else
            warn "Missing critical file: $file"
            ((issues++))
        fi
    done
    
    if [ $issues -eq 0 ]; then
        echo "CLAUDE_STRUCTURE=valid"
        return 0
    else
        echo "CLAUDE_STRUCTURE=invalid"
        echo "CLAUDE_ISSUES=$issues"
        return 1
    fi
}

# Validate complete git environment
validate_git_environment() {
    info "Validating git environment..."
    
    local failed=0
    
    # Check git repository
    if check_git_repository; then
        success "Git repository found"
    else
        error_exit "Not in a git repository"
    fi
    
    # Check git command
    if check_tool_available "git"; then
        success "Git command available"
    else
        error_exit "Git command not found"
    fi
    
    # Get git status info
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo "GIT_BRANCH=$branch"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo "GIT_CLEAN=false"
        warn "Uncommitted changes detected"
    else
        echo "GIT_CLEAN=true"
    fi
    
    return 0
}

# Validate GitHub environment
validate_github_environment() {
    info "Validating GitHub environment..."
    
    # Check gh command
    if ! check_tool_available "gh"; then
        error_exit "GitHub CLI (gh) not found. Please install: https://cli.github.com/"
    fi
    success "GitHub CLI available"
    
    # Check authentication
    if ! check_github_auth; then
        error_exit "Not authenticated with GitHub. Run: gh auth login"
    fi
    success "GitHub authenticated"
    
    # Check repo connection
    if gh repo view >/dev/null 2>&1; then
        echo "GH_REPO_CONNECTED=true"
        local repo
        repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
        echo "GH_REPO=$repo"
        success "Connected to GitHub repository: $repo"
    else
        echo "GH_REPO_CONNECTED=false"
        warn "Not connected to a GitHub repository"
    fi
    
    return 0
}

# Validate CLAUDE project structure
validate_claude_environment() {
    info "Validating CLAUDE project structure..."
    
    if check_claude_structure; then
        success "CLAUDE structure validated"
    else
        warn "CLAUDE structure has issues - some features may not work correctly"
        return 1
    fi
    
    # Check for plan directory
    if [ -d "CLAUDE/plan" ]; then
        echo "PLAN_DIR=CLAUDE/plan"
        success "Plan directory found"
    else
        echo "PLAN_DIR="
        warn "Plan directory not found at CLAUDE/plan"
    fi
    
    return 0
}

# Validate all environments
validate_all() {
    local failed=0
    
    validate_git_environment || ((failed++))
    validate_github_environment || ((failed++))
    validate_claude_environment || ((failed++))
    
    if [ $failed -eq 0 ]; then
        success "All environment validations passed"
        return 0
    else
        error_exit "Environment validation failed with $failed errors"
    fi
}

# Make functions available for scripts that source this file
