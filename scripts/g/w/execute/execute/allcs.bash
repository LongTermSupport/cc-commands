#!/usr/bin/env bash
# Script: execute_allcs.bash
# Purpose: Run code standards fixer during plan execution
# Usage: execute_allcs.bash
# Output: Code standards check results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Running code standards fixer"
    echo "=== CODE STANDARDS CHECK ==="
    
    # Check if QA tool exists
    if [ ! -f bin/qa ]; then
        echo "QA_TOOL_AVAILABLE=false"
        echo "⚠ QA tool not found at bin/qa"
        echo "ALLCS_RESULT=skipped"
        return 0
    fi
    
    echo "QA_TOOL_AVAILABLE=true"
    
    # Run allCS with noise suppression
    export CI=true
    if bin/qa -t allCS &> /dev/null; then
        echo "ALLCS_RESULT=success"
        echo "✓ Code standards check passed"
    else
        echo "ALLCS_RESULT=failed"
        echo "⚠ Code standards check failed"
        error_exit "Code standards check failed"
    fi
    
    echo "✓ Code standards check complete"
}

main
