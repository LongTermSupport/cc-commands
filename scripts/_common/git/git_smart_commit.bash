#!/usr/bin/env bash
# Script: git_smart_commit.bash
# Purpose: Generate intelligent commit messages and execute commits
# Usage: git_smart_commit.bash [analyze|generate|commit] [commit-message]
# Output: Commit analysis data or execution results

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common scripts
source "$COMMON_DIR/_inc/helpers.inc.bash"
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Set up temp file cleanup
setup_temp_cleanup

# Operation mode
OPERATION="${1:-analyze}"
CUSTOM_MESSAGE="${2:-}"

# Analyze file changes for commit message generation
analyze_changes_for_message() {
    local changes_output
    
    # Get file change statistics quietly
    changes_output=$(create_temp_file "changes_output")
    trap "rm -f '$changes_output'" RETURN
    
    # Capture git diff statistics
    {
        git diff --name-status HEAD 2>/dev/null || true
        git diff --cached --name-status 2>/dev/null || true
    } | sort -u > "$changes_output"
    
    if [ ! -s "$changes_output" ]; then
        echo "NO_CHANGES=true"
        return 0
    fi
    
    echo "NO_CHANGES=false"
    
    # Count change types
    local added
    added=$(grep -c "^A" "$changes_output" || true)
    local modified
    modified=$(grep -c "^M" "$changes_output" || true)
    local deleted
    deleted=$(grep -c "^D" "$changes_output" || true)
    local renamed
    renamed=$(grep -c "^R" "$changes_output" || true)
    local total
    total=$(wc -l < "$changes_output")
    
    echo "FILES_ADDED=$added"
    echo "FILES_MODIFIED=$modified"
    echo "FILES_DELETED=$deleted"
    echo "FILES_RENAMED=$renamed"
    echo "FILES_TOTAL=$total"
    
    # Analyze file types
    local file_types
    file_types=$(awk '{print $2}' "$changes_output" | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -5)
    echo "FILE_TYPES<<EOF"
    echo "$file_types"
    echo "EOF"
    
    # Analyze directories affected
    local dirs_affected
    dirs_affected=$(awk '{print $2}' "$changes_output" | xargs -I {} dirname {} | sort | uniq -c | sort -rn | head -5)
    echo "DIRS_AFFECTED<<EOF"
    echo "$dirs_affected"
    echo "EOF"
    
    # Show actual changes for context (limited)
    echo "CHANGE_DETAILS<<EOF"
    head -20 "$changes_output"
    echo "EOF"
}

# Generate commit message based on changes
generate_commit_message() {
    local changes_data="$1"
    local message=""
    
    # Parse the analysis data
    eval "$changes_data"
    
    if [ "${NO_CHANGES:-true}" = "true" ]; then
        echo "COMMIT_MESSAGE="
        echo "MESSAGE_TYPE=none"
        return 0
    fi
    
    # Determine primary action
    local primary_action=""
    if [ "${FILES_ADDED:-0}" -gt "${FILES_MODIFIED:-0}" ] && [ "${FILES_ADDED:-0}" -gt "${FILES_DELETED:-0}" ]; then
        primary_action="Add"
    elif [ "${FILES_MODIFIED:-0}" -gt "${FILES_DELETED:-0}" ]; then
        primary_action="Update"
    elif [ "${FILES_DELETED:-0}" -gt 0 ]; then
        primary_action="Remove"
    else
        primary_action="Update"
    fi
    
    # Analyze scope from directories
    local scope=""
    if [ -n "${DIRS_AFFECTED:-}" ]; then
        # Extract most affected directory
        scope=$(echo "$DIRS_AFFECTED" | head -1 | awk '{print $2}' | sed 's|^\./||')
    fi
    
    # Build message components
    local file_summary=""
    if [ "${FILES_TOTAL:-0}" -eq 1 ]; then
        # Single file - be specific
        local single_file
        single_file=$(echo "$CHANGE_DETAILS" | head -1 | awk '{print $2}')
        message="$primary_action $single_file"
    else
        # Multiple files - summarize
        local components=()
        [ "${FILES_ADDED:-0}" -gt 0 ] && components+=("${FILES_ADDED} added")
        [ "${FILES_MODIFIED:-0}" -gt 0 ] && components+=("${FILES_MODIFIED} modified")
        [ "${FILES_DELETED:-0}" -gt 0 ] && components+=("${FILES_DELETED} deleted")
        
        file_summary=$(IFS=", "; echo "${components[*]}")
        
        if [ -n "$scope" ] && [ "$scope" != "." ]; then
            message="$primary_action $scope ($file_summary)"
        else
            message="$primary_action multiple files ($file_summary)"
        fi
    fi
    
    echo "COMMIT_MESSAGE=$message"
    echo "MESSAGE_TYPE=generated"
    echo "PRIMARY_ACTION=$primary_action"
    echo "SCOPE=$scope"
}

# Execute commit with message
execute_commit() {
    local message="$1"
    
    if [ -z "$message" ]; then
        error_exit "Cannot commit without a message"
    fi
    
    info "Preparing commit: $message"
    
    # Stage all changes
    if run_with_output "git add -A" "Failed to stage changes"; then
        echo "STAGING_SUCCESS=true"
    else
        echo "STAGING_SUCCESS=false"
        return 1
    fi
    
    # Execute commit
    if run_with_output "git commit -m '$message'" "Failed to commit changes"; then
        echo "COMMIT_SUCCESS=true"
        
        # Get commit hash
        local commit_hash
        commit_hash=$(git rev-parse HEAD)
        echo "COMMIT_HASH=$commit_hash"
        
        # Get short hash
        local short_hash
        short_hash=$(git rev-parse --short HEAD)
        echo "COMMIT_SHORT=$short_hash"
        
        success "Committed as $short_hash: $message"
    else
        echo "COMMIT_SUCCESS=false"
        return 1
    fi
}

# Main execution
main() {
    case "$OPERATION" in
        analyze)
            debug "Analyzing changes for commit message generation"
            analyze_changes_for_message
            ;;
            
        generate)
            debug "Generating commit message from changes"
            # First analyze
            local analysis
            analysis=$(analyze_changes_for_message)
            echo "$analysis"
            echo ""
            # Then generate message
            generate_commit_message "$analysis"
            ;;
            
        commit)
            if [ -n "$CUSTOM_MESSAGE" ]; then
                # Use provided message
                debug "Using custom commit message"
                execute_commit "$CUSTOM_MESSAGE"
            else
                # Generate and use smart message
                debug "Generating smart commit message"
                local analysis
                analysis=$(analyze_changes_for_message)
                local message_data
                message_data=$(generate_commit_message "$analysis")
                
                # Extract the generated message
                local generated_message=""
                eval "$message_data"
                generated_message="${COMMIT_MESSAGE:-}"
                
                if [ -z "$generated_message" ]; then
                    error_exit "Failed to generate commit message - no changes detected"
                fi
                
                echo "GENERATED_MESSAGE=$generated_message"
                execute_commit "$generated_message"
            fi
            ;;
            
        *)
            error_exit "Unknown operation: $OPERATION. Valid: analyze, generate, commit"
            ;;
    esac
}

# Run main function
main

