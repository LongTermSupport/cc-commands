#!/usr/bin/env bash
# Script: issue-ops.sh
# Purpose: GitHub issue operations using gh CLI
# Usage: issue-ops.sh [fetch|create-plan|list] [args]
# Output: Structured issue data

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

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

# Get comprehensive issue information including parent/child relationships
get_issue_full() {
    local issue_num="${1:-}"
    local repo="${2:-}"  # Optional: "owner/repo" or current repo
    require_arg "$issue_num" "issue number"
    
    info "Fetching comprehensive issue data for #$issue_num..."
    
    # Validate issue number
    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        error_exit "Invalid issue number: $issue_num"
    fi
    
    # Set up repo parameter for output
    if [ -n "$repo" ]; then
        echo "TARGET_REPO=$repo"
    else
        echo "TARGET_REPO=current"
    fi
    
    # Get basic issue data with comments - use API to ensure we get actual issues, not PRs
    local issue_json
    if [ -n "$repo" ]; then
        # Use GitHub API to fetch issue and check if it's actually an issue (not a PR)
        issue_json=$(gh api "repos/$repo/issues/$issue_num" 2>/dev/null) || {
            error_exit "Failed to fetch issue #$issue_num from repo $repo. Check that the issue exists and you have access."
        }
        
        # Check if this is actually a pull request
        if echo "$issue_json" | jq -e '.pull_request' >/dev/null 2>&1; then
            error_exit "Issue #$issue_num is actually a pull request, not an issue. Use the issue number, not the PR number."
        fi
    else
        # Get current repo for API call
        local current_repo
        current_repo=$(gh repo view --json nameWithOwner | jq -r '.nameWithOwner // ""' 2>/dev/null) || {
            error_exit "Cannot determine current repository"
        }
        
        issue_json=$(gh api "repos/$current_repo/issues/$issue_num" 2>/dev/null) || {
            error_exit "Failed to fetch issue #$issue_num. Check that the issue exists and you have access."
        }
        
        # Check if this is actually a pull request
        if echo "$issue_json" | jq -e '.pull_request' >/dev/null 2>&1; then
            error_exit "Issue #$issue_num is actually a pull request, not an issue. Use the issue number, not the PR number."
        fi
    fi
    
    # Extract basic information from GitHub API response
    local title
    title=$(echo "$issue_json" | jq -r '.title // "No title"')
    local state
    state=$(echo "$issue_json" | jq -r '.state // "unknown"' | tr '[:lower:]' '[:upper:]')
    local author
    author=$(echo "$issue_json" | jq -r '.user.login // "unknown"')
    local body
    body=$(echo "$issue_json" | jq -r '.body // ""')
    local labels
    labels=$(echo "$issue_json" | jq -r '(.labels // []) | map(.name) | join(",")')
    local assignees
    assignees=$(echo "$issue_json" | jq -r '(.assignees // []) | map(.login) | join(",")')
    local comment_count
    comment_count=$(echo "$issue_json" | jq -r '.comments // 0')
    local url
    url=$(echo "$issue_json" | jq -r '.html_url // ""')
    local repo_name
    if [ -n "$repo" ]; then
        repo_name="$repo"
    else
        # Get current repo name
        repo_name=$(gh repo view --json nameWithOwner | jq -r '.nameWithOwner // "unknown"' 2>/dev/null)
    fi
    local created_at
    created_at=$(echo "$issue_json" | jq -r '.created_at // ""')
    local updated_at
    updated_at=$(echo "$issue_json" | jq -r '.updated_at // ""')
    
    # Get parent issue using GraphQL with sub_issues header
    local parent_json=""
    local parent_info=""
    if [ -n "$repo" ]; then
        # Extract owner/repo from repo parameter
        local owner repo_only
        owner=$(echo "$repo" | cut -d'/' -f1)
        repo_only=$(echo "$repo" | cut -d'/' -f2)
        
        parent_json=$(gh api graphql --header 'GraphQL-Features: sub_issues' -f query="
        {
          repository(owner: \"$owner\", name: \"$repo_only\") {
            issue(number: $issue_num) {
              parent {
                number
                title
                repository {
                  name
                  owner {
                    login
                  }
                }
                url
              }
            }
          }
        }" 2>/dev/null || echo '{}')
        
        parent_info=$(echo "$parent_json" | jq -r '.data.repository.issue.parent // empty')
    else
        # Use current repo - need to get owner/repo from git
        local current_repo
        current_repo=$(gh repo view --json nameWithOwner | jq -r '.nameWithOwner // ""' 2>/dev/null)
        
        if [ -n "$current_repo" ]; then
            local owner repo_only
            owner=$(echo "$current_repo" | cut -d'/' -f1)
            repo_only=$(echo "$current_repo" | cut -d'/' -f2)
            
            parent_json=$(gh api graphql --header 'GraphQL-Features: sub_issues' -f query="
            {
              repository(owner: \"$owner\", name: \"$repo_only\") {
                issue(number: $issue_num) {
                  parent {
                    number
                    title
                    repository {
                      name
                      owner {
                        login
                      }
                    }
                    url
                  }
                }
              }
            }" 2>/dev/null || echo '{}')
            
            parent_info=$(echo "$parent_json" | jq -r '.data.repository.issue.parent // empty')
        fi
    fi
    
    # Get sub-issues using GraphQL
    local subissues_json=""
    local subissues_info=""
    if [ -n "$repo" ]; then
        local owner repo_only
        owner=$(echo "$repo" | cut -d'/' -f1)
        repo_only=$(echo "$repo" | cut -d'/' -f2)
        
        subissues_json=$(gh api graphql --header 'GraphQL-Features: sub_issues' -f query="
        {
          repository(owner: \"$owner\", name: \"$repo_only\") {
            issue(number: $issue_num) {
              subIssues(first: 50) {
                nodes {
                  number
                  title
                  state
                  repository {
                    name
                    owner {
                      login
                    }
                  }
                  url
                }
              }
            }
          }
        }" 2>/dev/null || echo '{}')
        
        subissues_info=$(echo "$subissues_json" | jq -r '.data.repository.issue.subIssues.nodes // []')
    else
        local current_repo
        current_repo=$(gh repo view --json nameWithOwner | jq -r '.nameWithOwner // ""' 2>/dev/null)
        
        if [ -n "$current_repo" ]; then
            local owner repo_only
            owner=$(echo "$current_repo" | cut -d'/' -f1)
            repo_only=$(echo "$current_repo" | cut -d'/' -f2)
            
            subissues_json=$(gh api graphql --header 'GraphQL-Features: sub_issues' -f query="
            {
              repository(owner: \"$owner\", name: \"$repo_only\") {
                issue(number: $issue_num) {
                  subIssues(first: 50) {
                    nodes {
                      number
                      title
                      state
                      repository {
                        name
                        owner {
                          login
                        }
                      }
                      url
                    }
                  }
                }
              }
            }" 2>/dev/null || echo '{}')
            
            subissues_info=$(echo "$subissues_json" | jq -r '.data.repository.issue.subIssues.nodes // []')
        fi
    fi
    
    # Output structured data
    echo "ISSUE_NUMBER=$issue_num"
    echo "ISSUE_TITLE=$title"
    echo "ISSUE_STATE=$state"
    echo "ISSUE_AUTHOR=$author"
    echo "ISSUE_LABELS=$labels"
    echo "ISSUE_ASSIGNEES=$assignees"
    echo "ISSUE_COMMENT_COUNT=$comment_count"
    echo "ISSUE_URL=$url"
    echo "ISSUE_REPOSITORY=$repo_name"
    echo "ISSUE_CREATED_AT=$created_at"
    echo "ISSUE_UPDATED_AT=$updated_at"
    
    # Parent issue information
    if [ -n "$parent_info" ] && [ "$parent_info" != "null" ]; then
        local parent_number
        parent_number=$(echo "$parent_info" | jq -r '.number // ""')
        local parent_title
        parent_title=$(echo "$parent_info" | jq -r '.title // ""')
        local parent_repo
        parent_repo=$(echo "$parent_info" | jq -r '.repository.owner.login + "/" + .repository.name // ""')
        local parent_url
        parent_url=$(echo "$parent_info" | jq -r '.url // ""')
        
        echo "PARENT_ISSUE_EXISTS=true"
        echo "PARENT_ISSUE_NUMBER=$parent_number"
        echo "PARENT_ISSUE_TITLE=$parent_title"
        echo "PARENT_ISSUE_REPOSITORY=$parent_repo"
        echo "PARENT_ISSUE_URL=$parent_url"
    else
        echo "PARENT_ISSUE_EXISTS=false"
    fi
    
    # Sub-issues information
    local subissues_count
    subissues_count=$(echo "$subissues_info" | jq 'length // 0' 2>/dev/null || echo "0")
    # Trim whitespace from count
    subissues_count=$(echo "$subissues_count" | tr -d '[:space:]')
    echo "SUBISSUES_COUNT=$subissues_count"
    
    if [ "$subissues_count" -gt 0 ]; then
        echo "SUBISSUES_EXIST=true"
        
        # List each sub-issue
        local index=0
        echo "$subissues_info" | jq -r '.[] | [.number, .title, .state, (.repository.owner.login + "/" + .repository.name), .url] | @tsv' | \
        while IFS=$'\t' read -r sub_number sub_title sub_state sub_repo sub_url; do
            echo "SUBISSUE_${index}_NUMBER=$sub_number"
            echo "SUBISSUE_${index}_TITLE=$sub_title"
            echo "SUBISSUE_${index}_STATE=$sub_state"
            echo "SUBISSUE_${index}_REPOSITORY=$sub_repo"
            echo "SUBISSUE_${index}_URL=$sub_url"
            index=$((index + 1))
        done
    else
        echo "SUBISSUES_EXIST=false"
    fi
    
    # Save full issue data including comments to temp files
    local issue_file="/tmp/issue_${issue_num}_full.json"
    echo "$issue_json" > "$issue_file"
    echo "ISSUE_FULL_DATA_FILE=$issue_file"
    
    # Save body to temp file if needed
    if [ -n "$body" ]; then
        local body_file="/tmp/issue_${issue_num}_body.md"
        echo "$body" > "$body_file"
        echo "ISSUE_BODY_FILE=$body_file"
    else
        echo "ISSUE_BODY_FILE="
    fi
    
    # Save comments to temp file if any exist
    if [ "$comment_count" -gt 0 ]; then
        local comments_file="/tmp/issue_${issue_num}_comments.json"
        echo "$issue_json" | jq '.comments // []' > "$comments_file"
        echo "ISSUE_COMMENTS_FILE=$comments_file"
    else
        echo "ISSUE_COMMENTS_FILE="
    fi
    
    # Save parent issue data if it exists
    if [ -n "$parent_info" ] && [ "$parent_info" != "null" ]; then
        local parent_file="/tmp/issue_${issue_num}_parent.json"
        echo "$parent_info" > "$parent_file"
        echo "PARENT_ISSUE_DATA_FILE=$parent_file"
    else
        echo "PARENT_ISSUE_DATA_FILE="
    fi
    
    # Save sub-issues data if they exist
    if [ "$subissues_count" -gt 0 ]; then
        local subissues_file="/tmp/issue_${issue_num}_subissues.json"
        echo "$subissues_info" > "$subissues_file"
        echo "SUBISSUES_DATA_FILE=$subissues_file"
    else
        echo "SUBISSUES_DATA_FILE="
    fi
    
    success "Comprehensive issue data fetched for #$issue_num"
    if [ -n "$parent_info" ] && [ "$parent_info" != "null" ]; then
        info "Found parent issue: $(echo "$parent_info" | jq -r '.repository.owner.login + "/" + .repository.name')#$(echo "$parent_info" | jq -r '.number')"
    fi
    if [ "$subissues_count" -gt 0 ]; then
        info "Found $subissues_count sub-issue(s)"
    fi
}

# Main script logic
OPERATION="${1:-}"

case "$OPERATION" in
    fetch)
        ISSUE_NUM="${2:-}"
        fetch_issue "$ISSUE_NUM"
        ;;
    fetch-full)
        ISSUE_NUM="${2:-}"
        REPO="${3:-}"  # Optional repo parameter
        get_issue_full "$ISSUE_NUM" "$REPO"
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
        error_exit "Unknown operation: $OPERATION. Valid operations: fetch, fetch-full, create-plan, list, check, comment"
        ;;
esac

