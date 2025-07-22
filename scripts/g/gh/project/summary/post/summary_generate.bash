#!/usr/bin/env bash
# Script: summary_generate.bash
# Purpose: Generate summary statistics and validate data for Claude analysis
# Usage: summary_generate.bash [data_file] [audience]
# Output: KEY=value pairs with summary generation results

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
DATA_FILE="${1:-}"
AUDIENCE="${2:-client}"

if [[ -z "$DATA_FILE" ]]; then
    echo "SUMMARY_GENERATED=false"
    echo "ERROR_MESSAGE=Data file path is required"
    error_exit "Usage: summary_generate.bash <data_file> [audience]"
fi

if [[ ! -f "$DATA_FILE" ]]; then
    echo "SUMMARY_GENERATED=false"
    echo "ERROR_MESSAGE=Data file does not exist: $DATA_FILE"
    error_exit "Data file does not exist: $DATA_FILE"
fi

info "Generating summary from data file: $DATA_FILE"
info "Target audience: $AUDIENCE"

# Validate data file structure
info "Validating data file structure..."

if ! jq empty "$DATA_FILE" 2>/dev/null; then
    echo "SUMMARY_GENERATED=false"
    echo "ERROR_MESSAGE=Data file is not valid JSON"
    error_exit "Data file is not valid JSON: $DATA_FILE"
fi

# Check for required top-level keys
REQUIRED_KEYS=("collection_timestamp" "since_date" "organization" "project_info" "project_items" "repositories" "recent_activity" "summary")
for key in "${REQUIRED_KEYS[@]}"; do
    if ! jq -e ".$key" "$DATA_FILE" >/dev/null 2>&1; then
        warning "Data file missing key: $key"
    fi
done

# Extract basic metadata
ORGANIZATION=$(jq -r '.organization' "$DATA_FILE")
PROJECT_TITLE=$(jq -r '.project_info.title // "Unknown Project"' "$DATA_FILE")
COLLECTION_TIME=$(jq -r '.collection_timestamp' "$DATA_FILE")
SINCE_DATE=$(jq -r '.since_date' "$DATA_FILE")

success "Data file validation complete"
info "Organization: $ORGANIZATION"
info "Project: $PROJECT_TITLE"
info "Collection Time: $COLLECTION_TIME"
info "Data Since: $SINCE_DATE"

# Generate detailed statistics
info "Generating detailed statistics..."

TOTAL_REPOS=$(jq -r '.summary.total_repositories_checked' "$DATA_FILE")
ACTIVE_REPOS=$(jq -r '.summary.repositories_with_activity | length' "$DATA_FILE")
TOTAL_ISSUES=$(jq -r '.summary.total_recent_issues' "$DATA_FILE")
TOTAL_PRS=$(jq -r '.summary.total_recent_pull_requests' "$DATA_FILE")
TOTAL_COMMITS=$(jq -r '.summary.total_recent_commits' "$DATA_FILE")
TOTAL_COMMENTS=$(jq -r '.summary.total_recent_issue_comments' "$DATA_FILE")
PROJECT_ITEMS=$(jq -r '.summary.total_project_items' "$DATA_FILE")

# Calculate activity metrics
if [[ "$TOTAL_REPOS" -gt 0 ]]; then
    ACTIVITY_PERCENTAGE=$(echo "scale=1; $ACTIVE_REPOS * 100 / $TOTAL_REPOS" | bc -l 2>/dev/null || echo "0")
else
    ACTIVITY_PERCENTAGE="0"
fi

TOTAL_ACTIVITY=$((TOTAL_ISSUES + TOTAL_PRS + TOTAL_COMMITS + TOTAL_COMMENTS))

# Generate audience-specific insights
case "$AUDIENCE" in
    "client")
        info "Generating client-focused summary insights..."
        AUDIENCE_FOCUS="business-impact"
        ;;
    "technical")
        info "Generating technical team summary insights..."
        AUDIENCE_FOCUS="implementation-details"
        ;;
    "management")
        info "Generating management summary insights..."
        AUDIENCE_FOCUS="strategic-overview"
        ;;
    "product owner"|"product-owner"|"po")
        info "Generating product owner summary insights..."
        AUDIENCE_FOCUS="feature-progress"
        ;;
    *)
        info "Generating general summary insights for audience: $AUDIENCE"
        AUDIENCE_FOCUS="general"
        ;;
esac

# Create audience-specific activity summary
ACTIVITY_SUMMARY=""
if [[ "$TOTAL_ACTIVITY" -gt 0 ]]; then
    case "$AUDIENCE_FOCUS" in
        "business-impact")
            ACTIVITY_SUMMARY="Active development with $TOTAL_ACTIVITY total interactions across $ACTIVE_REPOS repositories"
            ;;
        "implementation-details")
            ACTIVITY_SUMMARY="$TOTAL_COMMITS commits, $TOTAL_PRS pull requests, $TOTAL_ISSUES issues, and $TOTAL_COMMENTS comments"
            ;;
        "strategic-overview")
            ACTIVITY_SUMMARY="$ACTIVITY_PERCENTAGE% of repositories showing activity ($ACTIVE_REPOS of $TOTAL_REPOS)"
            ;;
        "feature-progress")
            ACTIVITY_SUMMARY="$PROJECT_ITEMS project items with $TOTAL_ACTIVITY development activities"
            ;;
        *)
            ACTIVITY_SUMMARY="$TOTAL_ACTIVITY activities across $ACTIVE_REPOS active repositories"
            ;;
    esac
else
    ACTIVITY_SUMMARY="No recent activity detected in the specified time period"
fi

# Extract top active repositories
info "Identifying most active repositories..."
TOP_REPOS=$(jq -r '.repositories | to_entries | map({
    name: .key,
    activity: ((.value.recent_issues | length) + (.value.recent_pull_requests | length) + (.value.recent_commits | length) + (.value.recent_issue_comments | length))
}) | sort_by(.activity) | reverse | .[0:5] | map("\(.name) (\(.activity))") | join(", ")' "$DATA_FILE")

success "Summary generation complete"

# Output results
echo "SUMMARY_GENERATED=true"
echo "DATA_VALIDATED=true"
echo "ORGANIZATION=$ORGANIZATION"
echo "PROJECT_TITLE=$PROJECT_TITLE"
echo "AUDIENCE_FOCUS=$AUDIENCE_FOCUS"
echo "TOTAL_ACTIVITY=$TOTAL_ACTIVITY"
echo "ACTIVE_REPOS=$ACTIVE_REPOS"
echo "TOTAL_REPOS=$TOTAL_REPOS"
echo "ACTIVITY_PERCENTAGE=$ACTIVITY_PERCENTAGE"
echo "ACTIVITY_SUMMARY=$ACTIVITY_SUMMARY"
echo "TOP_REPOS=$TOP_REPOS"
echo "TIME_PERIOD=$(echo "$SINCE_DATE" | cut -d'T' -f1) to $(echo "$COLLECTION_TIME" | cut -d'T' -f1)"

echo "Script success: ${0##*/}"
