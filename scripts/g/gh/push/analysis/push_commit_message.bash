#!/usr/bin/env bash
# Script: push_commit_message.bash
# Purpose: Handle commit message generation based on action
# Usage: push_commit_message.bash "action"
# Output: Commit message handling results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$SCRIPT_DIR/../../../../_inc/error_handler.inc.bash"

main() {
    local action="$1"
    
    echo "✓ Processing commit message requirements"
    
    if [ "$action" = "commit_and_push" ]; then
        echo "Will generate intelligent commit message from changes during commit phase"
        echo "COMMIT_MESSAGE_NEEDED=true"
    else
        echo "Skipping commit message generation - no commit needed"
        echo "COMMIT_MESSAGE_NEEDED=false"
    fi
    
    echo "ACTION_PROCESSED=$action"
    echo "✓ Commit message processing complete"
}

# Check if action provided
if [ $# -eq 0 ]; then
    error_exit "Action required as argument"
fi

main "$1"
echo "Script success: ${0##*/}"