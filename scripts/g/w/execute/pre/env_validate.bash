#!/usr/bin/env bash
# Script: execute_env_validate.bash
# Purpose: Validate environment for g:w:execute command
# Usage: execute_env_validate.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

main() {
    echo "✓ Validating environment for plan execution"
    echo "=== ENVIRONMENT VALIDATION ==="
    
    # Find plan directory (case-insensitive)
    PLAN_DIR=$(find . -maxdepth 2 -iname "plan" -type d | grep -i "claude/plan" | head -1 || echo "")
    if [ -n "$PLAN_DIR" ]; then
        echo "PLAN_DIR=$PLAN_DIR"
        echo "PLAN_DIR_EXISTS=true"
        echo "✓ Found plan directory: $PLAN_DIR"
    else
        echo "PLAN_DIR=not_found"
        echo "PLAN_DIR_EXISTS=false"
        echo "⚠ No plan directory found"
    fi
    
    # Check workflow documentation
    if [ -f "CLAUDE/PlanWorkflow.md" ]; then
        echo "WORKFLOW_DOC=exists"
        echo "✓ Found workflow documentation"
    else
        echo "WORKFLOW_DOC=missing"
        echo "⚠ No workflow documentation found"
    fi
    
    # Check git availability
    if which git >/dev/null 2>&1; then
        echo "GIT_AVAILABLE=true"
        echo "✓ Git is available"
    else
        echo "GIT_AVAILABLE=false"
        echo "⚠ Git not available"
    fi
    
    # Check if in git repo
    if [ -d .git ]; then
        echo "IN_GIT_REPO=true"
        echo "✓ In git repository"
    else
        echo "IN_GIT_REPO=false"
        echo "⚠ Not in git repository"
    fi
    
    # Check QA tool
    if [ -f bin/qa ]; then
        echo "QA_TOOL=exists"
        echo "✓ QA tool available"
    else
        echo "QA_TOOL=missing"
        echo "⚠ QA tool not found"
    fi
    
    echo "✓ Environment validation complete"
}

main
echo "Script success: ${0##*/}"