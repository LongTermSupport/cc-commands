#!/usr/bin/env bash
# Script: push_decision.bash
# Purpose: Analyze repository state and determine push action
# Usage: push_decision.bash <changes_exist> <push_needed>
# Output: ACTION and decision details

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

# Arguments
CHANGES_EXIST="${1:-}"
PUSH_NEEDED="${2:-}"

# Validate arguments
if [ -z "$CHANGES_EXIST" ] || [ -z "$PUSH_NEEDED" ]; then
    error_exit "Missing required arguments: changes_exist and push_needed"
fi

# Determine action
info "Determining required actions based on repository state..."

if [ "$CHANGES_EXIST" = "true" ]; then
    echo "ACTION=commit_and_push"
    echo "ACTION_DESC=Uncommitted changes detected - commit needed"
    echo "NEEDS_COMMIT=true"
elif [ "$PUSH_NEEDED" = "true" ]; then
    echo "ACTION=push_only"
    echo "ACTION_DESC=Existing commits ready to push"
    echo "NEEDS_COMMIT=false"
else
    echo "ACTION=none"
    echo "ACTION_DESC=Repository is up to date - no action needed"
    echo "NEEDS_COMMIT=false"
fi

echo "Script success: ${0##*/}"
