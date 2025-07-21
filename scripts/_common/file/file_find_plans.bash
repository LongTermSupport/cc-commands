#!/usr/bin/env bash
# Script: find-plans.sh
# Purpose: Locate and analyze plan files in CLAUDE/plan directory
# Usage: find-plans.sh [list|find|analyze|create] [args]
# Output: Structured data about plans

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define path to common directory
COMMON_DIR="$SCRIPT_DIR/.."
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Find the plan directory
find_plan_directory() {
    # Look for CLAUDE/plan in current directory (case-insensitive)
    if [ -d "CLAUDE/plan" ]; then
        echo "PLAN_DIR=CLAUDE/plan"
        echo "PLAN_DIR_EXISTS=true"
        return 0
    elif [ -d "claude/plan" ]; then
        echo "PLAN_DIR=claude/plan"
        echo "PLAN_DIR_EXISTS=true"
        return 0
    fi
    
    # Try to find it up to 2 levels deep (case-insensitive)
    local plan_dir
    plan_dir=$(find . -maxdepth 2 -type d -ipath "*/claude/plan" 2>/dev/null | head -1)
    
    if [ -n "$plan_dir" ]; then
        echo "PLAN_DIR=$plan_dir"
        echo "PLAN_DIR_EXISTS=true"
        return 0
    else
        echo "PLAN_DIR="
        echo "PLAN_DIR_EXISTS=false"
        return 1
    fi
}

# List all plan files
list_plans() {
    eval "$(find_plan_directory)"
    
    if [ "$PLAN_DIR_EXISTS" != "true" ]; then
        warn "No plan directory found"
        echo "PLAN_COUNT=0"
        return 1
    fi
    
    info "Listing plans in $PLAN_DIR..."
    
    # Find all .md files and sort by modification time
    local plans=()
    while IFS= read -r -d '' file; do
        plans+=("$file")
    done < <(find "$PLAN_DIR" -name "*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | tr '\n' '\0')
    
    echo "PLAN_COUNT=${#plans[@]}"
    
    if [ ${#plans[@]} -eq 0 ]; then
        warn "No plan files found"
        return 0
    fi
    
    # Output plan list with details
    local i=0
    for plan in "${plans[@]}"; do
        local basename
        basename=$(basename "$plan")
        local modified
        modified=$(date -r "$plan" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown")
        echo "PLAN_${i}_FILE=$plan"
        echo "PLAN_${i}_NAME=$basename"
        echo "PLAN_${i}_MODIFIED=$modified"
        i=$((i + 1))
    done
    
    # Show recent plans
    echo ""
    info "Recent plans:"
    local count=0
    for plan in "${plans[@]}"; do
        local basename
        basename=$(basename "$plan")
        local modified
        modified=$(date -r "$plan" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown")
        echo "  $basename - $modified"
        count=$((count + 1))
        [ $count -ge 10 ] && break
    done
    
    return 0
}

# Find a specific plan
find_plan() {
    local search_term="${1:-}"
    if [ -z "$search_term" ]; then
        error_exit "Missing required argument: search term"
    fi
    
    eval "$(find_plan_directory)"
    
    if [ "$PLAN_DIR_EXISTS" != "true" ]; then
        error_exit "No plan directory found"
    fi
    
    info "Searching for plan: $search_term"
    
    # First try exact match
    local exact_path="$PLAN_DIR/${search_term}.md"
    if [ -f "$exact_path" ]; then
        echo "MATCH_TYPE=exact"
        echo "PLAN_FILE=$exact_path"
        echo "PLAN_NAME=$(basename "$exact_path")"
        success "Found exact match: $exact_path"
        return 0
    fi
    
    # Try case-insensitive search
    local matches=()
    while IFS= read -r -d '' file; do
        matches+=("$file")
    done < <(find "$PLAN_DIR" -iname "*${search_term}*.md" -type f -print0 2>/dev/null)
    
    if [ ${#matches[@]} -eq 0 ]; then
        echo "MATCH_TYPE=none"
        echo "PLAN_FILE="
        warn "No plans found matching: $search_term"
        return 1
    elif [ ${#matches[@]} -eq 1 ]; then
        echo "MATCH_TYPE=fuzzy"
        echo "PLAN_FILE=${matches[0]}"
        echo "PLAN_NAME=$(basename "${matches[0]}")"
        success "Found match: ${matches[0]}"
        return 0
    else
        echo "MATCH_TYPE=multiple"
        echo "MATCH_COUNT=${#matches[@]}"
        warn "Multiple plans found matching: $search_term"
        
        local i=0
        for match in "${matches[@]}"; do
            echo "MATCH_${i}_FILE=$match"
            echo "MATCH_${i}_NAME=$(basename "$match")"
            echo "  $(basename "$match")"
            i=$((i + 1))
        done
        return 1
    fi
}

# Analyze a plan file
analyze_plan() {
    local plan_file="${1:-}"
    if [ -z "$plan_file" ]; then
        error_exit "Missing required argument: plan file"
    fi
    
    if [ ! -f "$plan_file" ]; then
        error_exit "Plan file not found: $plan_file"
    fi
    
    info "Analyzing plan: $plan_file"
    
    # Count task statuses
    local total=0
    local completed=0
    local in_progress=0
    local pending=0
    local all_done=false
    
    # Check for ALL DONE marker
    if grep -q "ALL DONE!" "$plan_file"; then
        all_done=true
    fi
    
    # Count tasks
    while IFS= read -r line; do
        if [[ "$line" =~ ^\[\ \] ]]; then
            ((total++))
            ((pending++))
        elif [[ "$line" =~ ^\[✓\] ]]; then
            ((total++))
            ((completed++))
        elif [[ "$line" =~ ^\[⏳\] ]]; then
            ((total++))
            ((in_progress++))
        fi
    done < "$plan_file"
    
    # Calculate percentage
    local percentage=0
    if [ $total -gt 0 ]; then
        percentage=$((completed * 100 / total))
    fi
    
    # Output analysis
    echo "PLAN_FILE=$plan_file"
    echo "TOTAL_TASKS=$total"
    echo "COMPLETED_TASKS=$completed"
    echo "IN_PROGRESS_TASKS=$in_progress"
    echo "PENDING_TASKS=$pending"
    echo "COMPLETION_PERCENTAGE=$percentage"
    echo "ALL_DONE=$all_done"
    
    # Summary
    echo ""
    info "Plan Analysis Summary:"
    echo "  Total tasks: $total"
    echo "  Completed: $completed ($percentage%)"
    echo "  In progress: $in_progress"
    echo "  Pending: $pending"
    
    if [ "$all_done" = "true" ]; then
        success "Plan marked as ALL DONE!"
    elif [ $in_progress -gt 0 ]; then
        warn "Plan has $in_progress tasks in progress"
    elif [ $completed -eq $total ] && [ $total -gt 0 ]; then
        warn "All tasks completed but plan not marked as ALL DONE"
    fi
}

# Create a new plan file
create_plan() {
    local plan_name="${1:-}"
    if [ -z "$plan_name" ]; then
        error_exit "Missing required argument: plan name"
    fi
    
    eval "$(find_plan_directory)"
    
    if [ "$PLAN_DIR_EXISTS" != "true" ]; then
        info "Creating plan directory: CLAUDE/plan"
        mkdir -p "CLAUDE/plan" || error_exit "Failed to create plan directory"
        PLAN_DIR="CLAUDE/plan"
    fi
    
    # Sanitize plan name (remove .md if provided, replace spaces)
    plan_name="${plan_name%.md}"
    plan_name="${plan_name// /-}"
    
    local plan_file="$PLAN_DIR/${plan_name}.md"
    
    if [ -f "$plan_file" ]; then
        error_exit "Plan already exists: $plan_file"
    fi
    
    echo "PLAN_FILE=$plan_file"
    echo "PLAN_NAME=${plan_name}.md"
    echo "PLAN_CREATED=true"
    
    success "Plan file path ready: $plan_file"
}

# Main script logic
OPERATION="${1:-list}"

case "$OPERATION" in
    list)
        list_plans
        ;;
    find)
        SEARCH="${2:-}"
        find_plan "$SEARCH"
        ;;
    analyze)
        PLAN_FILE="${2:-}"
        analyze_plan "$PLAN_FILE"
        ;;
    create)
        PLAN_NAME="${2:-}"
        create_plan "$PLAN_NAME"
        ;;
    *)
        error_exit "Unknown operation: $OPERATION. Valid operations: list, find, analyze, create"
        ;;
esac

