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

## 📖 Help Documentation

<Task>
First, check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " GH:ISSUE:PLAN - GitHub Issue to Plan Converter"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "Creates a comprehensive plan from a GitHub issue following project workflow"; \
echo "standards. Analyzes issue content, comments, and linked issues to generate"; \
echo "a structured plan with tasks and progress tracking. Never includes time"; \
echo "estimates in the generated plan or GitHub comments."; \
echo ""; \
echo "USAGE:"; \
echo "  /g:gh:issue:plan [issue-url-or-number]"; \
echo "  /g:gh:issue:plan --help"; \
echo ""; \
echo "ARGUMENTS:"; \
echo "  [issue-url-or-number]  GitHub issue URL or number (#123)"; \
echo "  --help                 Show this help message"; \
echo ""; \
echo "EXAMPLES:"; \
echo "  /g:gh:issue:plan https://github.com/owner/repo/issues/123"; \
echo "    Create plan from full GitHub URL"; \
echo ""; \
echo "  /g:gh:issue:plan #123"; \
echo "    Create plan from issue number (uses current repo)"; \
echo ""; \
echo "  /g:gh:issue:plan"; \
echo "    Show recent issues and select interactively"; \
echo ""; \
echo "FEATURES:"; \
echo "  • Extracts requirements from issue and comments"; \
echo "  • Creates structured plan following project standards"; \
echo "  • Generates task list with progress tracking"; \
echo "  • Links to relevant project documentation"; \
echo "  • Prompts to commit and post to GitHub after creation"; \
echo "  • Never includes time estimates in plans"; \
echo ""; \
echo "OUTPUT:"; \
echo "  • Creates plan file in CLAUDE/plan/issue-{number}-{title}.md"; \
echo "  • Includes task breakdown with [ ] checkboxes"; \
echo "  • References project standards and workflows"; \
echo "  • Focuses on what needs to be done, not how long"; \
echo ""; \
echo "WORKFLOW:"; \
echo "  1. Analyze issue and create plan"; \
echo "  2. Prompt: 'Commit plan and add comment to issue?'"; \
echo "  3. If yes: commit to git and post GitHub comment"; \
echo "  4. Prompt: 'Would you like to execute the plan now?'"; \
echo ""; \
echo "PRECONDITIONS:"; \
echo "  • GitHub CLI (gh) installed and authenticated"; \
echo "  • In a git repository (for local issue references)"; \
echo "  • Project has CLAUDE directory structure"; \
echo ""; \
echo "SAFETY:"; \
echo "  • Won't overwrite existing plan files"; \
echo "  • All git operations require confirmation"; \
echo "  • GitHub comment posting requires approval"; \
echo "  • Clear preview before any changes"; \
echo ""; \
exit 0; \
fi

## 🚦 Precondition Checks

### Environment Validation
!echo "Validating GitHub environment and project setup"; \
set -e; echo "=== GitHub Issue Planning Environment Check ==="; \
test -d .git && echo "✓ Git repository found" || (echo "✗ Not in a git repository" && exit 1); \
which gh >/dev/null 2>&1 && echo "✓ gh CLI available ($(gh --version | head -1))" || (echo "✗ gh CLI not found - required for GitHub operations" && exit 1); \
gh auth status >/dev/null 2>&1 && echo "✓ GitHub authenticated" || (echo "✗ Not authenticated with GitHub - run: gh auth login" && exit 1); \
test -d CLAUDE && echo "✓ CLAUDE directory exists" || (echo "✗ CLAUDE directory not found" && exit 1); \
test -d CLAUDE/plan && echo "✓ CLAUDE/plan directory exists" || (echo "⚠ CLAUDE/plan directory not found - will create" && mkdir -p CLAUDE/plan); \
test -f CLAUDE/PlanWorkflow.md && echo "✓ PlanWorkflow.md found" || echo "⚠ PlanWorkflow.md not found - will use defaults"

## 📊 Argument Parsing

<Task>
Parse the issue argument and determine the mode of operation.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
if [ -z "$ARGUMENTS" ]; then \
  echo "MODE: \"INTERACTIVE\""; \
  echo "ISSUE_NUMBER: \"\""; \
  echo "Need to show issue list for selection"; \
elif [[ "$ARGUMENTS" =~ ^https://github.com/.*/issues/([0-9]+) ]]; then \
  ISSUE_NUM="${BASH_REMATCH[1]}"; \
  echo "MODE: \"URL\""; \
  echo "ISSUE_NUMBER: \"$ISSUE_NUM\""; \
  echo "Parsed issue number from GitHub URL"; \
elif [[ "$ARGUMENTS" =~ ^#?([0-9]+)$ ]]; then \
  ISSUE_NUM="${BASH_REMATCH[1]}"; \
  echo "MODE: \"NUMBER\""; \
  echo "ISSUE_NUMBER: \"$ISSUE_NUM\""; \
  echo "Using issue number directly"; \
else \
  echo "ERROR: Invalid argument format"; \
  echo "Expected: issue number (#123) or GitHub URL"; \
  exit 1; \
fi

### Issue Selection Interface

<Task>
If no issue was specified, show recent issues for selection.
</Task>

!if [ -z "$ARGUMENTS" ]; then \
  echo "=== Recent Open Issues ==="; \
  echo ""; \
  gh issue list --state open --limit 10 --json number,title,author,createdAt,labels --jq '.[] | "\(.number)\t\(.createdAt[0:10])\t\(.author.login)\t\(.title[0:60])\(.title[60:] | if . != "" then "..." else "" end)\t\(if .labels then (.labels | map(.name) | join(", "))[0:30] else "" end)"' | awk 'BEGIN {printf "%-6s %-12s %-15s %-63s %s\n", "#", "Created", "Author", "Title", "Labels"; print "────── ──────────── ─────────────── ─────────────────────────────────────────────────────────────── ─────────"} {printf "%-6s %-12s %-15s %-63s %s\n", $1, $2, $3, $4, $5}'; \
  echo ""; \
  echo "Please specify an issue number from the list above."; \
  echo "Example: /g:gh:issue:plan 123"; \
  exit 0; \
fi

## 📊 Issue Analysis Phase

### Fetch Complete Issue Information

<Task>
Fetch the issue data from GitHub including all comments and metadata.
</Task>

!echo "Fetching detailed issue data from GitHub"; \
ISSUE_ARG="$ARGUMENTS"; \
if [[ "$ISSUE_ARG" =~ ^https://github.com/.*/issues/([0-9]+) ]]; then \
  ISSUE_NUM="${BASH_REMATCH[1]}"; \
elif [[ "$ISSUE_ARG" =~ ^#?([0-9]+)$ ]]; then \
  ISSUE_NUM="${BASH_REMATCH[1]}"; \
fi; \
echo "=== Fetching Issue Data for #$ISSUE_NUM ==="; \
gh issue view "$ISSUE_NUM" --json number,title,body,author,createdAt,updatedAt,labels,assignees,milestone,state,comments > /tmp/issue-$ISSUE_NUM.json 2>&1 || (echo "Failed to fetch issue #$ISSUE_NUM" && exit 1); \
echo "✓ Issue data fetched successfully"; \
echo "Title: $(jq -r '.title' /tmp/issue-$ISSUE_NUM.json)"; \
echo "Author: $(jq -r '.author.login' /tmp/issue-$ISSUE_NUM.json)"; \
echo "State: $(jq -r '.state' /tmp/issue-$ISSUE_NUM.json)"; \
echo "Comments: $(jq '.comments | length' /tmp/issue-$ISSUE_NUM.json)"; \
echo "Labels: $(jq -r '.labels | map(.name) | join(", ")' /tmp/issue-$ISSUE_NUM.json || echo "none")"

### Issue Content Analysis

<Task>
Analyze the issue content to extract requirements and understand the context.
I'll read the issue data and analyze:
1. The main issue description
2. All comments and discussions
3. Any linked issues or documentation
4. Technical requirements and constraints
</Task>

<Read>
/tmp/issue-$ISSUE_NUM.json
</Read>

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
</Task>

@CLAUDE/PlanWorkflow.md
@CLAUDE/Core/CodeStandards.md  
@CLAUDE/Core/TestingStandards.md
@CLAUDE/Tools/Commands.md
@CLAUDE/Tools/PHPStan.md

### Generate Plan Content

<Task>
Based on the issue analysis and project standards, I'll create a comprehensive plan that:
1. Follows the PlanWorkflow.md template structure
2. Breaks down the work into clear, actionable tasks
3. Includes all necessary documentation references
4. Has proper progress tracking with checkboxes
5. NEVER includes any time estimates or effort predictions
6. Focuses on WHAT needs to be done, not HOW LONG it will take
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

Do you want to create this plan? (yes/no)
</Task>

## 🔧 Plan File Creation

<Task>
Upon confirmation, create the plan file in CLAUDE/plan/ directory.
</Task>

!echo "Creating plan file"; \
ISSUE_NUM="[extracted from above]"; \
ISSUE_TITLE="[extracted and kebab-cased]"; \
PLAN_FILE="CLAUDE/plan/issue-${ISSUE_NUM}-${ISSUE_TITLE}.md"; \
if [ -f "$PLAN_FILE" ]; then \
  echo "WARNING: Plan file already exists: $PLAN_FILE"; \
  echo "Please remove or rename the existing file first"; \
  exit 1; \
fi; \
echo "✓ Plan file path validated: $PLAN_FILE"

<Write>
[Plan content will be written here based on the issue analysis]
</Write>

### Verify Plan Creation

!echo "Verifying plan file creation"; \
PLAN_FILE="[path from above]"; \
if [ -f "$PLAN_FILE" ]; then \
  echo "✓ Plan file created successfully"; \
  echo "Location: $PLAN_FILE"; \
  echo "Size: $(wc -l < "$PLAN_FILE") lines"; \
  echo ""; \
  echo "Tasks in plan:"; \
  grep -E "^(\[ \]|\[✓\]|\[⏳\])" "$PLAN_FILE" | head -10; \
else \
  echo "✗ Failed to create plan file"; \
  exit 1; \
fi

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

!if [ "$USER_WANTS_COMMIT_AND_COMMENT" = "yes" ]; then \
  echo "=== Executing Git Commit and GitHub Comment ==="; \
  PLAN_FILE="[path from above]"; \
  ISSUE_NUM="[number]"; \
  ISSUE_TITLE="[title]"; \
  set -e; \
  \
  echo "[1/2] Committing plan to git..."; \
  git add "$PLAN_FILE" && echo "✓ Plan file staged"; \
  git commit -m "Add plan for issue #${ISSUE_NUM}: ${ISSUE_TITLE}" && echo "✓ Commit created"; \
  git log --oneline -1; \
  \
  echo ""; \
  echo "[2/2] Posting comment to GitHub issue..."; \
  COMMENT="📋 **Plan Created**\n\nI've analyzed this issue and created a comprehensive plan following the project's workflow standards.\n\n**Plan Summary:**\n- Total tasks: [count]\n- Categories: [list]\n- Key areas: [areas]\n\n**Next Steps:**\n1. Review the plan for completeness\n2. Execute tasks following the progress tracking\n3. Update task status as work progresses\n\nPlan committed to repository: \`CLAUDE/plan/issue-${ISSUE_NUM}-${ISSUE_TITLE}.md\`\n\n*Plan generated without time estimates per project standards*"; \
  gh issue comment "$ISSUE_NUM" --body "$COMMENT" && echo "✓ Comment posted successfully" || echo "✗ Failed to post comment"; \
  echo ""; \
  echo "✓ Both actions completed successfully!"; \
else \
  echo "Skipping commit and GitHub comment"; \
fi

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