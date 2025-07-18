#!/usr/bin/env bash
# Script: sync_readme_check.bash
# Purpose: Check if README.md needs updates for sync operation
# Usage: sync_readme_check.bash
# Output: README update status in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

main() {
    echo "✓ Checking README.md currency"
    echo "=== README Update Check ==="
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    # Check if README is current by comparing last modified time with recent commits
    if [ -f "README.md" ]; then
        README_MODIFIED=$(stat -c %Y README.md 2>/dev/null || echo "0")
        
        if [ -d "export/commands" ]; then
            LAST_COMMAND_CHANGE=$(find export/commands -name "*.md" -printf "%T@\n" | sort -n | tail -1 | cut -d. -f1)
            
            if [ "$README_MODIFIED" -lt "$LAST_COMMAND_CHANGE" ]; then
                echo "⚠️  README.md appears outdated compared to command changes"
                echo "📝 Consider updating README.md to reflect current command structure"
                echo "README_OUTDATED=true"
            else
                echo "✓ README.md appears current"
                echo "README_OUTDATED=false"
            fi
        else
            echo "⚠️  Commands directory not found"
            echo "README_OUTDATED=unknown"
        fi
    else
        echo "⚠️  README.md not found"
        echo "README_OUTDATED=missing"
    fi
    
    echo "✓ README check complete"
}

main
echo "Script success: ${0##*/}"