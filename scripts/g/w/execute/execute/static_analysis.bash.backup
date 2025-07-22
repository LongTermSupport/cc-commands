#!/usr/bin/env bash
# Script: execute_static_analysis.bash
# Purpose: Run static analysis during plan execution
# Usage: execute_static_analysis.bash
# Output: Static analysis results with full output

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Running static analysis"
    echo "=== STATIC ANALYSIS ==="
    
    # Check if QA tool exists
    if [ ! -f bin/qa ]; then
        echo "QA_TOOL_AVAILABLE=false"
        echo "⚠ QA tool not found at bin/qa"
        echo "STATIC_ANALYSIS_RESULT=skipped"
        return 0
    fi
    
    echo "QA_TOOL_AVAILABLE=true"
    
    # Run static analysis (do not suppress output - need to see results)
    export CI=true
    if bin/qa -t allStatic; then
        echo "STATIC_ANALYSIS_RESULT=success"
        echo "✓ Static analysis passed"
    else
        echo "STATIC_ANALYSIS_RESULT=failed"
        echo "⚠ Static analysis failed"
        error_exit "Static analysis failed"
    fi
    
    echo "✓ Static analysis complete"
}

main
