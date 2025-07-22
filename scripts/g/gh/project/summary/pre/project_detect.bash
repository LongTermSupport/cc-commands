#!/usr/bin/env bash
# Script: project_detect.bash
# Purpose: Detect or validate GitHub organization and project for summary generation
# Usage: project_detect.bash [github_url] [org] [project_id]
# Output: KEY=value pairs with detected organization and project details

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../../_common"

source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Arguments
GITHUB_URL="${1:-}"
ORG="${2:-}"
PROJECT_ID="${3:-}"

info "Detecting GitHub organization and project..."

# Function to parse GitHub project URL
parse_github_project_url() {
    local url="$1"
    if [[ "$url" =~ github\.com/orgs/([^/]+)/projects/([0-9]+) ]]; then
        echo "URL_ORG=${BASH_REMATCH[1]}"
        echo "URL_PROJECT_ID=${BASH_REMATCH[2]}"
        return 0
    else
        return 1
    fi
}

# Function to detect organization from current git remote
detect_github_org() {
    if git remote get-url origin &>/dev/null; then
        local remote_url=$(git remote get-url origin)
        debug "Git remote URL: $remote_url"
        
        if [[ "$remote_url" =~ github\.com[/:]([^/]+) ]]; then
            echo "${BASH_REMATCH[1]}"
            return 0
        fi
    fi
    return 1
}

# Function to find most recent project for an organization
detect_recent_project() {
    local org="$1"
    info "Finding most recently updated project for org: $org"
    
    # Get all projects for the organization, sorted by updated date
    local recent_project_json
    if recent_project_json=$(gh api "orgs/$org/projects" --jq 'sort_by(.updated_at) | reverse | .[0] | {id: .id, title: .title, updated: .updated_at}' 2>/dev/null); then
        if [[ "$recent_project_json" != "null" ]]; then
            echo "$recent_project_json" | jq -r '.id'
            return 0
        fi
    fi
    return 1
}

# Function to validate project exists and get details
validate_project() {
    local org="$1" 
    local project_id="$2"
    
    info "Validating project $project_id for org $org..."
    
    local project_info
    if project_info=$(gh project view "$project_id" --owner "$org" --format json 2>/dev/null); then
        local title=$(echo "$project_info" | jq -r '.title')
        local item_count=$(echo "$project_info" | jq -r '.items | length')
        
        echo "PROJECT_TITLE=$title"
        echo "PROJECT_ITEM_COUNT=$item_count"
        success "Project validated: $title ($item_count items)"
        return 0
    else
        return 1
    fi
}

# Function to extract repositories from project items
extract_project_repos() {
    local org="$1"
    local project_id="$2"
    
    info "Extracting repositories from project items..."
    
    local repo_list
    if repo_list=$(gh project item-list "$project_id" --owner "$org" --format json 2>/dev/null); then
        local repo_count=$(echo "$repo_list" | jq -r '[.items[].content.repository.name // empty] | unique | length')
        echo "REPO_COUNT=$repo_count"
        
        if [[ "$repo_count" -gt 0 ]]; then
            success "Found $repo_count repositories in project"
        else
            warning "No repositories found in project items"
        fi
        return 0
    else
        echo "REPO_COUNT=0"
        return 1
    fi
}

# Main detection logic
FINAL_ORG=""
FINAL_PROJECT_ID=""

# Mode 1: Parse from GitHub URL
if [[ -n "$GITHUB_URL" ]]; then
    info "Parsing GitHub project URL: $GITHUB_URL"
    
    if parse_result=$(parse_github_project_url "$GITHUB_URL"); then
        eval "$parse_result"
        FINAL_ORG="$URL_ORG"
        FINAL_PROJECT_ID="$URL_PROJECT_ID"
        success "Parsed URL - Org: $FINAL_ORG, Project: $FINAL_PROJECT_ID"
    else
        echo "PROJECT_READY=false"
        echo "ERROR_MESSAGE=Invalid GitHub project URL format. Expected: https://github.com/orgs/ORG/projects/NUMBER"
        error_exit "Invalid GitHub project URL format. Expected: https://github.com/orgs/ORG/projects/NUMBER"
    fi

# Mode 2: Use provided org and project_id
elif [[ -n "$ORG" && -n "$PROJECT_ID" ]]; then
    info "Using provided org and project ID: $ORG / $PROJECT_ID"
    FINAL_ORG="$ORG"
    FINAL_PROJECT_ID="$PROJECT_ID"

# Mode 3: Auto-detect from current repository
else
    info "Auto-detecting organization from current repository..."
    
    if detected_org=$(detect_github_org); then
        FINAL_ORG="$detected_org"
        success "Detected organization from git remote: $FINAL_ORG"
        
        # Find most recent project
        if detected_project=$(detect_recent_project "$FINAL_ORG"); then
            FINAL_PROJECT_ID="$detected_project"
            success "Detected most recent project: $FINAL_PROJECT_ID"
        else
            echo "PROJECT_READY=false"
            echo "ERROR_MESSAGE=No projects found for organization: $FINAL_ORG"
            error_exit "No projects found for organization: $FINAL_ORG"
        fi
    else
        echo "PROJECT_READY=false"
        echo "ERROR_MESSAGE=Cannot detect GitHub organization. Not in a git repository or no GitHub remote found."
        error_exit "Cannot detect GitHub organization. Not in a git repository or no GitHub remote found."
    fi
fi

# Validate the final org and project
if validate_project "$FINAL_ORG" "$FINAL_PROJECT_ID"; then
    # Extract repository information
    extract_project_repos "$FINAL_ORG" "$FINAL_PROJECT_ID"
    
    echo "PROJECT_READY=true"
    echo "DETECTED_ORG=$FINAL_ORG"
    echo "DETECTED_PROJECT_ID=$FINAL_PROJECT_ID"
    success "Project detection complete - $FINAL_ORG / $FINAL_PROJECT_ID"
else
    echo "PROJECT_READY=false"
    echo "ERROR_MESSAGE=Cannot access project $FINAL_PROJECT_ID for organization $FINAL_ORG"
    error_exit "Cannot access project $FINAL_PROJECT_ID for organization $FINAL_ORG"
fi

echo "Script success: ${0##*/}"