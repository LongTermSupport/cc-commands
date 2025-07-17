---
description: Creates new Claude Code custom commands with best practices, bash permissions, and workflow patterns
allowed-tools:
  - Write
  - Read
  - Task
  - Bash
  - TodoWrite
  - LS
  - Glob
---

# Command Creation Wizard 🚀

You are a highly experienced software architect and prompt engineer with expertise in creating robust, maintainable, and user-friendly CLI tools. Your focus is on fail-fast validation, clear documentation, and bulletproof error handling. You use the latest features of claude code custom commands and prompting in general.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## ⚠️ Non-Interactive Bash Commands ONLY

**ALL bash commands MUST be completely non-interactive. Commands that require user input will hang indefinitely.**

### ❌ NEVER Use These Interactive Commands:
- `read` or `read -p` - Will hang waiting for input
- Interactive editors: `vim`, `nano`, `emacs`, etc.
- Commands with `-i` flags: `git rebase -i`, `git add -i`
- Password prompts: `sudo`, `ssh` without keys, `mysql -p`
- Confirmation prompts: `rm -i`, `cp -i`, `mv -i`
- Interactive shells: `bash`, `sh`, `python`, `node` (without scripts)
- Menu-driven tools: `make menuconfig`, `dpkg-reconfigure`

### ✅ ALWAYS Use Non-Interactive Alternatives:
- `git commit -m "message"` instead of `git commit` (which opens editor)
- `echo "y" | command` or `command -y` for auto-confirmations
- Pre-authenticated tools: `gh` (authenticated), passwordless `sudo`
- Command flags: `rm -f` instead of `rm -i`
- Piped input: `echo "input" | command` when needed
- Script files: `python script.py` instead of interactive `python`

### 🎯 User Interaction Pattern:
```markdown
<Task>
Ask user: "Do you want to proceed with [action]? (yes/no)"
Wait for user response before continuing.
</Task>

!echo "Executing approved action"; \
set -e; [non-interactive command here]
```

https://docs.anthropic.com/en/docs/claude-code/slash-commands

## 📚 Project Documentation Discovery

<Task>
Scan for relevant project documentation that commands should reference
</Task>

!set -e; echo "=== Discovering Project Documentation ==="; if [ -d "CLAUDE" ]; then echo "✓ CLAUDE directory found"; find CLAUDE -name "*.md" -type f | head -20 | sed 's/^/  - @/'; else echo "✗ No CLAUDE directory found"; fi; if [ -f "README.md" ]; then echo "✓ README.md found"; fi; if [ -d "docs" ]; then echo "✓ docs directory found"; find docs -name "*.md" -type f | head -10 | sed 's/^/  - @/'; fi; if [ -f ".env.example" ]; then echo "✓ .env.example found (for environment setup)"; fi; if [ -f "package.json" ]; then echo "✓ package.json found (Node.js project)"; fi; if [ -f "composer.json" ]; then echo "✓ composer.json found (PHP project)"; fi

### Key Documentation Files

<Task>
Based on the project structure, I'll identify key documentation that should be referenced in commands:
- Workflow documents (e.g., CLAUDE/PlanWorkflow.md)
- Code standards (e.g., CLAUDE/Core/CodeStandards.md)
- Testing guidelines (e.g., CLAUDE/Core/TestingStandards.md)
- Tool documentation (e.g., CLAUDE/Tools/Commands.md)
</Task>

## 📖 Help Documentation

<Task>
First, check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " COMMAND:CREATE - Create New Claude Code Commands"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "Creates new Claude Code custom commands with best practices, including:"; \
echo "  • Comprehensive error handling and fail-fast validation"; \
echo "  • Bash command permission management"; \
echo "  • Non-interactive command patterns"; \
echo "  • Progress tracking and user confirmations"; \
echo "  • Automatic --help documentation"; \
echo ""; \
echo "USAGE:"; \
echo "  /g:command:create"; \
echo "  /g:command:create [command-name]"; \
echo "  /g:command:create --help"; \
echo ""; \
echo "ARGUMENTS:"; \
echo "  [command-name]  Optional. Pre-fill the command name (e.g., 'db:migrate')"; \
echo "  --help          Show this help message"; \
echo ""; \
echo "INTERACTIVE PROMPTS:"; \
echo "  1. Command name (use : for namespacing)"; \
echo "  2. Primary purpose"; \
echo "  3. Whether it makes changes (yes/no)"; \
echo "  4. Detailed requirements gathering"; \
echo "  5. Bash permission approval"; \
echo ""; \
echo "EXAMPLES:"; \
echo "  /g:command:create"; \
echo "    Start interactive command creation wizard"; \
echo ""; \
echo "  /g:command:create test:integration"; \
echo "    Create a command named 'test:integration' (skips name prompt)"; \
echo ""; \
echo "FEATURES:"; \
echo "  • Enforces non-interactive bash commands"; \
echo "  • Generates comprehensive help documentation"; \
echo "  • Creates folder structure for namespaced commands"; \
echo "  • Includes project documentation discovery"; \
echo "  • Implements safety patterns and confirmations"; \
echo ""; \
echo "SAFETY:"; \
echo "  • Won't overwrite existing commands"; \
echo "  • Validates all inputs before proceeding"; \
echo "  • Requires explicit permission for bash commands"; \
echo "  • All created commands include --help support"; \
echo ""; \
exit 0; \
fi

## 🔍 Initial Validation & Preconditions

!set -e; echo "=== Command Creation Environment Check ==="; echo "Working Directory: $(pwd)"; echo "Claude Commands Directory: $(ls -la .claude/commands 2>/dev/null || echo 'Not found - will create')"; which jq >/dev/null 2>&1 && echo "✓ jq available" || echo "✗ jq not found (optional)"; which gh >/dev/null 2>&1 && echo "✓ gh CLI available" || echo "✗ gh CLI not found (needed for GitHub commands)"; gh auth status >/dev/null 2>&1 && echo "✓ gh authenticated" || echo "✗ gh not authenticated"

### 📊 Comprehensive Argument Parsing & Validation

<Task>
Parse all arguments once and perform all validations in a single bash execution.
This outputs structured data that Claude will use throughout the command.
</Task>

!echo "=== ARGUMENT PARSING & VALIDATION ==="; \
if [ -n "$ARGUMENTS" ]; then \
  # Extract first word as command name \
  COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}'); \
  # Extract everything after first word as requirements \
  FULL_REQUIREMENTS=$(echo "$ARGUMENTS" | cut -d' ' -f2-); \
  # If there's only one word, no requirements were provided \
  if [ "$COMMAND_NAME" = "$FULL_REQUIREMENTS" ]; then \
    FULL_REQUIREMENTS=""; \
  fi; \
  \
  # Check for overwrite protection \
  if [[ "$COMMAND_NAME" == *:* ]]; then \
    FOLDER_PATH="${COMMAND_NAME//:://}.md"; \
    COMMAND_PATH=".claude/commands/${FOLDER_PATH}"; \
  else \
    COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"; \
  fi; \
  \
  if [ -f "$COMMAND_PATH" ]; then \
    echo "ERROR: Command already exists at $COMMAND_PATH"; \
    echo "To update an existing command, use: /g:command:update $COMMAND_NAME"; \
    exit 1; \
  fi; \
  \
  # Determine mode based on whether full requirements were provided \
  if [ -n "$FULL_REQUIREMENTS" ]; then \
    MODE="FULL"; \
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
    echo " Full Argument Mode Detected"; \
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
  else \
    MODE="INTERACTIVE"; \
  fi; \
  \
  # Output all parsed values for Claude to use \
  echo "COMMAND_NAME: \"$COMMAND_NAME\""; \
  echo "COMMAND_PATH: \"$COMMAND_PATH\""; \
  echo "FULL_REQUIREMENTS: \"$FULL_REQUIREMENTS\""; \
  echo "MODE: \"$MODE\""; \
else \
  # No arguments provided - full interactive mode \
  echo "COMMAND_NAME: \"\""; \
  echo "COMMAND_PATH: \"\""; \
  echo "FULL_REQUIREMENTS: \"\""; \
  echo "MODE: \"INTERACTIVE\""; \
fi

### ⚡ Requirements Gathering

<Task>
Based on the parsed MODE from above, either extract requirements from FULL_REQUIREMENTS or gather them interactively.
</Task>

Based on the parsed arguments:
- **Mode**: [I'll use the MODE value from the parsing output]
- **Command Name**: [I'll use COMMAND_NAME from the parsing output]
- **Requirements**: [I'll use FULL_REQUIREMENTS from the parsing output if MODE is FULL]

If full requirements were provided (MODE: "FULL"), I'll analyze them to extract:
- Primary purpose
- Whether it makes changes
- Required tools and preconditions
- Input/output specifications
- Any specific features requested

Otherwise (MODE: "INTERACTIVE"), I need the following information:

1. **Command name** (required): [Use COMMAND_NAME from parsing, or ask if empty]
2. **Primary purpose** (required): 
3. **Makes changes?** (yes/no - required):

I'll proceed based on the MODE determined during parsing.

## 📋 Comprehensive Requirements Gathering

Once basic requirements are confirmed, I'll gather detailed specifications:

### Command Metadata
- **Full name**: (kebab-case, descriptive)
- **Category/namespace**: (optional, e.g., `git:`, `test:`, `db:`)
- **Brief description**: (for YAML frontmatter)
- **Long description**: (for command help text)

### Behavioral Specifications
- **Input handling**:
  - [ ] No arguments
  - [ ] File paths via `$ARGUMENTS`
  - [ ] Specific parameters (list them)
  - [ ] Interactive prompts
  - [ ] Piped input support

- **Preconditions to check**:
  - [ ] Required tools installed
  - [ ] Authentication status
  - [ ] File/directory existence
  - [ ] Permissions
  - [ ] Git repository status
  - [ ] Network connectivity

- **Output format**:
  - [ ] Human-readable summary
  - [ ] Structured data (JSON/YAML)
  - [ ] File modifications
  - [ ] Progress indicators
  - [ ] Error reports

### Safety & Robustness
- **Change management**:
  - [ ] Dry-run mode
  - [ ] Preview changes
  - [ ] Confirmation prompt
  - [ ] Rollback capability
  - [ ] Backup creation

- **Error handling**:
  - [ ] Input validation
  - [ ] Graceful degradation
  - [ ] Clear error messages
  - [ ] Recovery suggestions
  - [ ] Exit codes

### Advanced Features
- **Special requirements**:
  - [ ] Bash command execution (!)
  - [ ] File content inclusion (@)
  - [ ] Progress tracking (todos)
  - [ ] Subagent tasks
  - [ ] External API calls
  - [ ] Caching/memoization

## 🔒 Bash Command Permission Analysis

<Task>
I'll analyze your command for bash commands that need permissions. This ensures transparency and security.
</Task>

### Command Risk Categories

**🟢 Low Risk (Auto-Approved, Informational)**
- `echo`, `printf` - Output only
- `pwd`, `whoami`, `id` - Current state info
- `date`, `uname`, `hostname` - System info
- `which`, `type`, `command -v` - Command availability
- `true`, `false` - Return codes only
- `basename`, `dirname` - Path parsing
- `wc`, `du -h` - File statistics
- `env`, `printenv` - Environment display
- `cat`, `head`, `tail`, `less`, `more` - File reading
- `grep`, `egrep`, `fgrep` - Pattern matching
- `awk`, `sed` (read-only mode) - Text processing
- `cut`, `paste`, `tr` - Text manipulation
- `sort`, `uniq` - Text organization
- `diff`, `comm` - File comparison
- `ls`, `ll`, `la` - Directory listing
- `find` (read-only) - File searching
- `test`, `[`, `[[` - Condition checking
- `stat` - File metadata
- `file` - File type detection
- `md5sum`, `sha256sum` - Checksums
- `jq`, `yq` (read mode) - JSON/YAML parsing
- `set` - Shell options (builtin, safe)
- `exit` - Script termination

**🟡 Medium Risk (Read Operations with Side Effects)**
- `git status`, `git log`, `git diff` - Repository info
- `git branch`, `git remote -v` - Git metadata
- `npm list`, `pip list` - Package listings
- `docker ps`, `docker images` - Container info
- `mysql -e "SELECT..."` - Database queries
- `curl` (GET only), `wget` (spider mode) - Network reads
- `gh auth status`, `gh repo view` - GitHub reads

**🟠 High Risk (Modifications)**
- `mkdir`, `touch` - Create files/dirs
- `cp`, `mv` - Copy/move files
- `git add`, `git commit` - Repository changes
- `npm install`, `pip install` - Package installation
- Write operations with `>`, `>>`

**🔴 Critical Risk (System Changes)**
- `rm`, `rmdir` - Delete operations
- `chmod`, `chown` - Permission changes
- `sudo` commands - Elevated privileges
- Network operations (`curl`, `wget` writing files)
- Script execution (`sh`, `bash`, `python`)

### Automatic Permission Detection

<Task>
I'll scan your command template for bash commands (preceded by !) and categorize them by risk level.
</Task>

### 🛡️ Permission Approval Process

Based on the detected commands, I'll present:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  BASH COMMAND PERMISSIONS REQUIRED  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your command requires permission to execute:

🟢 LOW RISK (4 commands):
  • echo - Display output messages
  • which - Check command availability
  • pwd - Show current directory
  • test - Check file/directory existence

🟡 MEDIUM RISK (2 commands):
  • gh issue list - Read GitHub issues
  • gh auth status - Check authentication

🟠 HIGH RISK (1 command):
  • gh issue comment - Post to GitHub

POTENTIAL IMPACTS:
✓ Read access to GitHub repository
✓ Network requests to GitHub API
⚠️ Can post public comments to issues

Do you approve these permissions? (yes/no)
```

### Permission Implementation

Once approved, I'll add to the command's frontmatter:

```yaml
---
description: [Your description]
allowed-tools: [...]
allowed-bash-commands:
  low-risk:
    - echo
    - which
    - pwd
    - test
  medium-risk:
    - gh  # With restrictions: read-only operations
  high-risk:
    - gh  # With restrictions: comment posting only
---
```

## 🔧 Bash Command Optimization Best Practices

### ❌ BAD: Multiple separate bash commands (slow, multiple approvals)
```bash
!set -e; echo "=== Environment Check ==="
!set -e; test -d .git && echo "✓ Git repo found" || exit 1
!set -e; which gh >/dev/null 2>&1 && echo "✓ gh CLI available" || exit 1
!set -e; gh auth status >/dev/null 2>&1 && echo "✓ GitHub authenticated" || exit 1
```

### ✅ GOOD: Chained bash commands with human-friendly descriptions
```bash
!echo "Validating GitHub environment and tools"; \
set -e; echo "=== Environment Check ==="; \
test -d .git && echo "✓ Git repo found" || exit 1; \
which gh >/dev/null 2>&1 && echo "✓ gh CLI available" || exit 1; \
gh auth status >/dev/null 2>&1 && echo "✓ GitHub authenticated" || exit 1
```

### 🎯 Command Chaining Strategy

#### Single Comprehensive Parsing Pattern
Parse ALL arguments and perform ALL validations in ONE bash call at the start:
```bash
!echo "=== COMPREHENSIVE PARSING ==="; \
# Parse command name \
CMD=$(echo "$ARGUMENTS" | awk '{print $1}'); \
# Parse requirements \
REQS=$(echo "$ARGUMENTS" | cut -d' ' -f2-); \
# Validate and check paths \
if [ -f ".claude/commands/${CMD}.md" ]; then \
  echo "ERROR: Command exists"; \
  exit 1; \
fi; \
# Output all parsed data for Claude \
echo "COMMAND_NAME: \"$CMD\""; \
echo "REQUIREMENTS: \"$REQS\""; \
echo "MODE: \"$([ -n "$REQS" ] && echo "FULL" || echo "INTERACTIVE")\""
```

#### Key Principles
- **Parse once, use everywhere**: Output structured data Claude can reference
- **Chain everything possible**: Reduce subprocess overhead
- **Structured output**: Use `KEY: "value"` format for easy parsing
- **Human-friendly**: Start chains with descriptive echo
- **Error handling**: Use `set -e` for fail-fast behavior
- **Readability**: Use escaped newlines (`\`) for multi-line commands

## 🎯 Command Generation Template

Based on your requirements, I'll generate a command using this professional template:

```markdown
---
description: [Concise description]
allowed-tools: [Minimum required tools]
allowed-bash-commands:
  low-risk: [Commands like echo, test, which]
  medium-risk: [Commands like ls, git status]
  high-risk: [Commands that modify files]
  critical-risk: [Commands that delete or sudo]
---

# [Command Name] - [Purpose]

You are an expert [relevant domain] engineer with deep knowledge of best practices, error handling, and user experience. Your approach prioritizes clarity, safety, and robustness.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

## 📊 Argument Parsing

<Task>
Parse all arguments at once and output structured data for use throughout the command.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
# [Parse arguments based on your command's needs] \
# [Validate inputs and check preconditions] \
# [Output structured data for Claude to use] \
# Example: \
# echo "PARSED_ARG1: \"value1\""; \
# echo "PARSED_ARG2: \"value2\""; \
# echo "MODE: \"INTERACTIVE or FULL\""

## 📖 Help Documentation

<Task>
Check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " [COMMAND NAME IN UPPERCASE]"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "[Long description of what this command does, when to use it, and key features]"; \
echo ""; \
echo "USAGE:"; \
echo "  /[namespace]:[command] [arguments]"; \
echo "  /[namespace]:[command] --help"; \
echo ""; \
echo "ARGUMENTS:"; \
echo "  [argument1]    [Description of argument1]"; \
echo "  [argument2]    [Description of argument2] (optional)"; \
echo "  --help         Show this help message"; \
echo ""; \
echo "EXAMPLES:"; \
echo "  /[namespace]:[command]"; \
echo "    [What this does]"; \
echo ""; \
echo "  /[namespace]:[command] [example-arg]"; \
echo "    [What this does with the argument]"; \
echo ""; \
echo "PRECONDITIONS:"; \
echo "  • [Required tool or condition 1]"; \
echo "  • [Required tool or condition 2]"; \
echo "  • [Required authentication or permissions]"; \
echo ""; \
echo "SAFETY:"; \
echo "  • [Safety feature 1 - e.g., dry-run mode]"; \
echo "  • [Safety feature 2 - e.g., confirmation prompts]"; \
echo "  • [What the command will NOT do]"; \
echo ""; \
exit 0; \
fi

## 🚦 Precondition Checks

### Environment Validation
!echo "Validating environment and required tools"; \
set -e; echo "=== Environment Validation ==="; \
[Check required tools]; \
[Verify authentication status]; \
[Validate working directory]; \
[Confirm necessary permissions - use existing || patterns for error handling]

### Input Validation
[Validate all inputs before proceeding]
[Check file existence and accessibility]
[Verify argument format and constraints]

## 📊 Analysis Phase

[Gather information needed for execution]
[Analyze current state]
[Identify potential issues or conflicts]

## 🎯 Execution Planning

### Summary of Changes
Before proceeding, here's what will happen:

**Changes to be made:**
- [Specific change 1]
- [Specific change 2]
- [Impact summary]

**Files affected:**
- [List of files]

**Potential risks:**
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

### ⚠️ Confirmation Required

This operation will make the following changes:
[High-level summary in 2-3 lines]

**Do you want to proceed?** (yes/no)
> Note: This confirmation is required even in auto-accept mode for safety.

## 🔧 Execution Phase

[Step-by-step execution with progress updates]
[Error handling at each step]
[Validation after each critical operation]

## ✅ Verification Phase

[Verify changes were applied correctly]
[Run post-execution tests]
[Generate summary report]

## 📈 Results Summary

[Clear summary of what was accomplished]
[Any warnings or follow-up actions needed]
[Suggestions for next steps]

## 🚨 Error Recovery

If something goes wrong:
1. [Specific recovery step 1]
2. [Specific recovery step 2]
3. [How to report issues]

---
*Command created with professional standards for reliability and user safety*
```

## 🧪 Testing Protocol

I'll test your command by:

1. **Validation testing**: Run all precondition checks
2. **Dry-run testing**: Execute up to confirmation point
3. **Edge case testing**: Test with invalid inputs
4. **Integration testing**: Verify tool interactions

## 🔐 Permission Analysis Workflow

### Step 1: Command Analysis
<Task>
After you provide your command requirements, I'll:
1. Generate the initial command template
2. Scan for all bash commands (lines starting with !)
3. Extract and categorize each command by risk level
4. Identify any potentially dangerous patterns
5. Auto-approve low-risk commands
</Task>

### Step 2: Permission Presentation
For commands requiring approval, I'll show:
- **Medium/High/Critical risk commands** requiring approval
- **Specific commands** and their purposes
- **Potential impacts** on the system
- **Security considerations**
- **Auto-approved commands** listed separately

### Step 3: User Approval
For non-auto-approved commands, you'll:
- Review all requested permissions
- Understand the risks involved
- Explicitly approve or deny permissions
- Optionally restrict certain commands

### Step 4: Implementation
After approval, I'll:
- Add `allowed-bash-commands` to the frontmatter
- Include both auto-approved and user-approved commands
- Document any restrictions or conditions
- Include security notes in the command documentation
- Ensure the command follows principle of least privilege

### Example Permission Request:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  BASH COMMAND PERMISSIONS REQUIRED  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Command: git-auto-commit
Purpose: Automatically commit changes with AI-generated messages

COMMANDS REQUIRING APPROVAL:

🟡 MEDIUM RISK (3):
  • git status - Check for changes
  • git diff - Review modifications
  • git log - Read commit history

🟠 HIGH RISK (2):
  • git add - Stage files
  • git commit - Create commits

SECURITY ANALYSIS:
✓ No deletion commands detected
✓ No sudo/elevated privileges required
✓ No network writes (only git operations)
⚠️ Will modify git history
⚠️ Commits cannot be easily undone

AUTO-APPROVED (Low Risk):
✓ echo - Status messages (1 command)
✓ test - File/directory checks (1 command)
✓ cat, grep - File reading (2 commands)
✓ Total: 4 low-risk commands

RECOMMENDATIONS:
- Always preview changes before committing
- Include dry-run mode for safety
- Add confirmation prompts for commits

Do you approve these permissions? (yes/no)
```

## 🎭 Workflow Patterns

### Pattern 1: Single Approval → Execute All
Best for commands that perform multiple related actions that should all succeed or fail together.

```bash
# Gather all actions upfront
!set -e; echo "This command will:"
!set -e; echo "✓ Action 1: Create file X"
!set -e; echo "✓ Action 2: Commit to git"
!set -e; echo "✓ Action 3: Post to GitHub"
!set -e; echo ""

<Task>
Ask user: "Proceed with all actions? (yes/no)"
If yes, continue with execution. If no, abort.
</Task>

# Execute actions only if user approved
!if [ "$USER_APPROVED" = "yes" ]; then
    # Execute all actions (each with set -e for fail-fast)
    set -e; echo "Creating file..."
    # action 1
    
    set -e; echo "Committing to git..."
    # action 2
    
    set -e; echo "Posting to GitHub..."
    # action 3
else
    echo "Operation cancelled."
    exit 0
fi
```

### Pattern 2: Progressive with Checkpoints
For commands where each step depends on the previous one's success.

```bash
# Step 1
echo "Step 1: Analyzing..."
# do analysis
if [ $? -ne 0 ]; then
    echo "Analysis failed"
    exit 1
fi

# Checkpoint
read -p "Analysis complete. Continue to implementation? (yes/no): " continue
if [ "$continue" != "yes" ]; then
    echo "Stopped at analysis phase"
    exit 0
fi

# Step 2
echo "Step 2: Implementing..."
# do implementation
```

### Pattern 3: Dry-Run Then Execute
For potentially destructive or complex operations.

```bash
# Dry run first
echo "=== DRY RUN MODE ==="
echo "Would perform these actions:"
# show what would happen

read -p "Execute these actions for real? (yes/no): " execute
if [ "$execute" = "yes" ]; then
    echo "=== EXECUTING ==="
    # perform actual actions
fi
```

### Pattern 4: Auto-Execute with Bail Points
For commands that should "just work" but allow interruption.

```bash
echo "Starting automated workflow..."
echo "Press Ctrl+C at any time to cancel"
sleep 2  # Give user time to cancel

# Auto-execute with status updates
echo "[1/3] Creating plan..."
# action 1

echo "[2/3] Committing..."
# action 2

echo "[3/3] Publishing..."
# action 3

echo "✓ All actions completed successfully!"
```

## 💡 Prompt Engineering Best Practices

Commands I create will include:

### Persona Definition
- Clear expertise domain
- Quality focus statements
- Responsibility emphasis

### Cognitive Strategies
- Step-by-step thinking
- Explicit validation points
- Clear decision criteria

### Output Optimization
- Structured formatting
- Progressive disclosure
- Actionable messages

### Safety Patterns
- Defensive programming
- Explicit confirmations
- Graceful degradation

## 🚀 Quick Examples

1. **GitHub Integration Command**:
   ```
   Command: pr-review
   Checks: gh installed, authenticated, in git repo
   Confirms: Before adding review comments
   ```

2. **Database Migration Command**:
   ```
   Command: db:migrate
   Checks: DB connection, migration files, backup capability
   Confirms: Before applying migrations
   ```

3. **Code Refactoring Command**:
   ```
   Command: refactor:extract-method
   Checks: File exists, valid syntax, test coverage
   Confirms: Before modifying code
   ```

## 🎬 Ready to Start?

Please provide:
1. **Command name** (use : for namespacing, e.g., `git:commit`, `db:migrate`)
2. **Primary purpose** (one clear sentence)
3. **Makes changes?** (yes/no)

I'll then:
- Create the command with folder namespacing (e.g., `git:commit` → `.claude/commands/git/commit.md`)
- Include relevant project documentation references
- Set up appropriate bash permissions
- Apply best workflow patterns
- Generate a production-ready command following all best practices

## 🔄 Post-Creation Instructions

<Task>
After creating the command:
1. Ensure proper folder structure for namespaced commands
2. Save the file in the correct location
3. Show the file path and next steps
</Task>

### ⚡ **IMPORTANT: Tab Completion Setup** ⚡

```
🎯 To enable tab completion for your new/updated command:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  You MUST restart your Claude Code session! ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simply exit and re-run Claude Code:
1. Exit current session (Ctrl+C or type 'exit')
2. Start Claude Code again
3. Your command will have tab completion! 🚀

Example: /git:co<TAB> → /git:commit
```

### File Structure

Commands with namespaces are saved in folders:
- `git:commit` → `.claude/commands/git/commit.md`
- `db:migrate` → `.claude/commands/db/migrate.md`
- `test` → `.claude/commands/test.md`

This ensures your new command is immediately available with full tab completion support!