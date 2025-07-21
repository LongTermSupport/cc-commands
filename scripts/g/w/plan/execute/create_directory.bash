#!/usr/bin/env bash
# Script: plan_create_directory.bash
# Purpose: Create plan directory structure
# Usage: plan_create_directory.bash "plan_dir"
# Output: Directory creation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local plan_dir="$1"
    
    echo "✓ Creating plan directory structure"
    echo "=== Directory Creation ==="
    
    # Create plan directory if needed
    if [ ! -d "$plan_dir" ]; then
        if mkdir -p "$plan_dir"; then
            echo "✓ Created $plan_dir directory"
            echo "DIRECTORY_CREATED=true"
        else
            echo "✗ Failed to create $plan_dir directory"
            echo "DIRECTORY_CREATED=false"
            error_exit "Failed to create plan directory"
        fi
    else
        echo "✓ Plan directory already exists: $plan_dir"
        echo "DIRECTORY_CREATED=false"
    fi
    
    echo "PLAN_DIR=$plan_dir"
    echo "DIRECTORY_EXISTS=true"
    echo "✓ Directory creation complete"
}

# Check if plan directory provided
if [ $# -eq 0 ]; then
    error_exit "Plan directory required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"