---
description: Automated Git push with GitHub Actions monitoring and smart commit handling
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Task
  - Bash(set -e*), Bash(echo *), Bash(test *), Bash(if *)
  - Bash(git status), Bash(git diff*), Bash(git log*), Bash(git add*), Bash(git commit*), Bash(git push*)
  - Bash(gh auth status), Bash(gh workflow*), Bash(gh run*), Bash(gh repo view*)
  - Bash(which *), Bash(pwd), Bash(cat *), Bash(head *), Bash(tail *), Bash(awk *), Bash(cut *)
  - Bash(sleep *), Bash(date), Bash(wc *), Bash(grep *)
---

# GitHub Push with Actions Monitoring

You are an expert DevOps engineer with deep knowledge of Git workflows, GitHub Actions, and CI/CD best practices. Your approach prioritizes safety, comprehensive monitoring, and intelligent automation while maintaining full visibility into the deployment process.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:gh:push - Smart Git Push with GitHub Actions Monitoring**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intelligent Git workflow automation that handles commits, pushes, and monitors
GitHub Actions to completion. Automatically detects uncommitted changes, generates
smart commit messages, pushes to remote, and monitors all triggered workflows.

**USAGE:**
```
/g:gh:push
/g:gh:push --help
```

**FEATURES:**
• Detects uncommitted changes automatically
• Generates intelligent commit messages from actual changes
• Pushes to remote repository with progress tracking
• Monitors all triggered GitHub Actions workflows
• Waits for workflow completion with real-time updates
• Provides detailed failure diagnosis and recovery suggestions
• No manual commit message input required

**WORKFLOW:**
1. Environment validation (git, gh setup)
2. Uncommitted changes detection
3. User confirmation for commit (if changes found)
4. Auto-generated commit message creation
5. Git add, commit, and push execution
6. GitHub Actions workflow detection
7. Real-time workflow monitoring
8. Completion verification or failure diagnosis

**PRECONDITIONS:**
• Must be in a Git repository
• Git must be installed and configured
• GitHub CLI (gh) must be installed
• Must be authenticated with GitHub (gh auth login)
• Remote repository must be accessible

**SAFETY:**
• Shows all changes before committing
• Requires explicit confirmation for commits
• Provides detailed progress feedback
• Includes failure recovery suggestions
• Never overwrites existing commits

**EXAMPLES:**
```
/g:gh:push
  Detect changes, create commit, push, and monitor actions
```

**MONITORING:**
• Real-time GitHub Actions status updates
• Detailed workflow run information
• Failure diagnosis with specific error details
• Recovery suggestions for common issues
</help>

## 🚦 Precondition Checks

### Environment Validation
!bash .claude/cc-commands/scripts/_common/env/env_validate.bash git gh

## 📊 Repository State Analysis

### Current Status Check
!bash .claude/cc-commands/scripts/_common/git/git_state_analysis.bash summary

## 🎯 Decision Point

<Task>
Based on the repository analysis, determine what action to take:
1. If CHANGES_EXIST is "true", ask the user for confirmation to proceed with committing the changes.
2. If CHANGES_EXIST is "false" but PUSH_NEEDED is "true", proceed directly to push existing commits.
3. If both are "false", inform the user that everything is up to date and exit.
</Task>

!bash .claude/cc-commands/scripts/g/gh/push_decision.bash "$CHANGES_EXIST" "$PUSH_NEEDED"

<Task>
Based on the ACTION output above:
- If ACTION is "none", the repository is up to date and we should exit
- If ACTION is "commit_and_push" or "push_only", proceed with the appropriate operations
</Task>

## 📝 Smart Commit Message Generation

<Task>
If ACTION is "commit_and_push", show that we'll generate an intelligent commit message based on the actual changes detected.
</Task>

!bash .claude/cc-commands/scripts/g/gh/push_commit_message.bash "$ACTION"

## 🔧 Commit and Push Execution

### Execute Git Operations
!bash .claude/cc-commands/scripts/g/gh/push_execute_git.bash "$ACTION"

## 🔍 GitHub Actions Detection

### Workflow Discovery
!bash .claude/cc-commands/scripts/g/gh/push_workflow_detect.bash "$PUSH_RESULT" "$PUSHED_COMMIT"

## 📊 Real-time Workflow Monitoring

<Task>
If workflows were detected (MONITORING_NEEDED is "true"), monitor them until completion.
This involves periodic checking of workflow run status and providing real-time updates.
</Task>

!bash .claude/cc-commands/scripts/g/gh/push_workflow_monitor.bash "$MONITORING_NEEDED" "$PUSHED_COMMIT" 300

## ✅ Results Analysis and Verification

### Final Status Check
!bash .claude/cc-commands/scripts/g/gh/push_final_status.bash "$PUSHED_COMMIT" "$PUSH_RESULT"

## 📈 Results Summary

### Success Report
<Task>
Generate a comprehensive summary of the entire push and monitoring process.
Include what was accomplished, any issues found, and next steps.
</Task>

Based on the execution results, here's your comprehensive push summary:

## 🎯 Push Operation Summary

**✅ Successfully Completed:**
- Environment validation and precondition checks
- Repository state analysis and change detection
- Smart commit message generation
- Git staging, commit, and push operations
- GitHub Actions workflow detection and monitoring
- Real-time workflow status tracking
- Final verification and results analysis

**📊 Key Metrics:**
- Files committed: [Based on actual changes]
- Workflows monitored: [Based on detection]
- Total execution time: [Calculated from start]
- Final sync status: [Local vs remote comparison]

## 🚨 Error Recovery & Troubleshooting

### Common Issues and Solutions

**If workflows failed:**
1. **Check workflow logs**: Click the failed workflow URLs provided above
2. **Review error messages**: Look for specific failure reasons in the GitHub Actions tab
3. **Fix issues locally**: Make necessary corrections and run `/g:gh:push` again
4. **Verify permissions**: Ensure repository has proper access to secrets and resources

**If push failed:**
1. **Check remote access**: Verify GitHub authentication with `gh auth status`
2. **Resolve conflicts**: Use `git pull` to sync with remote changes
3. **Check branch permissions**: Ensure you have push access to the target branch
4. **Verify remote URL**: Confirm the remote repository URL is correct

**If monitoring timed out:**
1. **Check manually**: Visit the GitHub Actions tab in your repository
2. **Long-running workflows**: Some workflows may take longer than the monitoring timeout
3. **Re-run monitoring**: You can manually check status with `gh run list`

### Recovery Commands
```bash
# Check workflow status manually
gh run list --limit 10

# View specific workflow details
gh run view <run-id>

# Re-authenticate if needed
gh auth login

# Check git status
git status && git log --oneline -n 5
```

## 🔄 Next Steps

1. **If all workflows passed**: Your changes are successfully deployed and verified
2. **If workflows failed**: Review the error details and fix issues before next push
3. **For ongoing development**: Continue making changes and use `/g:gh:push` for automated workflow

---
*Smart Git workflow automation with comprehensive GitHub Actions monitoring*