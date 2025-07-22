# g:gh:issue:plan - GitHub Issue to Plan Converter

## Overview

The `g:gh:issue:plan` command creates comprehensive project plans from GitHub issues, following project workflow standards. It analyzes issue content, comments, and linked issues to generate structured plans with task breakdowns, never including time estimates.

## High-Level Purpose

Converts GitHub issues into actionable project plans by:
- Extracting requirements from issues and discussion threads
- Following project-specific workflow standards (PlanWorkflow.md)
- Creating task lists with progress tracking
- Detecting bug issues and applying test-driven approach
- Committing plans and posting GitHub comments
- Maintaining focus on what needs to be done (not how long)

## Workflow in Terse Pseudocode

```pseudocode
// Phase 1: Analysis (orchestrator mode=analyze)
IF arguments == "--help" THEN
    DISPLAY help documentation
    EXIT
END IF

RUN plan_orchestrate.bash analyze "$ARGUMENTS"
    -> pre/env_validate.bash: Check environment
    -> analysis/arg_parse.bash: Parse issue URL/number
    -> analysis/list_issues.bash: List recent issues (if interactive)
    -> analysis/issue_fetch.bash: Fetch issue data from GitHub
    -> OUTPUT: Issue data, mode, file paths

IF NO_ISSUE_SELECTED THEN
    WAIT for user to select from list
    RE-RUN with selected issue
END IF

// Phase 2: Issue Analysis (Claude-driven)
READ issue body and comments from temp files
ANALYZE issue type:
    IF bug indicators THEN
        SET bug_fix_mode = true
        FORM hypothesis about cause
    END IF
EXTRACT requirements and context
IDENTIFY related issues and URLs

// Phase 3: Plan Generation (Claude-driven)
SEARCH for project documentation:
    - PlanWorkflow.md (takes precedence)
    - CLAUDE/ documentation
    - Project standards
    
GENERATE plan content:
    - Task breakdown with [ ] checkboxes
    - Reference project documentation
    - For bugs: Test-first approach
    - NO time estimates
    - GitHub comment tasks

SHOW plan preview
REQUEST confirmation

// Phase 4: Execution (orchestrator mode=execute)
IF confirmed THEN
    RUN plan_orchestrate.bash execute "$ISSUE_NUMBER" "$ISSUE_TITLE"
        -> execute/path_validate.bash: Create plan file path
        -> OUTPUT: PLAN_FILE_PATH
    
    WRITE plan content to file
END IF

// Phase 5: Commit and Comment (orchestrator mode=commit)
ASK "Commit plan and add comment to issue?"
IF yes THEN
    RUN plan_orchestrate.bash commit "$PLAN_FILE_PATH" "$ISSUE_NUMBER"
        -> post/verify.bash: Verify plan created
        -> post/commit_comment.bash: Git commit and GitHub comment
        -> OUTPUT: Commit and comment status
END IF

// Phase 6: Execution Prompt (Claude-driven)
ASK "Would you like to execute the plan now?"
PROVIDE guidance based on response
```

## Scripts Involved and Their Roles

### Main Command File
- **Path**: `export/commands/g/gh/issue/plan.md`
- **Role**: Issue analysis, plan generation, user interaction
- **Calls**: `plan_orchestrate.bash` with different modes

### Orchestrator Script
- **Path**: `scripts/g/gh/issue/plan/plan_orchestrate.bash`
- **Role**: Coordinates all operations across three phases
- **Modes**:
  - `analyze`: Parse arguments, fetch issue data
  - `execute`: Create plan file path
  - `commit`: Commit to git and post GitHub comment
  - `full`: Run all phases (default)

### Sub-Scripts

#### Pre-condition Scripts
- **pre/env_validate.bash**
  - Validates GitHub CLI authentication
  - Checks git repository
  - Verifies CLAUDE directory exists
  - Outputs: `ENV_VALID`, `CLAUDE_DIR_EXISTS`

#### Analysis Scripts
- **analysis/arg_parse.bash**
  - Parses issue URL or number
  - Determines operation mode
  - Handles various formats (#123, repo#123, full URL)
  - Outputs: `MODE`, `PARSED_ISSUE_NUMBER`, `PARSED_ISSUE_REFERENCE`

- **analysis/list_issues.bash**
  - Lists recent open issues
  - Used in interactive mode
  - Shows issue number, title, labels
  - Outputs: Issue list for selection

- **analysis/issue_fetch.bash**
  - Fetches comprehensive issue data
  - Gets issue body, comments, metadata
  - Saves to temp files
  - Outputs: `ISSUE_NUMBER`, `ISSUE_TITLE`, `ISSUE_BODY_FILE`, `ISSUE_COMMENTS_FILE`

#### Execution Scripts
- **execute/path_validate.bash**
  - Creates plan file path
  - Handles kebab-case conversion
  - Ensures CLAUDE/plan directory exists
  - Outputs: `PLAN_FILE_PATH`

#### Post Scripts
- **post/verify.bash**
  - Verifies plan file was created
  - Checks file content
  - Outputs: `PLAN_CREATED`

- **post/commit_comment.bash**
  - Commits plan to git
  - Posts summary comment to GitHub
  - Includes task count
  - Outputs: `COMMIT_SUCCESS`, `COMMENT_SUCCESS`

## Data Flow (KEY=value outputs)

### Analysis Phase Outputs
```
MODE=interactive|url|number|invalid
PARSED_ISSUE_NUMBER=123
PARSED_ISSUE_REFERENCE=owner/repo#123
ISSUE_NUMBER=123
ISSUE_TITLE=Issue title
ISSUE_BODY_FILE=/path/to/temp/body
ISSUE_COMMENTS_FILE=/path/to/temp/comments
ISSUE_LABELS=bug,enhancement
ISSUE_STATE=open
```

### Execution Phase Outputs
```
PLAN_FILE_PATH=CLAUDE/plan/issue-123-kebab-title.md
PLAN_DIR_EXISTS=true
```

### Commit Phase Outputs
```
PLAN_CREATED=true
COMMIT_SUCCESS=true
COMMENT_SUCCESS=true
COMMIT_HASH=abc123
```

## Error Handling Patterns

1. **Authentication Failures**
   - GitHub CLI not authenticated
   - Clear instructions to run `gh auth login`

2. **Issue Access Problems**
   - Invalid issue number
   - Private repository access
   - Network failures

3. **Git Issues**
   - Uncommitted changes blocking commit
   - Remote push failures

4. **File Conflicts**
   - Existing plan file
   - Directory creation failures

## User Interaction Points

1. **Help Request**
   - Check for `--help` argument
   - Display comprehensive documentation

2. **Issue Selection**
   - Interactive mode shows recent issues
   - User selects from numbered list

3. **Plan Preview**
   - Shows plan structure before creation
   - Confirmation required

4. **Commit Decision**
   - "Commit plan and add comment?"
   - Optional workflow step

5. **Execution Prompt**
   - "Execute the plan now?"
   - Provides next steps

## Bugs and Quirks

### **(quirk:)** Three-Phase Orchestration
The orchestrator has three separate modes (analyze, execute, commit) rather than two like other commands. This allows for more granular control but adds complexity.

### **(bug:)** Task Count Limitation
The task counter only looks for `- [ ]` patterns, missing other valid checkbox formats like `* [ ]` or indented tasks.

### **(quirk:)** Issue Reference Formats
Supports multiple formats (URL, repo#num, #num) which is flexible but can be confusing for parsing.

### **(quirk:)** Plan File Naming
Uses kebab-case conversion which might create long filenames for verbose issue titles.

### **(bug:)** No Plan Update Support
If a plan already exists for an issue, there's no update mechanism - it just fails.

## TypeScript Migration Considerations

### Input/Output Specifications
- **Inputs**: Issue URL/number, interactive selection
- **Outputs**: Plan file, git commit, GitHub comment

### State Management Requirements
- Issue metadata across phases
- Temporary file management
- Plan creation status
- Multiple operation modes

### External Service Dependencies
- GitHub API (via gh CLI)
- Git operations
- File system
- Network for API calls

### Performance Characteristics
- API calls can be slow (1-3 seconds)
- Multiple sequential operations
- Three orchestrator calls

### Testing Considerations
- Mock GitHub API responses
- Test various issue formats
- Verify plan generation logic
- Test bug detection
- Ensure project doc discovery works

## Pattern Contributions

This command demonstrates:
1. **Three-phase orchestration** - Analyze, execute, commit
2. **External API integration** - GitHub issue fetching
3. **Interactive selection** - Numbered list selection
4. **Document discovery** - Finding project standards
5. **Bug-specific workflow** - Test-driven approach for bugs
6. **Multi-step confirmation** - Commit, comment, execute