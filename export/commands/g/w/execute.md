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

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## ⚠️ CRITICAL: Command Flow Control

**IMPORTANT**: This command has TWO distinct modes that must be handled separately:
1. **LIST MODE** (no arguments): Shows available plans and STOPS - do not execute anything
2. **EXECUTE MODE** (with plan name): Finds and executes the specified plan

You MUST determine the mode from arguments BEFORE taking any other action.

## 📋 Example Execution Flows

### Flow 1: No Arguments (List Mode)
```
User: /g:w:execute
AI: [Parse arguments → MODE=LIST]
AI: [List 10 recent plans with status]
AI: [STOP and wait for user to run command again with a plan name]
```

### Flow 2: With Plan Name (Execute Mode)
```
User: /g:w:execute issue-109
AI: [Parse arguments → MODE=EXECUTE, PLAN_NAME=issue-109]
AI: [Find and confirm plan]
AI: [Execute plan tasks]
```

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
CRITICAL: The MODE determined here controls the entire flow of this command.
If the user provided "--help", the help documentation below will be shown and we should stop.
</Task>

!bash .claude/cc-commands/scripts/g/w/execute/execute_orchestrate.bash analyze "$ARGUMENTS"

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:w:execute - Execute Previously Created Plans**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executes plans from the CLAUDE/plan directory following project workflow standards.
Supports resuming partially completed plans, verifying status accuracy, and 
maintaining highest code quality throughout execution.

USAGE:
  /g:w:execute                 # List recent plans
  /g:w:execute [plan-name]     # Execute specific plan
  /g:w:execute --help          # Show this help

ARGUMENTS:
  [plan-name]  Plan name or partial match (fuzzy matching supported)
  --help       Show this help message

EXAMPLES:
  /g:w:execute
    Lists 10 most recent plans with status summary

  /g:w:execute postcode-surcharge
    Executes plan matching "postcode-surcharge"

  /g:w:execute postcode
    Fuzzy matches plans containing "postcode"

FEATURES:
  • Lists plans by modification time when no args provided
  • Fuzzy matching for plan names with confirmation
  • Verifies and updates plan status before execution
  • Follows project workflow standards (PlanWorkflow.md)
  • Runs QA tools (allCs, allStatic) during execution
  • Suggests milestone commits during long executions
  • Supports resuming partially completed plans

WORKFLOW:
  1. Discovers and validates selected plan
  2. Reads plan and all linked documentation
  3. Verifies current progress status
  4. Executes remaining tasks with progress tracking
  5. Runs quality checks after modifications
  6. Updates plan status throughout execution

SAFETY:
  • Confirms plan selection before execution
  • Verifies "ALL DONE!" status accuracy
  • Creates git commits at milestones
  • Provides clear recovery instructions on failure
  • Maintains plan document accuracy
</help>

## 🚦 Precondition Checks

### Initial Analysis

<Task>
The orchestrator will handle all analysis including argument parsing, environment validation, and mode determination.
</Task>

### System Requirements Status
<Task>
Based on the environment check results, validate all preconditions are met.
</Task>

## 🚦 Mode Router

<Task>
CRITICAL: Check the MODE variable from argument parsing above.
- If MODE=LIST: Execute ONLY Section A below (List Plans), then STOP
- If MODE=EXECUTE: Skip to Section B below (Execute Plan)
Do not proceed through both sections.
</Task>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Section A: List Plans (MODE=LIST ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<Task>
Execute this section ONLY if MODE=LIST. After listing plans, STOP completely.
Do not proceed to Section B or any execution logic.
</Task>

### List Recent Plans

<Task>
If MODE=LIST from the orchestrator output above, the plans have already been listed.
Stop here and wait for the user to run the command again with a plan name.
</Task>

<Task>
🛑 STOP HERE if MODE=LIST. The plans have been listed above. 
Wait for the user to run the command again with a specific plan name.
Do NOT proceed to Section B or any execution logic.
</Task>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Section B: Execute Plan (MODE=EXECUTE ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<Task>
Execute this section ONLY if MODE=EXECUTE and a plan name was provided.
If you reached here with MODE=LIST, you made an error - STOP immediately.
</Task>

### Find Specific Plan

<Task>
Search for the plan using exact and fuzzy matching.
</Task>

<Task>
The orchestrator has already handled plan search if MODE=EXECUTE.
Check PLAN_FOUND and PLAN_PATH from the output above.
</Task>

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

<Task>
The orchestrator has already verified the plan status.
Proceed based on the verification results from above.
</Task>

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

!bash .claude/cc-commands/scripts/g/w/execute/execute_orchestrate.bash execute "$PLAN_PATH" allcs

### Static Analysis

!bash .claude/cc-commands/scripts/g/w/execute/execute_orchestrate.bash execute "$PLAN_PATH" static_analysis

## 📊 Progress Tracking

<Task>
Update plan document with current progress throughout execution.
</Task>

## 🎯 Milestone Management

<Task>
Suggest and create git commits at logical milestones during execution.
</Task>

### Check Git Status

!bash .claude/cc-commands/scripts/g/w/execute/execute_orchestrate.bash execute "$PLAN_PATH" git_status

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