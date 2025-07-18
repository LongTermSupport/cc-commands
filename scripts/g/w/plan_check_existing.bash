#!/usr/bin/env bash
# Script: plan_check_existing.bash
# Purpose: Check for existing plans and determine plan directory
# Usage: plan_check_existing.bash "filename"
# Output: Existing plan check results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    local filename="$1"
    
    echo "✓ Checking for existing plans"
    echo "=== Existing Plan Check ==="
    
    # Determine plan directory based on project structure
    if [ -d "CLAUDE/plan" ]; then
        PLAN_DIR="CLAUDE/plan"
    elif [ -d "CLAUDE/Plan" ]; then
        PLAN_DIR="CLAUDE/Plan"
    elif [ -d "CLAUDE" ]; then
        PLAN_DIR="CLAUDE/plan"
    else
        PLAN_DIR="plans"
    fi
    
    echo "PLAN_DIR: \"$PLAN_DIR\""
    
    # Check if plan file already exists
    if [ -n "$filename" ]; then
        PLAN_FILE="$PLAN_DIR/$filename.md"
        
        if [ -f "$PLAN_FILE" ]; then
            echo "⚠ Plan file already exists: $PLAN_FILE"
            echo "PLAN_EXISTS=true"
            echo "PLAN_FILE=$PLAN_FILE"
            
            # Get file info
            PLAN_SIZE=$(wc -l < "$PLAN_FILE")
            PLAN_MODIFIED=$(stat -c %Y "$PLAN_FILE" 2>/dev/null || echo "unknown")
            
            echo "Existing plan has $PLAN_SIZE lines"
            echo "PLAN_SIZE=$PLAN_SIZE"
            echo "PLAN_MODIFIED=$PLAN_MODIFIED"
        else
            echo "✓ No existing plan found - can create new plan"
            echo "PLAN_EXISTS=false"
            echo "PLAN_FILE=$PLAN_FILE"
        fi
    else
        echo "No filename provided - cannot check for existing plans"
        echo "PLAN_EXISTS=unknown"
        echo "PLAN_FILE="
    fi
    
    echo "PLAN_DIR=$PLAN_DIR"
    echo "✓ Existing plan check complete"
}

# Check if filename provided
if [ $# -eq 0 ]; then
    main ""
else
    main "$1"
fi

echo "Script success: ${0##*/}"