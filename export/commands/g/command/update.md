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

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## 📚 Required Documentation Reading

**IMPORTANT: Before proceeding, you MUST read and understand the following cc-commands documentation:**

<Task>
Read the following cc-commands documentation files to understand the current standards and best practices:

1. `.claude/cc-commands/README.md` - Main cc-commands documentation
2. `.claude/cc-commands/scripts/CLAUDE.md` - Script coding standards
3. `.claude/cc-commands/scripts/CONVERSION-GUIDE.md` - How to convert inline bash to scripts
4. `.claude/cc-commands/scripts/LESSONS-LEARNED.md` - Best practices from conversions
5. `.claude/cc-commands/scripts/_common/CLAUDE.md` - Common scripts documentation

These documents contain critical information about:
- Script-based architecture patterns
- LLM-based help system implementation
- Common script usage and availability
- Output formatting standards
- Error handling patterns
- Noise suppression techniques

You MUST apply these standards when updating commands.
</Task>

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below (everything between the <help> tags) and stop. Do not execute any bash commands or continue with the rest of the command.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:command:update - Update Existing Commands**
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
</help>

## 🔍 Initial Validation

!bash .claude/cc-commands/scripts/g/command/update_env_check.bash

## 📊 Comprehensive Argument Parsing

<Task>
Parse arguments to extract command name and any additional update requirements. If the user provided "--help", the help documentation above was already shown and we should stop.
</Task>

!bash .claude/cc-commands/scripts/g/command/update_arg_parse.bash "$ARGUMENTS"

### Validate Target Command

<Task>
Validate the command exists. I'll use the COMMAND_NAME from the parsed output above.
</Task>

!bash .claude/cc-commands/scripts/g/command/update_validate.bash "$ARGUMENTS"

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

!bash .claude/cc-commands/scripts/g/command/update_backup.bash "$ARGUMENTS"

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