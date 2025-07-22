#!/usr/bin/env bash
# Script: summary_orchestrate.bash
# Purpose: Main orchestrator for GitHub project summary - coordinates dynamic data collection and analysis
# Usage: summary_orchestrate.bash [mode] [arguments]
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
    local args=("$@")
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" "${args[@]}" > "$temp_file" 2>&1; then
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
    local audience="${2:-client}"
    local github_url="${3:-}"
    local org="${4:-}"
    local project_id="${5:-}"
    
    case "$mode" in
        analyze)
            echo "=== PROJECT SUMMARY ANALYSIS PHASE ==="
            
            # Step 1: Environment validation
            capture_script_output "$SCRIPT_DIR/pre/env_validate.bash" || {
                error_exit "Environment validation failed"
            }
            
            # Check if prerequisites are met
            if [[ "${SCRIPT_OUTPUTS[PREREQUISITES_MET]:-false}" != "true" ]]; then
                echo "ANALYSIS_COMPLETE=false"
                echo "PREREQUISITES_MET=false"
                echo "ERROR_MESSAGE=${SCRIPT_OUTPUTS[ERROR_MESSAGE]:-Unknown validation error}"
                return 1
            fi
            
            # Step 2: GitHub org and project detection/validation
            capture_script_output "$SCRIPT_DIR/pre/project_detect.bash" "$github_url" "$org" "$project_id" || {
                error_exit "Project detection failed"
            }
            
            if [[ "${SCRIPT_OUTPUTS[PROJECT_READY]:-false}" != "true" ]]; then
                echo "ANALYSIS_COMPLETE=false" 
                echo "PROJECT_READY=false"
                echo "ERROR_MESSAGE=${SCRIPT_OUTPUTS[ERROR_MESSAGE]:-Project detection failed}"
                return 1
            fi
            
            echo "=== ANALYSIS COMPLETE ==="
            echo "ANALYSIS_COMPLETE=true"
            echo "PREREQUISITES_MET=${SCRIPT_OUTPUTS[PREREQUISITES_MET]:-false}"
            echo "PROJECT_READY=${SCRIPT_OUTPUTS[PROJECT_READY]:-false}"
            echo "GH_AUTH=${SCRIPT_OUTPUTS[GH_AUTH]:-unknown}"
            echo "DETECTED_ORG=${SCRIPT_OUTPUTS[DETECTED_ORG]:-unknown}"
            echo "DETECTED_PROJECT_ID=${SCRIPT_OUTPUTS[DETECTED_PROJECT_ID]:-unknown}"
            echo "PROJECT_TITLE=${SCRIPT_OUTPUTS[PROJECT_TITLE]:-unknown}"
            echo "REPO_COUNT=${SCRIPT_OUTPUTS[REPO_COUNT]:-0}"
            echo "AUDIENCE=$audience"
            ;;
            
        execute)
            echo "=== PROJECT SUMMARY EXECUTION PHASE ==="
            
            # Step 1: Dynamic data collection with detected parameters
            local detected_org="${SCRIPT_OUTPUTS[DETECTED_ORG]:-$org}"
            local detected_project_id="${SCRIPT_OUTPUTS[DETECTED_PROJECT_ID]:-$project_id}"
            
            capture_script_output "$SCRIPT_DIR/execute/data_collect.bash" "$detected_org" "$detected_project_id" || {
                error_exit "Data collection failed"
            }
            
            # Check if data was collected successfully
            if [[ "${SCRIPT_OUTPUTS[DATA_COLLECTED]:-false}" != "true" ]]; then
                echo "EXECUTION_COMPLETE=false"
                echo "DATA_COLLECTED=false"
                echo "ERROR_MESSAGE=${SCRIPT_OUTPUTS[ERROR_MESSAGE]:-Data collection failed}"
                return 1
            fi
            
            # Step 2: Summary generation and analysis  
            capture_script_output "$SCRIPT_DIR/post/summary_generate.bash" "${SCRIPT_OUTPUTS[DATA_FILE]:-}" "$audience" || {
                error_exit "Summary generation failed"
            }
            
            echo "=== EXECUTION COMPLETE ==="
            echo "EXECUTION_COMPLETE=true"
            echo "DATA_COLLECTED=${SCRIPT_OUTPUTS[DATA_COLLECTED]:-false}"
            echo "SUMMARY_GENERATED=${SCRIPT_OUTPUTS[SUMMARY_GENERATED]:-false}"
            echo "DATA_FILE=${SCRIPT_OUTPUTS[DATA_FILE]:-}"
            echo "SUMMARY_STATS=${SCRIPT_OUTPUTS[SUMMARY_STATS]:-}"
            echo "AUDIENCE=$audience"
            echo "FINAL_ORG=${SCRIPT_OUTPUTS[FINAL_ORG]:-$detected_org}"
            echo "FINAL_PROJECT_ID=${SCRIPT_OUTPUTS[FINAL_PROJECT_ID]:-$detected_project_id}"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Use 'analyze' or 'execute'"
            ;;
    esac
}

main "$@"
echo "Script success: ${0##*/}"
