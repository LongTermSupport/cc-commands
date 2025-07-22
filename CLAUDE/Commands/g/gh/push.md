# g:gh:push

## Overview
Intelligent git push with GitHub Actions monitoring. Analyzes repository state, makes smart decisions about commits/pushes, and monitors triggered workflows.

## Orchestrator Pattern
- **Location**: `scripts/g/gh/push/push_orchestrate.bash`
- **Modes**: `analyze`, `execute`
- **Bash Calls**: 2 (reduced from potential 8-10)

## Workflow Phases

### Phase 1: Analysis
1. **Environment Validation** (`_common/env/env_validate.bash`)
   - Validates git and gh tools
   
2. **Repository State** (`_common/git/git_state_analysis.bash`)
   - Gets CHANGES_EXIST, PUSH_NEEDED
   
3. **Decision Analysis** (`analysis/decision.bash`)
   - Determines ACTION (none, push_only, commit_and_push)
   
4. **Commit Message Prep** (`analysis/commit_message.bash`)
   - Only if ACTION=commit_and_push
   - Sets COMMIT_MESSAGE_NEEDED=true

### Phase 2: Execution
1. **Git Operations** (`execute/execute_git.bash`)
   - Performs commit and/or push based on action
   - Returns PUSH_RESULT, PUSHED_COMMIT
   
2. **Workflow Detection** (`monitor/push_workflow_detect.bash`)
   - Detects triggered GitHub Actions
   - Sets MONITORING_NEEDED
   
3. **Workflow Monitoring** (`monitor/push_workflow_monitor.bash`)
   - Monitors workflows for up to 300 seconds
   - Only runs if MONITORING_NEEDED=true
   
4. **Final Status** (`post/final_status.bash`)
   - Reports final workflow statuses

## KEY=value Outputs
```
# Analysis Phase
ACTION_REQUIRED=commit_and_push|push_only|none
CHANGES_EXIST=true|false
PUSH_NEEDED=true|false  
COMMIT_MESSAGE_NEEDED=true|false

# Execution Phase
FINAL_RESULT=success|failed|none
WORKFLOWS_MONITORED=true|false
PUSH_RESULT=success|failed
PUSHED_COMMIT=<sha>
MONITORING_NEEDED=true|false
```

## Command Structure
```markdown
# Step 1: Analysis
!bash push_orchestrate.bash analyze

<Task>
Based on ACTION_REQUIRED:
- If "commit_and_push": Generate commit message
- If "push_only": Prepare to push
- If "none": Inform user no action needed
</Task>

# Step 2: Execute (if needed)
!bash push_orchestrate.bash execute "$ACTION" "$COMMIT_MESSAGE"
```

## Bugs
**(bug: workflow monitoring timeout)** - Hard-coded 300 second timeout may not be sufficient for long-running workflows

**(bug: error propagation)** - Workflow detection/monitoring failures only warn, don't stop execution

## Quirks
**(quirk: two-parameter execute)** - Execute mode requires action as first param, commit message as second (even if empty)

**(quirk: silent workflow failures)** - Workflow monitoring failures are warnings, command still reports success if push worked

**(quirk: no branch selection)** - Always pushes current branch, no option to specify target

## Patterns Used
- Orchestrator pattern with two-phase workflow
- Conditional execution based on analysis results  
- External API monitoring (GitHub Actions)
- Progressive disclosure (only monitors if workflows detected)
- Graceful degradation (continues on monitoring failures)

## Dependencies
- git (for repository operations)
- gh CLI (for GitHub Actions monitoring)
- Common scripts for environment/git operations

## Terse Pseudocode
```
analyze:
  validate_environment(git, gh)
  state = analyze_repository()
  action = decide_action(state.changes, state.push_needed)
  if action == commit_and_push:
    prepare_commit_message()
  return action_summary

execute(action, message):
  if action != none:
    result = execute_git_operations(action, message)
    if result.success:
      workflows = detect_workflows(result.commit)
      if workflows.found:
        monitor_workflows(workflows, timeout=300)
      check_final_status(result.commit)
  return execution_summary
```