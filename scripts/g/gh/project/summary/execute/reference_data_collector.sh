#!/bin/bash
# Script: gather-project-updates-clean.sh  
# Purpose: GitHub Project Updates Gatherer - Generic version with dynamic parameters
# Usage: gather-project-updates-clean.sh <org> <project_id>
# Output: JSON file with comprehensive GitHub project data

set -euo pipefail
IFS=$'\n\t'

# Arguments
ORG="${1:-}"
PROJECT_ID="${2:-}"

if [[ -z "$ORG" || -z "$PROJECT_ID" ]]; then
    echo "ERROR: Organization and project ID are required"
    echo "Usage: $0 <org> <project_id>"
    exit 1
fi

OUTPUT_FILE="/tmp/github-project-summary-$(date +%Y%m%d-%H%M%S).json"
SINCE_DATE=$(date -d '24 hours ago' -Iseconds)

echo "Collecting GitHub project data for $ORG / $PROJECT_ID since $SINCE_DATE..."

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
echo "Fetching project details..."
PROJECT_TEMP="/tmp/project_info_$$.json"
if gh project view "$PROJECT_ID" --owner "$ORG" --format json > "$PROJECT_TEMP"; then
    jq --slurpfile project_info "$PROJECT_TEMP" '.project_info = $project_info[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    rm -f "$PROJECT_TEMP"
    echo "✓ Project information collected"
else
    echo "ERROR: Failed to fetch project information for $ORG / $PROJECT_ID"
    exit 1
fi

# Get all project items
echo "Fetching project items..."
ITEMS_TEMP="/tmp/project_items_$$.json"
if gh project item-list "$PROJECT_ID" --owner "$ORG" --format json --limit 500 > "$ITEMS_TEMP"; then
    jq --slurpfile items "$ITEMS_TEMP" '.project_items = $items[0].items' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    rm -f "$ITEMS_TEMP"
    echo "✓ Project items collected"
else
    echo "ERROR: Failed to fetch project items for $ORG / $PROJECT_ID"
    exit 1
fi

# Extract repositories from project items dynamically
echo "Extracting repositories from project items..."
REPO_LIST=$(jq -r '.project_items[].content.repository.name // empty' "$OUTPUT_FILE" | sort -u | grep -v '^$')

if [[ -z "$REPO_LIST" ]]; then
    echo "⚠ No repositories found in project items. Using organization repositories with recent activity."
    
    # Fallback: get organization repositories with recent activity
    REPO_LIST=$(gh api "orgs/$ORG/repos" --paginate --jq '.[] | select(.updated_at > "'$(date -d '7 days ago' -Iseconds)'") | .name' | head -10)
fi

REPO_COUNT=$(echo "$REPO_LIST" | wc -l)
echo "Processing $REPO_COUNT repositories..."

# Process each repository
while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    
    echo "Processing repository: $repo"
    
    # Create temp directory for this repo's data
    TEMP_DIR="/tmp/gh-data-$$-$repo"
    mkdir -p "$TEMP_DIR"
    
    # Get repository info
    if gh api "repos/$ORG/$repo" > "$TEMP_DIR/repo_info.json"; then
        echo "  ✓ Repository info collected"
    else
        echo "  ⚠ Failed to get repository info for $repo"
        echo '{}' > "$TEMP_DIR/repo_info.json"
    fi
    
    # Get recent issues using search API (more reliable for date filtering)
    SEARCH_DATE=$(echo "$SINCE_DATE" | cut -d'T' -f1)  # Extract just the date part (YYYY-MM-DD)
    
    if gh api "search/issues?q=repo:$ORG/$repo+updated:>$SEARCH_DATE+type:issue" | jq '.items' > "$TEMP_DIR/issues.json"; then
        echo "  ✓ Issues collected"
    else
        echo "  ⚠ Failed to get issues for $repo"
        echo '[]' > "$TEMP_DIR/issues.json"
    fi
    
    # Get recent pull requests using search API
    if gh api "search/issues?q=repo:$ORG/$repo+updated:>$SEARCH_DATE+type:pr" | jq '.items' > "$TEMP_DIR/prs.json"; then
        echo "  ✓ Pull requests collected"
    else
        echo "  ⚠ Failed to get pull requests for $repo"
        echo '[]' > "$TEMP_DIR/prs.json"
    fi
    
    # Get recent commits using search API
    if gh api "search/commits?q=repo:$ORG/$repo+committer-date:>$SEARCH_DATE" | jq '.items' > "$TEMP_DIR/commits.json"; then
        echo "  ✓ Commits collected"
    else
        echo "  ⚠ No recent commits found for $repo"
        echo '[]' > "$TEMP_DIR/commits.json"
    fi
    
    # Get issue comments sorted by update date, then filter client-side
    if gh api "repos/$ORG/$repo/issues/comments?sort=updated&direction=desc&per_page=100" --paginate | \
       jq --arg since "$SINCE_DATE" '[.[] | select(.updated_at > $since)]' > "$TEMP_DIR/issue_comments.json"; then
        echo "  ✓ Issue comments collected"
    else
        echo "  ⚠ Failed to get issue comments for $repo"
        echo '[]' > "$TEMP_DIR/issue_comments.json"
    fi
    
    # Get recent repository events (may not be available for private repos)
    if gh api "repos/$ORG/$repo/events" -F per_page=100 > "$TEMP_DIR/repo_events.json" 2>/dev/null; then
        echo "  ✓ Repository events collected"
    else
        echo "  ⚠ Repository events not accessible for $repo"
        echo '[]' > "$TEMP_DIR/repo_events.json"
    fi
    
    # Update JSON with repository data
    jq --arg repo "$repo" \
       --slurpfile repo_info "$TEMP_DIR/repo_info.json" \
       --slurpfile issues "$TEMP_DIR/issues.json" \
       --slurpfile prs "$TEMP_DIR/prs.json" \
       --slurpfile commits "$TEMP_DIR/commits.json" \
       --slurpfile issue_comments "$TEMP_DIR/issue_comments.json" \
       --slurpfile repo_events "$TEMP_DIR/repo_events.json" \
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
    jq --slurpfile issues "$TEMP_DIR/issues.json" \
       --slurpfile prs "$TEMP_DIR/prs.json" \
       --slurpfile commits "$TEMP_DIR/commits.json" \
       --slurpfile issue_comments "$TEMP_DIR/issue_comments.json" \
       --slurpfile repo_events "$TEMP_DIR/repo_events.json" \
       '.recent_activity.issues += $issues[0] |
        .recent_activity.pull_requests += $prs[0] |
        .recent_activity.commits += $commits[0] |
        .recent_activity.issue_comments += $issue_comments[0] |
        .recent_activity.repository_events += $repo_events[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    
    # Clean up temp files for this repo
    rm -rf "$TEMP_DIR"
done <<< "$REPO_LIST"

# Get organization events for additional context
echo "Fetching organization events..."
TEMP_EVENTS="/tmp/org_events_$$.json"
if gh api "orgs/$ORG/events" -F per_page=100 > "$TEMP_EVENTS" 2>/dev/null; then
    jq --slurpfile events "$TEMP_EVENTS" '.organization_events = $events[0]' \
       "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    echo "✓ Organization events collected"
else
    echo "⚠ Organization events not accessible"
    jq '.organization_events = []' "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
fi
rm -f "$TEMP_EVENTS"

# Add summary statistics
echo "Calculating summary statistics..."
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

echo "Data collection complete!"
echo "Output saved to: $OUTPUT_FILE"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"

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

echo ""
echo "Full data available in $OUTPUT_FILE"