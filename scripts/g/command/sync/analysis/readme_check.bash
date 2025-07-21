#!/usr/bin/env bash
# Script: sync_readme_check.bash
# Purpose: Check if README.md needs updates for sync operation
# Usage: sync_readme_check.bash
# Output: README update status in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Checking README.md currency"
    echo "=== README Update Check ==="
    
    # Find cc-commands directory (we might already be in it)
    if [ -d ".claude/cc-commands" ]; then
        cd ".claude/cc-commands"
    elif [ -f "README.md" ] && [ -d "scripts" ] && [ -d "CLAUDE" ]; then
        # We're likely already in cc-commands
        true
    else
        error_exit "Cannot find cc-commands directory"
    fi
    
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
    
    # Check CommonScripts.md
    echo ""
    echo "=== CommonScripts.md Update Check ==="
    
    if [ -f "CLAUDE/CommonScripts.md" ]; then
        COMMON_SCRIPTS_MODIFIED=$(stat -c %Y CLAUDE/CommonScripts.md 2>/dev/null || echo "0")
        
        # Find most recent _common script modification
        if [ -d "scripts/_common" ]; then
            LAST_COMMON_CHANGE=$(find scripts/_common -name "*.bash" -printf "%T@\n" | sort -n | tail -1 | cut -d. -f1)
            
            if [ "$COMMON_SCRIPTS_MODIFIED" -lt "$LAST_COMMON_CHANGE" ]; then
                echo "⚠️  CommonScripts.md appears outdated compared to _common script changes"
                echo "📝 Consider updating CommonScripts.md to reflect current common scripts"
                echo "COMMON_SCRIPTS_OUTDATED=true"
                
                # Find which scripts were modified after the doc
                echo ""
                echo "Scripts modified after CommonScripts.md:"
                find scripts/_common -name "*.bash" -newer CLAUDE/CommonScripts.md -printf "  - %P\n" | sort
            else
                echo "✓ CommonScripts.md appears current"
                echo "COMMON_SCRIPTS_OUTDATED=false"
            fi
            
            # Count scripts vs documented scripts
            SCRIPT_COUNT=$(find scripts/_common -name "*.bash" -type f | wc -l)
            echo "COMMON_SCRIPT_COUNT=$SCRIPT_COUNT"
        else
            echo "⚠️  Common scripts directory not found"
            echo "COMMON_SCRIPTS_OUTDATED=unknown"
        fi
    else
        echo "⚠️  CommonScripts.md not found"
        echo "COMMON_SCRIPTS_OUTDATED=missing"
    fi
    
    echo "✓ Documentation check complete"
}

main
