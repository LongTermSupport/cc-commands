#!/usr/bin/env bash
# Script: env_validate.bash
# Purpose: Validate environment prerequisites for GitHub project summary
# Usage: env_validate.bash
# Output: KEY=value pairs indicating environment status

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../../_common"

source "$COMMON_DIR/_inc/error_handler.inc.bash"

info "Validating environment for GitHub project summary..."

# Check required tools
MISSING_TOOLS=""

if ! silent_run "which gh"; then
    MISSING_TOOLS="$MISSING_TOOLS gh"
fi

if ! silent_run "which jq"; then
    MISSING_TOOLS="$MISSING_TOOLS jq"
fi

if ! silent_run "which git"; then
    MISSING_TOOLS="$MISSING_TOOLS git"
fi

if [[ -n "$MISSING_TOOLS" ]]; then
    echo "PREREQUISITES_MET=false"
    echo "ERROR_MESSAGE=Missing required tools:$MISSING_TOOLS"
    error_exit "Missing required tools:$MISSING_TOOLS"
fi

# Check GitHub CLI authentication
if run_with_output "gh auth status" "GitHub CLI authentication check failed"; then
    echo "GH_AUTH=true"
    success "GitHub CLI is authenticated"
else
    echo "PREREQUISITES_MET=false"
    echo "GH_AUTH=false"
    echo "ERROR_MESSAGE=GitHub CLI is not authenticated. Run: gh auth login"
    error_exit "GitHub CLI is not authenticated. Run: gh auth login"
fi

# Check network connectivity to GitHub
if run_with_output "gh api user" "GitHub API connectivity check failed"; then
    success "GitHub API is accessible"
else
    echo "PREREQUISITES_MET=false"
    echo "GH_AUTH=false"
    echo "ERROR_MESSAGE=Cannot access GitHub API. Check network connection."
    error_exit "Cannot access GitHub API. Check network connection."
fi

# All checks passed
echo "PREREQUISITES_MET=true"
success "All environment prerequisites are met"

echo "Script success: ${0##*/}"