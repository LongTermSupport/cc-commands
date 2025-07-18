#!/usr/bin/env bash
# Script: arg_parse_standard.bash
# Purpose: Standard argument parsing for Claude Code commands
# Usage: source arg_parse_standard.bash "$@" or bash arg_parse_standard.bash [args]
# Output: Sets variables for parsed arguments

set -euo pipefail
IFS=$'\n\t'

# Initialize standard variables
HELP_REQUESTED=false
VERBOSE=false
DRY_RUN=false
FORCE=false
ARGS=()

# Process arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            HELP_REQUESTED=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --)
            shift
            ARGS+=("$@")
            break
            ;;
        -*)
            # Unknown option
            echo "WARNING: Unknown option: $1" >&2
            shift
            ;;
        *)
            # Regular argument
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Export variables for use in sourcing scripts
export HELP_REQUESTED
export VERBOSE
export DRY_RUN
export FORCE
export ARGS

# Output parsed values when run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    echo "HELP_REQUESTED=$HELP_REQUESTED"
    echo "VERBOSE=$VERBOSE"
    echo "DRY_RUN=$DRY_RUN"
    echo "FORCE=$FORCE"
    echo "ARG_COUNT=${#ARGS[@]}"
    
    # Output individual arguments
    for i in "${!ARGS[@]}"; do
        echo "ARG_${i}=${ARGS[$i]}"
    done
    
    echo "Script success: ${0##*/}"
fi