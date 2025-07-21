#!/usr/bin/env bash
# Script: plan_list_issues.bash
# Purpose: List recent open issues when no arguments provided
# Usage: plan_list_issues.bash "arguments"
# Output: Recent issues list or exit if arguments provided

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local arguments="$1"
    
    # Only show issues if no arguments provided
    if [ -z "$arguments" ]; then
        echo "=== Recent Open Issues ==="
        echo ""
        
        # Get recent open issues and format them
        gh issue list --state open --limit 10 --json number,title,author,createdAt,labels --jq '.[] | "\(.number)\t\(.createdAt[0:10])\t\(.author.login)\t\(.title[0:60])\(.title[60:] | if . != "" then "..." else "" end)\t\(if .labels then (.labels | map(.name) | join(", "))[0:30] else "" end)"' | awk 'BEGIN {printf "%-6s %-12s %-15s %-63s %s\n", "#", "Created", "Author", "Title", "Labels"; print "────── ──────────── ─────────────── ─────────────────────────────────────────────────────────────── ─────────"} {printf "%-6s %-12s %-15s %-63s %s\n", $1, $2, $3, $4, $5}'
        
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

echo "Script success: ${0##*/}"