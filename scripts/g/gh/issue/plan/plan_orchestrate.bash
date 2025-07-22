#!/usr/bin/env bash
# Script: plan_orchestrate.bash
# Purpose: Main orchestrator for g:gh:issue:plan - converts GitHub issues to project plans
# Usage: plan_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}
PLAN_DIR="$SCRIPT_DIR"

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

# Set up temp file cleanup
setup_temp_cleanup

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

main() {
    local mode="${1:-full}"
    shift || true
    local arguments=("$@")
    
    case "$mode" in
        analyze)
            # Phase 1: Analysis only
            echo "=== ANALYSIS PHASE ==="
            
            # Step 1: Environment validation
            capture_script_output "$PLAN_DIR/pre/env_validate.bash" || {
                error_exit "Environment validation failed"
            }
            
            # Step 2: Argument parsing
            capture_script_output "$PLAN_DIR/analysis/arg_parse.bash" "$arguments" || {
                error_exit "Argument parsing failed"
            }
            
            # Step 3: List issues if needed
            if [[ "${SCRIPT_OUTPUTS[MODE]:-}" == "interactive" ]]; then
                capture_script_output "$PLAN_DIR/analysis/list_issues.bash" || {
                    error_exit "Failed to list issues"
                }
            fi
            
            # Step 4: Fetch issue data
            if [[ -n "${SCRIPT_OUTPUTS[PARSED_ISSUE_NUMBER]:-}" ]]; then
                # Use full issue reference if available, otherwise just the issue number
                local issue_ref="${SCRIPT_OUTPUTS[PARSED_ISSUE_REFERENCE]:-${SCRIPT_OUTPUTS[PARSED_ISSUE_NUMBER]}}"
                capture_script_output "$PLAN_DIR/analysis/issue_fetch.bash" "$issue_ref" || {
                    error_exit "Failed to fetch issue data"
                }
            fi
            ;;
            
        execute)
            # Phase 2: Execution only
            echo "=== EXECUTION PHASE ==="
            
            local issue_number="${1:-${SCRIPT_OUTPUTS[ISSUE_NUMBER]:-}}"
            local issue_title="${2:-${SCRIPT_OUTPUTS[ISSUE_TITLE]:-}}"
            
            if [[ -z "$issue_number" || -z "$issue_title" ]]; then
                error_exit "Issue number and title required for execution"
            fi
            
            # Validate plan file path
            capture_script_output "$PLAN_DIR/execute/path_validate.bash" "$issue_number" "$issue_title" || {
                error_exit "Failed to validate plan file path"
            }
            
            printf "\n\nLLM TO WRITE THE PLAN CONTENTS TO THE SPECIFIED FILE PATH\n\n"
            ;;
            
        commit)
            # Verify plan
            if [[ -n "${SCRIPT_OUTPUTS[PLAN_FILE_PATH]:-}" ]]; then
                capture_script_output "$PLAN_DIR/post/verify.bash" "${SCRIPT_OUTPUTS[PLAN_FILE_PATH]}" || {
                    error_exit "Plan verification failed"
                }
            fi
            # Phase 3: Commit and comment
            echo "=== COMMIT PHASE ==="
            
            local plan_file="${1:-${SCRIPT_OUTPUTS[PLAN_FILE_PATH]:-}}"
            local issue_number="${2:-${SCRIPT_OUTPUTS[ISSUE_NUMBER]:-}}"
            local issue_title="${SCRIPT_OUTPUTS[ISSUE_TITLE]:-Unknown}"
            
            if [[ -z "$plan_file" || -z "$issue_number" ]]; then
                error_exit "Plan file and issue number required for commit"
            fi
            
            # Count tasks in the plan file (look for - [ ] patterns)
            local task_count=0
            if [[ -f "$plan_file" ]]; then
                task_count=$(grep -c -- '- \[ \]' "$plan_file" 2>/dev/null || echo "0")
            fi
            
            capture_script_output "$PLAN_DIR/post/commit_comment.bash" "$issue_number" "$issue_title" "$plan_file" "$task_count" || {
                error_exit "Failed to commit and comment"
            }
            ;;
            
        full|*)
            # Full execution - all phases
            echo "=== FULL ORCHESTRATION ==="
            
            # Run analysis
            "$0" analyze "$arguments" || exit $?
            
            # Check if we have issue data
            if [[ -z "${SCRIPT_OUTPUTS[PARSED_ISSUE_NUMBER]:-}" ]]; then
                echo "NO_ISSUE_SELECTED=true"
                exit 0
            fi
            
            # Run execution
            "$0" execute "${SCRIPT_OUTPUTS[PARSED_ISSUE_NUMBER]}" "${SCRIPT_OUTPUTS[ISSUE_TITLE]}" || exit $?
            
            # Output for Claude to decide on commit
            echo "READY_TO_COMMIT=true"
            ;;
    esac
    
    # Final output for Claude
    echo ""
    echo "=== FINAL STATE ==="
    for key in "${!SCRIPT_OUTPUTS[@]}"; do
        echo "$key=${SCRIPT_OUTPUTS[$key]}"
    done
}

main "$@"
