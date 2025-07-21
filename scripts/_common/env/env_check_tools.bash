#!/usr/bin/env bash
# Script: check-tools.sh
# Purpose: Check for required command-line tools
# Usage: check-tools.sh tool1 tool2 tool3...
# Output: TOOLS_AVAILABLE=true or exits with error listing missing tools

set -euo pipefail
IFS=$'\n\t'

# Get script directory for loading other scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define path to common directory
COMMON_DIR="$SCRIPT_DIR/.."
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Check if no tools specified
if [ $# -eq 0 ]; then
    error_exit "No tools specified. Usage: $0 tool1 tool2 tool3..."
fi

# Track missing tools
missing_tools=()
found_tools=()

# Check each tool
for tool in "$@"; do
    if command -v "$tool" >/dev/null 2>&1; then
        found_tools+=("$tool")
        debug "Found tool: $tool"
    else
        missing_tools+=("$tool")
        warn "Missing tool: $tool"
    fi
done

# Report results
echo "TOOLS_CHECKED=$#"
echo "TOOLS_FOUND=${#found_tools[@]}"
echo "TOOLS_MISSING=${#missing_tools[@]}"

if [ ${#missing_tools[@]} -eq 0 ]; then
    echo "TOOLS_AVAILABLE=true"
    success "All required tools are available"
else
    echo "TOOLS_AVAILABLE=false"
    echo "MISSING_TOOLS=${missing_tools[*]}"
    error_exit "Missing required tools: ${missing_tools[*]}"
fi

