#!/usr/bin/env bash
# Script: plan_env_validate.bash
# Purpose: Validate GitHub issue planning environment
# Usage: plan_env_validate.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Source error handler
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Validating GitHub environment and project setup"
    echo "=== GitHub Issue Planning Environment Check ==="
    
    # Check if we're in a git repository
    if test -d .git; then
        echo "✓ Git repository found"
        echo "GIT_REPO=true"
    else
        echo "✗ Not in a git repository"
        echo "GIT_REPO=false"
        error_exit "Not in a git repository"
    fi
    
    # Check if gh CLI is available
    if which gh >/dev/null 2>&1; then
        GH_VERSION=$(gh --version | head -1)
        echo "✓ gh CLI available ($GH_VERSION)"
        echo "GH_AVAILABLE=true"
    else
        echo "✗ gh CLI not found - required for GitHub operations"
        echo "GH_AVAILABLE=false"
        error_exit "gh CLI not found"
    fi
    
    # Check GitHub authentication
    if gh auth status >/dev/null 2>&1; then
        echo "✓ GitHub authenticated"
        echo "GH_AUTHENTICATED=true"
    else
        echo "✗ Not authenticated with GitHub - run: gh auth login"
        echo "GH_AUTHENTICATED=false"
        error_exit "Not authenticated with GitHub"
    fi
    
    # Check CLAUDE directory structure
    if test -d CLAUDE; then
        echo "✓ CLAUDE directory exists"
        echo "CLAUDE_DIR=true"
    else
        echo "✗ CLAUDE directory not found"
        echo "CLAUDE_DIR=false"
        error_exit "CLAUDE directory not found"
    fi
    
    # Check/create CLAUDE/plan directory
    if test -d CLAUDE/plan; then
        echo "✓ CLAUDE/plan directory exists"
        echo "CLAUDE_PLAN_DIR=true"
    else
        echo "⚠ CLAUDE/plan directory not found - will create"
        mkdir -p CLAUDE/plan
        echo "CLAUDE_PLAN_DIR=created"
    fi
    
    # Check for PlanWorkflow.md
    if test -f CLAUDE/PlanWorkflow.md; then
        echo "✓ PlanWorkflow.md found"
        echo "PLAN_WORKFLOW=true"
    else
        echo "⚠ PlanWorkflow.md not found - will use defaults"
        echo "PLAN_WORKFLOW=false"
    fi
    
    echo "ENVIRONMENT_VALID=true"
    echo "✓ Environment validation complete"
}

main
