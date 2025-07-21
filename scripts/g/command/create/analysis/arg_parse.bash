#!/usr/bin/env bash
# Script: create_arg_parse.bash
# Purpose: Parse arguments for g:command:create command
# Usage: create_arg_parse.bash "$ARGUMENTS"
# Output: Parsed arguments in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source error handler include
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

# Arguments
ARGUMENTS="${1:-}"

main() {
    echo "✓ Parsing command arguments"
    
    # Output working directory
    echo "WORKING_DIR=$(pwd)"
    
    # Check commands directory
    if [ -d ".claude/commands" ]; then
        echo "COMMANDS_DIR=exists"
    else
        echo "COMMANDS_DIR=missing"
    fi
    
    # Parse arguments
    if [ -n "$ARGUMENTS" ]; then
        # Extract command name from arguments
        COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
        FULL_REQUIREMENTS=$(echo "$ARGUMENTS" | cut -d' ' -f2-)
        
        # If command name is the same as full requirements, there are no additional requirements
        if [ "$COMMAND_NAME" = "$FULL_REQUIREMENTS" ]; then
            FULL_REQUIREMENTS=""
        fi
        
        echo "COMMAND_NAME=$COMMAND_NAME"
        echo "FULL_REQUIREMENTS=$FULL_REQUIREMENTS"
        
        # Determine command path based on namespacing
        if [[ "$COMMAND_NAME" == *:* ]]; then
            FOLDER_PATH="${COMMAND_NAME//:://}.md"
            COMMAND_PATH=".claude/commands/${FOLDER_PATH}"
        else
            COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"
        fi
        
        echo "COMMAND_PATH=$COMMAND_PATH"
        
        # Check if command already exists
        if [ -f "$COMMAND_PATH" ]; then
            echo "ERROR_EXISTS=true"
            echo "EXISTING_PATH=$COMMAND_PATH"
            error_exit "Command already exists: $COMMAND_PATH"
        else
            echo "ERROR_EXISTS=false"
        fi
        
        # Set mode based on requirements
        if [ -n "$FULL_REQUIREMENTS" ]; then
            echo "MODE=FULL"
        else
            echo "MODE=INTERACTIVE"
        fi
        
    else
        echo "COMMAND_NAME="
        echo "FULL_REQUIREMENTS="
        echo "COMMAND_PATH="
        echo "ERROR_EXISTS=false"
        echo "MODE=INTERACTIVE"
    fi
    
    echo "✓ Argument parsing complete"
}

main
echo "Script success: ${0##*/}"