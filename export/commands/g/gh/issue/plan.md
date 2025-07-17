---
description: Creates a comprehensive plan from GitHub issue following project workflow standards
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - TodoWrite
  - LS
  - Glob
  - WebFetch
allowed-bash-commands:
  low-risk:
    - echo
    - printf
    - test
    - pwd
    - which
    - head
    - tail
    - find
    - mkdir
    - date
    - sed
    - grep
    - awk
    - cut
    - sort
    - wc
  medium-risk:
    - gh  # GitHub CLI for issue operations and auth checks
    - git  # Repository status checks
  high-risk:
    - gh  # Issue commenting (optional)
    - git  # Repository commits (optional)
---

# GitHub Issue to Plan Converter 📋

You are an expert software architect and project manager with deep knowledge of issue analysis, requirement extraction, and strategic planning. You excel at understanding complex technical issues, following discussion threads, and creating actionable plans that follow established workflows.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## 📖 Help Documentation

<Task>
First, check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " GH:ISSUE:PLAN - GitHub Issue to Plan Converter"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "Creates comprehensive plans from GitHub issues following project workflow"; \
echo "standards. Analyzes issue content, comments, and linked issues to generate"; \
echo "structured plans with tasks, research items, and progress tracking."; \
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
echo "FEATURES:"; \
echo "  • Extracts requirements from issue and comments"; \
echo "  • Creates structured plan following project standards"; \
echo "  • Generates task list with progress tracking"; \
echo "  • Links to relevant project documentation"; \
echo "  • Optional: Posts plan back to GitHub issue"; \
echo ""; \
echo "OUTPUT:"; \
echo "  • Creates plan file in CLAUDE/plan/issue-{number}.md"; \
echo "  • Includes task breakdown with [ ] checkboxes"; \
echo "  • References project standards and workflows"; \
echo ""; \
echo "PRECONDITIONS:"; \
echo "  • GitHub CLI (gh) installed and authenticated"; \
echo "  • In a git repository (for local issue references)"; \
echo "  • Project has CLAUDE directory structure"; \
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

### Input Validation and Processing

<Task>
Let me analyze the provided input: "$ARGUMENTS"

If no argument is provided, I'll show recent issues for easy selection.
If an argument is provided, I'll validate it as either:
- A numeric issue ID (e.g., "123")
- A full GitHub URL (e.g., "https://github.com/owner/repo/issues/123")

I'll then extract the issue number and proceed with analysis.
</Task>

### Issue Selection Interface

!echo "Listing recent GitHub issues for selection"; \
set -e; if [ -z "$ARGUMENTS" ]; then \
    echo "=== No issue specified. Showing recent open issues ==="; \
    echo ""; \
    gh issue list --state open --limit 10 --json number,title,author,createdAt,labels --jq '.[] | "\(.number)\t\(.createdAt[0:10])\t\(.author.login)\t\(.title[0:60])\(.title[60:] | if . != "" then "..." else "" end)\t\(if .labels then (.labels | map(.name) | join(", ")) else "" end)"' | awk 'BEGIN {printf "%-6s %-12s %-15s %-63s %s\n", "#", "Created", "Author", "Title", "Labels"; print "────── ──────────── ─────────────── ─────────────────────────────────────────────────────────────── ─────────"} {printf "%-6s %-12s %-15s %-63s %s\n", $1, $2, $3, $4, $5}'; \
    echo ""; \
fi

<Task>
If no argument was provided, I've shown the 10 most recent open issues above.

Please provide an issue number from the list above, or specify:
- An issue number (e.g., 123)
- A full GitHub URL (e.g., https://github.com/owner/repo/issues/123)

If an argument was provided, I'll validate it and proceed with the analysis.
</Task>

## 📊 Issue Analysis Phase

<Task>
Now I'll proceed with comprehensive issue analysis:

1. **Issue Data Extraction**: Fetch complete issue information including title, body, metadata, and all comments
2. **Link Discovery**: Identify and analyze all URLs mentioned in the issue thread
3. **Context Gathering**: Follow relevant links to gather additional context from documentation, code, or related issues
4. **Requirement Analysis**: Extract technical requirements, constraints, and stakeholder concerns
5. **Decision Tracking**: Note any agreements or decisions made in the discussion thread
</Task>

### Fetch Complete Issue Information

!echo "Fetching detailed issue data from GitHub"; \
set -e; if [ -n "$ARGUMENTS" ]; then \
    echo "=== Fetching Issue Data for #$ARGUMENTS ==="; \
    gh issue view "$ARGUMENTS" --json title,body,author,createdAt,updatedAt,labels,assignees,milestone,state,comments --jq '.'; \
fi

### Link Analysis and Context Gathering

<Task>
From the issue data, I'll:

1. **Extract all URLs** mentioned in the issue body and comments
2. **Categorize links** by type:
   - Documentation references
   - Code files or repositories
   - Related issues or pull requests
   - External resources or APIs
   - Design documents or specifications

3. **Follow relevant links** to gather additional context:
   - Read referenced documentation
   - Analyze mentioned code files
   - Review related issues for context
   - Examine external resources for requirements

4. **Synthesize findings** into a comprehensive understanding of the issue
</Task>

### Technical Requirements Extraction

<Task>
Based on the gathered information, I'll analyze:

1. **Core Problem**: What is the fundamental issue or feature request?
2. **Technical Constraints**: What limitations or requirements must be considered?
3. **Stakeholder Concerns**: What are the different perspectives and priorities?
4. **Success Criteria**: How will we know when this is resolved?
5. **Dependencies**: What other work or decisions does this depend on?
6. **Risks and Considerations**: What potential issues should be anticipated?
</Task>

## 📝 Plan Generation Phase

### Project Standards Integration

<Task>
I'll read the relevant project documentation to ensure the plan follows established standards:
</Task>

@CLAUDE/PlanWorkflow.md
@CLAUDE/Core/CodeStandards.md
@CLAUDE/Core/TestingStandards.md
@CLAUDE/Tools/Commands.md
@CLAUDE/Tools/PHPStan.md

### Plan Document Creation

<Task>
I'll generate a comprehensive plan document with:

1. **Filename**: `issue-{number}-{kebab-case-title}.md` in the CLAUDE/plan/ directory
2. **Structure**: Following the PlanWorkflow.md template with:
   - Required documentation references
   - Progress tracking section with checkboxes
   - Summary of the issue and requirements
   - Detailed breakdown of tasks and subtasks
   - Technical implementation notes
   - Testing requirements
   - Success criteria and validation steps

3. **Content Quality**: Ensuring the plan is:
   - Actionable with clear, specific tasks
   - Well-organized with logical task sequencing
   - Comprehensive covering all aspects of the issue
   - Aligned with project standards and workflows
   - Testable with clear validation criteria
</Task>

### Plan Preview and Validation

<Task>
Before creating the file, I'll show you a preview of the generated plan including:

- **Plan filename** and location
- **Task summary** (number of tasks and major categories)
- **Key requirements** extracted from the issue
- **Implementation approach** and major decisions
- **Testing strategy** and validation criteria
- **Estimated complexity** and potential risks

This preview allows you to review the plan before it's written to disk.
</Task>

## ⚠️ Plan Creation Confirmation

<Task>
I'll present the plan creation details:

**Plan Details:**
- **File**: `CLAUDE/plan/issue-{number}-{title}.md`
- **Based on**: Issue #{number} - {title}
- **Tasks**: {count} tasks across {categories} categories
- **Complexity**: {assessment}
- **Estimated effort**: {estimate}

**Plan Contents:**
- ✓ Requirements analysis and context
- ✓ Technical implementation tasks
- ✓ Testing and validation requirements
- ✓ Documentation and standards compliance
- ✓ Success criteria and acceptance tests

**Do you want to create this plan?** (yes/no)

Note: You can review and modify the plan after creation before executing it.
</Task>

## 🔧 Plan File Creation

<Task>
Upon confirmation, I'll:

1. **Create the plan file** in the CLAUDE/plan/ directory
2. **Validate the file** was created successfully
3. **Show the file path** and basic statistics
4. **Prepare for optional operations** (git commit, GitHub comment)

The plan will include all the standard elements from PlanWorkflow.md:
- Required documentation references at the top
- Progress section with task tracking
- Summary of the issue and goals
- Detailed implementation breakdown
- Testing and validation requirements
</Task>

## 📤 Optional Git Integration

<Task>
I'll ask if you want to commit the plan to the repository:

**Git Operations Available:**
- ✓ Add the plan file to git staging
- ✓ Create a descriptive commit message
- ✓ Show commit preview for approval
- ✓ Execute the commit

**Commit Details:**
- **Files**: `CLAUDE/plan/{filename}.md`
- **Message**: `"Add plan for issue #{number}: {title}"`
- **Impact**: New plan file tracked in repository

**Would you like to commit this plan?** (yes/no)
</Task>

## 💬 Optional GitHub Integration

<Task>
I'll offer to post a progress comment to the original GitHub issue:

**Comment Features:**
- ✓ Link to the committed plan (if committed)
- ✓ Summary of analysis findings
- ✓ High-level task breakdown
- ✓ Next steps and timeline
- ✓ Professional formatting

**Comment Preview:**
I'll show you exactly what will be posted before posting it.

**Would you like to post a progress comment to the issue?** (yes/no)

Note: This will be visible to all issue participants and cannot be easily undone.
</Task>

## ✅ Completion Summary

<Task>
I'll provide a comprehensive summary of what was accomplished:

**Actions Completed:**
- ✓ Issue #{number} analyzed and understood
- ✓ Plan created: `CLAUDE/plan/{filename}.md`
- ✓ Git operations: {status}
- ✓ GitHub updates: {status}

**Plan Details:**
- **Tasks**: {count} actionable items
- **Categories**: {list of major areas}
- **Next Steps**: Execute plan using PlanWorkflow.md process

**Recommendations:**
- Review the plan for completeness
- Execute tasks following the Progress section
- Run quality tools (allCs, allStatic) during implementation
- Update Progress section as tasks are completed

**Ready to Execute:**
To begin implementing this plan, use the execution workflow defined in PlanWorkflow.md.
</Task>

## 🚨 Error Recovery

If any operation fails:

**Common Issues and Solutions:**
- **Invalid issue number**: Verify the issue exists and is accessible
- **Authentication failure**: Run `gh auth login` to re-authenticate
- **Network connectivity**: Check internet connection and GitHub status
- **Permission errors**: Ensure you have access to the repository
- **File system issues**: Check disk space and directory permissions
- **Git conflicts**: Resolve any uncommitted changes before committing plan

**Recovery Actions:**
1. **Check preconditions**: Re-run environment validation
2. **Verify inputs**: Confirm issue number and repository access
3. **Retry operations**: Most failures are transient
4. **Manual fallback**: Create plan file manually if needed
5. **Report issues**: Document any persistent problems

## 💡 Advanced Usage

### Batch Planning
Process multiple issues by running the command multiple times:
```bash
/gh:issue:plan 123
/gh:issue:plan 124
/gh:issue:plan 125
```

### Integration with Existing Plans
- **Related issues**: Plans can reference each other
- **Dependencies**: Note cross-plan dependencies in the summary
- **Coordination**: Use consistent naming and structure

### Customization Options
- **Plan templates**: Modify PlanWorkflow.md to customize plan structure
- **Naming conventions**: Adjust filename format as needed
- **Integration points**: Extend with project-specific requirements

### Performance Optimization
- **Link following**: Automatically limited to prevent infinite loops
- **Context gathering**: Prioritizes most relevant information
- **Plan generation**: Optimized for actionable, specific tasks

---
*This command creates production-ready plans that integrate seamlessly with your project workflow*