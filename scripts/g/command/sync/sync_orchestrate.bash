#!/usr/bin/env bash
# Script: sync_orchestrate.bash
# Purpose: Main orchestrator for sync command - calls all sub-scripts conditionally
# Usage: sync_orchestrate.bash [commit_message]
# Output: Orchestrated sync operation with structured output

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"
SYNC_DIR="$SCRIPT_DIR/sync"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

# Variable to store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture script output and extract KEY=value pairs
capture_script_output() {
    local script_path="$1"
    shift
    local args="$@"
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" $args > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                SCRIPT_OUTPUTS["$key"]="$value"
                # Captured: $key=$value
            fi
        done < "$temp_file"
    else
        local exit_code=$?
        echo "ERROR: Script failed with exit code $exit_code"
        cat "$temp_file"
        rm -f "$temp_file"
        return $exit_code
    fi
    
    rm -f "$temp_file"
    echo ""
    return 0
}

# Main orchestration logic
main() {
    # Accept commit message as parameter
    local commit_message="${1:-}"
    
    echo "🔄 Starting sync orchestration"
    echo ""
    
    # Step 1: Environment validation
    capture_script_output "$SYNC_DIR/pre/env_validate.bash" || {
        error_exit "Environment validation failed"
    }
    
    # Step 2: Repository status analysis
    capture_script_output "$SYNC_DIR/analysis/status_analysis.bash" || {
        error_exit "Status analysis failed"
    }
    
    # Step 3: Change analysis (only if changes exist)
    if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
        capture_script_output "$SYNC_DIR/analysis/change_analysis.bash" || {
            error_exit "Change analysis failed"
        }
    else
        echo "✓ No changes to analyze"
        echo ""
    fi
    
    # Step 4: Commit execution (only if changes exist and commit message provided)
    if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
        if [[ -n "$commit_message" ]]; then
            capture_script_output "$SYNC_DIR/git/commit_execute.bash" "$commit_message" || {
                error_exit "Commit execution failed"
            }
        else
            echo "⚠️  WARNING: Changes exist but no commit message provided"
            echo "COMMIT_MESSAGE_REQUIRED=true"
            echo ""
        fi
    fi
    
    # Step 5: Pull from remote
    local current_branch="${SCRIPT_OUTPUTS[CURRENT_BRANCH]:-main}"
    capture_script_output "$SYNC_DIR/git/pull_execute.bash" "$current_branch" || {
        error_exit "Pull execution failed"
    }
    
    # Step 6: Check README status
    capture_script_output "$SYNC_DIR/analysis/readme_check.bash" || {
        error_exit "README check failed"
    }
    
    # Step 7: Update README if needed
    if [[ "${SCRIPT_OUTPUTS[README_OUTDATED]:-false}" == "true" ]]; then
        echo "README_UPDATE_NEEDED=true"
        echo "⚠️  README update required - handle in Claude Code"
        echo ""
    fi
    
    # Step 8: Push to remote (only if needed)
    if [[ "${SCRIPT_OUTPUTS[PUSH_NEEDED]:-false}" == "true" ]] || \
       [[ "${SCRIPT_OUTPUTS[COMMIT_SUCCESS]:-false}" == "true" ]]; then
        capture_script_output "$SYNC_DIR/git/push_execute.bash" "$current_branch" || {
            error_exit "Push execution failed"
        }
    else
        echo "✓ No push needed - already up to date"
        echo ""
    fi
    
    # Step 9: Final summary
    capture_script_output "$SYNC_DIR/post/summary.bash" || {
        echo "⚠️  Summary generation failed, but sync completed"
    }
    
    echo "✅ Sync orchestration complete"
    
    # Output final state for Claude Code
    echo ""
    echo "=== FINAL STATE ==="
    echo "SYNC_COMPLETE=true"
    echo "CHANGES_COMMITTED=${SCRIPT_OUTPUTS[COMMIT_SUCCESS]:-false}"
    echo "README_UPDATE_NEEDED=${SCRIPT_OUTPUTS[README_OUTDATED]:-false}"
    echo "REMOTE_SYNCED=${SCRIPT_OUTPUTS[PUSH_SUCCESS]:-true}"
    echo "CURRENT_BRANCH=$current_branch"
}

# Execute main function with optional commit message parameter
main "$@"
echo "Script success: ${0##*/}"