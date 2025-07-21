#!/usr/bin/env bash
# Script: sync_env_validate.bash
# Purpose: Validate cc-commands repository environment for sync operation
# Usage: sync_env_validate.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Validating cc-commands repository environment"
    echo "=== Environment Validation ==="
    
    # Check if cc-commands directory exists
    if [ ! -d ".claude/cc-commands" ]; then
        echo "ERROR: cc-commands directory not found at .claude/cc-commands"
        echo "This command requires the cc-commands repository to be present."
        error_exit "cc-commands directory not found"
    fi
    echo "✓ cc-commands directory found"
    
    # Change to cc-commands directory and verify it's a git repo
    cd .claude/cc-commands
    if [ ! -d ".git" ]; then
        echo "ERROR: .claude/cc-commands is not a git repository"
        error_exit "cc-commands is not a git repository"
    fi
    echo "✓ Valid git repository"
    
    # Check remote configuration
    if ! git remote -v | grep -q origin; then
        echo "ERROR: No 'origin' remote configured"
        error_exit "No 'origin' remote configured"
    fi
    echo "✓ Remote 'origin' configured:"
    git remote -v | grep origin | head -1
    
    # Store current directory for reference
    CC_DIR=$(pwd)
    echo "CC_DIR=$CC_DIR"
    echo "ENVIRONMENT_VALID=true"
    
    echo "✓ Environment validation complete"
}

main
