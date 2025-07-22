#!/usr/bin/env bash
# Include: helpers.inc.bash  
# Purpose: Common helper functions for all scripts
# Usage: This file is meant to be SOURCED, not executed

# Include guard
if [[ "${HELPERS_INC_INCLUDED:-}" == "true" ]]; then
    return 0
fi
HELPERS_INC_INCLUDED=true

# safe_source: Safely source include files with validation
# Usage: safe_source "filename.inc.bash"
# Requires: COMMON_DIR must be set and valid
safe_source() {
    local include_file="$1"
    
    # COMMON_DIR must be set
    [[ -n "${COMMON_DIR:-}" ]] || {
        echo "ERROR: COMMON_DIR not set before safe_source" >&2
        exit 1
    }
    
    # COMMON_DIR must exist and contain _inc
    [[ -d "$COMMON_DIR/_inc" ]] || {
        echo "ERROR: COMMON_DIR invalid or missing _inc: $COMMON_DIR" >&2
        exit 1
    }
    
    # Include file must exist
    local full_path="$COMMON_DIR/_inc/$include_file"
    [[ -f "$full_path" ]] || {
        echo "ERROR: Include file not found: $full_path" >&2
        exit 1
    }
    
    # Source the file - dynamic sourcing is intentional for include system
    # shellcheck disable=SC1090  # Dynamic source is by design
    source "$full_path"
}

# get_var_path: Get the cc-commands var directory path from any script location
# Usage: VAR_PATH=$(get_var_path)
# Requires: COMMON_DIR must be set and valid
get_var_path() {
    # COMMON_DIR must be set (points to scripts/_common/)
    [[ -n "${COMMON_DIR:-}" ]] || {
        echo "ERROR: COMMON_DIR not set before get_var_path" >&2
        exit 1
    }
    
    # Navigate from _common to root and add var
    local var_path
    var_path="$(realpath "$COMMON_DIR/../..")/var"
    
    # Ensure var directory exists
    [[ -d "$var_path" ]] || {
        echo "ERROR: var directory not found: $var_path" >&2
        exit 1
    }
    
    echo "$var_path"
}

# ============================================================================
# MESSAGE AND OUTPUT FUNCTIONS
# ============================================================================

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
    if [[ -n "${DEBUG:-}" ]]; then
        echo "[DEBUG] $message" >&2
    fi
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

# Check if command exists
# Usage: require_command "git" "Git is required but not installed"
require_command() {
    local cmd="$1"
    local error_msg="${2:-$cmd is required but not installed}"
    
    if ! command -v "$cmd" &> /dev/null; then
        echo "ERROR: $error_msg" >&2
        exit 1
    fi
}

# Check if directory exists
# Usage: require_directory "/path/to/dir" "Custom error message"
require_directory() {
    local dir="$1"
    local error_msg="${2:-Required directory not found: $dir}"
    
    if [[ ! -d "$dir" ]]; then
        echo "ERROR: $error_msg" >&2
        exit 1
    fi
}

# Check if file exists
# Usage: require_file "/path/to/file" "Custom error message"
require_file() {
    local file="$1"
    local error_msg="${2:-Required file not found: $file}"
    
    if [[ ! -f "$file" ]]; then
        echo "ERROR: $error_msg" >&2
        exit 1
    fi
}

# Validate git repository
# Usage: require_git_repo "Custom error message"
require_git_repo() {
    local error_msg="${1:-Not in a git repository}"
    
    if [[ ! -d ".git" ]]; then
        echo "ERROR: $error_msg" >&2
        exit 1
    fi
}

# ============================================================================
# TEMP FILE MANAGEMENT (using var/ directory)
# ============================================================================

# Global temp file tracking array
declare -a _TEMP_FILES

# Create temp file in var/ directory with proper cleanup tracking
# Usage: temp_file=$(create_temp_file "operation_name")
create_temp_file() {
    local prefix="${1:-temp}"
    local var_path
    var_path=$(get_var_path)
    
    # Create unique temp file name
    local temp_file="$var_path/${prefix}_$$_$(date +%s%N)"
    
    # Create the file
    touch "$temp_file" || {
        echo "ERROR: Cannot create temp file: $temp_file" >&2
        exit 1
    }
    
    # Add to cleanup tracking
    _TEMP_FILES+=("$temp_file")
    echo "$temp_file"
}

# Clean up specific temp file
# Usage: cleanup_temp_file "/path/to/temp/file"
cleanup_temp_file() {
    local file="$1"
    [[ -f "$file" ]] && rm -f "$file"
    
    # Remove from tracking array
    local new_array=()
    for temp in "${_TEMP_FILES[@]:-}"; do
        [[ "$temp" != "$file" ]] && new_array+=("$temp")
    done
    _TEMP_FILES=("${new_array[@]}")
}

# Clean up all tracked temp files
# Usage: cleanup_temp_files (typically called in trap)
cleanup_temp_files() {
    for file in "${_TEMP_FILES[@]:-}"; do
        [[ -f "$file" ]] && rm -f "$file"
    done
    _TEMP_FILES=()
}

# Set up automatic temp file cleanup on script exit
# Usage: setup_temp_cleanup (call once at script start)
setup_temp_cleanup() {
    trap 'cleanup_temp_files' EXIT INT TERM
}

# ============================================================================
# ORCHESTRATOR FUNCTIONS
# ============================================================================

# Capture script output and parse KEY=value pairs
# Usage: capture_script_output "$SCRIPT_PATH" [args...]
# Requires: SCRIPT_OUTPUTS associative array must be declared in caller
# Note: Stores parsed KEY=value pairs in SCRIPT_OUTPUTS["KEY"]="value"
capture_script_output() {
    local script_path="$1"
    shift
    local args=("$@")
    local temp_file
    temp_file=$(create_temp_file "script_output")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" "${args[@]}" > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs into SCRIPT_OUTPUTS associative array
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                SCRIPT_OUTPUTS["$key"]="$value"
                debug "Captured: $key=$value"
            fi
        done < "$temp_file"
        
        cleanup_temp_file "$temp_file"
        return 0
    else
        local exit_code=$?
        echo "ERROR: Script failed with exit code $exit_code"
        cat "$temp_file"
        cleanup_temp_file "$temp_file"
        return $exit_code
    fi
    
    echo ""
}