#!/usr/bin/env bash
# Script: plan_arg_parse.bash
# Purpose: Parse GitHub issue plan arguments
# Usage: plan_arg_parse.bash "arguments"
# Output: Parsed arguments in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

main() {
    local arguments="$1"
    
    echo "✓ Parsing issue arguments"
    echo "=== ARGUMENT PARSING ==="
    
    if [ -z "$arguments" ]; then
        echo "MODE: \"INTERACTIVE\""
        echo "ISSUE_NUMBER: \"\""
        echo "Need to show issue list for selection"
        echo "OPERATION_MODE=interactive"
    elif [[ "$arguments" =~ ^https://github.com/.*/issues/([0-9]+) ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
        echo "MODE: \"URL\""
        echo "ISSUE_NUMBER: \"$ISSUE_NUM\""
        echo "Parsed issue number from GitHub URL"
        echo "OPERATION_MODE=url"
        echo "PARSED_ISSUE_NUMBER=$ISSUE_NUM"
    elif [[ "$arguments" =~ ^#?([0-9]+)$ ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
        echo "MODE: \"NUMBER\""
        echo "ISSUE_NUMBER: \"$ISSUE_NUM\""
        echo "Using issue number directly"
        echo "OPERATION_MODE=number"
        echo "PARSED_ISSUE_NUMBER=$ISSUE_NUM"
    else
        echo "MODE: \"INVALID\""
        echo "ISSUE_NUMBER: \"\""
        echo "Invalid argument format: $arguments"
        echo "Expected: GitHub URL or issue number (#123)"
        echo "OPERATION_MODE=invalid"
        error_exit "Invalid argument format"
    fi
    
    echo "✓ Argument parsing complete"
}

# Check if arguments provided
if [ $# -eq 0 ]; then
    main ""
else
    main "$1"
fi

