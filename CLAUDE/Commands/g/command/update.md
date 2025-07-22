# g:command:update - Command Update Wizard

## Overview

The `g:command:update` command analyzes existing Claude Code commands and provides instructions for regenerating them with the latest standards using `g:command:create`. It's a read-only analysis tool that preserves command functionality while upgrading patterns.

## High-Level Purpose

Updates existing commands to latest standards by:
- Analyzing current command structure and functionality
- Extracting core requirements and behavior
- Creating backups before updates
- Providing complete instructions for regeneration
- Supporting both refresh (standards update) and enhance (add features) modes

## Workflow in Terse Pseudocode

```pseudocode
// Phase 1: Analysis
IF arguments == "--help" THEN
    DISPLAY help documentation
    EXIT
END IF

RUN update_orchestrate.bash analyze "$ARGUMENTS"
    -> pre/env_check.bash: Validate environment
    -> analysis/arg_parse.bash: Parse command name and requirements
    -> analysis/validate_command.bash: Check command exists
    -> OUTPUT: COMMAND_NAME, COMMAND_PATH, UPDATE_MODE

IF no command name provided THEN
    LIST available commands
    EXIT
END IF

// Phase 2: Command Analysis (Claude-driven)
READ existing command file
EXTRACT:
    - Command name from path
    - Description from frontmatter
    - Purpose from content
    - Tools and bash commands used
    - Key functionality
    - Whether makes changes

DETERMINE update approach:
    - REFRESH: Just update to latest standards
    - ENHANCE: Add new features from ADDITIONAL_REQUIREMENTS

// Phase 3: Backup
RUN update_orchestrate.bash backup "$ARGUMENTS"
    -> execute/backup_command.bash: Create timestamped backup
    -> OUTPUT: BACKUP_PATH

// Phase 4: Generate Instructions (Claude-driven)
PREPARE comprehensive requirements:
    - All extracted functionality
    - Additional requirements if ENHANCE mode
    - Specific bash commands needed
    - Tools required
    
GENERATE command:create invocation:
    - Complete, self-contained command
    - Ready to copy and run
    - No placeholders or context needed

DISPLAY update summary and instructions
```

## Scripts Involved and Their Roles

### Main Command File
- **Path**: `export/commands/g/command/update.md`
- **Role**: Analysis and instruction generation (no execution)
- **Calls**: `update_orchestrate.bash` twice (analyze, backup)

### Orchestrator Script
- **Path**: `scripts/g/command/update/update_orchestrate.bash`
- **Role**: Coordinates analysis and backup operations
- **Modes**:
  - `analyze`: Parse arguments, validate command
  - `backup`: Create command backup

### Sub-Scripts

#### Pre-condition Scripts
- **pre/env_check.bash**
  - Validates environment
  - Checks commands directory
  - Sources from `_common/env/env_validate.bash`

#### Analysis Scripts
- **analysis/arg_parse.bash**
  - Parses command name and additional requirements
  - Lists available commands if none specified
  - Determines UPDATE_MODE (REFRESH or ENHANCE)
  - Outputs: `COMMAND_NAME`, `UPDATE_MODE`, `ADDITIONAL_REQUIREMENTS`

- **analysis/validate_command.bash**
  - Checks if command file exists
  - Builds command path from name
  - Validates file is readable
  - Outputs: `COMMAND_PATH`, `COMMAND_EXISTS`

#### Execution Scripts
- **execute/backup_command.bash**
  - Creates timestamped backup
  - Preserves in `.claude/commands/backups/`
  - Handles namespaced commands
  - Outputs: `BACKUP_PATH`, `BACKUP_CREATED`

## Data Flow (KEY=value outputs)

### Analysis Phase Outputs
```
PHASE=analysis
COMMAND_NAME=<name>
COMMAND_PATH=<path>
UPDATE_MODE=REFRESH|ENHANCE
ADDITIONAL_REQUIREMENTS=<requirements>
COMMAND_EXISTS=true|false
```

### Backup Phase Outputs
```
PHASE=backup
BACKUP_PATH=<path>
BACKUP_CREATED=true
COMMAND_PATH=<original-path>
```

## Error Handling Patterns

1. **Missing Command Name**
   - Lists available commands
   - Shows usage examples
   - Exits gracefully

2. **Command Not Found**
   - Clear error message
   - Suggests checking command name
   - Lists similar commands

3. **Backup Failures**
   - Handles directory creation
   - Reports backup location
   - Non-critical (continues anyway)

## User Interaction Points

1. **Help Request**
   - Check for `--help` argument
   - Display comprehensive documentation

2. **Command Selection**
   - If no command specified, show list
   - Interactive selection not implemented

3. **Update Confirmation**
   - Shows what will be updated
   - Provides backup location
   - User manually runs command:create

## Bugs and Quirks

### **(quirk:)** Read-Only Design
The command doesn't actually update anything - it only provides instructions. This is intentional to give users control but can be confusing.

### **(bug:)** No Direct Integration
The command can't invoke `g:command:create` directly due to Claude Code limitations, requiring manual copy-paste of the generated command.

### **(quirk:)** Placeholder Extraction
The command tries to extract "ACTUAL values" but the implementation suggests it might still use placeholders in some cases.

### **(quirk:)** Backup Directory
Creates backups in `.claude/commands/backups/` which might not be gitignored by default.

### **(bug:)** Enhancement Mode Parsing
The ADDITIONAL_REQUIREMENTS parsing might fail with complex requirements containing quotes or special characters.

## TypeScript Migration Considerations

### Input/Output Specifications
- **Inputs**: Command name, optional additional requirements
- **Outputs**: Analysis summary, backup path, regeneration instructions

### State Management Requirements
- Command metadata extraction
- Backup operation status
- Update mode determination

### External Service Dependencies
- File system operations only
- No network or API calls
- No authentication required

### Performance Characteristics
- Fast file operations (< 500ms)
- Command analysis is quick
- No heavy processing

### Testing Considerations
- Test command extraction logic
- Verify backup creation
- Test enhancement vs refresh modes
- Ensure generated instructions are complete
- Mock file system operations

## Pattern Contributions

This command demonstrates:
1. **Analysis-only pattern** - Provides instructions without execution
2. **Backup pattern** - Timestamped backups before updates
3. **Command discovery** - Lists available commands dynamically
4. **Enhancement mode** - Adding features to existing commands
5. **Self-contained output** - Generated commands need no context