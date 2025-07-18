#!/usr/bin/env bash
# Script: push_env_check.bash
# Purpose: Quick environment check for push command
# Usage: push_env_check.bash
# Output: Structured validation results

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load error handlers only
source "$COMMON_DIR/error/error_handlers.bash"

# Quick validation checks
main() {
    local all_valid=true
    
    # Git repository check
    if silent_run "test -d .git"; then
        echo "GIT_REPO=true"
    else
        echo "GIT_REPO=false"
        all_valid=false
    fi
    
    # Git command check
    if silent_run "which git"; then
        echo "GIT_CMD=true"
    else
        echo "GIT_CMD=false"
        all_valid=false
    fi
    
    # GitHub CLI check
    if silent_run "which gh"; then
        echo "GH_CMD=true"
        
        # Auth check
        if silent_run "gh auth status"; then
            echo "GH_AUTH=true"
        else
            echo "GH_AUTH=false"
            all_valid=false
        fi
    else
        echo "GH_CMD=false"
        echo "GH_AUTH=false"
        all_valid=false
    fi
    
    # Remote check
    if silent_run "git remote get-url origin"; then
        echo "GIT_REMOTE=true"
    else
        echo "GIT_REMOTE=false"
        all_valid=false
    fi
    
    # Working directory
    echo "WORKING_DIR=$(pwd)"
    
    # Overall status
    if [ "$all_valid" = "true" ]; then
        echo "ALL_CHECKS_PASSED=true"
    else
        echo "ALL_CHECKS_PASSED=false"
    fi
}

# Run checks
main

echo "Script success: ${0##*/}"