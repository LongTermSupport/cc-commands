# Example: Converting g:command:create

This shows how to convert the `g:command:create` command to use the new script infrastructure.

## Original Command Structure

The original command has inline bash throughout:

```markdown
!echo "Checking system requirements and environment"; \
set -e; \
echo "WORKING_DIR=$(pwd)"; \
test -d .claude/commands && echo "COMMANDS_DIR=exists" || echo "COMMANDS_DIR=missing"; \
which jq >/dev/null 2>&1 && echo "JQ_AVAILABLE=true" || echo "JQ_AVAILABLE=false"; \
which gh >/dev/null 2>&1 && echo "GH_AVAILABLE=true" || echo "GH_AVAILABLE=false"; \
gh auth status >/dev/null 2>&1 && echo "GH_AUTHENTICATED=true" || echo "GH_AUTHENTICATED=false"
```

## Converted Command Structure

The new version uses a dedicated script:

```markdown
!bash .claude/cc-commands/scripts/g/command/create_req_check.bash "$ARGUMENTS"
```

## The Script (`scripts/g/command/create_req_check.bash`)

```bash
#!/usr/bin/env bash
# Script: create_req_check.bash
# Purpose: Create new Claude Code commands with best practices
# Usage: create_req_check.bash [command-name] [requirements]
# Output: Command creation workflow with structured data

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"
source "$COMMON_DIR/arg/arg_parse_standard.bash" "$@"

# Main logic here...
```

## Benefits of This Approach

1. **Single bash call** instead of multiple inline commands
2. **Reusable components** from `_common/`
3. **Better error handling** with proper error messages
4. **Easier testing** - can test script independently
5. **Cleaner command file** - focuses on Claude logic, not bash

## How Claude Code Uses the Output

The script outputs structured data:

```
HELP_REQUESTED=true
COMMANDS_DIR=exists
JQ_AVAILABLE=true
GH_AVAILABLE=true
GH_AUTHENTICATED=false
MODE=INTERACTIVE
COMMAND_NAME=
COMMAND_PATH=
```

Claude Code can then use this data throughout the command:

```markdown
<Task>
Based on the bash output above:
- If HELP_REQUESTED=true, show help and exit
- If MODE=INTERACTIVE, gather requirements interactively
- If GH_AUTHENTICATED=false, warn about limited GitHub features
</Task>
```

## Migration Process

1. **Identify repeated patterns** in your command
2. **Create a script** in the appropriate directory
3. **Use common scripts** for standard operations
4. **Replace inline bash** with a single script call
5. **Test the script** independently first
6. **Update the command** to use the script

## Common Patterns to Extract

- Environment validation → `_common/env/env_validate.bash`
- Git operations → `_common/git/git_operations.bash`
- GitHub CLI operations → `_common/gh/gh_issue_ops.bash`
- Argument parsing → `_common/arg/arg_parse_standard.bash`
- File discovery → `_common/file/file_find_plans.bash`

## Testing Your Conversion

```bash
# Test the script directly
bash .claude/cc-commands/scripts/g/command/create_req_check.bash --help
bash .claude/cc-commands/scripts/g/command/create_req_check.bash test:command

# Test error handling
cd /tmp  # Not in a git repo
bash /path/to/.claude/cc-commands/scripts/g/command/create_req_check.bash

# Test with Claude Code
/g:command:create test:command
```