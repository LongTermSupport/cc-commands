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
    
    echo "✓ Fetching comprehensive issue data from GitHub"
    echo "=== Fetching Issue Data ==="
    
    # Extract issue number and repo from argument
    local ISSUE_NUM=""
    local REPO=""
    
    if [[ "$issue_arg" =~ ^https://github.com/([^/]+/[^/]+)/issues/([0-9]+) ]]; then
        REPO="${BASH_REMATCH[1]}"
        ISSUE_NUM="${BASH_REMATCH[2]}"
    elif [[ "$issue_arg" =~ ^([^/]+/[^/]+)#([0-9]+)$ ]]; then
        REPO="${BASH_REMATCH[1]}"
        ISSUE_NUM="${BASH_REMATCH[2]}"
    elif [[ "$issue_arg" =~ ^#?([0-9]+)$ ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
        # Leave REPO empty to use current repo
    else
        echo "Invalid issue argument format: $issue_arg"
        error_exit "Invalid issue argument format: expected URL, repo#issue, or issue number"
    fi
    
    echo "=== Fetching Comprehensive Issue Data for #$ISSUE_NUM ==="
    if [[ -n "$REPO" ]]; then
        echo "Repository: $REPO"
    else
        echo "Repository: current"
    fi
    
    # Use our comprehensive fetch-full function
    local fetch_output
    local temp_file=$(mktemp)
    
    if bash "$COMMON_DIR/gh/gh_issue_ops.bash" fetch-full "$ISSUE_NUM" "$REPO" > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract all the rich data from fetch-full output
        local key value
        while IFS='=' read -r key value; do
            case "$key" in
                ISSUE_NUMBER|ISSUE_TITLE|ISSUE_STATE|ISSUE_AUTHOR|ISSUE_LABELS|ISSUE_ASSIGNEES|ISSUE_COMMENT_COUNT|ISSUE_URL|ISSUE_REPOSITORY|ISSUE_CREATED_AT|ISSUE_UPDATED_AT)
                    echo "$key=$value"
                    ;;
                PARENT_ISSUE_EXISTS|PARENT_ISSUE_NUMBER|PARENT_ISSUE_TITLE|PARENT_ISSUE_REPOSITORY|PARENT_ISSUE_URL)
                    echo "$key=$value"
                    ;;
                SUBISSUES_COUNT|SUBISSUES_EXIST|SUBISSUE_*_NUMBER|SUBISSUE_*_TITLE|SUBISSUE_*_STATE|SUBISSUE_*_REPOSITORY|SUBISSUE_*_URL)
                    echo "$key=$value"
                    ;;
                ISSUE_FULL_DATA_FILE|ISSUE_BODY_FILE|ISSUE_COMMENTS_FILE|PARENT_ISSUE_DATA_FILE|SUBISSUES_DATA_FILE)
                    echo "$key=$value"
                    ;;
            esac
        done < "$temp_file"
        
        echo "FETCH_SUCCESS=true"
        echo "COMPREHENSIVE_FETCH=true"
        
        # Display summary of what we found
        echo ""
        echo "=== ISSUE RELATIONSHIP SUMMARY ==="
        
        # Check for parent issue
        if grep -q "PARENT_ISSUE_EXISTS=true" "$temp_file"; then
            local parent_repo parent_num parent_title
            parent_repo=$(grep "PARENT_ISSUE_REPOSITORY=" "$temp_file" | cut -d'=' -f2-)
            parent_num=$(grep "PARENT_ISSUE_NUMBER=" "$temp_file" | cut -d'=' -f2-)
            parent_title=$(grep "PARENT_ISSUE_TITLE=" "$temp_file" | cut -d'=' -f2-)
            echo "✓ Found parent issue: $parent_repo#$parent_num - $parent_title"
            echo "PARENT_FOUND=true"
        else
            echo "✓ No parent issue found - this is a root issue"
            echo "PARENT_FOUND=false"
        fi
        
        # Check for sub-issues
        local subissues_count
        subissues_count=$(grep "SUBISSUES_COUNT=" "$temp_file" | cut -d'=' -f2-)
        if [[ "${subissues_count:-0}" -gt 0 ]]; then
            echo "✓ Found $subissues_count sub-issue(s)"
            echo "SUBISSUES_FOUND=true"
        else
            echo "✓ No sub-issues found"
            echo "SUBISSUES_FOUND=false"
        fi
        
        # Check for comments with potential browser console info
        local comment_count
        comment_count=$(grep "ISSUE_COMMENT_COUNT=" "$temp_file" | cut -d'=' -f2-)
        if [[ "${comment_count:-0}" -gt 0 ]]; then
            echo "✓ Found $comment_count comment(s) - checking for browser console URLs"
            echo "COMMENTS_AVAILABLE=true"
        else
            echo "✓ No comments found"
            echo "COMMENTS_AVAILABLE=false"
        fi
        
    else
        echo "Failed to fetch comprehensive issue data for #$ISSUE_NUM"
        cat "$temp_file" >&2
        rm -f "$temp_file"
        echo "FETCH_SUCCESS=false"
        error_exit "Failed to fetch comprehensive issue data for #$ISSUE_NUM"
    fi
    
    rm -f "$temp_file"
    echo "✓ Comprehensive issue data fetch complete"
}

# Check if issue argument provided
if [ $# -eq 0 ]; then
    error_exit "Issue argument required"
fi

main "$1"
