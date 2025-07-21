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

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:command:sync - Synchronize CC-Commands Repository**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Synchronizes the shared cc-commands repository by:
  1. Committing any local changes
  2. Pulling updates from the remote repository
  3. Pushing local commits to share with other projects

USAGE:
  /g:command:sync
  /g:command:sync --help

ARGUMENTS:
  --help            Show this help message

EXAMPLES:
  /g:command:sync
    Sync with intelligently generated commit message based on actual changes

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
</help>

## 📊 Argument Parsing

<Task>
Parse the arguments to determine if help was requested. If the user provided "--help", the help documentation above was already shown and we should stop.
</Task>

## 🚦 Precondition Checks

### Environment Validation
!bash .claude/cc-commands/scripts/g/command/sync_env_validate.bash

## 📊 Repository Status Analysis

<Task>
Analyze the current state of the repository to understand what needs to be synced.
</Task>

!bash .claude/cc-commands/scripts/g/command/sync_status_analysis.bash

### Detailed Change Analysis

<Task>
If changes exist, show detailed diff for user review and analyze the changes to understand what was modified.
</Task>

!bash .claude/cc-commands/scripts/g/command/sync_change_analysis.bash

<Task>
Based on the repository status, determine the sync strategy and show the user what will happen.
</Task>

## 🎯 Sync Strategy

Based on the repository analysis, here's the sync plan:

### 📝 Step 1: Analyze Changes and Generate Commit Message

<Task>
If there are uncommitted changes:
1. Use git diff to see what actually changed in the files
2. For new files, read them to understand their purpose
3. For modified files, analyze the diff to understand what was changed
4. Generate a meaningful commit message following conventional commit format

The commit message should:
- Use conventional commit format (feat:, fix:, docs:, refactor:, etc.)
- Clearly describe WHAT changed (list specific commands if multiple)
- Be specific about the nature of changes
- Be concise but informative

Examples of good commit messages:
- "feat: add sync command for repository synchronization"
- "fix: improve error handling in create and update commands"
- "refactor: simplify command argument parsing logic"
- "feat: add plan command and update create/update commands"

After analyzing, display the commit message that will be used.
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
If there are changes to commit, execute the git add and commit operations using the commit message you generated in the previous step.
</Task>

!bash .claude/cc-commands/scripts/g/command/sync_commit_execute.bash "$COMMIT_MESSAGE"

### Step 2: Pull Remote Changes

!bash .claude/cc-commands/scripts/g/command/sync_pull_execute.bash "$CURRENT_BRANCH"

### Step 3: Update README.md

<Task>
Check if the README.md file needs updates based on the current state of commands and repository structure. If updates are needed, update the README.md to reflect the current available commands, features, and documentation, then commit those changes.
</Task>

!bash .claude/cc-commands/scripts/g/command/sync_readme_check.bash

<Task>
Update README if README_OUTDATED=true
</Task>

### Step 4: Push to Remote

!bash .claude/cc-commands/scripts/g/command/sync_push_execute.bash "$CURRENT_BRANCH"

## ✅ Sync Complete

<Task>
Show a summary of what was accomplished during the sync.
</Task>

!bash .claude/cc-commands/scripts/g/command/sync_summary.bash

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