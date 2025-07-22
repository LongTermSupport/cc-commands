#!/usr/bin/env bash
# Script: push_commit_message.bash
# Purpose: Handle commit message generation based on action
# Usage: push_commit_message.bash "action"
# Output: Commit message handling results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

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
