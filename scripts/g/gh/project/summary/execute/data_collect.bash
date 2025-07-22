#!/usr/bin/env bash
# Script: data_collect.bash
# Purpose: Collect GitHub project data with dynamic organization and project detection
# Usage: data_collect.bash [org] [project_id]
# Output: KEY=value pairs with collection results and data file location

set -euo pipefail
IFS=$'\n\t'

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

# Arguments
ORG="${1:-}"
PROJECT_ID="${2:-}"

if [[ -z "$ORG" || -z "$PROJECT_ID" ]]; then
    echo "DATA_COLLECTED=false"
    echo "ERROR_MESSAGE=Organization and project ID are required"
    error_exit "Usage: data_collect.bash <org> <project_id>"
fi

# Use var directory for output file
VAR_PATH=$(get_var_path)
OUTPUT_FILE="$VAR_PATH/github-project-summary-$(date +%Y%m%d-%H%M%S).json"
SINCE_DATE=$(date -d '24 hours ago' -Iseconds)

# Set up temp file cleanup
setup_temp_cleanup

info "Collecting GitHub project data for $ORG / $PROJECT_ID since $SINCE_DATE..."
info "Output file: $OUTPUT_FILE"

# Initialize JSON structure
cat > "$OUTPUT_FILE" << 'EOF'
{
  "collection_timestamp": "",
  "since_date": "",
  "organization": "",
  "project_info": {},
  "project_items": [],
  "repositories": {},
  "recent_activity": {
    "issues": [],
    "pull_requests": [],
    "commits": [],
    "issue_comments": [],
    "repository_events": []
  }
}
EOF

# Update metadata
jq --arg timestamp "$(date -Iseconds)" \
   --arg since "$SINCE_DATE" \
   --arg org "$ORG" \
   '.collection_timestamp = $timestamp | .since_date = $since | .organization = $org' \
   "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

# Get project information
info "Fetching project details..."
PROJECT_TEMP=$(create_temp_file "project_info")
if gh project view "$PROJECT_ID" --owner "$ORG" --format json > "$PROJECT_TEMP"; then
    jq --slurpfile project_info "$PROJECT_TEMP" '.project_info = $project_info[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    cleanup_temp_file "$PROJECT_TEMP"
    success "Project information collected"
else
    echo "DATA_COLLECTED=false"
    echo "ERROR_MESSAGE=Failed to fetch project information"
    error_exit "Failed to fetch project information for $ORG / $PROJECT_ID"
fi

# Get all project items
info "Fetching project items..."
ITEMS_TEMP=$(create_temp_file "project_items")
if gh project item-list "$PROJECT_ID" --owner "$ORG" --format json --limit 500 > "$ITEMS_TEMP"; then
    jq --slurpfile items "$ITEMS_TEMP" '.project_items = $items[0].items' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    cleanup_temp_file "$ITEMS_TEMP"
    success "Project items collected"
else
    echo "DATA_COLLECTED=false"
    echo "ERROR_MESSAGE=Failed to fetch project items"
    error_exit "Failed to fetch project items for $ORG / $PROJECT_ID"
fi

# Extract repositories from project items
info "Extracting repositories from project items..."
REPO_LIST=$(jq -r '.project_items[] | 
  if .content.repository then
    if (.content.repository | type) == "string" then
      .content.repository | split("/")[1] // empty
    else
      .content.repository.name // empty  
    end
  else
    empty
  end' "$OUTPUT_FILE" | sort -u | grep -v '^$')

if [[ -z "$REPO_LIST" ]]; then
    warning "No repositories found in project items. Using organization repositories with recent activity."
    
    # Fallback: get organization repositories with recent activity
    REPO_LIST=$(gh api "orgs/$ORG/repos" --paginate --jq '.[] | select(.updated_at > "'$(date -d '7 days ago' -Iseconds)'") | .name' | head -10)
fi

REPO_COUNT=$(echo "$REPO_LIST" | wc -l)
info "Processing $REPO_COUNT repositories..."

# Process each repository
while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    
    info "Processing repository: $repo"
    
    # Create temp files for this repo's data (using var/ directory)
    REPO_INFO_TEMP=$(create_temp_file "repo_info_$repo")
    ISSUES_TEMP=$(create_temp_file "issues_$repo")
    PRS_TEMP=$(create_temp_file "prs_$repo") 
    COMMITS_TEMP=$(create_temp_file "commits_$repo")
    COMMENTS_TEMP=$(create_temp_file "comments_$repo")
    EVENTS_TEMP=$(create_temp_file "events_$repo")
    
    # Get repository info
    if gh api "repos/$ORG/$repo" > "$REPO_INFO_TEMP"; then
        debug "Repository info collected for $repo"
    else
        warn "Failed to get repository info for $repo"
        echo '{}' > "$REPO_INFO_TEMP"
    fi
    
    # Get recent issues using search API (more reliable for date filtering)
    SEARCH_DATE=$(echo "$SINCE_DATE" | cut -d'T' -f1)  # Extract just the date part (YYYY-MM-DD)
    
    if gh api "search/issues?q=repo:$ORG/$repo+updated:>$SEARCH_DATE+type:issue" | jq '.items' > "$ISSUES_TEMP"; then
        debug "Issues collected for $repo"
    else
        warn "Failed to get issues for $repo"
        echo '[]' > "$ISSUES_TEMP"
    fi
    
    # Get recent pull requests using search API
    if gh api "search/issues?q=repo:$ORG/$repo+updated:>$SEARCH_DATE+type:pr" | jq '.items' > "$PRS_TEMP"; then
        debug "Pull requests collected for $repo"
    else
        warn "Failed to get pull requests for $repo"
        echo '[]' > "$PRS_TEMP"
    fi
    
    # Get recent commits using search API
    if gh api "search/commits?q=repo:$ORG/$repo+committer-date:>$SEARCH_DATE" | jq '.items' > "$COMMITS_TEMP"; then
        debug "Commits collected for $repo"
    else
        debug "No recent commits found for $repo"
        echo '[]' > "$COMMITS_TEMP"
    fi
    
    # Get issue comments sorted by update date, then filter client-side
    if gh api "repos/$ORG/$repo/issues/comments?sort=updated&direction=desc&per_page=100" --paginate | \
       jq --arg since "$SINCE_DATE" '[.[] | select(.updated_at > $since)]' > "$COMMENTS_TEMP"; then
        debug "Issue comments collected for $repo"
    else
        warn "Failed to get issue comments for $repo"
        echo '[]' > "$COMMENTS_TEMP"
    fi
    
    # Get recent repository events (may not be available for private repos)
    if gh api "repos/$ORG/$repo/events" -F per_page=100 > "$EVENTS_TEMP" 2>/dev/null; then
        debug "Repository events collected for $repo"
    else
        debug "Repository events not accessible for $repo"
        echo '[]' > "$EVENTS_TEMP"
    fi
    
    # Update JSON with repository data
    jq --arg repo "$repo" \
       --slurpfile repo_info "$REPO_INFO_TEMP" \
       --slurpfile issues "$ISSUES_TEMP" \
       --slurpfile prs "$PRS_TEMP" \
       --slurpfile commits "$COMMITS_TEMP" \
       --slurpfile issue_comments "$COMMENTS_TEMP" \
       --slurpfile repo_events "$EVENTS_TEMP" \
       '.repositories[$repo] = {
         "info": $repo_info[0],
         "recent_issues": $issues[0],
         "recent_pull_requests": $prs[0],
         "recent_commits": $commits[0],
         "recent_issue_comments": $issue_comments[0],
         "recent_repository_events": $repo_events[0]
       }' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    
    # Add to consolidated recent activity
    jq --slurpfile issues "$ISSUES_TEMP" \
       --slurpfile prs "$PRS_TEMP" \
       --slurpfile commits "$COMMITS_TEMP" \
       --slurpfile issue_comments "$COMMENTS_TEMP" \
       --slurpfile repo_events "$EVENTS_TEMP" \
       '.recent_activity.issues += $issues[0] |
        .recent_activity.pull_requests += $prs[0] |
        .recent_activity.commits += $commits[0] |
        .recent_activity.issue_comments += $issue_comments[0] |
        .recent_activity.repository_events += $repo_events[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    
    # Clean up temp files for this repo
    cleanup_temp_file "$REPO_INFO_TEMP"
    cleanup_temp_file "$ISSUES_TEMP"
    cleanup_temp_file "$PRS_TEMP"
    cleanup_temp_file "$COMMITS_TEMP"
    cleanup_temp_file "$COMMENTS_TEMP"
    cleanup_temp_file "$EVENTS_TEMP"
done <<< "$REPO_LIST"

# Get organization events for additional context
info "Fetching organization events..."
ORG_EVENTS_TEMP=$(create_temp_file "org_events")
if gh api "orgs/$ORG/events" -F per_page=100 > "$ORG_EVENTS_TEMP" 2>/dev/null; then
    jq --slurpfile events "$ORG_EVENTS_TEMP" '.organization_events = $events[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    success "Organization events collected"
else
    info "Organization events not accessible"
    jq '.organization_events = []' "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
fi
cleanup_temp_file "$ORG_EVENTS_TEMP"

# Add summary statistics
info "Calculating summary statistics..."
jq '.summary = {
  "total_project_items": (.project_items | length),
  "total_repositories_checked": (.repositories | keys | length),
  "total_recent_issues": (.recent_activity.issues | length),
  "total_recent_pull_requests": (.recent_activity.pull_requests | length),
  "total_recent_commits": (.recent_activity.commits | length),
  "total_recent_issue_comments": (.recent_activity.issue_comments | length),
  "total_recent_repository_events": (.recent_activity.repository_events | length),
  "repositories_with_activity": [.repositories | to_entries[] | select((.value.recent_issues | length) > 0 or (.value.recent_pull_requests | length) > 0 or (.value.recent_commits | length) > 0 or (.value.recent_issue_comments | length) > 0 or (.value.recent_repository_events | length) > 0) | .key]
}' "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

# Output summary
success "Data collection complete!"
info "Output saved to: $OUTPUT_FILE"
info "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"

# Display collection summary
echo ""
echo "=== COLLECTION SUMMARY ==="
jq -r '.summary | 
  "Project Items: \(.total_project_items)",
  "Repositories Checked: \(.total_repositories_checked)", 
  "Recent Issues: \(.total_recent_issues)",
  "Recent Pull Requests: \(.total_recent_pull_requests)",
  "Recent Commits: \(.total_recent_commits)",
  "Recent Issue Comments: \(.total_recent_issue_comments)",
  "Recent Repository Events: \(.total_recent_repository_events)",
  "Active Repositories: \(.repositories_with_activity | join(", "))"' "$OUTPUT_FILE"

# Output results
echo "DATA_COLLECTED=true"
echo "DATA_FILE=$OUTPUT_FILE"
echo "FINAL_ORG=$ORG"
echo "FINAL_PROJECT_ID=$PROJECT_ID"

# Create summary stats for the orchestrator
STATS=$(jq -c '.summary' "$OUTPUT_FILE")
echo "SUMMARY_STATS=$STATS"

echo "Script success: ${0##*/}"
