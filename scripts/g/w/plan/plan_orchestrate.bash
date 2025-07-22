#!/usr/bin/env bash
# Script: plan_orchestrate.bash
# Purpose: Main orchestrator for g:w:plan - coordinates plan creation workflow
# Usage: plan_orchestrate.bash [mode] [arguments]
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

# Set up temp file cleanup
setup_temp_cleanup

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

main() {
    # Accept parameters
    local mode="${1:-analyze}"
    shift || true
    local arguments=("$@")
    
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
