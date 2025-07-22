#!/usr/bin/env bash
# Script: plan_env_validate.bash
# Purpose: Validate GitHub issue planning environment
# Usage: plan_env_validate.bash
# Output: Environment validation results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory and resolve COMMON_DIR
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation
