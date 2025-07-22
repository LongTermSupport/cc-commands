#!/usr/bin/env bash
# Script: create_orchestrate.bash
# Purpose: Main orchestrator for g:command:create - coordinates command creation workflow
# Usage: create_orchestrate.bash [mode] [arguments]
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
    local mode="${1:-analyze}"
    shift || true
    local arguments=("$@")
    
    echo "=== CREATE COMMAND ORCHESTRATOR ==="
    echo "MODE=$mode"
    echo ""
    
    case "$mode" in
        analyze)
            # Step 1: Environment validation
            capture_script_output "$SCRIPT_DIR/pre/env_validate.bash" || {
                error_exit "Environment validation failed"
            }
            
            # Step 2: Parse arguments
            if [ -n "$arguments" ]; then
                capture_script_output "$SCRIPT_DIR/analysis/arg_parse.bash" "$arguments" || {
                    error_exit "Argument parsing failed"
                }
            else
                echo "NO_ARGUMENTS=true"
                echo "MODE=INTERACTIVE"
            fi
            
            # Step 3: Check documentation existence
            if [ -f "$SCRIPT_DIR/../../../../CLAUDE/CommandStructure.md" ]; then
                echo "COMMAND_STRUCTURE_DOC=true"
            else
                echo "COMMAND_STRUCTURE_DOC=false"
                warn "CommandStructure.md not found - new commands may not follow best practices"
            fi
            
            # Output summary for Claude
            echo "=== ANALYSIS COMPLETE ==="
            echo "READY_FOR_REQUIREMENTS=${SCRIPT_OUTPUTS[MODE]:-INTERACTIVE}"
            if [ -n "${SCRIPT_OUTPUTS[COMMAND_NAME]:-}" ]; then
                echo "COMMAND_NAME=${SCRIPT_OUTPUTS[COMMAND_NAME]}"
            fi
            ;;
            
        create)
            # This mode expects Claude has prepared the command content
            local command_name="$1"
            local command_content="$2"
            local scripts_needed="${3:-}"
            
            if [ -z "$command_name" ] || [ -z "$command_content" ]; then
                error_exit "Create mode requires command name and content"
            fi
            
            # Create the command file
            capture_script_output "$SCRIPT_DIR/execute/command.bash" "$command_name" "$command_content" || {
                error_exit "Failed to create command file"
            }
            
            # Create any needed scripts if following orchestrator pattern
            if [ -n "$scripts_needed" ] && [ "$scripts_needed" != "none" ]; then
                capture_script_output "$SCRIPT_DIR/execute/scripts.bash" "$command_name" "$scripts_needed" || {
                    error_exit "Failed to create command scripts"
                }
            fi
            
            # Final summary
            capture_script_output "$SCRIPT_DIR/post/summary.bash" "$command_name" || {
                warn "Summary generation failed"
            }
            
            echo "=== COMMAND CREATED SUCCESSFULLY ==="
            echo "COMMAND_CREATED=true"
            echo "RESTART_REQUIRED=true"
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Valid modes: analyze, create"
            ;;
    esac
}

main "$@"
