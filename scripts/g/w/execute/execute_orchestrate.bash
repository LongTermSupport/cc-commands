#!/usr/bin/env bash
# Script: execute_orchestrate.bash
# Purpose: Main orchestrator for g:w:execute - coordinates plan execution workflow
# Usage: execute_orchestrate.bash [mode] [arguments]
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
    
    echo "=== EXECUTE ORCHESTRATOR ==="
    echo "MODE=$mode"
    echo ""
    
    case "$mode" in
        analyze)
            # Parse arguments first
            capture_script_output "$SCRIPT_DIR/pre/arg_parse.bash" "$@" || {
                error_exit "Argument parsing failed"
            }
            
            # Extract parsed mode and plan name
            local parsed_mode="${SCRIPT_OUTPUTS[MODE]:-LIST}"
            local plan_name="${SCRIPT_OUTPUTS[PLAN_NAME]:-}"
            
            # Environment validation
            capture_script_output "$SCRIPT_DIR/pre/env_validate.bash" || {
                error_exit "Environment validation failed"
            }
            
            # Handle based on parsed mode
            if [ "$parsed_mode" = "LIST" ]; then
                # List plans mode
                capture_script_output "$COMMON_DIR/file/file_find_plans.bash" list || {
                    error_exit "Failed to list plans"
                }
                
                echo "=== ANALYSIS COMPLETE ==="
                echo "ACTION_REQUIRED=none"
                echo "MODE=LIST"
                echo "PLANS_LISTED=true"
            else
                # Execute mode - find and analyze plan
                capture_script_output "$COMMON_DIR/file/file_find_plans.bash" find "$plan_name" || {
                    error_exit "Plan search failed"
                }
                
                local match_type="${SCRIPT_OUTPUTS[MATCH_TYPE]:-none}"
                local plan_path="${SCRIPT_OUTPUTS[PLAN_FILE]:-}"
                
                if [ "$match_type" != "none" ] && [ -n "$plan_path" ]; then
                    # Verify plan status
                    capture_script_output "$SCRIPT_DIR/analysis/status_verify.bash" "$plan_path" || {
                        error_exit "Status verification failed"
                    }
                fi
                
                echo "=== ANALYSIS COMPLETE ==="
                echo "ACTION_REQUIRED=execute"
                echo "MODE=EXECUTE"
                echo "PLAN_NAME=$plan_name"
                echo "PLAN_FOUND=$([[ "$match_type" != "none" ]] && echo "true" || echo "false")"
                if [ -n "$plan_path" ]; then
                    echo "PLAN_PATH=$plan_path"
                fi
            fi
            ;;
            
        execute)
            # Execute mode expects plan path and action type
            local plan_path="${1:-}"
            local action="${2:-run_tasks}"
            
            if [ -z "$plan_path" ]; then
                error_exit "Execute mode requires plan path"
            fi
            
            case "$action" in
                allcs)
                    # Run code standards
                    capture_script_output "$SCRIPT_DIR/execute/allcs.bash" || {
                        warn "Code standards check had issues"
                    }
                    ;;
                    
                static_analysis)
                    # Run static analysis
                    capture_script_output "$SCRIPT_DIR/execute/static_analysis.bash" || {
                        warn "Static analysis had issues"
                    }
                    ;;
                    
                git_status)
                    # Check git status
                    capture_script_output "$SCRIPT_DIR/post/git_status.bash" || {
                        warn "Git status check failed"
                    }
                    ;;
                    
                *)
                    error_exit "Unknown execute action: $action"
                    ;;
            esac
            
            echo "=== EXECUTION COMPLETE ==="
            echo "ACTION=$action"
            echo "RESULT=success"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Valid modes: analyze, execute"
            ;;
    esac
}

main "$@"
