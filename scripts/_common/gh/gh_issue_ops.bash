#!/usr/bin/env bash
# Script: issue-ops.sh
# Purpose: GitHub issue operations using gh CLI
# Usage: issue-ops.sh [fetch|create-plan|list] [args]
# Output: Structured issue data

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define path to common directory
COMMON_DIR="$SCRIPT_DIR/.."
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Fetch issue details
fetch_issue() {
    local issue_num="${1:-}"
    require_arg "$issue_num" "issue number"
    
    info "Fetching issue #$issue_num..."
    
    # Validate issue number
    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        error_exit "Invalid issue number: $issue_num"
    fi
    
    # Fetch issue data
    local issue_json
    issue_json=$(gh issue view "$issue_num" --json number,title,body,author,state,labels,assignees,milestone,comments 2>/dev/null) || {
        error_exit "Failed to fetch issue #$issue_num. Check that the issue exists and you have access."
    }
    
    # Parse JSON data
    local title
    title=$(echo "$issue_json" | jq -r '.title // "No title"')
    local state
    state=$(echo "$issue_json" | jq -r '.state // "unknown"')
    local author
    author=$(echo "$issue_json" | jq -r '.author.login // "unknown"')
    local body
    body=$(echo "$issue_json" | jq -r '.body // ""')
    local labels
    labels=$(echo "$issue_json" | jq -r '(.labels // []) | map(.name) | join(",")')
    local assignees
    assignees=$(echo "$issue_json" | jq -r '(.assignees // []) | map(.login) | join(",")')
    local comment_count
    comment_count=$(echo "$issue_json" | jq -r '(.comments // []) | length')
    
    # Output structured data
    echo "ISSUE_NUMBER=$issue_num"
    echo "ISSUE_TITLE=$title"
    echo "ISSUE_STATE=$state"
    echo "ISSUE_AUTHOR=$author"
    echo "ISSUE_LABELS=$labels"
    echo "ISSUE_ASSIGNEES=$assignees"
    echo "ISSUE_COMMENT_COUNT=$comment_count"
    
    # Save body to temp file if needed
    if [ -n "$body" ]; then
        local body_file="/tmp/issue_${issue_num}_body.md"
        echo "$body" > "$body_file"
        echo "ISSUE_BODY_FILE=$body_file"
    else
        echo "ISSUE_BODY_FILE="
    fi
    
    success "Fetched issue #$issue_num: $title"
}

# Create plan from issue
create_plan_from_issue() {
    local issue_num="${1:-}"
    require_arg "$issue_num" "issue number"
    
    # First fetch the issue
    eval "$(fetch_issue "$issue_num")"
    
    if [ "$ISSUE_STATE" != "open" ]; then
        warn "Issue #$issue_num is $ISSUE_STATE"
    fi
    
    # Create plan filename
    local safe_title
    safe_title=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
    local plan_name="issue-${issue_num}-${safe_title}"
    
    # Truncate if too long
    if [ ${#plan_name} -gt 100 ]; then
        plan_name="${plan_name:0:100}"
    fi
    
    echo "PLAN_NAME=$plan_name"
    echo "PLAN_ISSUE=$issue_num"
    
    # Read issue body if available
    if [ -n "$ISSUE_BODY_FILE" ] && [ -f "$ISSUE_BODY_FILE" ]; then
        echo "ISSUE_BODY_AVAILABLE=true"
    else
        echo "ISSUE_BODY_AVAILABLE=false"
    fi
    
    success "Ready to create plan: $plan_name"
}

# List recent issues
list_issues() {
    local state="${1:-open}"
    local limit="${2:-20}"
    
    info "Listing $state issues (limit: $limit)..."
    
    # Fetch issues
    local issues_json
    issues_json=$(gh issue list --state "$state" --limit "$limit" --json number,title,author,labels,updatedAt 2>/dev/null) || {
        error_exit "Failed to list issues"
    }
    
    # Count issues
    local count
    count=$(echo "$issues_json" | jq 'length')
    echo "ISSUE_COUNT=$count"
    
    if [ "$count" -eq 0 ]; then
        warn "No $state issues found"
        return 0
    fi
    
    # Process each issue
    echo "$issues_json" | jq -r '.[] | [.number, .title, .author.login, (.labels | map(.name) | join(",")), .updatedAt] | @tsv' | \
    while IFS=$'\t' read -r number title author labels updated; do
        # Format updated date
        local updated_formatted
        updated_formatted=$(date -d "$updated" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$updated")
        
        # Truncate title if too long
        if [ ${#title} -gt 60 ]; then
            title="${title:0:57}..."
        fi
        
        echo "#$number: $title"
        echo "  Author: $author | Updated: $updated_formatted"
        [ -n "$labels" ] && echo "  Labels: $labels"
        echo ""
    done
}

# Check if issue exists and is accessible
check_issue_access() {
    local issue_num="${1:-}"
    require_arg "$issue_num" "issue number"
    
    if gh issue view "$issue_num" --json number >/dev/null 2>&1; then
        echo "ISSUE_ACCESSIBLE=true"
        return 0
    else
        echo "ISSUE_ACCESSIBLE=false"
        return 1
    fi
}

# Add comment to issue
add_issue_comment() {
    local issue_num="${1:-}"
    local comment="${2:-}"
    require_arg "$issue_num" "issue number"
    require_arg "$comment" "comment text"
    
    info "Adding comment to issue #$issue_num..."
    
    if gh issue comment "$issue_num" --body "$comment" >/dev/null 2>&1; then
        echo "COMMENT_ADDED=true"
        success "Comment added to issue #$issue_num"
        return 0
    else
        echo "COMMENT_ADDED=false"
        error_exit "Failed to add comment to issue #$issue_num"
    fi
}

# Main script logic
OPERATION="${1:-}"

case "$OPERATION" in
    fetch)
        ISSUE_NUM="${2:-}"
        fetch_issue "$ISSUE_NUM"
        ;;
    create-plan)
        ISSUE_NUM="${2:-}"
        create_plan_from_issue "$ISSUE_NUM"
        ;;
    list)
        STATE="${2:-open}"
        LIMIT="${3:-20}"
        list_issues "$STATE" "$LIMIT"
        ;;
    check)
        ISSUE_NUM="${2:-}"
        check_issue_access "$ISSUE_NUM"
        ;;
    comment)
        ISSUE_NUM="${2:-}"
        COMMENT="${3:-}"
        add_issue_comment "$ISSUE_NUM" "$COMMENT"
        ;;
    *)
        error_exit "Unknown operation: $OPERATION. Valid operations: fetch, create-plan, list, check, comment"
        ;;
esac

