# Claude Code Command Structure Guide

This document defines the structure, patterns, and best practices for creating efficient Claude Code commands that minimize bash script calls while maintaining clarity and functionality.

## Core Principles

### 1. Minimize Bash Script Calls
**Goal**: Reduce the number of individual `!bash` calls requiring user approval.

**Why**: Each bash call requires user approval, slowing down command execution. Fewer calls = faster execution.

**How**: Use orchestrator scripts that handle multiple operations internally.

### 2. Hierarchical Script Organization
Scripts should be organized in a logical directory structure that reflects their purpose and execution order.

### 3. Deterministic Logic in Bash
Move conditional logic that can be determined programmatically into bash scripts rather than having Claude make multiple decisions.

### 4. Claude Handles Complex Decisions
Reserve Claude's decision-making for tasks requiring:
- Natural language understanding
- Content generation (commit messages, documentation)
- User interaction and confirmation
- Complex analysis of outputs

## Directory Structure Pattern

```
scripts/
└── g/
    └── command/
        └── {command_name}/
            ├── {command}_orchestrate.bash    # Main orchestrator
            ├── pre/                          # Precondition checks
            │   ├── env_validate.bash
            │   └── prereq_check.bash
            ├── analysis/                     # Analysis scripts
            │   ├── status_analysis.bash
            │   └── change_detection.bash
            ├── execute/                      # Execution scripts
            │   ├── main_operation.bash
            │   └── secondary_operation.bash
            └── post/                         # Cleanup/summary
                ├── summary.bash
                └── cleanup.bash
```

## Orchestrator Pattern

### Structure

```bash
#!/usr/bin/env bash
# Script: {command}_orchestrate.bash
# Purpose: Main orchestrator for {command} - coordinates all sub-operations
# Usage: {command}_orchestrate.bash [parameters]
# Output: Structured output with KEY=value pairs and execution results

set -euo pipefail
IFS=$'\n\t'

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../_common"
COMMAND_DIR="$SCRIPT_DIR/{command_name}"

# Load common scripts
source "$COMMON_DIR/error/error_handlers.bash"

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture and parse script outputs
capture_script_output() {
    local script_path="$1"
    shift
    local args="$@"
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" $args > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                SCRIPT_OUTPUTS["$key"]="$value"
            fi
        done < "$temp_file"
    else
        local exit_code=$?
        echo "ERROR: Script failed with exit code $exit_code"
        cat "$temp_file"
        rm -f "$temp_file"
        return $exit_code
    fi
    
    rm -f "$temp_file"
    echo ""
    return 0
}

main() {
    # Accept parameters
    local param1="${1:-}"
    
    # Step 1: Precondition checks
    capture_script_output "$COMMAND_DIR/pre/env_validate.bash" || {
        error_exit "Environment validation failed"
    }
    
    # Step 2: Conditional execution based on outputs
    if [[ "${SCRIPT_OUTPUTS[SOME_CONDITION]:-false}" == "true" ]]; then
        capture_script_output "$COMMAND_DIR/analysis/detailed_analysis.bash" || {
            error_exit "Analysis failed"
        }
    fi
    
    # Continue with orchestrated flow...
    
    # Final output for Claude
    echo "=== FINAL STATE ==="
    echo "OPERATION_COMPLETE=true"
    echo "NEXT_ACTION_NEEDED=${SCRIPT_OUTPUTS[SOME_FLAG]:-false}"
}

main "$@"
echo "Script success: ${0##*/}"
```

## Command Structure Pattern

### Minimal Bash Calls Design

```markdown
---
description: Command that uses orchestrator pattern
---

# Command Name

[Command introduction and critical instructions]

## 📖 Help Documentation
[Help section with <Task> block]

## 🔄 Initial Analysis Phase

!bash .claude/cc-commands/scripts/g/command/{command}_orchestrate.bash

<Task>
Based on the orchestrator output:
- Check KEY=value pairs from output
- Determine what actions are needed
- Generate any required content (commit messages, etc.)
</Task>

## 🎯 Decision Point

<Task>
Based on analysis:
1. If ACTION_REQUIRED=true, prepare necessary inputs
2. Show user what will happen
3. Get confirmation if needed
</Task>

## 🚀 Execution Phase

!bash .claude/cc-commands/scripts/g/command/{command}_orchestrate.bash "$GENERATED_INPUT"

<Task>
Review final output and handle any post-processing needed
</Task>
```

## Real Example: Sync Command

### Before Refactoring (8 bash calls):
```markdown
!bash sync_env_validate.bash
!bash sync_status_analysis.bash  
!bash sync_change_analysis.bash
!bash sync_commit_execute.bash "$MSG"
!bash sync_pull_execute.bash "$BRANCH"
!bash sync_readme_check.bash
!bash sync_push_execute.bash "$BRANCH"
!bash sync_summary.bash
```

### After Refactoring (2 bash calls):
```markdown
# First call - complete analysis
!bash sync_orchestrate.bash

<Task>
Generate commit message if COMMIT_MESSAGE_REQUIRED=true
</Task>

# Second call - complete execution
!bash sync_orchestrate.bash "$COMMIT_MESSAGE"
```

## Design Guidelines

### 1. Sub-script Communication
Sub-scripts communicate state through KEY=value outputs:

```bash
# In sub-script
echo "CHANGES_EXIST=true"
echo "FILE_COUNT=5"
echo "COMMIT_NEEDED=true"
```

### 2. Conditional Logic in Orchestrator
```bash
# Orchestrator decides flow based on outputs
if [[ "${SCRIPT_OUTPUTS[CHANGES_EXIST]}" == "true" ]]; then
    capture_script_output "$COMMAND_DIR/analysis/change_analysis.bash"
fi
```

### 3. Parameter Passing
Orchestrators should accept parameters for different execution modes:

```bash
# Mode-based execution
MODE="${1:-analyze}"  # analyze, execute, full

case "$MODE" in
    analyze)
        # Only run analysis scripts
        ;;
    execute)
        # Skip analysis, run execution
        ;;
    full)
        # Run everything
        ;;
esac
```

### 4. Error Handling

#### Critical Stop Pattern
When errors require immediate termination, use the standardized error exit pattern:

```bash
error_exit() {
    echo "ERROR: $1" >&2
    echo "================== COMMAND EXECUTION MUST STOP ==================" >&2
    echo "An unexpected error has occurred. Claude Code should not continue." >&2
    echo "================================================================" >&2
    exit 1
}
```

This pattern ensures:
- Clear visual separation with bordered message
- Unambiguous "COMMAND EXECUTION MUST STOP" instruction
- Claude understands this is terminal, not a warning
- User sees the severity immediately

#### Error Handling Strategy
- Each sub-script failure should be caught by the orchestrator
- Critical failures use `error_exit` to stop execution completely
- Non-critical failures can be logged but execution continues
- Always provide context about what failed and why

### 5. Output Structure
Maintain clear output sections:

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "→ Running: Environment Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# ... output ...

echo "=== FINAL STATE ==="
echo "KEY1=value1"
echo "KEY2=value2"
```

## When to Use This Pattern

### Good Candidates for Orchestration:
1. **Commands with multiple sequential steps** - git operations, builds, deployments
2. **Commands with conditional logic** - "if X then Y" flows
3. **Commands requiring multiple validations** - environment checks, prerequisites
4. **Commands with cleanup/summary steps** - need consistent execution order

### When NOT to Orchestrate:
1. **Simple single-operation commands** - just run the one script
2. **Highly interactive commands** - where each step needs user input
3. **Commands where Claude needs to make decisions between steps**

## Migration Strategy

When updating existing commands:

1. **Identify related scripts**
   ```bash
   find scripts -name "{command}_*.bash"
   ```

2. **Create directory structure**
   ```bash
   mkdir -p scripts/g/command/{command}/{pre,analysis,execute,post}
   ```

3. **Move scripts to subdirectories**
   - Group by execution phase
   - Update COMMON_DIR paths (add one more `../`)

4. **Create orchestrator**
   - Import capture_script_output function
   - Define execution flow
   - Handle conditional logic

5. **Update command file**
   - Replace multiple !bash calls with orchestrator calls
   - Move complex logic to <Task> blocks

## Task Block Guidelines

### Purpose of Task Blocks

Task blocks (`<Task>...</Task>`) are instructions for Claude to process information, make decisions, and interact with users. They should be used strategically to leverage Claude's capabilities while maintaining efficient command flow.

### When to Use Task Blocks

1. **After Bash Script Output** - To interpret and act on script results
   ```markdown
   !bash .claude/cc-commands/scripts/g/command/analyze.bash
   
   <Task>
   Based on the output above:
   - Check if ERRORS_FOUND=true
   - Identify which files have issues
   - Determine next steps
   </Task>
   ```

2. **For Content Generation** - When creating commit messages, documentation, etc.
   ```markdown
   <Task>
   If COMMIT_MESSAGE_REQUIRED=true:
   1. Analyze the file changes shown above
   2. Generate a conventional commit message
   3. Store in COMMIT_MESSAGE variable
   </Task>
   ```

3. **User Interaction Points** - For confirmations and input gathering
   ```markdown
   <Task>
   Show the user what operations will be performed:
   - List files to be modified
   - Explain potential impacts
   - Ask for confirmation to proceed
   </Task>
   ```

4. **Complex Decision Making** - When logic requires understanding context
   ```markdown
   <Task>
   Based on the error type:
   - If it's a merge conflict, provide resolution steps
   - If it's a permission issue, suggest fixes
   - If it's a network error, recommend retry
   </Task>
   ```

### Task Block Anti-Patterns

1. **❌ Redundant Instructions** - Don't repeat the same task multiple times
   ```markdown
   <!-- BAD: Three blocks all saying to generate commit message -->
   <Task>Generate commit message</Task>
   <Task>Create a commit message</Task>
   <Task>Make the commit message</Task>
   ```

2. **❌ Simple Variable Checks** - Don't use Task blocks for trivial operations
   ```markdown
   <!-- BAD: Overcomplicated -->
   <Task>
   Check if the variable SHOULD_CONTINUE equals "yes"
   </Task>
   
   <!-- GOOD: Just put it in the narrative -->
   If SHOULD_CONTINUE is "yes", we'll proceed with the operation.
   ```

3. **❌ Describing Bash Output** - Don't ask Claude to describe what bash will do
   ```markdown
   <!-- BAD: Redundant description -->
   <Task>
   The next command will run the test suite and show the results
   </Task>
   !bash run_tests.bash
   
   <!-- GOOD: Just run it -->
   ### Running Tests
   !bash run_tests.bash
   ```

### Task Block Best Practices

1. **Be Specific and Actionable**
   ```markdown
   <Task>
   Read the error message from line 23 above.
   If it mentions "permission denied":
   1. Check the file path
   2. Suggest using sudo or changing permissions
   3. Provide the exact command to fix it
   </Task>
   ```

2. **Use Conditional Logic**
   ```markdown
   <Task>
   Only perform these steps if CHANGES_EXIST=true:
   1. Read the first 50 lines of each modified file
   2. Understand the nature of changes
   3. Generate appropriate commit message
   </Task>
   ```

3. **Group Related Operations**
   ```markdown
   <Task>
   Repository analysis complete. Now:
   1. Determine if commit is needed (check CHANGES_EXIST)
   2. Identify if pull is required (check REMOTE_STATUS)
   3. Generate a summary of required operations
   4. Format as a bullet list for user confirmation
   </Task>
   ```

4. **Provide Clear Output Instructions**
   ```markdown
   <Task>
   If README_UPDATE_NEEDED=true:
   1. Read the current README.md
   2. Update the command list in the "Available Commands" section
   3. Ensure all new commands are documented
   4. Write the updated content back
   </Task>
   ```

### Task Block Structure

For complex tasks, use clear numbered steps:

```markdown
<Task>
Purpose: [What this task accomplishes]

Steps:
1. [First action]
2. [Second action]
3. [Decision point]
   - If X: [action]
   - If Y: [different action]
4. [Final action]

Output: [What should result from this task]
</Task>
```

## Best Practices

### 1. Naming Conventions
- Orchestrator: `{command}_orchestrate.bash`
- Sub-scripts: `{phase}_{operation}.bash`
- Directories: Match execution phases

### 2. Output Design
- Use `KEY=value` for parseable data
- Use `echo "✓ Message"` for status updates
- Use `echo "━━━"` for visual separators

### 3. State Management
- Orchestrator maintains state via SCRIPT_OUTPUTS array
- Sub-scripts are stateless - only input/output
- Pass required state as parameters

### 4. Testing
```bash
# Test orchestrator analysis mode
bash scripts/g/command/cmd/cmd_orchestrate.bash

# Test with parameters
bash scripts/g/command/cmd/cmd_orchestrate.bash "test input"

# Test individual sub-scripts
bash scripts/g/command/cmd/pre/env_validate.bash
```

### 5. Documentation
Each orchestrator should document:
- Expected parameters
- Output KEY=value pairs
- Execution flow
- Error conditions

## Common Patterns

### Pattern 1: Analysis → Decision → Execute
```bash
# First call: analyze only
RESULT=$(bash orchestrate.bash --analyze)

# Claude makes decision based on RESULT

# Second call: execute with decision
bash orchestrate.bash --execute "$DECISION"
```

### Pattern 2: Progressive Execution
```bash
# Orchestrator tracks progress
if [ -f ".progress" ]; then
    RESUME_FROM=$(cat .progress)
fi

# Skip completed steps
if [[ "$RESUME_FROM" > "step1" ]]; then
    echo "✓ Skipping completed step 1"
else
    run_step_1
    echo "step1" > .progress
fi
```

### Pattern 3: Batch Operations
```bash
# Process multiple items in one call
for item in "${ITEMS[@]}"; do
    capture_script_output "$COMMAND_DIR/process.bash" "$item"
done
```

## Examples of Well-Structured Commands

### 1. Sync Command
- **Orchestrator**: Handles complete git workflow
- **Phases**: pre-check → analyze → commit → pull → push → summary
- **Bash calls**: Reduced from 8 to 2

### 2. Build Command (hypothetical)
- **Orchestrator**: Manages build pipeline
- **Phases**: clean → compile → test → package → deploy
- **Bash calls**: 1 for complete build, 2 if deployment needs confirmation

### 3. Database Migration (hypothetical)
- **Orchestrator**: Handles migration workflow
- **Phases**: backup → validate → migrate → verify → cleanup
- **Bash calls**: 1 for dry-run analysis, 1 for execution

## Conclusion

The orchestrator pattern significantly improves command efficiency by:
- Reducing user approval prompts
- Moving deterministic logic to bash
- Maintaining clear execution flow
- Preserving Claude's role in complex decisions

When creating or updating commands, always consider whether multiple bash calls can be consolidated into an orchestrated flow.