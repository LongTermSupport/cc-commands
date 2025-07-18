#!/usr/bin/env bash
# Script: error_handlers.bash
# Purpose: Standard error handling functions for all scripts
# Usage: source error_handlers.bash
# Output: Error messages to stderr, exits on error_exit

set -euo pipefail
IFS=$'\n\t'

# Color codes for output (only if terminal supports it)
if [ -t 2 ]; then
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    GREEN='\033[0;32m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=''
    YELLOW=''
    GREEN=''
    BOLD=''
    NC=''
fi

# Error exit function - use for fatal errors
error_exit() {
    local message="${1:-Unknown error}"
    local exit_code="${2:-1}"
    
    echo -e "${RED}${BOLD}ERROR: ${message}${NC}" >&2
    echo -e "${RED}================== COMMAND EXECUTION MUST STOP ==================${NC}" >&2
    echo -e "${RED}An unexpected error has occurred. Claude Code should not continue.${NC}" >&2
    echo -e "${RED}================================================================${NC}" >&2
    exit "$exit_code"
}

# Warning function - use for non-fatal issues
warn() {
    local message="${1:-Warning}"
    echo -e "${YELLOW}⚠ WARNING: ${message}${NC}" >&2
}

# Debug function - only outputs if VERBOSE is true
debug() {
    local message="${1:-Debug}"
    if [ "${VERBOSE:-false}" = "true" ]; then
        echo -e "${GREEN}🔍 DEBUG: ${message}${NC}" >&2
    fi
}

# Success message function
success() {
    local message="${1:-Success}"
    echo -e "${GREEN}✓ ${message}${NC}"
}

# Info message function
info() {
    local message="${1:-Info}"
    echo "→ ${message}"
}

# Validate required environment variable
require_env() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    
    if [ -z "$var_value" ]; then
        error_exit "Required environment variable '$var_name' is not set"
    fi
}

# Validate required argument
require_arg() {
    local arg_value="$1"
    local arg_name="$2"
    
    if [ -z "$arg_value" ]; then
        error_exit "Required argument '$arg_name' is missing"
    fi
}

# Check command exists
require_command() {
    local cmd="$1"
    
    if ! command -v "$cmd" >/dev/null 2>&1; then
        error_exit "Required command '$cmd' is not available"
    fi
}

# Trap handler for cleanup
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        warn "Script exited with code: $exit_code"
    fi
}

# Set trap for cleanup (can be overridden by sourcing script)
trap cleanup_on_exit EXIT

# Run command with output capture - only show on failure
run_with_output() {
    local cmd="$1"
    local error_msg="${2:-Command failed}"
    local output_file=$(mktemp)
    
    # Clean up temp file on exit
    trap "rm -f '$output_file'" RETURN
    
    debug "Running: $cmd"
    
    if eval "$cmd" > "$output_file" 2>&1; then
        # Success - only show debug output if verbose
        if [ "${VERBOSE:-false}" = "true" ] && [ -s "$output_file" ]; then
            debug "Command output:"
            cat "$output_file" | while IFS= read -r line; do
                debug "  $line"
            done
        fi
        return 0
    else
        local exit_code=$?
        # Failure - always show output
        echo -e "${RED}${BOLD}ERROR: ${error_msg}${NC}" >&2
        echo -e "${RED}Exit code: $exit_code${NC}" >&2
        echo -e "${RED}Command output:${NC}" >&2
        cat "$output_file" >&2
        return $exit_code
    fi
}

# Run command silently unless it fails
silent_run() {
    local cmd="$1"
    local output_file=$(mktemp)
    
    trap "rm -f '$output_file'" RETURN
    
    if eval "$cmd" > "$output_file" 2>&1; then
        return 0
    else
        local exit_code=$?
        cat "$output_file" >&2
        return $exit_code
    fi
}

# Export functions for use in subshells
export -f error_exit
export -f warn
export -f debug
export -f success
export -f info
export -f run_with_output
export -f silent_run

debug "Error handlers loaded successfully"