# Include Directory (_inc) - Sourced Components

This directory contains bash code designed to be **sourced** (included) into other scripts, not executed directly.

## Naming Convention

All include files MUST use the `.inc.bash` suffix:
- `error_handler.inc.bash`
- `string_utils.inc.bash`
- `validation.inc.bash`

## Critical Rules for Include Files

1. **DO NOT set shell options** - No `set -e`, `set -u`, etc.
2. **DO NOT modify IFS** - Leave `IFS` unchanged
3. **DO NOT execute code** - Only define functions and variables
4. **DO use include guards** - Prevent multiple inclusion
5. **DO document side effects** - If you must modify global state
6. **DO use .inc.bash suffix** - Makes it clear these are includes

## What Goes in _inc

- Function libraries (error handling, string utilities, etc.)
- Shared variable definitions
- Common constants
- Utility functions that need caller's context

## What Does NOT Go in _inc

- Standalone scripts
- Scripts that perform actions when sourced
- Scripts that need their own shell environment
- Scripts that output KEY=value pairs for parsing

## Include File Template

```bash
# Include: {name}.inc.bash
# Purpose: [What this provides]
# Usage: source "$SCRIPT_DIR/../_inc/{name}.inc.bash"
# Note: This file is meant to be SOURCED, not executed
# WARNING: Do not set shell options or IFS in include files!

# Guard against multiple inclusion
if [ -n "${_{NAME}_INCLUDED:-}" ]; then
    return 0
fi
_{NAME}_INCLUDED=1

# Define functions here
function_name() {
    # Function implementation
}

# Define shared variables if needed
# SHARED_CONSTANT="value"
```

## Usage in Scripts

```bash
#!/usr/bin/env bash
# Script: my_script.bash
# Purpose: Example script using includes

# Set shell options in the script, not the include
set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source includes (adjust path based on script location)
source "$SCRIPT_DIR/../_inc/error_handler.inc.bash"

# Set up cleanup trap if using temp files
trap cleanup_temp_files EXIT

# Now use included functions
require_git_repo "This script must be run in a git repository"
error_exit "Something went wrong"
```

## Include vs Delegate

### Include (Sourced) - `_inc/` directory
- Functions that need access to caller's variables
- Error handling that should exit the calling script
- Utility functions used frequently
- Shared constants and variables
- Run in the caller's shell context

### Delegate (Executed) - `_common/` directories
- Standalone operations with clear inputs/outputs
- Scripts that perform specific tasks
- Operations that should run in isolation
- Scripts that output KEY=value pairs
- Run in their own shell process

## Current Includes

### error_handler.inc.bash
Common error handling and utility functions:
- `error_exit` - Exit with standard error format
- `warn`, `info`, `success` - Messaging functions
- `debug` - Conditional debug output
- `require_*` - Validation functions
- `run_with_output` - Capture output, show on failure
- `silent_run` - Suppress output
- Temp file management utilities

## Best Practices

1. **Always use include guards** to prevent multiple sourcing
2. **Document any global variables** created or modified
3. **Prefix internal variables** with underscore
4. **Don't execute code** during sourcing
5. **Keep includes focused** - one purpose per file
6. **Test includes** by sourcing in minimal scripts