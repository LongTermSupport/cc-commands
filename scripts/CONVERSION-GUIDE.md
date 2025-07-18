# Command Conversion Guide

This guide shows how to convert inline bash in Claude Code commands to use the new script infrastructure.

## Quick Reference

### Environment Checks

**Before (inline bash):**
```bash
!test -d .git && echo "✓ Git repository found" || exit 1
!which gh >/dev/null 2>&1 && echo "✓ gh CLI available" || exit 1
```

**After (using scripts):**
```bash
!bash .claude/cc-commands/scripts/_common/env/env_validate.bash all
!bash .claude/cc-commands/scripts/_common/env/env_check_tools.bash git gh
```

### Git Operations

**Before (inline bash):**
```bash
!BRANCH=$(git branch --show-current) && echo "Current branch: $BRANCH"
!git add . && git commit -m "message" && git push
```

**After (using scripts):**
```bash
!eval "$(bash .claude/cc-commands/scripts/_common/git/git_status.bash)" && echo "Current branch: $BRANCH"
!bash .claude/cc-commands/scripts/_common/git/git_operations.bash commit "message" && bash .claude/cc-commands/scripts/_common/git/git_operations.bash push
```

### Argument Parsing

**Before (inline bash):**
```bash
!if [ "$ARGUMENTS" = "--help" ]; then echo "HELP_REQUESTED: true"; exit 0; fi
```

**After (using scripts):**
```bash
!eval "$(bash .claude/cc-commands/scripts/_common/arg/arg_parse_standard.bash $ARGUMENTS)" && [ "$HELP_REQUESTED" = "true" ] && exit 0
```

## Conversion Steps

### 1. Identify Patterns

Look for common patterns in your commands:
- Environment validation
- Git operations
- File operations
- GitHub CLI usage
- Argument parsing

### 2. Create Command Script

For complex commands, create a dedicated script:

```bash
# Create script directory if needed
mkdir -p .claude/cc-commands/scripts/g/mycommand/

# Create the script
touch .claude/cc-commands/scripts/g/mycommand/execute.sh
chmod +x .claude/cc-commands/scripts/g/mycommand/execute.sh
```

### 3. Script Template

Use this template for new command scripts:

```bash
#!/usr/bin/env bash
# Script: command_execute.bash
# Purpose: [Description of what the command does]
# Usage: command_execute.bash [arguments]
# Output: [Description of output]

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

# Parse arguments
ARG1="${1:-}"

# Main execution
main() {
    info "Starting command execution..."
    
    # Validate environment (suppress noise)
    bash "$COMMON_DIR/env/env_validate.bash" all >/dev/null 2>&1 || error_exit "Environment validation failed"
    echo "ENVIRONMENT_VALID=true"
    
    # Your command logic here
    
    success "Command completed successfully"
}

# Run main function
main

echo "Script success: ${0##*/}"
```

### 4. Update Command File

In your `.claude/cc-commands/command.md` file:

**Before:**
```markdown
!test -d .git || exit 1
!BRANCH=$(git branch --show-current)
!echo "Branch: $BRANCH"
# ... more inline bash
```

**After:**
```markdown
!bash .claude/cc-commands/scripts/g/mycommand/execute.sh "$ARGUMENTS"
```

## Common Conversions

### Check Git Repository

**Before:**
```bash
!test -d .git || { echo "Not a git repository"; exit 1; }
```

**After:**
```bash
!source .claude/cc-commands/scripts/_common/env/validate.sh && check_git_repository || exit 1
```

### Get Current Branch

**Before:**
```bash
!BRANCH=$(git branch --show-current) && echo "BRANCH=$BRANCH"
```

**After:**
```bash
!eval "$(bash .claude/cc-commands/scripts/_common/git/operations.sh branch)"
```

### Check for Changes

**Before:**
```bash
!if [ -n "$(git status --porcelain)" ]; then echo "Changes exist"; fi
```

**After:**
```bash
!eval "$(bash .claude/cc-commands/scripts/_common/git/operations.sh changes)" && [ "$CHANGES_EXIST" = "true" ] && echo "Changes exist"
```

### Find Plan Files

**Before:**
```bash
!find CLAUDE/plan -name "*.md" -type f | head -10
```

**After:**
```bash
!bash .claude/cc-commands/scripts/_common/file/find-plans.sh list
```

### GitHub Issue Operations

**Before:**
```bash
!gh issue view 123 --json title,body
```

**After:**
```bash
!bash .claude/cc-commands/scripts/_common/gh/issue-ops.sh fetch 123
```

## Benefits of Conversion

1. **Consistency**: All commands use the same error handling and output format
2. **Maintainability**: Fix bugs in one place, not multiple commands
3. **Testability**: Scripts can be tested independently
4. **Composability**: Mix and match common operations
5. **Error Handling**: Proper error messages and exit codes
6. **Progress Tracking**: Clear progress indicators

## Testing Your Conversion

After converting a command:

1. Test the script directly:
   ```bash
   bash .claude/cc-commands/scripts/g/mycommand/execute.sh test-arg
   ```

2. Test error conditions:
   ```bash
   # Remove git directory temporarily
   mv .git .git.bak
   bash .claude/cc-commands/scripts/g/mycommand/execute.sh
   # Restore
   mv .git.bak .git
   ```

3. Test through Claude Code:
   ```
   g:mycommand test-arg
   ```

## Gradual Migration

You don't need to convert everything at once:

1. Start with the most complex commands
2. Convert commands that share common patterns
3. Leave simple one-liners as inline bash if they work well
4. Focus on commands that need better error handling

## Getting Help

- Check existing scripts in `_common/` for examples
- Read the documentation in `scripts/CLAUDE.md`
- Look at converted commands like `g/gh/push.sh` for patterns