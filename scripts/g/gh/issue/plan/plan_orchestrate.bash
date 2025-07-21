#!/usr/bin/env bash
# Script: plan_orchestrate.bash
# Purpose: Main orchestrator for g:gh:issue:plan - converts GitHub issues to project plans
# Usage: plan_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"
PLAN_DIR="$SCRIPT_DIR"

# Source error handler
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture and parse script outputs
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

main() {
    local mode="${1:-full}"
    shift || true
    local arguments="$@"
    
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
            if [[ -n "${SCRIPT_OUTPUTS[ISSUE_NUMBER]:-}" ]]; then
                capture_script_output "$PLAN_DIR/analysis/issue_fetch.bash" "${SCRIPT_OUTPUTS[ISSUE_NUMBER]}" || {
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
            
            # Create plan file
            capture_script_output "$PLAN_DIR/execute/file_create.bash" "$issue_number" "$issue_title" || {
                error_exit "Failed to create plan file"
            }
            
            # Verify plan
            if [[ -n "${SCRIPT_OUTPUTS[PLAN_FILE_PATH]:-}" ]]; then
                capture_script_output "$PLAN_DIR/post/verify.bash" "${SCRIPT_OUTPUTS[PLAN_FILE_PATH]}" || {
                    error_exit "Plan verification failed"
                }
            fi
            ;;
            
        commit)
            # Phase 3: Commit and comment
            echo "=== COMMIT PHASE ==="
            
            local plan_file="${1:-${SCRIPT_OUTPUTS[PLAN_FILE_PATH]:-}}"
            local issue_number="${2:-${SCRIPT_OUTPUTS[ISSUE_NUMBER]:-}}"
            
            if [[ -z "$plan_file" || -z "$issue_number" ]]; then
                error_exit "Plan file and issue number required for commit"
            fi
            
            capture_script_output "$PLAN_DIR/post/commit_comment.bash" "$plan_file" "$issue_number" || {
                error_exit "Failed to commit and comment"
            }
            ;;
            
        full|*)
            # Full execution - all phases
            echo "=== FULL ORCHESTRATION ==="
            
            # Run analysis
            "$0" analyze "$arguments" || exit $?
            
            # Check if we have issue data
            if [[ -z "${SCRIPT_OUTPUTS[ISSUE_NUMBER]:-}" ]]; then
                echo "NO_ISSUE_SELECTED=true"
                exit 0
            fi
            
            # Run execution
            "$0" execute "${SCRIPT_OUTPUTS[ISSUE_NUMBER]}" "${SCRIPT_OUTPUTS[ISSUE_TITLE]}" || exit $?
            
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
