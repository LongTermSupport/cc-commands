#!/usr/bin/env bash
# Script: update_orchestrate.bash
# Purpose: Main orchestrator for g:command:update - coordinates analysis and update operations
# Usage: update_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

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
    local arguments="${2:-}"
    
    echo "=== COMMAND UPDATE ORCHESTRATOR ==="
    echo "Mode: $mode"
    echo "Arguments: $arguments"
    echo ""
    
    case "$mode" in
        analyze)
            # Step 1: Environment validation
            capture_script_output "$SCRIPT_DIR/pre/env_check.bash" || {
                error_exit "Environment validation failed"
            }
            
            # Step 2: Argument parsing
            capture_script_output "$SCRIPT_DIR/analysis/arg_parse.bash" "$arguments" || {
                error_exit "Argument parsing failed"
            }
            
            # Step 3: Command validation (if command name provided)
            if [[ "${SCRIPT_OUTPUTS[COMMAND_NAME]:-}" != "" ]]; then
                capture_script_output "$SCRIPT_DIR/analysis/validate_command.bash" "$arguments" || {
                    error_exit "Command validation failed"
                }
            fi
            
            # Final output for analysis phase
            echo "=== ANALYSIS COMPLETE ==="
            echo "PHASE=analysis"
            echo "COMMAND_NAME=${SCRIPT_OUTPUTS[COMMAND_NAME]:-}"
            echo "COMMAND_PATH=${SCRIPT_OUTPUTS[COMMAND_PATH]:-}"
            echo "UPDATE_MODE=${SCRIPT_OUTPUTS[UPDATE_MODE]:-}"
            echo "ADDITIONAL_REQUIREMENTS=${SCRIPT_OUTPUTS[ADDITIONAL_REQUIREMENTS]:-}"
            ;;
            
        backup)
            # Just run backup operation
            if [[ "${2:-}" == "" ]]; then
                error_exit "Backup mode requires arguments"
            fi
            
            capture_script_output "$SCRIPT_DIR/execute/backup_command.bash" "$arguments" || {
                error_exit "Backup operation failed"
            }
            
            # Final output for backup phase
            echo "=== BACKUP COMPLETE ==="
            echo "PHASE=backup"
            echo "BACKUP_PATH=${SCRIPT_OUTPUTS[BACKUP_PATH]:-}"
            echo "COMMAND_PATH=${SCRIPT_OUTPUTS[COMMAND_PATH]:-}"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Use 'analyze' or 'backup'"
            ;;
    esac
}

main "$@"
echo "Script success: ${0##*/}"