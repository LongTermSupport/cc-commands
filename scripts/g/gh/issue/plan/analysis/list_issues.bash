#!/usr/bin/env bash
# Script: plan_list_issues.bash
# Purpose: List recent open issues when no arguments provided
# Usage: plan_list_issues.bash "arguments"
# Output: Recent issues list or exit if arguments provided

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
    
    # Only show issues if no arguments provided
    if [ -z "$arguments" ]; then
        echo "=== Recent Open Issues ==="
        echo ""
        
        # Get recent open issues using simple format
        echo "Available GitHub Issues:"
        echo ""
        gh issue list --state open --limit 10
        echo ""
        
        echo ""
        echo "Please specify an issue number from the list above."
        echo "Example: /g:gh:issue:plan 123"
        
        echo "NO_ARGUMENTS_PROVIDED=true"
        exit 0
    else
        echo "ARGUMENTS_PROVIDED=true"
        echo "ARGUMENTS=$arguments"
    fi
}

# Check if arguments provided
if [ $# -eq 0 ]; then
    main ""
else
    main "$1"
fi

