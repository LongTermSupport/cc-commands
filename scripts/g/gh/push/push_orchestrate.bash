#!/usr/bin/env bash
# Script: push_orchestrate.bash
# Purpose: Main orchestrator for g:gh:push - coordinates git push with GitHub Actions monitoring
# Usage: push_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
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

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture and parse script outputs
capture_script_output() {
    local script_path="$1"
    shift
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" "$@" > "$temp_file" 2>&1; then
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
    local mode="${1:-analyze}"
    shift || true
    
    echo "=== PUSH ORCHESTRATOR ==="
    echo "MODE=$mode"
    echo ""
    
    case "$mode" in
        analyze)
            # Step 1: Environment validation
            capture_script_output "$COMMON_DIR/env/env_validate.bash" git gh || {
                error_exit "Environment validation failed"
            }
            
            # Step 2: Repository state analysis
            capture_script_output "$COMMON_DIR/git/git_state_analysis.bash" summary || {
                error_exit "Repository state analysis failed"
            }
            
            # Step 3: Decision analysis
            local changes_exist="${SCRIPT_OUTPUTS[CHANGES_EXIST]:-false}"
            local push_needed="${SCRIPT_OUTPUTS[PUSH_NEEDED]:-false}"
            
            capture_script_output "$SCRIPT_DIR/analysis/decision.bash" "$changes_exist" "$push_needed" || {
                error_exit "Push decision analysis failed"
            }
            
            # Step 4: Commit message preparation (if needed)
            local action="${SCRIPT_OUTPUTS[ACTION]:-none}"
            if [ "$action" = "commit_and_push" ]; then
                capture_script_output "$SCRIPT_DIR/analysis/commit_message.bash" "$action" || {
                    error_exit "Commit message preparation failed"
                }
            fi
            
            # Output summary for Claude
            echo "=== ANALYSIS COMPLETE ==="
            echo "ACTION_REQUIRED=${SCRIPT_OUTPUTS[ACTION]:-none}"
            echo "CHANGES_EXIST=$changes_exist"
            echo "PUSH_NEEDED=$push_needed"
            if [ "$action" = "commit_and_push" ]; then
                echo "COMMIT_MESSAGE_NEEDED=true"
            else
                echo "COMMIT_MESSAGE_NEEDED=false"
            fi
            ;;
            
        execute)
            # This mode expects the action and optionally a commit message
            local action="${1:-}"
            local commit_message="${2:-}"
            
            if [ -z "$action" ]; then
                error_exit "Execute mode requires action parameter"
            fi
            
            # Execute git operations
            if [ "$action" != "none" ]; then
                capture_script_output "$SCRIPT_DIR/execute/execute_git.bash" "$action" "$commit_message" || {
                    error_exit "Git execution failed"
                }
                
                local push_result="${SCRIPT_OUTPUTS[PUSH_RESULT]:-failed}"
                local pushed_commit="${SCRIPT_OUTPUTS[PUSHED_COMMIT]:-}"
                
                if [ "$push_result" = "success" ]; then
                    # Detect workflows
                    capture_script_output "$SCRIPT_DIR/monitor/push_workflow_detect.bash" "$push_result" "$pushed_commit" || {
                        warn "Workflow detection failed"
                    }
                    
                    local monitoring_needed="${SCRIPT_OUTPUTS[MONITORING_NEEDED]:-false}"
                    
                    # Monitor workflows if needed
                    if [ "$monitoring_needed" = "true" ]; then
                        capture_script_output "$SCRIPT_DIR/monitor/push_workflow_monitor.bash" "$monitoring_needed" "$pushed_commit" 300 || {
                            warn "Workflow monitoring failed"
                        }
                    fi
                    
                    # Final status check
                    capture_script_output "$SCRIPT_DIR/post/final_status.bash" "$pushed_commit" "$push_result" || {
                        warn "Final status check failed"
                    }
                fi
            fi
            
            echo "=== EXECUTION COMPLETE ==="
            echo "FINAL_RESULT=${push_result:-none}"
            echo "WORKFLOWS_MONITORED=${monitoring_needed:-false}"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Valid modes: analyze, execute"
            ;;
    esac
}

main "$@"
