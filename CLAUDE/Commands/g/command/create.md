# g:command:create - Command Creation Wizard

## Overview

The `g:command:create` command is a sophisticated wizard that creates new Claude Code custom commands following best practices, with minimal bash usage, comprehensive error handling, and an orchestrator pattern for complex commands.

## High-Level Purpose

Creates optimized Claude Code commands with:
- Interactive or full-argument mode for requirements gathering
- Bash permission management and safety checks
- Orchestrator pattern for multi-step commands
- Comprehensive help documentation
- Script-based architecture following cc-commands standards

## Workflow in Terse Pseudocode

```pseudocode
// Phase 1: Analysis (orchestrator mode=analyze)
IF arguments == "--help" THEN
    DISPLAY help documentation
    EXIT
END IF

RUN create_orchestrate.bash analyze "$ARGUMENTS"
    -> env_validate.bash: Check environment
    -> arg_parse.bash: Parse arguments if provided
    -> CHECK CommandStructure.md existence
    -> OUTPUT: MODE=INTERACTIVE|FULL, COMMAND_NAME, etc.

// Phase 2: Requirements Gathering (Claude-driven)
IF MODE == "FULL" THEN
    EXTRACT requirements from FULL_REQUIREMENTS
ELSE
    GATHER interactively:
        - Command name
        - Primary purpose
        - Makes changes? (yes/no)
        - Detailed requirements
        - System operations needed
END IF

// Phase 3: Permission Analysis (Claude-driven)
ANALYZE bash commands needed
CATEGORIZE by risk level (LOW/MEDIUM/HIGH)
REQUEST user approval

// Phase 4: Command Generation (Claude-driven)
READ CommandStructure.md if available
DETERMINE if orchestrator pattern needed
GENERATE command content using template
PREPARE script structure if needed

// Phase 5: Creation (orchestrator mode=create)
RUN create_orchestrate.bash create "$COMMAND_NAME" "$COMMAND_CONTENT" "$SCRIPTS_NEEDED"
    -> execute/command.bash: Create command file
    -> execute/scripts.bash: Create orchestrator/scripts if needed
    -> post/summary.bash: Generate summary
    -> OUTPUT: COMMAND_CREATED=true, RESTART_REQUIRED=true

// Phase 6: Post-Creation (Claude-driven)
DISPLAY file location
PROVIDE tab completion instructions
SUGGEST next steps
```

## Scripts Involved and Their Roles

### Main Command File
- **Path**: `export/commands/g/command/create.md`
- **Role**: Claude Code command definition with workflow logic
- **Calls**: `create_orchestrate.bash` in two phases (analyze, create)

### Orchestrator Script
- **Path**: `scripts/g/command/create/create_orchestrate.bash`
- **Role**: Coordinates all bash operations, minimizes calls
- **Modes**:
  - `analyze`: Environment validation, argument parsing
  - `create`: File creation, script generation

### Sub-Scripts

#### Pre-condition Scripts
- **pre/env_validate.bash**
  - Validates cc-commands environment
  - Checks for .claude directory structure
  - Sources from `_common/env/env_validate.bash`

#### Analysis Scripts
- **analysis/arg_parse.bash**
  - Parses command-line arguments
  - Extracts command name and requirements
  - Outputs: `COMMAND_NAME`, `FULL_REQUIREMENTS`, `MODE`

#### Execution Scripts
- **execute/command.bash**
  - Creates the actual command file
  - Handles namespacing (converts : to directory structure)
  - Checks for existing commands
  - Outputs: `COMMAND_PATH`, `FILE_CREATED`

- **execute/scripts.bash**
  - Creates orchestrator and sub-scripts if needed
  - Generates directory structure
  - Creates boilerplate scripts
  - Outputs: `SCRIPTS_CREATED`, script paths

#### Post Scripts
- **post/summary.bash**
  - Generates creation summary
  - Lists created files
  - Provides next steps
  - Outputs: Summary text

## Data Flow (KEY=value outputs)

### Analysis Phase Outputs
```
MODE=INTERACTIVE|FULL
COMMAND_NAME=<name>
FULL_REQUIREMENTS=<requirements>
COMMANDS_DIR=exists|missing
COMMAND_STRUCTURE_DOC=true|false
READY_FOR_REQUIREMENTS=INTERACTIVE|FULL
```

### Creation Phase Outputs
```
COMMAND_PATH=<path>
FILE_CREATED=true
CREATED_DIR=<dir>
SCRIPTS_CREATED=true
ORCHESTRATOR_PATH=<path>
COMMAND_CREATED=true
RESTART_REQUIRED=true
```

## Error Handling Patterns

1. **Orchestrator Level**
   - Uses `error_exit` for critical failures
   - Captures sub-script failures with proper context
   - Sources error handler from `_inc/error_handler.inc.bash`

2. **Sub-Script Level**
   - All scripts use `set -euo pipefail`
   - Source common error handler
   - Return meaningful error messages

3. **Command Level**
   - Checks for bash command failures
   - Provides "Command aborted due to bash error" message
   - Clear recovery instructions

## User Interaction Points

1. **Help Request**
   - Check for `--help` argument
   - Display comprehensive documentation
   - Exit without executing bash

2. **Interactive Mode**
   - Command name prompt
   - Primary purpose prompt
   - Makes changes? prompt
   - Detailed requirements gathering
   - Bash permission approval

3. **Confirmation Points**
   - Bash permissions approval (always)
   - Command creation confirmation (if makes changes)

## Bugs and Quirks

### **(quirk:)** Namespace Conversion
The command converts namespace separators differently:
- User input: `git:commit`
- File path: `.claude/commands/git/commit.md`
- But the conversion uses `//` replacement which could cause issues with deep namespaces

### **(quirk:)** Script Path Assumptions
The orchestrator assumes specific relative paths that could break if the directory structure changes. Uses `realpath` for robustness but still relies on relative paths.

### **(quirk:)** Template Hardcoding
The command template is hardcoded in the markdown file rather than being a separate template file, making it harder to update across all commands.

### **(bug:)** Missing Script Detection
The `scripts_needed` parameter is passed but `execute/scripts.bash` doesn't exist in the current implementation, suggesting incomplete orchestrator pattern implementation.

## TypeScript Migration Considerations

### Input/Output Specifications
- **Inputs**: Command name, requirements (interactive or as arguments)
- **Outputs**: Created command file, optional script structure

### State Management Requirements
- Parse state between analysis and creation phases
- Command metadata (name, purpose, permissions)
- Creation results (paths, success status)

### External Service Dependencies
- File system operations (create directories, write files)
- No network dependencies
- No authentication requirements

### Performance Characteristics
- Fast execution (< 1 second typically)
- Two bash calls instead of many
- Minimal subprocess overhead

### Testing Considerations
- Mock file system operations
- Test namespace-to-path conversion
- Verify error handling at each phase
- Test both interactive and full argument modes
- Ensure template generation is correct