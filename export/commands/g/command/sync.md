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

** IMPORTANT - relax, you are not in a rush. NEVER take dangerous short cuts. ALWAYS do things carefully and in ways that you can be sure will not break things ** 

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

## 🚦 Initial Analysis

### Run Complete Repository Analysis
!bash .claude/cc-commands/scripts/g/command/sync/sync_orchestrate.bash

<Task>
Based on the orchestrator output:
1. Check the repository status (CHANGES_EXIST, CURRENT_BRANCH, etc.)
2. If COMMIT_MESSAGE_REQUIRED=true, we need to generate a commit message
3. Determine what sync operations will be needed
</Task>

## 🎯 Sync Planning

<Task>
If COMMIT_MESSAGE_REQUIRED=true from the orchestrator:
1. Analyze the changes shown in the output (modified/new files)
2. Read specific files if needed to understand the changes better
3. Generate a meaningful commit message following conventional commit format:
   - Use conventional prefixes (feat:, fix:, docs:, refactor:, etc.)
   - Clearly describe WHAT changed
   - Be specific but concise

Examples:
- "feat: add orchestrator pattern to reduce bash calls"
- "fix: correct COMMON_DIR paths in moved scripts"
- "refactor: reorganize sync scripts into subdirectories"

Store the commit message in COMMIT_MESSAGE variable.
</Task>

### ⚠️ Confirmation Required

<Task>
Show the user what will happen based on the analysis:
- List any changes that will be committed
- Mention if pull/push operations are needed
- Ask for confirmation to proceed
</Task>

**Do you want to proceed with the sync?** (yes/no)

## 🔧 Execution Phase

### Complete Sync Execution

!bash .claude/cc-commands/scripts/g/command/sync/sync_orchestrate.bash "$COMMIT_MESSAGE"

<Task>
Review the orchestrator output for:
- Confirmation of successful operations
- README_UPDATE_NEEDED=true (requires manual README update)
- Any errors or warnings
</Task>

### Update README.md (if needed)

<Task>
If README_UPDATE_NEEDED=true from the orchestrator:
1. Read the current README.md
2. Update it to reflect current commands and features
3. Commit the changes
</Task>

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