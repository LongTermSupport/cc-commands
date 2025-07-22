#!/usr/bin/env bash
# Script: sync_orchestrate.bash
# Purpose: Main orchestrator for sync command - calls all sub-scripts conditionally
# Usage: sync_orchestrate.bash [commit_message]
# Output: Orchestrated sync operation with structured output

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

# Set up temp file cleanup
setup_temp_cleanup

# Variable to store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Main orchestration logic
main() {
    # Accept commit message as parameter
    local commit_message="${1:-}"
    
    echo "🔄 Starting sync orchestration"
    echo ""
    
    # Step 1: Environment validation
    capture_script_output "$SCRIPT_DIR/pre/env_validate.bash" || {
        error_exit "Environment validation failed"
    }
    
    # Step 2: Repository status analysis
    capture_script_output "$SCRIPT_DIR/analysis/status_analysis.bash" || {
        error_exit "Status analysis failed"
    }
    
    # Step 3: Change analysis (only if changes exist)
    if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
        capture_script_output "$SCRIPT_DIR/analysis/change_analysis.bash" || {
            error_exit "Change analysis failed"
        }
    else
        echo "✓ No changes to analyze"
        echo ""
    fi
    
    # Step 4: Commit execution (only if changes exist and commit message provided)
    if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}" == "true" ]]; then
        if [[ -n "$commit_message" ]]; then
            capture_script_output "$SCRIPT_DIR/git/commit_execute.bash" "$commit_message" || {
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
    capture_script_output "$SCRIPT_DIR/git/pull_execute.bash" "$current_branch" || {
        error_exit "Pull execution failed"
    }
    
    # Step 6: Check README status
    capture_script_output "$SCRIPT_DIR/analysis/readme_check.bash" || {
        error_exit "README check failed"
    }
    
    # Step 7: Update documentation if needed
    local docs_update_needed=false
    if [[ "${SCRIPT_OUTPUTS[README_OUTDATED]:-false}" == "true" ]] || \
       [[ "${SCRIPT_OUTPUTS[COMMON_SCRIPTS_OUTDATED]:-false}" == "true" ]] || \
       [[ "${SCRIPT_OUTPUTS[COMMON_INCLUDES_OUTDATED]:-false}" == "true" ]]; then
        docs_update_needed=true
        echo "README_UPDATE_NEEDED=true"
        echo "⚠️  Documentation update required - handle in Claude Code"
        
        if [[ "${SCRIPT_OUTPUTS[README_OUTDATED]:-false}" == "true" ]]; then
            echo "  - README.md needs updating"
        fi
        if [[ "${SCRIPT_OUTPUTS[COMMON_SCRIPTS_OUTDATED]:-false}" == "true" ]]; then
            echo "  - CommonScripts.md needs updating"
        fi
        if [[ "${SCRIPT_OUTPUTS[COMMON_INCLUDES_OUTDATED]:-false}" == "true" ]]; then
            echo "  - CommonIncludes.md needs updating"
        fi
        echo ""
    else
        echo "README_UPDATE_NEEDED=false"
        echo "✓ All documentation is current"
        echo ""
    fi
    
    # Step 8: Push to remote (only if needed)
    if [[ "${SCRIPT_OUTPUTS[PUSH_NEEDED]:-false}" == "true" ]] || \
       [[ "${SCRIPT_OUTPUTS[COMMIT_SUCCESS]:-false}" == "true" ]]; then
        capture_script_output "$SCRIPT_DIR/git/push_execute.bash" "$current_branch" || {
            error_exit "Push execution failed"
        }
    else
        echo "✓ No push needed - already up to date"
        echo ""
    fi
    
    # Step 9: Final summary
    capture_script_output "$SCRIPT_DIR/post/summary.bash" || {
        echo "⚠️  Summary generation failed, but sync completed"
    }
    
    echo "✅ Sync orchestration complete"
    
    # Output final state for Claude Code
    echo ""
    echo "=== FINAL STATE ==="
    echo "SYNC_COMPLETE=true"
    echo "CHANGES_COMMITTED=${SCRIPT_OUTPUTS[COMMIT_SUCCESS]:-false}"
    echo "README_UPDATE_NEEDED=${docs_update_needed}"
    echo "REMOTE_SYNCED=${SCRIPT_OUTPUTS[PUSH_SUCCESS]:-true}"
    echo "CURRENT_BRANCH=$current_branch"
}

# Execute main function with optional commit message parameter
main "$@"
