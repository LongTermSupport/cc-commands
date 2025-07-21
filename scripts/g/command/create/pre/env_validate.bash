#!/usr/bin/env bash
# Script: env_validate.bash
# Purpose: Validate environment for command creation
# Usage: env_validate.bash
# Output: Environment status in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source error handler include
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

main() {
    echo "✓ Validating environment for command creation"
    
    # Check working directory
    echo "WORKING_DIR=$(pwd)"
    
    # Check if we're in a project with .claude directory
    if [ -d ".claude" ]; then
        echo "CLAUDE_DIR=true"
    else
        echo "CLAUDE_DIR=false"
        error_exit "Not in a project with .claude directory"
    fi
    
    # Check commands directory
    if [ -d ".claude/commands" ]; then
        echo "COMMANDS_DIR=true"
    else
        echo "COMMANDS_DIR=false"
        # Will be created if needed
    fi
    
    # Check cc-commands installation
    if [ -d ".claude/cc-commands" ]; then
        echo "CC_COMMANDS_INSTALLED=true"
        
        # Check for CommandStructure.md
        if [ -f ".claude/cc-commands/CLAUDE/CommandStructure.md" ]; then
            echo "COMMAND_STRUCTURE_DOC=true"
        else
            echo "COMMAND_STRUCTURE_DOC=false"
        fi
    else
        echo "CC_COMMANDS_INSTALLED=false"
        warn "cc-commands not installed - commands may not follow best practices"
    fi
    
    # Check for useful tools
    command -v jq &> /dev/null && echo "JQ_AVAILABLE=true" || echo "JQ_AVAILABLE=false"
    command -v gh &> /dev/null && echo "GH_AVAILABLE=true" || echo "GH_AVAILABLE=false"
    
    # Check GitHub auth if gh is available
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            echo "GH_AUTH=true"
        else
            echo "GH_AUTH=false"
        fi
    fi
    
    echo "✓ Environment validation complete"
}

main
echo "Script success: ${0##*/}"