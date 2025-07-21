#!/usr/bin/env bash
# Script: plan_arg_parse.bash
# Purpose: Parse workflow plan arguments and generate filename
# Usage: plan_arg_parse.bash "arguments"
# Output: Parsed arguments in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local arguments="$1"
    
    echo "✓ Parsing plan arguments"
    echo "=== ARGUMENT PARSING ==="
    
    if [ -n "$arguments" ]; then
        # Use entire arguments as task name
        TASK_NAME="$arguments"
        
        # Convert to kebab-case for filename
        FILENAME=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
        
        echo "TASK_NAME: \"$TASK_NAME\""
        echo "FILENAME: \"$FILENAME\""
        echo "MODE: \"TASK_PROVIDED\""
        
        # Export for use by other scripts
        echo "TASK_NAME=$TASK_NAME"
        echo "FILENAME=$FILENAME"
        echo "HAS_TASK_NAME=true"
    else
        echo "TASK_NAME: \"\""
        echo "FILENAME: \"\""
        echo "MODE: \"INTERACTIVE\""
        echo "HAS_TASK_NAME=false"
    fi
    
    echo "✓ Argument parsing complete"
}

# Check if arguments provided
if [ $# -eq 0 ]; then
    main ""
else
    main "$1"
fi

echo "Script success: ${0##*/}"