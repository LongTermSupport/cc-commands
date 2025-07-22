#!/usr/bin/env bash
# Script: plan_issue_fetch.bash
# Purpose: Fetch detailed GitHub issue data
# Usage: plan_issue_fetch.bash "issue_argument"
# Output: Issue data fetching results in KEY=value format

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
    local issue_arg="$1"
    
    echo "✓ Fetching detailed issue data from GitHub"
    echo "=== Fetching Issue Data ==="
    
    # Extract issue number from argument
    if [[ "$issue_arg" =~ ^https://github.com/.*/issues/([0-9]+) ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
    elif [[ "$issue_arg" =~ ^#?([0-9]+)$ ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
    else
        echo "Invalid issue argument format: $issue_arg"
        error_exit "Invalid issue argument format"
    fi
    
    echo "=== Fetching Issue Data for #$ISSUE_NUM ==="
    
    # Fetch issue data using gh CLI
    if gh issue view "$ISSUE_NUM" --json number,title,body,author,createdAt,updatedAt,labels,assignees,milestone,state,comments > "/tmp/issue-$ISSUE_NUM.json" 2>&1; then
        echo "✓ Issue data fetched successfully"
        echo "FETCH_SUCCESS=true"
        echo "ISSUE_JSON_FILE=/tmp/issue-$ISSUE_NUM.json"
        echo "ISSUE_NUMBER=$ISSUE_NUM"
        
        # Extract and display key information
        TITLE=$(jq -r '.title' "/tmp/issue-$ISSUE_NUM.json")
        AUTHOR=$(jq -r '.author.login' "/tmp/issue-$ISSUE_NUM.json")
        STATE=$(jq -r '.state' "/tmp/issue-$ISSUE_NUM.json")
        COMMENTS=$(jq '.comments | length' "/tmp/issue-$ISSUE_NUM.json")
        LABELS=$(jq -r '.labels | map(.name) | join(", ")' "/tmp/issue-$ISSUE_NUM.json" || echo "none")
        
        echo "Title: $TITLE"
        echo "Author: $AUTHOR"
        echo "State: $STATE"
        echo "Comments: $COMMENTS"
        echo "Labels: $LABELS"
        
        # Export for use by other scripts
        echo "ISSUE_TITLE=$TITLE"
        echo "ISSUE_AUTHOR=$AUTHOR"
        echo "ISSUE_STATE=$STATE"
        echo "ISSUE_COMMENTS=$COMMENTS"
        echo "ISSUE_LABELS=$LABELS"
    else
        echo "Failed to fetch issue #$ISSUE_NUM"
        echo "FETCH_SUCCESS=false"
        error_exit "Failed to fetch issue #$ISSUE_NUM"
    fi
    
    echo "✓ Issue data fetch complete"
}

# Check if issue argument provided
if [ $# -eq 0 ]; then
    error_exit "Issue argument required"
fi

main "$1"
