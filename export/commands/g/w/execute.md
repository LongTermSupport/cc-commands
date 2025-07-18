---
description: Execute previously created plans with workflow-based approach
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Edit
  - MultiEdit
  - Task
  - TodoWrite
  - Bash(set -e*), Bash(echo *), Bash(test *), Bash(if *)
  - Bash(find *), Bash(ls *), Bash(stat *), Bash(grep *)
  - Bash(head *), Bash(tail *), Bash(sort *), Bash(basename *)
  - Bash(git status*), Bash(git diff*), Bash(git add*), Bash(git commit*)
  - Bash(export CI=true*), Bash(bin/qa*)
  - Glob
  - Grep
---

# g:w:execute - Execute Previously Created Plans

You are an expert software engineer and plan execution specialist with deep knowledge of workflow-based development, code quality standards, and safe incremental implementation. Your approach prioritizes accuracy, thoroughness, and maintaining the highest code standards.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## 🔧 Claude Code Optimization Guidelines

### ✅ **Bash Usage Best Practices:**
- **Use bash ONLY for:** System state checking, data extraction, file operations
- **Avoid bash for:** Static text output, user interfaces, help documentation
- **Chain commands:** Combine multiple operations in single bash calls
- **Structured output:** Use `KEY=value` format for Claude to parse
- **Fail-fast:** Always use `set -e` for immediate error termination

## 📊 Argument Parsing

<Task>
Parse all arguments at once and output structured data for use throughout the command.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
# First check for --help \
if [ "$ARGUMENTS" = "--help" ]; then \
  echo "HELP_REQUESTED=true"; \
  exit 0; \
fi; \
set -e; \
# Parse plan name from arguments \
if [ -n "$ARGUMENTS" ]; then \
  echo "PLAN_NAME=$ARGUMENTS"; \
  echo "MODE=EXECUTE"; \
else \
  echo "PLAN_NAME="; \
  echo "MODE=LIST"; \
fi

## 📖 Help Documentation

<Task>
If the user requested --help, provide the help documentation and exit.
</Task>

If you see `--help` in the parsed output above, please provide this help text and stop:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **G:W:EXECUTE - Execute Previously Created Plans**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executes plans from the CLAUDE/plan directory following project workflow standards.
Supports resuming partially completed plans, verifying status accuracy, and 
maintaining highest code quality throughout execution.

**USAGE:**
```
/g:w:execute                 # List recent plans
/g:w:execute [plan-name]     # Execute specific plan
/g:w:execute --help          # Show this help
```

**ARGUMENTS:**
- `[plan-name]` - Plan name or partial match (fuzzy matching supported)
- `--help` - Show this help message

**EXAMPLES:**
```
/g:w:execute
  Lists 10 most recent plans with status summary

/g:w:execute postcode-surcharge
  Executes plan matching "postcode-surcharge"

/g:w:execute postcode
  Fuzzy matches plans containing "postcode"
```

**FEATURES:**
• Lists plans by modification time when no args provided
• Fuzzy matching for plan names with confirmation
• Verifies and updates plan status before execution
• Follows project workflow standards (PlanWorkflow.md)
• Runs QA tools (allCs, allStatic) during execution
• Suggests milestone commits during long executions
• Supports resuming partially completed plans

**WORKFLOW:**
1. Discovers and validates selected plan
2. Reads plan and all linked documentation
3. Verifies current progress status
4. Executes remaining tasks with progress tracking
5. Runs quality checks after modifications
6. Updates plan status throughout execution

**SAFETY:**
• Confirms plan selection before execution
• Verifies "ALL DONE!" status accuracy
• Creates git commits at milestones
• Provides clear recovery instructions on failure
• Maintains plan document accuracy

## 🚦 Precondition Checks

### Environment Validation
!echo "Validating environment and required tools"; \
set -e; \
test -d CLAUDE/plan && echo "PLAN_DIR=exists" || echo "PLAN_DIR=missing"; \
test -f CLAUDE/PlanWorkflow.md && echo "WORKFLOW_DOC=exists" || echo "WORKFLOW_DOC=missing"; \
which git >/dev/null 2>&1 && echo "GIT_AVAILABLE=true" || echo "GIT_AVAILABLE=false"; \
test -d .git && echo "IN_GIT_REPO=true" || echo "IN_GIT_REPO=false"; \
test -f bin/qa && echo "QA_TOOL=exists" || echo "QA_TOOL=missing"

### System Requirements Status
<Task>
Based on the environment check results, validate all preconditions are met.
</Task>

## 📋 Plan Discovery Phase

<Task>
Based on MODE from argument parsing, either list plans or find the specific plan.
</Task>

### List Recent Plans (MODE=LIST)

!echo "Discovering plans in CLAUDE/plan directory"; \
set -e; \
if [ -d CLAUDE/plan ]; then \
  cd CLAUDE/plan; \
  # Find all .md files, get their modification time, sort by most recent \
  find . -name "*.md" -type f -printf "%T@ %P\n" | sort -rn | head -10 | while read -r timestamp filepath; do \
    # Extract plan name and check for progress markers \
    planname=$(basename "$filepath" .md); \
    # Count task statuses \
    total=$(grep -E "^\[[ ✓⏳]\]" "$filepath" 2>/dev/null | wc -l || echo "0"); \
    completed=$(grep -E "^\[✓\]" "$filepath" 2>/dev/null | wc -l || echo "0"); \
    inprogress=$(grep -E "^\[⏳\]" "$filepath" 2>/dev/null | wc -l || echo "0"); \
    # Check for ALL DONE marker \
    if grep -A1 "^## Progress" "$filepath" 2>/dev/null | grep -q "ALL DONE!"; then \
      status="COMPLETED"; \
    elif [ "$inprogress" -gt 0 ]; then \
      status="IN_PROGRESS"; \
    elif [ "$completed" -gt 0 ]; then \
      status="PARTIAL"; \
    else \
      status="NOT_STARTED"; \
    fi; \
    # Get summary if available \
    summary=$(grep -A2 "^## Summary" "$filepath" 2>/dev/null | tail -n1 | head -c 60 || echo "No summary"); \
    # Format: PLAN_NAME|STATUS|COMPLETED/TOTAL|SUMMARY \
    echo "$planname|$status|$completed/$total|$summary"; \
  done \
else \
  echo "ERROR: CLAUDE/plan directory not found"; \
  exit 1; \
fi

### Find Specific Plan (MODE=EXECUTE)

<Task>
If MODE=EXECUTE, search for the plan using exact and fuzzy matching.
</Task>

!if [ "$MODE" = "EXECUTE" ] && [ -n "$PLAN_NAME" ]; then \
  echo "Searching for plan: $PLAN_NAME"; \
  set -e; \
  cd CLAUDE/plan 2>/dev/null || { echo "ERROR: CLAUDE/plan directory not found"; exit 1; }; \
  # First try exact match \
  if [ -f "${PLAN_NAME}.md" ]; then \
    echo "MATCH_TYPE=exact"; \
    echo "PLAN_FILE=${PLAN_NAME}.md"; \
    echo "PLAN_PATH=CLAUDE/plan/${PLAN_NAME}.md"; \
  else \
    # Try fuzzy match - find files containing the search term \
    matches=$(find . -name "*.md" -type f | grep -i "$PLAN_NAME" | sed 's|^\./||' || true); \
    match_count=$(echo "$matches" | grep -c . || echo "0"); \
    if [ "$match_count" -eq 0 ]; then \
      # Try searching file contents for the term \
      matches=$(grep -l -i "$PLAN_NAME" *.md 2>/dev/null || true); \
      match_count=$(echo "$matches" | grep -c . || echo "0"); \
    fi; \
    if [ "$match_count" -eq 0 ]; then \
      echo "MATCH_TYPE=none"; \
      echo "ERROR: No plans found matching '$PLAN_NAME'"; \
    elif [ "$match_count" -eq 1 ]; then \
      echo "MATCH_TYPE=fuzzy_single"; \
      echo "PLAN_FILE=$matches"; \
      echo "PLAN_PATH=CLAUDE/plan/$matches"; \
    else \
      echo "MATCH_TYPE=fuzzy_multiple"; \
      echo "MATCH_COUNT=$match_count"; \
      echo "$matches" | while read -r match; do \
        echo "CANDIDATE=$match"; \
      done; \
    fi; \
  fi; \
fi

## 🎯 Plan Selection & Confirmation

<Task>
Based on the plan discovery results, handle plan selection and get user confirmation.
</Task>

## 📚 Plan & Documentation Reading

<Task>
Once a plan is confirmed, read the plan file and all referenced documentation.
</Task>

### Read Plan Document

<Task>
Read the selected plan file to understand requirements and current progress.
</Task>

### Read Workflow Documentation

<Task>
Check for project-specific workflow documentation or use embedded defaults.
</Task>

## 🔍 Progress Verification

<Task>
Analyze the plan's current progress and verify accuracy of status markers.
</Task>

### Status Verification

!echo "Analyzing plan progress and verifying status"; \
set -e; \
if [ -n "$PLAN_PATH" ]; then \
  # Extract all tasks and their status \
  echo "=== TASK STATUS ANALYSIS ==="; \
  # Count different task states \
  total_tasks=$(grep -E "^\[[ ✓⏳]\]" "$PLAN_PATH" 2>/dev/null | wc -l || echo "0"); \
  completed_tasks=$(grep -E "^\[✓\]" "$PLAN_PATH" 2>/dev/null | wc -l || echo "0"); \
  inprogress_tasks=$(grep -E "^\[⏳\]" "$PLAN_PATH" 2>/dev/null | wc -l || echo "0"); \
  pending_tasks=$(grep -E "^\[ \]" "$PLAN_PATH" 2>/dev/null | wc -l || echo "0"); \
  echo "TOTAL_TASKS=$total_tasks"; \
  echo "COMPLETED_TASKS=$completed_tasks"; \
  echo "INPROGRESS_TASKS=$inprogress_tasks"; \
  echo "PENDING_TASKS=$pending_tasks"; \
  # Check for ALL DONE marker \
  if grep -A1 "^## Progress" "$PLAN_PATH" 2>/dev/null | grep -q "ALL DONE!"; then \
    echo "HAS_ALL_DONE=true"; \
  else \
    echo "HAS_ALL_DONE=false"; \
  fi; \
  # Extract tasks for verification \
  echo "=== TASK LIST ==="; \
  grep -n -E "^\[[ ✓⏳]\]" "$PLAN_PATH" | head -20; \
fi

## 🚀 Execution Phase

<Task>
Execute the plan following the workflow standards and maintaining progress updates.
</Task>

### Pre-Execution Confirmation

<Task>
Get final confirmation from user before starting execution.
</Task>

### Plan Execution Loop

<Task>
Work through each task in the plan, updating progress and running QA checks.
</Task>

## 🧹 Quality Assurance

<Task>
Run code quality tools at appropriate intervals during execution.
</Task>

### Code Standards Check

!echo "Running code standards fixer"; \
export CI=true; \
set -e; \
bin/qa -t allCS &> /dev/null && echo "ALLCS_RESULT=success" || echo "ALLCS_RESULT=failed"

### Static Analysis

!echo "Running static analysis"; \
export CI=true; \
set -e; \
bin/qa -t allStatic

## 📊 Progress Tracking

<Task>
Update plan document with current progress throughout execution.
</Task>

## 🎯 Milestone Management

<Task>
Suggest and create git commits at logical milestones during execution.
</Task>

### Check Git Status

!echo "Checking git status for milestone commit"; \
set -e; \
git status --porcelain | head -20; \
echo "MODIFIED_COUNT=$(git status --porcelain | wc -l)"

## ✅ Completion Verification

<Task>
Verify all tasks are complete and plan can be marked as done.
</Task>

## 📈 Execution Summary

<Task>
Provide a summary of what was accomplished during execution.
</Task>

## 🚨 Error Recovery

If execution fails at any point:

1. **Save Progress**: Ensure plan document reflects accurate task status
2. **Note Blockers**: Document what prevented completion
3. **Recovery Steps**: 
   - Fix any syntax/type errors: `export CI=true; bin/qa -t allStatic`
   - Re-run the command to resume from last completed task
   - Check git status to understand changes: `git status`
4. **Rollback Option**: Use git to revert if needed: `git checkout -- <file>`

## 📋 Embedded Plan Workflow

<Task>
Include embedded workflow for projects without PlanWorkflow.md
</Task>

### Default Plan Workflow Standards

When no project-specific workflow exists, follow these standards:

**Planning Mode:**
- NO CODE CHANGES during planning
- Research all relevant files and dependencies
- Create detailed task breakdown
- Include code snippets for complex changes
- Reference project standards

**Execution Mode:**
- Read all linked documentation first
- Work through tasks sequentially
- Update progress after each task
- Run QA tools after file modifications
- Create milestone commits

**Progress Tracking:**
- `[ ]` - Not started
- `[⏳]` - In progress
- `[✓]` - Completed

**Quality Standards:**
- Run `allCs` after editing files
- Run `allStatic` after task completion
- Fix all issues before proceeding
- Never suppress errors or warnings

**Completion:**
- Add "ALL DONE!" only when truly complete
- Verify with static analysis passing
- Ensure all tests pass
- Document any follow-up needed

---
*Command created with Claude Code optimization best practices for maximum efficiency and clarity*