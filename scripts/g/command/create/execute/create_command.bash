#!/usr/bin/env bash
# Script: create_command.bash
# Purpose: Create the command file with provided content
# Usage: create_command.bash <command_name> <command_content>
# Output: Creation status and file path

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source error handler include
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

# Arguments
COMMAND_NAME="${1:-}"
COMMAND_CONTENT="${2:-}"

main() {
    if [ -z "$COMMAND_NAME" ] || [ -z "$COMMAND_CONTENT" ]; then
        error_exit "Usage: create_command.bash <command_name> <command_content>"
    fi
    
    echo "✓ Creating command: $COMMAND_NAME"
    
    # Determine command path based on namespacing
    if [[ "$COMMAND_NAME" == *:* ]]; then
        # Convert namespace:command to folder structure
        FOLDER_PATH="${COMMAND_NAME//:://}"
        COMMAND_PATH=".claude/commands/${FOLDER_PATH}.md"
        
        # Create directory structure
        COMMAND_DIR=$(dirname "$COMMAND_PATH")
        if [ ! -d "$COMMAND_DIR" ]; then
            mkdir -p "$COMMAND_DIR"
            echo "CREATED_DIR=$COMMAND_DIR"
        fi
    else
        COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"
    fi
    
    # Check if command already exists
    if [ -f "$COMMAND_PATH" ]; then
        error_exit "Command already exists: $COMMAND_PATH"
    fi
    
    # Create the command file
    echo "$COMMAND_CONTENT" > "$COMMAND_PATH"
    
    if [ -f "$COMMAND_PATH" ]; then
        echo "✓ Command file created successfully"
        echo "COMMAND_PATH=$COMMAND_PATH"
        echo "CREATION_SUCCESS=true"
        
        # Get file size for verification
        FILE_SIZE=$(wc -c < "$COMMAND_PATH")
        echo "FILE_SIZE=$FILE_SIZE"
    else
        error_exit "Failed to create command file"
    fi
}

main
echo "Script success: ${0##*/}"