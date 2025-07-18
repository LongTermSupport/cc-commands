---
description: Updates existing Claude Code commands to latest standards by regenerating them with command:create
ultrathink: true
allowed-tools:
  - Read
  - Write
  - Bash(set -e*), Bash(echo*), Bash(test*), Bash(if*), Bash(find*), Bash(cp*)
  - Task
  - LS
  - Glob
---

# Command Update Wizard 🔄

You are an expert at analyzing and improving Claude Code custom commands. Your role is to read existing commands, extract their core functionality, and provide clear instructions for regenerating them with the latest best practices.

**IMPORTANT: This command ONLY analyzes and provides instructions. It does NOT invoke command:create directly. The output is a summary that the user can use to manually run command:create.**

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

## 📖 Help Documentation

<Task>
If the user requested --help, provide the help documentation and exit.
</Task>

If you see `--help` in the arguments, please provide this help text and stop:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMAND:UPDATE - Update Existing Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updates existing Claude Code commands to latest standards by regenerating
them with command:create. This preserves your command's core functionality
while upgrading to the latest best practices, including:
  • Adding --help documentation
  • Improving error handling
  • Updating permission management
  • Applying latest command patterns

USAGE:
  /g:command:update [command-name]
  /g:command:update --help

ARGUMENTS:
  [command-name]  Required. The command to update (e.g., 'db:migrate')
  --help          Show this help message

EXAMPLES:
  /g:command:update test:integration
    Updates the test:integration command to latest standards

  /g:command:update g:gh:issue:plan
    Updates a global command in the g namespace

PROCESS:
  1. Reads the existing command
  2. Extracts core functionality and requirements
  3. Uses command:create to regenerate with latest patterns
  4. Preserves your custom logic and behavior

NOTES:
  • Original command is backed up before update
  • Command namespace is preserved
  • All custom functionality is maintained
  • Adds missing features like --help support
```

## 🔍 Initial Validation

!set -e; echo "=== Command Update Environment Check ==="; test -d .claude/commands && echo "✓ Commands directory found" || (echo "✗ Commands directory not found" && exit 1); test -f .claude/commands/command/create.md && echo "✓ command:create available" || (echo "✗ command:create not found - required for updates" && exit 1)

## 📊 Comprehensive Argument Parsing

<Task>
Parse arguments to extract command name and any additional update requirements.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
# First check for --help \
if [ "$ARGUMENTS" = "--help" ]; then \
  echo "HELP_REQUESTED: true"; \
  exit 0; \
fi; \
if [ -z "$ARGUMENTS" ]; then \
  echo "=== Available Commands ==="; \
  find .claude/commands -follow -name "*.md" -type f 2>/dev/null | grep -v "command/create.md" | grep -v "command/update.md" | sed 's|.claude/commands/||' | sed 's|\.md$||' | sed 's|/|:|g' | sort | nl -w2 -s". "; \
  echo ""; \
  echo "Usage: /g:command:update <command-name> [additional-requirements]"; \
  echo ""; \
  echo "Examples:"; \
  echo "  /g:command:update test:integration"; \
  echo "  /g:command:update test:integration \"Add --coverage flag and parallel test support\""; \
  exit 0; \
fi; \
# Extract command name (first word) \
COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}'); \
# Extract additional requirements (everything after first word) \
ADDITIONAL_REQS=$(echo "$ARGUMENTS" | cut -d' ' -f2-); \
if [ "$COMMAND_NAME" = "$ADDITIONAL_REQS" ]; then \
  ADDITIONAL_REQS=""; \
fi; \
# Output parsed data \
echo "COMMAND_NAME: \"$COMMAND_NAME\""; \
echo "ADDITIONAL_REQUIREMENTS: \"$ADDITIONAL_REQS\""; \
if [ -n "$ADDITIONAL_REQS" ]; then \
  echo "UPDATE_MODE: \"ENHANCE\""; \
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
  echo " Enhancement Mode - Adding New Features"; \
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
  echo "Additional requirements: $ADDITIONAL_REQS"; \
else \
  echo "UPDATE_MODE: \"REFRESH\""; \
  echo "Updating to latest standards only"; \
fi

### Validate Target Command

<Task>
Validate the command exists. I'll use the COMMAND_NAME from the parsed output above.
</Task>

!# Re-extract command name since variables don't persist \
COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}'); \
COMMAND_PATH=""; \
if [[ "$COMMAND_NAME" == *:* ]]; then \
  FOLDER_PATH="${COMMAND_NAME//:://}.md"; \
  if [ -f ".claude/commands/${FOLDER_PATH}" ]; then \
    COMMAND_PATH=".claude/commands/${FOLDER_PATH}"; \
    echo "✓ Found command: ${FOLDER_PATH}"; \
    echo "COMMAND_PATH: \"$COMMAND_PATH\""; \
  else \
    echo "✗ Command not found: ${COMMAND_NAME}"; \
    echo "Available commands:"; \
    find .claude/commands -follow -name "*.md" -type f 2>/dev/null | sed 's|.claude/commands/||' | sed 's|\.md$||' | sed 's|/|:|g' | sort; \
    exit 1; \
  fi; \
else \
  if [[ "$COMMAND_NAME" == *.md ]]; then \
    STRIPPED="${COMMAND_NAME%.md}"; \
  else \
    STRIPPED="$COMMAND_NAME"; \
  fi; \
  if [ -f ".claude/commands/${STRIPPED}.md" ]; then \
    COMMAND_PATH=".claude/commands/${STRIPPED}.md"; \
    echo "✓ Found command: ${STRIPPED}.md"; \
    echo "COMMAND_PATH: \"$COMMAND_PATH\""; \
  elif [ -f ".claude/commands/${STRIPPED//:///}.md" ]; then \
    COMMAND_PATH=".claude/commands/${STRIPPED//:///}.md"; \
    echo "✓ Found command: ${STRIPPED//:///}.md"; \
    echo "COMMAND_PATH: \"$COMMAND_PATH\""; \
  else \
    echo "✗ Command not found: ${COMMAND_NAME}"; \
    exit 1; \
  fi; \
fi

## 📖 Read Existing Command

<Task>
Read the existing command file and analyze its structure and purpose
</Task>

### Extract Command Information

<Task>
From the existing command, extract:
1. The command name (from file path)
2. The primary purpose (from description or first paragraph)
3. Whether it makes changes (analyze tools and bash commands)
4. Key functionality and workflow
</Task>

## 🎯 Generate Update Summary

<Task>
Based on the analysis and the UPDATE_MODE from parsing:
- If UPDATE_MODE is "ENHANCE": Include ADDITIONAL_REQUIREMENTS in the update
- If UPDATE_MODE is "REFRESH": Just update to latest standards

I need to extract ACTUAL values from the command file, not placeholders:
1. Extract the exact command name from the file path
2. Extract the exact description from the frontmatter
3. Extract the exact purpose from the command content
4. List all actual bash commands used (by finding ! prefixed lines)
5. List all actual tools from allowed-tools
6. Build a complete, ready-to-use command string with all details

The output must be self-contained - the user should be able to copy and run it directly without any editing or context from this analysis.
</Task>

### Preview Update Plan

Here's what I found:

**Command**: [name]
**Purpose**: [extracted purpose]
**Makes changes**: [yes/no]
**Key features**:
- [feature 1]
- [feature 2]

The updated command will include:
✓ Latest workflow patterns
✓ Proper bash permissions
✓ Project documentation references
✓ Improved error handling
✓ Better user interaction flow

## 💾 Create Backup

<Task>
Before providing the update summary, create a backup of the existing command.
</Task>

!# Re-extract command name and path since variables don't persist \
COMMAND_NAME=$(echo "$ARGUMENTS" | awk '{print $1}'); \
if [[ "$COMMAND_NAME" == *:* ]]; then \
  COMMAND_PATH=".claude/commands/${COMMAND_NAME//:://}.md"; \
else \
  COMMAND_PATH=".claude/commands/${COMMAND_NAME}.md"; \
fi; \
echo "Creating backup..."; \
BACKUP_PATH="${COMMAND_PATH%.md}-backup-$(date +%Y%m%d-%H%M%S).md"; \
if cp "$COMMAND_PATH" "$BACKUP_PATH"; then \
  echo "✓ Backup created: $BACKUP_PATH"; \
  echo "BACKUP_PATH: \"$BACKUP_PATH\""; \
else \
  echo "✗ Failed to create backup"; \
  exit 1; \
fi

## 📋 Update Summary Complete

**CRITICAL: DO NOT attempt to call command:create directly! This command only provides analysis and instructions.**

<Task>
Based on my analysis of the command, I'll provide a complete, self-contained command that can be run to recreate it with the latest standards.
</Task>

### Extracted Command Details

From my analysis of the existing command:
- **Command name**: [I'll extract the actual command name]
- **Current description**: [I'll extract from the frontmatter]
- **Current purpose**: [I'll extract from the command content]
- **Makes changes**: [I'll determine yes/no based on tools used]
- **Key functionality**: [I'll list the main features]
- **Bash commands used**: [I'll list actual bash commands found]
- **Tools required**: [I'll list the allowed-tools]



### Detailed Requirements for command:create

When prompted by command:create, here are the complete requirements to provide:

**Full Requirements Description:**
```
[A comprehensive paragraph that includes:
- The exact purpose and description from the original command
- All functionality that must be preserved
- Specific tools and bash commands used
- Any project-specific patterns or workflows
- Documentation references that should be included
- Error handling patterns used
- User interaction patterns
- Any additional features requested]
```

**Makes changes**: [yes/no - with explanation of what changes are made]

**Key Features to Preserve**:
1. [Specific feature with details]
2. [Specific feature with details]
3. [Specific feature with details]

**Bash Commands Required**:
- [List each bash command pattern found in the original]
- [With explanations of what they do]

**Additional Context**:
- [Any project-specific conventions]
- [Special error handling requirements]
- [Workflow patterns to maintain]

## ✅ Update Analysis Complete

I've:
1. Created a backup of your command at: [I'll reference BACKUP_PATH from above]
2. Analyzed the existing command structure and features
3. Incorporated any additional requirements you specified
4. Provided the exact command:create invocation needed

The next step is for you to run the command:create command with the requirements shown above.

### Complete Update Command

Copy and run this exact command:

```
/g:command:create [actual-command-name] "Read the detailed requirements from the command:update analysis"
```

**This command is now complete.** No further action will be taken.

---
*Command analysis completed by command:update*