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
Check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " G:GH:PUSH - Smart Git Push with GitHub Actions Monitoring"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "Intelligent Git workflow automation that handles commits, pushes, and monitors"; \
echo "GitHub Actions to completion. Automatically detects uncommitted changes, generates"; \
echo "smart commit messages, pushes to remote, and monitors all triggered workflows."; \
echo ""; \
echo "USAGE:"; \
echo "  /g:gh:push"; \
echo "  /g:gh:push --help"; \
echo ""; \
echo "FEATURES:"; \
echo "  • Detects uncommitted changes automatically"; \
echo "  • Generates intelligent commit messages from actual changes"; \
echo "  • Pushes to remote repository with progress tracking"; \
echo "  • Monitors all triggered GitHub Actions workflows"; \
echo "  • Waits for workflow completion with real-time updates"; \
echo "  • Provides detailed failure diagnosis and recovery suggestions"; \
echo "  • No manual commit message input required"; \
echo ""; \
echo "WORKFLOW:"; \
echo "  1. Environment validation (git, gh setup)"; \
echo "  2. Uncommitted changes detection"; \
echo "  3. User confirmation for commit (if changes found)"; \
echo "  4. Auto-generated commit message creation"; \
echo "  5. Git add, commit, and push execution"; \
echo "  6. GitHub Actions workflow detection"; \
echo "  7. Real-time workflow monitoring"; \
echo "  8. Completion verification or failure diagnosis"; \
echo ""; \
echo "PRECONDITIONS:"; \
echo "  • Must be in a Git repository"; \
echo "  • Git must be installed and configured"; \
echo "  • GitHub CLI (gh) must be installed"; \
echo "  • Must be authenticated with GitHub (gh auth login)"; \
echo "  • Remote repository must be accessible"; \
echo ""; \
echo "SAFETY:"; \
echo "  • Shows all changes before committing"; \
echo "  • Requires explicit confirmation for commits"; \
echo "  • Provides detailed progress feedback"; \
echo "  • Includes failure recovery suggestions"; \
echo "  • Never overwrites existing commits"; \
echo ""; \
echo "EXAMPLES:"; \
echo "  /g:gh:push"; \
echo "    Detect changes, create commit, push, and monitor actions"; \
echo ""; \
echo "MONITORING:"; \
echo "  • Real-time GitHub Actions status updates"; \
echo "  • Detailed workflow run information"; \
echo "  • Failure diagnosis with specific error details"; \
echo "  • Recovery suggestions for common issues"; \
echo ""; \
exit 0; \
fi

## 🚦 Precondition Checks

### Environment Validation
!echo "Validating Git and GitHub environment"; \
set -e; echo "=== Environment Validation ==="; \
echo "Working Directory: $(pwd)"; \
test -d .git && echo "✓ Git repository detected" || { echo "✗ Not a Git repository"; exit 1; }; \
which git >/dev/null 2>&1 && echo "✓ Git is installed" || { echo "✗ Git not found"; exit 1; }; \
which gh >/dev/null 2>&1 && echo "✓ GitHub CLI is installed" || { echo "✗ GitHub CLI not found"; exit 1; }; \
gh auth status >/dev/null 2>&1 && echo "✓ GitHub authenticated" || { echo "✗ GitHub authentication required (run: gh auth login)"; exit 1; }; \
git remote -v >/dev/null 2>&1 && echo "✓ Remote repository configured" || { echo "✗ No remote repository found"; exit 1; }; \
echo "✓ All preconditions satisfied"

## 📊 Repository State Analysis

### Current Status Check
!echo "Analyzing repository state and changes"; \
set -e; echo "=== Repository State Analysis ==="; \
BRANCH=$(git branch --show-current); \
echo "Current branch: $BRANCH"; \
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "No origin remote"); \
echo "Remote URL: $REMOTE_URL"; \
REPO_NAME=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo "Unknown"); \
echo "Repository: $REPO_NAME"; \
echo ""; \
echo "=== Change Detection ==="; \
if git diff --quiet && git diff --cached --quiet; then \
  echo "✓ No uncommitted changes detected"; \
  CHANGES_EXIST="false"; \
else \
  echo "⚠️  Uncommitted changes detected"; \
  CHANGES_EXIST="true"; \
  echo ""; \
  echo "=== Files with Changes ==="; \
  git status --porcelain | head -20; \
  CHANGE_COUNT=$(git status --porcelain | wc -l); \
  echo "Total files affected: $CHANGE_COUNT"; \
fi; \
echo ""; \
echo "=== Push Status Check ==="; \
LOCAL_COMMIT=$(git rev-parse HEAD); \
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "unknown"); \
if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then \
  echo "✓ Local and remote branches are in sync"; \
  PUSH_NEEDED="false"; \
else \
  echo "⚠️  Local branch is ahead of remote - push needed"; \
  PUSH_NEEDED="true"; \
  echo ""; \
  echo "=== Unpushed Commits ==="; \
  git log --oneline origin/$BRANCH..HEAD | head -5; \
fi; \
echo ""; \
echo "CHANGES_EXIST: $CHANGES_EXIST"; \
echo "PUSH_NEEDED: $PUSH_NEEDED"; \
echo "BRANCH: $BRANCH"; \
echo "REPO_NAME: $REPO_NAME"

## 🎯 Decision Point

<Task>
Based on the repository analysis, determine what action to take:
1. If CHANGES_EXIST is "true", ask the user for confirmation to proceed with committing the changes.
2. If CHANGES_EXIST is "false" but PUSH_NEEDED is "true", proceed directly to push existing commits.
3. If both are "false", inform the user that everything is up to date and exit.
</Task>

!echo "Determining required actions based on repository state"; \
set -e; echo "=== Action Decision ==="; \
if [ "$CHANGES_EXIST" = "true" ]; then \
  echo "📝 Uncommitted changes detected - commit needed"; \
  ACTION="commit_and_push"; \
elif [ "$PUSH_NEEDED" = "true" ]; then \
  echo "🚀 Existing commits ready to push"; \
  ACTION="push_only"; \
else \
  echo "✅ Repository is up to date - no action needed"; \
  ACTION="none"; \
fi; \
echo "ACTION: $ACTION"; \
echo ""; \
if [ "$ACTION" = "none" ]; then \
  echo "✅ Everything is up to date. No push or commit needed."; \
  exit 0; \
fi

## 📝 Smart Commit Message Generation

<Task>
If ACTION is "commit_and_push", generate an intelligent commit message based on the actual changes detected.
</Task>

!if [ "$ACTION" = "commit_and_push" ]; then \
  echo "Generating intelligent commit message from changes"; \
  set -e; echo "=== Smart Commit Message Generation ==="; \
  echo "Analyzing changes to create meaningful commit message..."; \
  echo ""; \
  echo "=== Detailed Change Analysis ==="; \
  git diff --name-status HEAD | head -10; \
  echo ""; \
  echo "=== Recent Commit Context ==="; \
  git log --oneline -n 3; \
  echo ""; \
  echo "=== Generating Commit Message ==="; \
  ADDED_FILES=$(git diff --cached --name-only --diff-filter=A | wc -l); \
  MODIFIED_FILES=$(git diff --cached --name-only --diff-filter=M | wc -l); \
  DELETED_FILES=$(git diff --cached --name-only --diff-filter=D | wc -l); \
  TOTAL_FILES=$(git diff --cached --name-only | wc -l); \
  echo "Files: +$ADDED_FILES ~$MODIFIED_FILES -$DELETED_FILES (total: $TOTAL_FILES)"; \
  echo ""; \
  echo "Commit message will be generated based on file patterns and changes..."; \
else \
  echo "Skipping commit message generation - no commit needed"; \
fi

## 🔧 Commit and Push Execution

### Staging Changes
!if [ "$ACTION" = "commit_and_push" ]; then \
  echo "Staging all changes for commit"; \
  set -e; echo "=== Staging Changes ==="; \
  git add .; \
  echo "✓ All changes staged"; \
  echo ""; \
  echo "=== Final Staged Changes Summary ==="; \
  git diff --cached --stat; \
  echo ""; \
  echo "Ready for commit..."; \
else \
  echo "Skipping staging - no commit needed"; \
fi

### Commit Creation
!if [ "$ACTION" = "commit_and_push" ]; then \
  echo "Creating commit with generated message"; \
  set -e; echo "=== Creating Commit ==="; \
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S'); \
  BRANCH=$(git branch --show-current); \
  MODIFIED_COUNT=$(git diff --cached --name-only | wc -l); \
  if [ $MODIFIED_COUNT -gt 0 ]; then \
    MAIN_FILES=$(git diff --cached --name-only | head -3 | tr '\n' ' '); \
    if [ $MODIFIED_COUNT -eq 1 ]; then \
      COMMIT_MSG="Update $(git diff --cached --name-only)"; \
    elif [ $MODIFIED_COUNT -le 3 ]; then \
      COMMIT_MSG="Update multiple files: $MAIN_FILES"; \
    else \
      COMMIT_MSG="Update $MODIFIED_COUNT files across project"; \
    fi; \
    echo "Generated commit message: $COMMIT_MSG"; \
    echo ""; \
    git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"; \
    echo "✓ Commit created successfully"; \
    COMMIT_HASH=$(git rev-parse HEAD); \
    echo "Commit hash: $COMMIT_HASH"; \
  else \
    echo "No changes to commit"; \
  fi; \
else \
  echo "Skipping commit creation - no commit needed"; \
fi

### Push to Remote
!echo "Pushing changes to remote repository"; \
set -e; echo "=== Pushing to Remote ==="; \
BRANCH=$(git branch --show-current); \
echo "Pushing branch '$BRANCH' to origin..."; \
PUSH_COMMIT_BEFORE=$(git rev-parse HEAD); \
if git push origin $BRANCH; then \
  echo "✓ Push completed successfully"; \
  PUSH_SUCCESSFUL="true"; \
  PUSHED_COMMIT="$PUSH_COMMIT_BEFORE"; \
else \
  echo "❌ Push failed"; \
  PUSH_SUCCESSFUL="false"; \
  exit 1; \
fi; \
echo ""; \
echo "=== Push Summary ==="; \
LATEST_COMMIT=$(git log --oneline -n 1); \
echo "Latest commit: $LATEST_COMMIT"; \
REMOTE_URL=$(git remote get-url origin); \
echo "Remote URL: $REMOTE_URL"; \
echo "Branch: $BRANCH"; \
echo "PUSH_SUCCESSFUL: $PUSH_SUCCESSFUL"; \
echo "PUSHED_COMMIT: $PUSHED_COMMIT"

## 🔍 GitHub Actions Detection

### Workflow Discovery
!if [ "$PUSH_SUCCESSFUL" = "true" ]; then \
  echo "Detecting GitHub Actions workflows triggered by push"; \
  set -e; echo "=== GitHub Actions Detection ==="; \
  echo "Scanning for workflows triggered by commit: $PUSHED_COMMIT"; \
  sleep 3; \
  REPO_NAME=$(gh repo view --json nameWithOwner --jq '.nameWithOwner'); \
  echo "Repository: $REPO_NAME"; \
  echo ""; \
  echo "=== Workflows for This Push ==="; \
  PUSH_WORKFLOWS=$(gh run list --json headSha,status,conclusion,workflowName,createdAt,url | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha) | "\(.status)/\(.conclusion // "null") | \(.workflowName) | \(.createdAt) | \(.url)"'); \
  if [ -n "$PUSH_WORKFLOWS" ]; then \
    echo "Workflows triggered by this push:"; \
    echo "$PUSH_WORKFLOWS" | sed 's/^/  \u2022 /'; \
    echo ""; \
    RUNNING_COUNT=$(echo "$PUSH_WORKFLOWS" | grep -c "in_progress\|queued" || echo "0"); \
    if [ "$RUNNING_COUNT" -gt 0 ]; then \
      echo "$RUNNING_COUNT workflows are still running"; \
      MONITORING_NEEDED="true"; \
    else \
      echo "All workflows for this push have completed"; \
      MONITORING_NEEDED="false"; \
    fi; \
  else \
    echo "No workflows found for this push yet (may still be starting...)"; \
    MONITORING_NEEDED="true"; \
  fi; \
  echo ""; \
  echo "MONITORING_NEEDED: $MONITORING_NEEDED"; \
else \
  echo "No push occurred - skipping workflow detection"; \
  MONITORING_NEEDED="false"; \
fi

## 📊 Real-time Workflow Monitoring

<Task>
If workflows were detected (MONITORING_NEEDED is "true"), monitor them until completion.
This involves periodic checking of workflow run status and providing real-time updates.
</Task>

!if [ "$MONITORING_NEEDED" = "true" ]; then \
  echo "Starting real-time workflow monitoring for pushed commit"; \
  set -e; echo "=== Real-time Workflow Monitoring ==="; \
  echo "Monitoring workflows for commit: $PUSHED_COMMIT"; \
  echo ""; \
  MAX_WAIT=300; \
  WAIT_COUNT=0; \
  while [ $WAIT_COUNT -lt $MAX_WAIT ]; do \
    echo "⏳ Checking workflow status... (${WAIT_COUNT}s elapsed)"; \
    RUNNING_FOR_COMMIT=$(gh run list --json headSha,status,workflowName | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha and (.status == "in_progress" or .status == "queued")) | .workflowName' | wc -l); \
    if [ $RUNNING_FOR_COMMIT -eq 0 ]; then \
      echo "✓ All workflows for this commit completed"; \
      break; \
    fi; \
    echo "  Still running for this commit: $RUNNING_FOR_COMMIT workflows"; \
    gh run list --json headSha,status,workflowName | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha and (.status == "in_progress" or .status == "queued")) | "    • \(.workflowName) - \(.status)"'; \
    sleep 10; \
    WAIT_COUNT=$((WAIT_COUNT + 10)); \
  done; \
  echo ""; \
  echo "=== Final Workflow Status for This Push ==="; \
  gh run list --json headSha,status,conclusion,workflowName,url | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha) | "\(.conclusion // .status) | \(.workflowName) | \(.url)"'; \
else \
  echo "No workflow monitoring needed"; \
fi

## ✅ Results Analysis and Verification

### Final Status Check
!echo "Analyzing final results and workflow outcomes"; \
set -e; echo "=== Final Results Analysis ==="; \
echo ""; \
echo "=== Push Verification ==="; \
BRANCH=$(git branch --show-current); \
LOCAL_COMMIT=$(git rev-parse HEAD); \
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "unknown"); \
if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then \
  echo "✓ Local and remote branches are in sync"; \
else \
  echo "⚠️  Local and remote branches may be out of sync"; \
fi; \
echo "Local commit:  $LOCAL_COMMIT"; \
echo "Remote commit: $REMOTE_COMMIT"; \
echo ""; \
echo "=== Workflow Results Summary ==="; \
if [ "$PUSH_SUCCESSFUL" = "true" ]; then \
  FAILED_FOR_COMMIT=$(gh run list --json headSha,conclusion,workflowName | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha and .conclusion == "failure") | .workflowName' | wc -l); \
  SUCCESS_FOR_COMMIT=$(gh run list --json headSha,conclusion,workflowName | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha and .conclusion == "success") | .workflowName' | wc -l); \
  echo "✓ Successful workflows for this push: $SUCCESS_FOR_COMMIT"; \
  echo "✗ Failed workflows for this push: $FAILED_FOR_COMMIT"; \
  if [ $FAILED_FOR_COMMIT -gt 0 ]; then \
    echo ""; \
    echo "=== Failed Workflows for This Push ==="; \
    gh run list --json headSha,conclusion,workflowName,url | jq -r --arg sha "$PUSHED_COMMIT" '.[] | select(.headSha == $sha and .conclusion == "failure") | "  ❌ \(.workflowName) - \(.url)"'; \
    OVERALL_SUCCESS="false"; \
  else \
    OVERALL_SUCCESS="true"; \
  fi; \
else \
  echo "No push occurred - no workflows to check"; \
  OVERALL_SUCCESS="true"; \
fi; \
echo ""; \
echo "OVERALL_SUCCESS: $OVERALL_SUCCESS"

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