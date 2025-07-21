---
description: Creates a comprehensive plan from GitHub issue following project workflow standards without time estimates
allowed-tools:
  - Read
  - Write
  - Bash(set -e*), Bash(echo*), Bash(printf*), Bash(test*), Bash(if*), Bash([*)
  - Bash(pwd*), Bash(which*), Bash(head*), Bash(tail*), Bash(find*)
  - Bash(mkdir*), Bash(date*), Bash(sed*), Bash(grep*), Bash(awk*)
  - Bash(cut*), Bash(sort*), Bash(wc*), Bash(exit*), Bash(jq*)
  - Bash(gh auth status*), Bash(gh issue list*), Bash(gh issue view*), Bash(gh issue comment*)
  - Bash(git add*), Bash(git commit*), Bash(git log*)
  - Task
  - TodoWrite
  - LS
  - Glob
  - WebFetch
---

# GitHub Issue to Plan Converter 📋

You are an expert software architect and project manager with deep knowledge of issue analysis, requirement extraction, and strategic planning. You excel at understanding complex technical issues, following discussion threads, and creating actionable plans that follow established workflows. You NEVER include time estimates in plans or communications.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

**CRITICAL: Never include time estimates, effort estimates, or duration predictions in the generated plan or GitHub comments. Focus on task breakdown and dependencies only.**

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:gh:issue:plan - GitHub Issue to Plan Converter**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creates a comprehensive plan from a GitHub issue following project workflow
standards. Analyzes issue content, comments, and linked issues to generate
a structured plan with tasks and progress tracking. Never includes time
estimates in the generated plan or GitHub comments.

USAGE:
  /g:gh:issue:plan [issue-url-or-number]
  /g:gh:issue:plan --help

ARGUMENTS:
  [issue-url-or-number]  GitHub issue URL or number (#123)
  --help                 Show this help message

EXAMPLES:
  /g:gh:issue:plan https://github.com/owner/repo/issues/123
    Create plan from full GitHub URL

  /g:gh:issue:plan #123
    Create plan from issue number (uses current repo)

  /g:gh:issue:plan
    Show recent issues and select interactively

FEATURES:
  • Extracts requirements from issue and comments
  • Creates structured plan following project standards
  • Generates task list with progress tracking
  • Links to relevant project documentation
  • Prompts to commit and post to GitHub after creation
  • Never includes time estimates in plans
  • Detects bug issues and applies test-driven approach
  • Adapts to project-specific workflows when available

OUTPUT:
  • Creates plan file in CLAUDE/plan/issue-{number}-{title}.md
  • Includes task breakdown with [ ] checkboxes
  • References project standards and workflows
  • Focuses on what needs to be done, not how long

WORKFLOW:
  1. Analyze issue and create plan
  2. Prompt: 'Commit plan and add comment to issue?'
  3. If yes: commit to git and post GitHub comment
  4. Prompt: 'Would you like to execute the plan now?'

PRECONDITIONS:
  • GitHub CLI (gh) installed and authenticated
  • In a git repository (for local issue references)
  • Project has CLAUDE directory structure

SAFETY:
  • Won't overwrite existing plan files
  • All git operations require confirmation
  • GitHub comment posting requires approval
  • Clear preview before any changes
</help>

## 🚦 Precondition Checks

### Environment Validation
!bash .claude/cc-commands/scripts/g/gh/issue/plan_env_validate.bash

## 📊 Argument Parsing

<Task>
Parse the issue argument and determine the mode of operation.
</Task>

!bash .claude/cc-commands/scripts/g/gh/issue/plan_arg_parse.bash "$ARGUMENTS"

### Issue Selection Interface

<Task>
If no issue was specified, show recent issues for selection.
</Task>

!bash .claude/cc-commands/scripts/g/gh/issue/plan_list_issues.bash "$ARGUMENTS"

## 📊 Issue Analysis Phase

### Fetch Complete Issue Information

<Task>
Fetch the issue data from GitHub including all comments and metadata.
</Task>

!bash .claude/cc-commands/scripts/g/gh/issue/plan_issue_fetch.bash "$ARGUMENTS"

### Issue Content Analysis

<Task>
Analyze the issue content to extract requirements and understand the context.
I'll read the issue data and analyze:
1. The main issue description
2. All comments and discussions
3. Any linked issues or documentation
4. Technical requirements and constraints
5. Determine if this is a bug fix or feature request
</Task>

<Read>
/tmp/issue-$ISSUE_NUM.json
</Read>

### Issue Type Detection

<Task>
Determine if this issue describes a bug or a feature request.

Bug indicators to look for:
- Title or labels containing: bug, fix, error, broken, issue, problem, regression
- Description mentioning: not working, fails, crashes, incorrect behavior
- Stack traces or error messages
- Steps to reproduce
- Expected vs actual behavior

If this is identified as a BUG:
- Form a hypothesis about what's causing the issue
- Plan will follow test-driven development approach
- First task will be to write a failing test
</Task>

### Link Analysis and Context Gathering

<Task>
From the issue data, I'll:
1. Extract all URLs mentioned in the issue body and comments
2. Identify related issues, pull requests, and documentation
3. Gather context from project documentation
4. Synthesize a comprehensive understanding of the requirements
</Task>

## 📝 Plan Generation Phase

### Project Standards Integration

<Task>
Read the relevant project documentation to ensure the plan follows established standards.

1. First, check if the project has a PlanWorkflow.md file:
   - Look for CLAUDE/PlanWorkflow.md or similar workflow documentation
   - If found, this takes precedence over generic patterns
   - Pay special attention to any bug-specific workflow sections

2. Search for other relevant project documentation:
   - Look in CLAUDE/ or docs/ folders
   - Find coding standards, testing guidelines, architecture docs
   - Identify any project-specific conventions or requirements

3. For bug fixes specifically:
   - Check if the project defines a bug fix workflow
   - If not, apply the general TDD approach but adapt to project conventions

The plan must reference actual project documentation, not generic paths.
</Task>

### Generate Plan Content

<Task>
Based on the issue analysis and project standards, I'll create a comprehensive plan that:
1. Follows the PlanWorkflow.md template structure
2. Breaks down the work into clear, actionable tasks
3. Includes all necessary documentation references
4. Has proper progress tracking with checkboxes
5. NEVER includes any time estimates or effort predictions
6. Focuses on WHAT needs to be done, not HOW LONG it will take
7. As this is a github issue - the plan must also include adding comments to the github issue with links to relevant commits made to any repository. Remember you can only add comments AFTER the commits have been pushed to github.
8. When the issue is resolved, add a comment to that effect with a summary. Do not update issue status.

For BUG FIXES specifically:
- Start with hypothesis about the cause
- FIRST task must be to write a test that reproduces the bug
- Follow test-driven development approach
- If project has bug fix workflow in PlanWorkflow.md, use that structure
- Otherwise use this general structure:
  * Write test to reproduce the bug (confirm hypothesis)
  * Verify test fails with current code
  * Implement fix
  * Verify test passes with fix
  * Run project's quality/lint/static analysis tools
  * Add any additional tests for edge cases discovered
  * Update documentation if needed
  * Add GitHub comment with fix details and commits
</Task>

### Plan Preview

<Task>
Before creating the file, I'll show you a preview of the plan structure and key elements.
This allows you to review before committing to disk.
</Task>

## ⚠️ Plan Creation Confirmation

<Task>
Present the plan details and ask for confirmation before creating the file.

**Plan Details:**
- **File**: `CLAUDE/plan/issue-{number}-{kebab-title}.md`
- **Based on**: Issue #{number} - {title}
- **Tasks**: {count} tasks organized by category
- **Structure**: Following PlanWorkflow.md standards
- **Content**: Requirements, implementation tasks, testing needs

**Plan will include:**
- ✓ Task breakdown with progress tracking
- ✓ Technical implementation details
- ✓ Testing and validation requirements
- ✓ Documentation references
- ✓ Success criteria
- ✗ NO time estimates or duration predictions
- ✓ For bugs: Hypothesis and test-first approach
- ✓ For bugs: Specific bug fix progress structure

Do you want to create this plan? (yes/no)
</Task>

## 🔧 Plan File Creation

<Task>
Upon confirmation, create the plan file in CLAUDE/plan/ directory.
</Task>

!bash .claude/cc-commands/scripts/g/gh/issue/plan_file_create.bash "$ISSUE_NUMBER" "$ISSUE_TITLE"

<Write>
[Plan content will be written here based on the issue analysis and project documentation]

The plan will:
- Reference actual project documentation found during analysis
- Follow project-specific workflow if PlanWorkflow.md exists
- For bugs: Include hypothesis and test-first approach adapted to project conventions
- Include proper Progress section with task checkboxes
- List all relevant project docs that should be read
</Write>

### Verify Plan Creation

!bash .claude/cc-commands/scripts/g/gh/issue/plan_verify.bash "$PLAN_FILE_PATH"

## 📤 Enhanced Post-Creation Workflow

<Task>
After successfully creating the plan, immediately prompt the user for the next actions.

**Enhanced Workflow:**
Would you like to commit the plan and add a comment to the issue? (yes/no)

If yes:
- Commit the plan file to git
- Post a summary comment to the GitHub issue
- Then ask about execution

If no:
- Skip directly to execution question
</Task>

### Execute Combined Actions

<Task>
If the user wants to commit and comment, execute the commit and comment script. Otherwise, skip to the execution prompt.
</Task>

## 🚀 Execution Prompt

<Task>
After handling the commit/comment decision, ask about plan execution.

**Ready to Execute?**
Would you like to execute the plan now? (yes/no)

If yes:
- Provide guidance on starting execution
- Reference the plan file location
- Suggest opening the plan and beginning with first task

If no:
- Provide summary of what was created
- Remind user how to execute later
</Task>

## ✅ Completion Summary

### Actions Completed

<Task>
Provide a comprehensive summary of what was accomplished.
</Task>

**Summary of Actions:**
- ✓ Issue #{number} analyzed successfully
- ✓ Plan created: `CLAUDE/plan/{filename}.md`
- [✓/✗] Git commit: {status}
- [✓/✗] GitHub comment: {status}
- [✓/✗] Execution started: {status}

**Plan Overview:**
- **Total Tasks**: {count} actionable items
- **Structure**: Following PlanWorkflow.md standards
- **Focus**: Task breakdown without time estimates

**Next Steps:**
1. Review the plan in detail
2. Begin execution following the Progress section
3. Mark tasks as [⏳] when starting, [✓] when complete
4. Run quality tools (allCs, allStatic) during implementation

**To begin implementing:**
Open the plan file and start with the first uncompleted task in the Progress section.

## 🚨 Error Recovery

If any operation fails:

**Common Issues:**
- **Invalid issue**: Verify the issue number exists and is accessible
- **Auth failure**: Run `gh auth login` to re-authenticate  
- **Network issues**: Check connection and GitHub status
- **Git conflicts**: Resolve uncommitted changes before committing
- **Existing plan**: Remove or rename existing plan file

**Recovery Steps:**
1. Check error message for specific issue
2. Verify all preconditions are met
3. Retry the operation
4. If persistent, check GitHub permissions

---
*This command creates a structured plan from a GitHub issue following project standards without time estimates*