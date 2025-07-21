#!/usr/bin/env bash
# Script: plan_orchestrate.bash
# Purpose: Main orchestrator for g:w:plan - coordinates plan creation workflow
# Usage: plan_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../_common"

# Load common scripts
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
    # Accept parameters
    local mode="${1:-analyze}"
    shift || true
    local arguments="$@"
    
    echo "=== WORKFLOW PLAN ORCHESTRATOR ==="
    echo "Mode: $mode"
    echo "Arguments: $arguments"
    echo ""
    
    case "$mode" in
        analyze)
            # Step 1: Argument parsing
            capture_script_output "$SCRIPT_DIR/analysis/arg_parse.bash" "$arguments" || {
                error_exit "Argument parsing failed"
            }
            
            # Step 2: Workflow discovery
            capture_script_output "$SCRIPT_DIR/analysis/workflow_discover.bash" || {
                error_exit "Workflow discovery failed"
            }
            
            # Step 3: Check for existing plans (if filename provided)
            if [[ "${SCRIPT_OUTPUTS[FILENAME]:-}" != "" ]]; then
                capture_script_output "$SCRIPT_DIR/pre/check_existing.bash" "${SCRIPT_OUTPUTS[FILENAME]}" || {
                    error_exit "Existing plan check failed"
                }
            fi
            
            # Final output for analysis phase
            echo "=== ANALYSIS COMPLETE ==="
            echo "PHASE=analysis"
            echo "PLAN_NAME=${SCRIPT_OUTPUTS[PLAN_NAME]:-}"
            echo "FILENAME=${SCRIPT_OUTPUTS[FILENAME]:-}"
            echo "WORKFLOW_FOUND=${SCRIPT_OUTPUTS[WORKFLOW_FOUND]:-false}"
            echo "EXISTING_PLANS=${SCRIPT_OUTPUTS[EXISTING_PLANS]:-}"
            ;;
            
        create)
            # Create plan directory
            local plan_dir="${1:-CLAUDE/plan}"
            
            if [[ "$plan_dir" == "" ]]; then
                error_exit "Create mode requires plan directory argument"
            fi
            
            capture_script_output "$SCRIPT_DIR/execute/create_directory.bash" "$plan_dir" || {
                error_exit "Directory creation failed"
            }
            
            # Final output for create phase
            echo "=== CREATE COMPLETE ==="
            echo "PHASE=create"
            echo "PLAN_DIR=${SCRIPT_OUTPUTS[PLAN_DIR]:-}"
            echo "CREATED=${SCRIPT_OUTPUTS[CREATED]:-false}"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Use 'analyze' or 'create'"
            ;;
    esac
}

main "$@"
