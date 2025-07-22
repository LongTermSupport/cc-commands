# Common Scripts Reference

This document provides a comprehensive reference of all scripts in the `_common/` directory. These scripts provide reusable functionality for Claude Code commands.

Last Updated: 2025-07-22

## Table of Contents

- [Overview](#overview)
- [Complete Script Inventory](#complete-script-inventory)
- [Script Categories](#script-categories)
  - [Argument Scripts](#argument-scripts-arg)
  - [Environment Scripts](#environment-scripts-env)
  - [Error Scripts](#error-scripts-error)
  - [File Scripts](#file-scripts-file)
  - [GitHub Scripts](#github-scripts-gh)
  - [Git Scripts](#git-scripts-git)
  - [PHP Scripts](#php-scripts-php)
  - [Symfony Scripts](#symfony-scripts-symfony)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

Common scripts are designed to be:
- **Reusable** - Used by multiple commands
- **Focused** - Each script does one thing well
- **Composable** - Work together seamlessly
- **Documented** - Clear usage and output format
- **Tested** - Can be run independently

## Complete Script Inventory

| Script | Category | Purpose | Output Format |
|--------|----------|---------|---------------|
| `arg_parse_standard.bash` | arg | Standard argument parsing | KEY=value |
| `env_check_tools.bash` | env | Check for required CLI tools | KEY=value |
| `env_validate.bash` | env | Comprehensive environment validation | KEY=value |
| `error_handlers.bash` | error | Error handling utilities (DEPRECATED) | Functions |
| `file_find_plans.bash` | file | Find and analyze plan files | KEY=value |
| `find_docs.bash` | file | Find documentation files | KEY=value |
| `gh_issue_ops.bash` | gh | GitHub issue operations | KEY=value |
| `gh_workflow_monitor.bash` | gh | Monitor GitHub Actions workflows | KEY=value |
| `gh_workflow_ops.bash` | gh | GitHub workflow operations | KEY=value |
| `git_operations.bash` | git | Common git operations | KEY=value |
| `git_smart_commit.bash` | git | Intelligent commit message generation | KEY=value |
| `git_state_analysis.bash` | git | Analyze git repository state | KEY=value |
| `git_status.bash` | git | Simple git status check | KEY=value |
| `detect_version.bash` | php | Detect PHP version | KEY=value |
| `detect_project.bash` | symfony | Detect Symfony project | KEY=value |

## Script Categories

### Argument Scripts (`arg/`)

#### `arg_parse_standard.bash`
Standard argument parsing for commands.

**Usage:**
```bash
bash arg_parse_standard.bash "$@"
```

**Output:**
```
HELP_REQUESTED=true|false
VERBOSE=true|false
ARGS_COUNT=<number>
ARG_0=<first_arg>
ARG_1=<second_arg>
...
```

**Features:**
- Detects `--help` flag
- Detects `--verbose` flag
- Parses remaining arguments into indexed variables

### Environment Scripts (`env/`)

#### `env_check_tools.bash`
Check for required command-line tools.

**Usage:**
```bash
bash env_check_tools.bash git gh jq
```

**Output:**
```
TOOLS_AVAILABLE=true|false
MISSING_TOOLS=<comma-separated list>
GIT_AVAILABLE=true|false
GH_AVAILABLE=true|false
JQ_AVAILABLE=true|false
```

**Exit Codes:**
- 0: All tools available
- 1: One or more tools missing

#### `env_validate.bash`
Comprehensive environment validation for commands.

**Usage:**
```bash
# Check specific aspects
bash env_validate.bash git      # Git repository check
bash env_validate.bash gh       # GitHub CLI check
bash env_validate.bash claude   # Claude structure check
bash env_validate.bash all      # All checks
```

**Output:**
```
GIT_REPO=true|false
GIT_BRANCH=<branch_name>
GH_AUTH=true|false
GH_REPO=<owner/repo>
CLAUDE_DIR_EXISTS=true|false
PLAN_DIR_EXISTS=true|false
```

**Features:**
- Modular validation
- Minimal output (only requested checks)
- Clear error messages

### Error Scripts (`error/`)

#### `error_handlers.bash`
**⚠️ DEPRECATED - Use `_inc/error_handler.inc.bash` instead**

Legacy error handling functions. Still used by some scripts but should be migrated.

### File Scripts (`file/`)

#### `file_find_plans.bash`
Locate and analyze plan files in CLAUDE/plan directory.

**Usage:**
```bash
bash file_find_plans.bash list              # List all plans
bash file_find_plans.bash find "issue-123"  # Find specific plan
bash file_find_plans.bash analyze "plan.md" # Analyze plan progress
bash file_find_plans.bash create "new-plan" # Create plan path
```

**Output for `list`:**
```
PLAN_COUNT=<number>
PLAN_0_FILE=<path>
PLAN_0_NAME=<filename>
PLAN_0_MODIFIED=<timestamp>
PLAN_1_FILE=<path>
...
```

**Output for `find`:**
```
MATCH_TYPE=exact|fuzzy|multiple|none
PLAN_FILE=<path>
PLAN_NAME=<filename>
# If multiple matches:
MATCH_COUNT=<number>
MATCH_0_FILE=<path>
MATCH_0_NAME=<filename>
...
```

**Output for `analyze`:**
```
PLAN_EXISTS=true|false
TOTAL_TASKS=<number>
COMPLETED_TASKS=<number>
INPROGRESS_TASKS=<number>
PENDING_TASKS=<number>
COMPLETION_PERCENTAGE=<number>
HAS_ALL_DONE=true|false
```

#### `find_docs.bash`
Find documentation files in project.

**Usage:**
```bash
bash find_docs.bash             # Find all docs
bash find_docs.bash "topic"     # Find docs about topic
```

**Output:**
```
DOC_COUNT=<number>
DOC_0_FILE=<path>
DOC_0_NAME=<filename>
DOC_0_TYPE=<md|txt|rst>
...
```

### GitHub Scripts (`gh/`)

#### `gh_issue_ops.bash`
GitHub issue operations using GitHub CLI.

**Usage:**
```bash
bash gh_issue_ops.bash fetch 123        # Fetch issue details
bash gh_issue_ops.bash list open        # List open issues
bash gh_issue_ops.bash create-plan 123  # Create plan from issue
```

**Output for `fetch`:**
```
ISSUE_NUMBER=123
ISSUE_TITLE=<title>
ISSUE_STATE=open|closed
ISSUE_AUTHOR=<username>
ISSUE_BODY=<body_text>
ISSUE_LABELS=<comma-separated>
ISSUE_URL=<url>
```

#### `gh_workflow_monitor.bash`
Monitor GitHub Actions workflows.

**Usage:**
```bash
bash gh_workflow_monitor.bash check <commit_sha>    # Check workflow status
bash gh_workflow_monitor.bash wait <commit_sha>     # Wait for completion
bash gh_workflow_monitor.bash latest                # Check latest runs
```

**Output:**
```
WORKFLOW_STATUS=pending|success|failure|cancelled
WORKFLOW_COUNT=<number>
WORKFLOW_0_NAME=<name>
WORKFLOW_0_STATUS=<status>
WORKFLOW_0_CONCLUSION=<conclusion>
WORKFLOW_0_URL=<url>
...
```

#### `gh_workflow_ops.bash`
GitHub workflow operations.

**Usage:**
```bash
bash gh_workflow_ops.bash detect <commit_sha>       # Detect workflows
bash gh_workflow_ops.bash wait <commit_sha> <timeout> # Wait with timeout
bash gh_workflow_ops.bash diagnose <run_id>         # Diagnose failure
```

**Output:**
```
WORKFLOWS_DETECTED=true|false
WORKFLOW_COUNT=<number>
MONITORING_NEEDED=true|false
```

### Git Scripts (`git/`)

#### `git_operations.bash`
Common git operations with safety checks.

**Usage:**
```bash
bash git_operations.bash commit "message"    # Safe commit
bash git_operations.bash push               # Push with checks
bash git_operations.bash pull               # Pull with checks
bash git_operations.bash stash              # Stash changes
```

**Output:**
```
OPERATION_SUCCESS=true|false
OPERATION_RESULT=<description>
# Operation-specific outputs
COMMIT_SHA=<sha>
PUSH_RESULT=success|failed|no_changes
```

#### `git_smart_commit.bash`
Generate intelligent commit messages based on changes.

**Usage:**
```bash
bash git_smart_commit.bash              # Analyze and suggest
bash git_smart_commit.bash commit       # Analyze and commit
```

**Output:**
```
SUGGESTED_MESSAGE=<generated_message>
CHANGE_SUMMARY=<brief_summary>
FILES_CHANGED=<number>
COMMIT_SUCCESS=true|false
```

#### `git_state_analysis.bash`
Comprehensive git repository state analysis.

**Usage:**
```bash
bash git_state_analysis.bash             # Full analysis
bash git_state_analysis.bash summary     # Brief summary
bash git_state_analysis.bash changes     # Just changes
```

**Output:**
```
BRANCH=<current_branch>
CHANGES_EXIST=true|false
STAGED_COUNT=<number>
UNSTAGED_COUNT=<number>
UNTRACKED_COUNT=<number>
PUSH_NEEDED=true|false
PULL_NEEDED=true|false
COMMITS_AHEAD=<number>
COMMITS_BEHIND=<number>
```

#### `git_status.bash`
Simple git status check.

**Usage:**
```bash
bash git_status.bash
```

**Output:**
```
GIT_REPO=true|false
BRANCH=<current_branch>
CHANGES_EXIST=true|false
CHANGES_COUNT=<number>
```

### PHP Scripts (`php/`)

#### `detect_version.bash`
Detect PHP version and configuration.

**Usage:**
```bash
bash detect_version.bash
```

**Output:**
```
PHP_AVAILABLE=true|false
PHP_VERSION=<version>
PHP_MAJOR=<major_version>
PHP_MINOR=<minor_version>
PHP_CONFIG_PATH=<path>
```

### Symfony Scripts (`symfony/`)

#### `detect_project.bash`
Detect if current directory is a Symfony project.

**Usage:**
```bash
bash detect_project.bash
```

**Output:**
```
SYMFONY_PROJECT=true|false
SYMFONY_VERSION=<version>
SYMFONY_ENV=dev|prod|test
CONSOLE_PATH=<path_to_console>
KERNEL_PATH=<path_to_kernel>
```

## Usage Examples

### Example 1: Complete Environment Check
```bash
#!/usr/bin/env bash
COMMON_DIR=".claude/cc-commands/scripts/_common"

# Check all prerequisites
echo "Checking environment..."

# Check tools
if ! bash "$COMMON_DIR/env/env_check_tools.bash" git gh jq; then
    echo "ERROR: Missing required tools"
    exit 1
fi

# Validate git and GitHub
eval "$(bash "$COMMON_DIR/env/env_validate.bash" all)"

if [ "$GIT_REPO" != "true" ]; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

if [ "$GH_AUTH" != "true" ]; then
    echo "ERROR: Not authenticated with GitHub"
    exit 1
fi

echo "Environment OK: Git branch $GIT_BRANCH, GitHub repo $GH_REPO"
```

### Example 2: Plan Discovery and Analysis
```bash
#!/usr/bin/env bash
COMMON_DIR=".claude/cc-commands/scripts/_common"

# Find a plan
PLAN_NAME="${1:-}"

if [ -z "$PLAN_NAME" ]; then
    # List all plans
    bash "$COMMON_DIR/file/file_find_plans.bash" list
else
    # Find specific plan
    eval "$(bash "$COMMON_DIR/file/file_find_plans.bash" find "$PLAN_NAME")"
    
    if [ "$MATCH_TYPE" = "none" ]; then
        echo "No plan found matching: $PLAN_NAME"
        exit 1
    fi
    
    # Analyze the plan
    eval "$(bash "$COMMON_DIR/file/file_find_plans.bash" analyze "$PLAN_FILE")"
    
    echo "Plan: $PLAN_NAME"
    echo "Progress: $COMPLETED_TASKS/$TOTAL_TASKS ($COMPLETION_PERCENTAGE%)"
    echo "Status: $([ "$HAS_ALL_DONE" = "true" ] && echo "COMPLETE" || echo "IN PROGRESS")"
fi
```

### Example 3: Git Workflow
```bash
#!/usr/bin/env bash
COMMON_DIR=".claude/cc-commands/scripts/_common"

# Check git state
eval "$(bash "$COMMON_DIR/git/git_state_analysis.bash" summary)"

if [ "$CHANGES_EXIST" = "true" ]; then
    echo "Changes detected:"
    echo "- Staged: $STAGED_COUNT"
    echo "- Unstaged: $UNSTAGED_COUNT"
    echo "- Untracked: $UNTRACKED_COUNT"
    
    # Generate commit message
    eval "$(bash "$COMMON_DIR/git/git_smart_commit.bash")"
    echo "Suggested commit: $SUGGESTED_MESSAGE"
    
    # Commit if approved
    bash "$COMMON_DIR/git/git_operations.bash" commit "$SUGGESTED_MESSAGE"
fi

if [ "$PUSH_NEEDED" = "true" ]; then
    echo "Pushing $COMMITS_AHEAD commits..."
    bash "$COMMON_DIR/git/git_operations.bash" push
fi
```

## Best Practices

### 1. Error Handling
- Always check exit codes
- Use `eval` carefully with script outputs
- Provide clear error messages

### 2. Output Parsing
- Scripts output `KEY=value` pairs for Claude Code
- Use `eval` in bash scripts to parse outputs
- Quote values properly when using `eval`

### 3. Script Composition
```bash
# Good: Check prerequisites first
bash env_check_tools.bash git || exit 1
bash git_status.bash

# Good: Use eval for KEY=value outputs
eval "$(bash git_state_analysis.bash)"
if [ "$CHANGES_EXIST" = "true" ]; then
    # Handle changes
fi

# Bad: Don't parse output with grep/cut
BRANCH=$(bash git_status.bash | grep BRANCH | cut -d= -f2)  # DON'T DO THIS
```

### 4. Performance
- Cache results when possible
- Use minimal output modes
- Batch operations

### 5. Maintenance
- Update this document when adding/modifying scripts
- Keep scripts focused on single responsibility
- Document all outputs in script headers

## Script Health Status

### Scripts Using New Conventions ✅
- All scripts in `_inc/` directory
- Scripts migrated to use `_inc/error_handler.inc.bash`

### Scripts Needing Migration ⚠️
- Most `_common` scripts still source old `error_handlers.bash`
- Should migrate to use `_inc/error_handler.inc.bash`

### Deprecated Scripts ❌
- `error/error_handlers.bash` - Use `_inc/error_handler.inc.bash` instead

---

*This document is automatically checked during README update process to ensure it stays current.*