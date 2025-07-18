---
description: Sync cc-commands repository by committing, pulling, and pushing changes
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Task
  - Bash(set -e*), Bash(echo *), Bash(test *), Bash(if *), Bash(cd *), Bash(pwd *), Bash(date *)
  - Bash(git status*), Bash(git diff*), Bash(git log*)
  - Bash(git add*), Bash(git commit*), Bash(git pull*), Bash(git push*)
---

# Command Sync - Synchronize Shared Commands Repository

You are an expert git workflow engineer with deep knowledge of repository synchronization, conflict resolution, and collaborative development. Your approach prioritizes data safety, clear communication, and reliable synchronization.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## 📖 Help Documentation

<Task>
If the user requested --help, provide the help documentation and exit.
</Task>

If you see `--help` in the arguments, please provide this help text and stop:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMAND:SYNC - Synchronize CC-Commands Repository
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Synchronizes the shared cc-commands repository by:
  1. Committing any local changes
  2. Pulling updates from the remote repository
  3. Pushing local commits to share with other projects

USAGE:
  /g:command:sync
  /g:command:sync [commit-message]
  /g:command:sync --help

ARGUMENTS:
  [commit-message]  Optional custom commit message
  --help            Show this help message

EXAMPLES:
  /g:command:sync
    Sync with auto-generated commit message

  /g:command:sync "fix: updated db:migrate command for better error handling"
    Sync with custom commit message

WORKFLOW:
  1. Shows current repository status
  2. Commits any uncommitted changes
  3. Pulls latest changes from remote
  4. Pushes local commits to remote
  5. Handles merge conflicts if they occur

SAFETY:
  • Shows all changes before committing
  • Requires confirmation for commits
  • Provides clear conflict resolution guidance
  • Never forces pushes or overwrites history

PREREQUISITES:
  • cc-commands directory must exist at .claude/cc-commands
  • Must be a valid git repository
  • Must have push access to the remote repository
```

## 📊 Argument Parsing

<Task>
Parse the arguments to determine if help was requested or if a commit message was provided.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
# Check for help flag \
if [ "$ARGUMENTS" = "--help" ]; then \
  echo "HELP_REQUESTED: true"; \
  exit 0; \
else \
  echo "HELP_REQUESTED: false"; \
  # Parse optional commit message if provided \
  if [ -n "$ARGUMENTS" ]; then \
    COMMIT_MSG="$ARGUMENTS"; \
  else \
    COMMIT_MSG=""; \
  fi; \
  echo "COMMIT_MSG: \"$COMMIT_MSG\""; \
fi

## 🚦 Precondition Checks

### Environment Validation
!echo "Validating cc-commands repository environment"; \
set -e; echo "=== Environment Validation ==="; \
# Check if cc-commands directory exists \
if [ ! -d ".claude/cc-commands" ]; then \
  echo "ERROR: cc-commands directory not found at .claude/cc-commands"; \
  echo "This command requires the cc-commands repository to be present."; \
  exit 1; \
fi; \
echo "✓ cc-commands directory found"; \
# Change to cc-commands directory and verify it's a git repo \
cd .claude/cc-commands; \
if [ ! -d ".git" ]; then \
  echo "ERROR: .claude/cc-commands is not a git repository"; \
  exit 1; \
fi; \
echo "✓ Valid git repository"; \
# Check remote configuration \
if ! git remote -v | grep -q origin; then \
  echo "ERROR: No 'origin' remote configured"; \
  exit 1; \
fi; \
echo "✓ Remote 'origin' configured:"; \
git remote -v | grep origin | head -1; \
# Store current directory for reference \
CC_DIR=$(pwd); \
echo "CC_DIR: \"$CC_DIR\""

## 📊 Repository Status Analysis

<Task>
Analyze the current state of the repository to understand what needs to be synced.
</Task>

!echo "Analyzing repository status"; \
set -e; cd "$CC_DIR"; \
echo "=== Git Status ==="; \
git status --porcelain > /tmp/git_status_$$.txt; \
if [ -s /tmp/git_status_$$.txt ]; then \
  echo "✓ Uncommitted changes found:"; \
  cat /tmp/git_status_$$.txt; \
  CHANGES_EXIST=true; \
else \
  echo "✓ Working directory clean"; \
  CHANGES_EXIST=false; \
fi; \
rm -f /tmp/git_status_$$.txt; \
echo "CHANGES_EXIST: $CHANGES_EXIST"; \
echo ""; \
echo "=== Recent Commits ==="; \
git log --oneline -5 || echo "No commits yet"; \
echo ""; \
echo "=== Branch Information ==="; \
CURRENT_BRANCH=$(git branch --show-current); \
echo "Current branch: $CURRENT_BRANCH"; \
# Check if we're ahead or behind remote \
git fetch --dry-run 2>&1 | grep -q "up to date" && echo "✓ Remote is up to date" || echo "⚠️  Remote has updates"

### Detailed Change Analysis

<Task>
If changes exist, show detailed diff for user review.
</Task>

<Task>
Based on the repository status, determine the sync strategy and show the user what will happen.
</Task>

## 🎯 Sync Strategy

Based on the repository analysis, here's the sync plan:

### 📝 Step 1: Handle Local Changes

<Task>
If there are uncommitted changes, prepare to commit them.
</Task>

<Task>
If changes need to be committed, generate an appropriate commit message.
</Task>

### ⚠️ Confirmation Required

<Task>
Before proceeding with any git operations, get user confirmation.
</Task>

This sync operation will:
1. **Commit**: [Status based on analysis]
2. **Pull**: Fetch and merge latest changes from origin
3. **Push**: Upload your commits to share with other projects

**Do you want to proceed with the sync?** (yes/no)

## 🔧 Execution Phase

### Step 1: Commit Local Changes

<Task>
If there are changes to commit, execute the git add and commit operations.
</Task>

!if [ "$CHANGES_EXIST" = "true" ]; then \
  echo "Committing local changes"; \
  set -e; cd "$CC_DIR"; \
  # Stage all changes \
  git add -A; \
  # Generate commit message if not provided \
  if [ -z "$COMMIT_MSG" ]; then \
    # Auto-generate descriptive commit message \
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M"); \
    HOSTNAME=$(hostname); \
    PROJECT_NAME=$(basename $(dirname $(dirname $(pwd)))); \
    AUTO_MSG="sync: updates from $PROJECT_NAME on $HOSTNAME at $TIMESTAMP"; \
    echo "Using auto-generated commit message: $AUTO_MSG"; \
    git commit -m "$AUTO_MSG" || { echo "ERROR: Commit failed"; exit 1; }; \
  else \
    echo "Using provided commit message: $COMMIT_MSG"; \
    git commit -m "$COMMIT_MSG" || { echo "ERROR: Commit failed"; exit 1; }; \
  fi; \
  echo "✓ Changes committed successfully"; \
else \
  echo "✓ No changes to commit"; \
fi

### Step 2: Pull Remote Changes

!echo "Pulling latest changes from remote"; \
set -e; cd "$CC_DIR"; \
echo "=== Git Pull ==="; \
# Attempt to pull with rebase to keep history clean \
if git pull --rebase origin "$CURRENT_BRANCH" 2>&1; then \
  echo "✓ Successfully pulled and rebased changes"; \
else \
  # If rebase fails, fall back to merge \
  echo "⚠️  Rebase failed, attempting merge..."; \
  git rebase --abort 2>/dev/null || true; \
  if git pull origin "$CURRENT_BRANCH"; then \
    echo "✓ Successfully pulled and merged changes"; \
  else \
    echo "ERROR: Pull failed. Manual intervention required."; \
    echo "Hints:"; \
    echo "  1. Check for merge conflicts with: git status"; \
    echo "  2. Resolve conflicts manually"; \
    echo "  3. Complete merge with: git add . && git commit"; \
    exit 1; \
  fi; \
fi

### Step 3: Push to Remote

!echo "Pushing changes to remote"; \
set -e; cd "$CC_DIR"; \
echo "=== Git Push ==="; \
if git push origin "$CURRENT_BRANCH"; then \
  echo "✓ Successfully pushed changes to remote"; \
else \
  echo "ERROR: Push failed"; \
  echo "Possible reasons:"; \
  echo "  - You don't have push access to the repository"; \
  echo "  - The remote has diverged (try pulling again)"; \
  echo "  - Network connectivity issues"; \
  exit 1; \
fi

## ✅ Sync Complete

<Task>
Show a summary of what was accomplished during the sync.
</Task>

!echo "=== Sync Summary ==="; \
set -e; cd "$CC_DIR"; \
echo "✓ Repository synchronized successfully"; \
echo ""; \
echo "Current status:"; \
git log --oneline -3; \
echo ""; \
echo "Remote status:"; \
git status -sb; \
echo ""; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo "✓ CC-Commands repository is now in sync!"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

### 🚀 Next Steps

Your cc-commands repository is now synchronized. Other projects using these shared commands will receive your updates when they run this sync command.

**Tips:**
- Run this command regularly to keep commands in sync
- Use descriptive commit messages to help other developers
- Check `git log` to see what changes others have made

## 🚨 Error Recovery

If the sync encounters problems:

1. **Merge Conflicts**: 
   - Navigate to `.claude/cc-commands`
   - Run `git status` to see conflicts
   - Edit conflicted files manually
   - Run `git add .` then `git commit`

2. **Authentication Issues**:
   - Ensure you have SSH keys set up for GitHub
   - Check with `ssh -T git@github.com`

3. **Network Problems**:
   - Verify internet connectivity
   - Try again later

4. **Permission Denied**:
   - Ensure you have push access to the repository
   - Contact repository administrators

---
*Command sync keeps shared commands consistent across all projects*