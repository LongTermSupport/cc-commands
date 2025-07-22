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