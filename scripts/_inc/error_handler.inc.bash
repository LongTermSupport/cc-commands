# Include: error_handler.inc.bash
# Purpose: Common error handling functions to be sourced by scripts
# Usage: source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"
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

# Warning message - continues execution
# Usage: warn "Warning message"
warn() {
    local message="${1:-Warning}"
    echo "⚠️  WARNING: $message" >&2
}

# Info message - informational output
# Usage: info "Info message"
info() {
    local message="${1:-}"
    echo "ℹ️  $message"
}

# Success message
# Usage: success "Success message"
success() {
    local message="${1:-}"
    echo "✓ $message"
}

# Debug message - only shows if DEBUG environment variable is set
# Usage: debug "Debug message"
debug() {
    local message="${1:-}"
    if [ -n "${DEBUG:-}" ]; then
        echo "[DEBUG] $message" >&2
    fi
}

# Run command with output capture, show output only on failure
# Usage: run_with_output "command" "Error message on failure"
run_with_output() {
    local cmd="$1"
    local error_msg="${2:-Command failed}"
    local output_file=$(mktemp)
    
    if eval "$cmd" > "$output_file" 2>&1; then
        rm -f "$output_file"
        return 0
    else
        local exit_code=$?
        echo "ERROR: $error_msg" >&2
        echo "Command output:" >&2
        cat "$output_file" >&2
        rm -f "$output_file"
        return $exit_code
    fi
}

# Silent run - suppress all output unless DEBUG is set
# Usage: silent_run "command"
silent_run() {
    local cmd="$1"
    if [ -n "${DEBUG:-}" ]; then
        eval "$cmd"
    else
        eval "$cmd" >/dev/null 2>&1
    fi
}

# Check if command exists
# Usage: require_command "git" "Git is required but not installed"
require_command() {
    local cmd="$1"
    local error_msg="${2:-$cmd is required but not installed}"
    
    if ! command -v "$cmd" &> /dev/null; then
        error_exit "$error_msg"
    fi
}

# Check if directory exists
# Usage: require_directory "/path/to/dir" "Custom error message"
require_directory() {
    local dir="$1"
    local error_msg="${2:-Required directory not found: $dir}"
    
    if [ ! -d "$dir" ]; then
        error_exit "$error_msg"
    fi
}

# Check if file exists
# Usage: require_file "/path/to/file" "Custom error message"
require_file() {
    local file="$1"
    local error_msg="${2:-Required file not found: $file}"
    
    if [ ! -f "$file" ]; then
        error_exit "$error_msg"
    fi
}

# Validate git repository
# Usage: require_git_repo "Custom error message"
require_git_repo() {
    local error_msg="${1:-Not in a git repository}"
    
    if [ ! -d ".git" ]; then
        error_exit "$error_msg"
    fi
}

# Create temporary file with automatic cleanup
# Usage: temp_file=$(create_temp_file)
# Note: Caller should set up trap for cleanup_temp_files
create_temp_file() {
    local temp_file=$(mktemp)
    # Add to cleanup list
    _TEMP_FILES+=("$temp_file")
    echo "$temp_file"
}

# Cleanup function - caller should add to their trap
cleanup_temp_files() {
    for file in "${_TEMP_FILES[@]:-}"; do
        [ -f "$file" ] && rm -f "$file"
    done
}

# Initialize temp files array if not already done
if [ -z "${_TEMP_FILES:-}" ]; then
    declare -a _TEMP_FILES
fi