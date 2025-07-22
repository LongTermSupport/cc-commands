#!/usr/bin/env bash
# Script: plan_file_create.bash
# Purpose: Create and validate plan file for GitHub issue
# Usage: plan_file_create.bash "issue_number" "issue_title"
# Output: Plan file creation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

main() {
    local issue_num="$1"
    local issue_title="$2"
    
    echo "✓ Creating plan file"
    echo "=== Plan File Creation ==="
    
    # Convert title to kebab-case for filename
    local kebab_title
    kebab_title=$(echo "$issue_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    # Create plan file path
    local plan_file="CLAUDE/plan/issue-${issue_num}-${kebab_title}.md"
    
    # Check if file already exists
    if [ -f "$plan_file" ]; then
        echo "WARNING: Plan file already exists: $plan_file"
        echo "Please remove or rename the existing file first"
        echo "PLAN_FILE_EXISTS=true"
        echo "PLAN_FILE_PATH=$plan_file"
        error_exit "Plan file already exists"
    fi
    
    echo "✓ Plan file path validated: $plan_file"
    echo "PLAN_FILE_EXISTS=false"
    echo "PLAN_FILE_PATH=$plan_file"
    echo "PLAN_FILE_KEBAB_TITLE=$kebab_title"
    
    echo "✓ Plan file creation setup complete"
}

# Check if required arguments provided
if [ $# -lt 2 ]; then
    error_exit "Issue number and title required as arguments"
fi

main "$1" "$2"
