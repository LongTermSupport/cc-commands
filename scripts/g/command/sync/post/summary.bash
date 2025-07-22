#!/usr/bin/env bash
# Script: sync_summary.bash
# Purpose: Generate sync completion summary
# Usage: sync_summary.bash
# Output: Sync summary in KEY=value format

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
    echo "✓ Generating sync summary"
    echo "=== Sync Summary ==="
    
    # Change to cc-commands directory
    cd ".claude/cc-commands"
    
    echo "✓ Repository synchronized successfully"
    echo ""
    echo "Current status:"
    git log --oneline -3
    echo ""
    echo "Remote status:"
    git status -sb
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✓ CC-Commands repository is now in sync!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "SYNC_COMPLETE=true"
    echo "✓ Sync summary complete"
}

main
