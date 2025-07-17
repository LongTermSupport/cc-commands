---
description: Updates existing Claude Code commands to latest standards by regenerating them with command:create
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - LS
  - Glob
allowed-bash-commands:
  low-risk:
    - echo
    - test
    - find
    - sed
    - sort
    - cp
    - mv
    - grep
    - nl
    - exit
    - set
---

# Command Update Wizard 🔄

You are an expert at analyzing and improving Claude Code custom commands. Your role is to read existing commands, extract their core functionality, and provide clear instructions for regenerating them with the latest best practices.

**IMPORTANT: This command ONLY analyzes and provides instructions. It does NOT invoke command:create directly. The output is a summary that the user can use to manually run command:create.**

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

## 📖 Help Documentation

<Task>
First, check if the user requested help documentation.
</Task>

!if [ "$ARGUMENTS" = "--help" ]; then \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo " COMMAND:UPDATE - Update Existing Commands"; \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
echo ""; \
echo "Updates existing Claude Code commands to latest standards by regenerating"; \
echo "them with command:create. This preserves your command's core functionality"; \
echo "while upgrading to the latest best practices, including:"; \
echo "  • Adding --help documentation"; \
echo "  • Improving error handling"; \
echo "  • Updating permission management"; \
echo "  • Applying latest command patterns"; \
echo ""; \
echo "USAGE:"; \
echo "  /g:command:update [command-name]"; \
echo "  /g:command:update --help"; \
echo ""; \
echo "ARGUMENTS:"; \
echo "  [command-name]  Required. The command to update (e.g., 'db:migrate')"; \
echo "  --help          Show this help message"; \
echo ""; \
echo "EXAMPLES:"; \
echo "  /g:command:update test:integration"; \
echo "    Updates the test:integration command to latest standards"; \
echo ""; \
echo "  /g:command:update g:gh:issue:plan"; \
echo "    Updates a global command in the g namespace"; \
echo ""; \
echo "PROCESS:"; \
echo "  1. Reads the existing command"; \
echo "  2. Extracts core functionality and requirements"; \
echo "  3. Uses command:create to regenerate with latest patterns"; \
echo "  4. Preserves your custom logic and behavior"; \
echo ""; \
echo "NOTES:"; \
echo "  • Original command is backed up before update"; \
echo "  • Command namespace is preserved"; \
echo "  • All custom functionality is maintained"; \
echo "  • Adds missing features like --help support"; \
echo ""; \
exit 0; \
fi

## 🔍 Initial Validation

!set -e; echo "=== Command Update Environment Check ==="; test -d .claude/commands && echo "✓ Commands directory found" || (echo "✗ Commands directory not found" && exit 1); test -f .claude/commands/command/create.md && echo "✓ command:create available" || (echo "✗ command:create not found - required for updates" && exit 1)

## 📊 Comprehensive Argument Parsing

<Task>
Parse arguments to extract command name and any additional update requirements.
</Task>

!echo "=== ARGUMENT PARSING ==="; \
if [ -z "$ARGUMENTS" ]; then \
  echo "=== Available Commands ==="; \
  find .claude/commands -name "*.md" -type f 2>/dev/null | grep -v "command/create.md" | grep -v "command/update.md" | sed 's|.claude/commands/||' | sed 's|\.md$||' | sed 's|/|:|g' | sort | nl -w2 -s". "; \
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
    find .claude/commands -name "*.md" -type f 2>/dev/null | sed 's|.claude/commands/||' | sed 's|\.md$||' | sed 's|/|:|g' | sort; \
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

Prepare a summary to feed to command:create:
1. Command name (maintaining namespace)
2. Clear one-sentence purpose
3. Makes changes: yes/no
4. Key features to preserve
5. New features to add (if UPDATE_MODE is "ENHANCE")
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

Based on my analysis, here's the summary for updating this command:

### Command Information
- **Name**: [Extracted from COMMAND_NAME]
- **Purpose**: [Extracted purpose, enhanced if UPDATE_MODE is "ENHANCE"]
- **Makes changes**: [yes/no based on analysis]
- **Current features**: [List of existing features]
- **New features requested**: [From ADDITIONAL_REQUIREMENTS if provided]

### Update Instructions

To update this command, the user should run:

```
/g:command:create [command-name] "[combined purpose and requirements]"
```

The full requirements should include:
1. The original purpose and functionality
2. All existing features that need to be preserved
3. Any new features from ADDITIONAL_REQUIREMENTS
4. Specific mentions of patterns to maintain

### Example Command

Based on this analysis, run:
```
/g:command:create [specific-command] "[specific combined requirements]"
```

## ✅ Update Analysis Complete

I've:
1. Created a backup of your command at: [I'll reference BACKUP_PATH from above]
2. Analyzed the existing command structure and features
3. Incorporated any additional requirements you specified
4. Provided the exact command:create invocation needed

The next step is for you to run the command:create command with the requirements shown above.

**This command is now complete.** No further action will be taken.

---
*Command analysis completed by command:update*