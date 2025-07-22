# Include: error_handler.inc.bash
# Purpose: Common error handling functions to be sourced by scripts
# Usage: source "$SCRIPT_DIR/_inc/error_handler.inc.bash"
# Note: This file is meant to be SOURCED, not executed
# WARNING: Do not set shell options (set -e, etc) or IFS in include files!

# Guard against multiple inclusion
if [ -n "${_ERROR_HANDLER_INCLUDED:-}" ]; then
    return 0
fi
_ERROR_HANDLER_INCLUDED=1

# Critical error exit function - stops all execution
# Usage: error_exit "Error message"
error_exit() {
    local message="${1:-Unknown error occurred}"
    echo "ERROR: $message" >&2
    echo "================== COMMAND EXECUTION MUST STOP ==================" >&2
    echo "An unexpected error has occurred. Claude Code should not continue." >&2
    echo "================================================================" >&2
    exit 1
}



# Run command with output capture, show output only on failure
# Usage: run_with_output "command" "Error message on failure"
run_with_output() {
    local cmd="$1"
    local error_msg="${2:-Command failed}"
    local output_file
    
    # Use proper temp file system if helpers are available
    if declare -f create_temp_file >/dev/null 2>&1; then
        output_file=$(create_temp_file "run_with_output")
    else
        # Fallback to mktemp if helpers not loaded
        output_file=$(mktemp)
    fi
    
    if eval "$cmd" > "$output_file" 2>&1; then
        # Clean up using proper function if available
        if declare -f cleanup_temp_file >/dev/null 2>&1; then
            cleanup_temp_file "$output_file"
        else
            rm -f "$output_file"
        fi
        return 0
    else
        local exit_code=$?
        echo "ERROR: $error_msg" >&2
        echo "Command output:" >&2
        cat "$output_file" >&2
        
        # Clean up using proper function if available
        if declare -f cleanup_temp_file >/dev/null 2>&1; then
            cleanup_temp_file "$output_file"
        else
            rm -f "$output_file"
        fi
        return $exit_code
    fi
}

# Silent run - suppress all output unless DEBUG is set
# Usage: silent_run "command"
silent_run() {
    local cmd="$1"
    if [[ -n "${DEBUG:-}" ]]; then
        eval "$cmd"
    else
        eval "$cmd" >/dev/null 2>&1
    fi
}