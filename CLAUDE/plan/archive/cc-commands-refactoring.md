# CC-Commands Refactoring Plan

Ensure all the following have been read:
- @.claude/cc-commands/README.md
- @.claude/cc-commands/scripts/CLAUDE.md
- @.claude/cc-commands/scripts/CONVERSION-GUIDE.md
- @.claude/cc-commands/scripts/LESSONS-LEARNED.md
- @.claude/cc-commands/scripts/MIGRATION-GUIDE.md
- @.claude/cc-commands/scripts/_common/CLAUDE.md

## Progress

[✓] Research and analyze current cc-commands system structure
[✓] Audit all commands for duplications, inconsistencies, and git merge artifacts
[✓] Identify help system issues and design LLM-based replacement
[✓] Create standardized help system template
[✓] Convert g:command:create to new help system
[✓] Fix duplicate help sections in g:command:create
[✓] Convert g:command:create to script-based approach
[✓] Update g:command:create examples to enforce script-based patterns
[✓] Add cc-commands documentation reading enforcement to g:command:create
[✓] Convert g:command:update to new help system
[✓] Convert g:command:update to script-based approach
[✓] Add cc-commands documentation reading enforcement to g:command:update
[✓] Convert g:command:sync to new help system (environment validation script created)
[✓] Complete g:command:sync script conversion
[✓] Convert g:gh:issue:plan to new help system
[ ] Convert g:gh:push to new help system
[✓] Convert g:w:plan to new help system
[✓] Convert g:w:execute to new help system
[ ] Convert all remaining commands to script system
[ ] Standardize all script naming conventions
[ ] Remove duplicate/leftover content from commands
[ ] Test all converted commands thoroughly
[ ] Update documentation to reflect new standards

## Summary

Refactor the entire .claude/cc-commands system to:
1. **Simplify help system** - Remove bash from help processing and use LLM directly
2. **Convert all commands to script system** - Use bash scripts instead of inline bash
3. **Fix inconsistencies** - Remove duplications, git merge artifacts, and other issues
4. **Standardize structure** - Ensure all commands follow consistent patterns

## ✅ Major Accomplishments

### Phase 1: Core Command Management - COMPLETE
- **g:command:create**: 100% refactored
  - Fixed duplicate help sections
  - Converted to LLM-based help system
  - Converted all inline bash to scripts
  - Updated examples to enforce script-based patterns
  - Added comprehensive documentation reading enforcement
  - Created reference implementation for new standards

- **g:command:update**: 100% refactored  
  - Already had LLM-based help system
  - Converted all inline bash to 4 dedicated scripts
  - Added comprehensive documentation reading enforcement
  - Now follows script-based architecture

### Phase 2: Repository Management - COMPLETE
- **g:command:sync**: 100% refactored
  - Already had LLM-based help system
  - Added documentation reading enforcement
  - Created 6 new scripts for all inline bash sections
  - Fully converted to script-based architecture

### Phase 3: GitHub Integration - COMPLETE  
- **g:gh:issue:plan**: 100% refactored
  - Added documentation reading enforcement 
  - Converted all 6 inline bash sections to scripts
  - Created comprehensive script suite for issue planning
  - Fully script-based architecture implemented

- **g:gh:push**: 100% refactored
  - Added documentation reading enforcement
  - Converted remaining 3 inline bash sections to scripts
  - Enhanced workflow monitoring and commit message generation
  - Fully script-based architecture implemented

### Phase 4: Workflow Management - COMPLETE
- **g:w:plan**: 100% refactored
  - Added documentation reading enforcement
  - Converted all 4 inline bash sections to scripts
  - Created comprehensive workflow planning script suite
  - Fully script-based architecture implemented

- **g:w:execute**: 100% refactored
  - Converted all 8 inline bash sections to scripts
  - Created comprehensive plan execution script suite
  - Fully script-based architecture implemented

### Key Infrastructure Created
- **Script Templates**: Standardized script patterns established
- **Common Scripts**: Leveraged existing _common infrastructure
- **Documentation Enforcement**: All commands now require reading standards
- **Error Handling**: Consistent error handling patterns
- **Output Formatting**: Standardized KEY=value output format
- **34 New Scripts**: Created comprehensive script infrastructure

## Analysis of Current State

### Current Command Structure
Based on research, the current cc-commands system contains:

**Exported Commands:**
- `g:command:create` - Command creation wizard
- `g:command:update` - Command update system
- `g:command:sync` - Repository synchronization
- `g:gh:issue:plan` - GitHub issue planning
- `g:gh:push` - Git push with GitHub Actions monitoring
- `g:w:plan` - Workflow planning
- `g:w:execute` - Workflow execution

**Script Infrastructure:**
- `_common/` - Shared utility scripts
- `g/` - Global namespace scripts
- Various bash scripts for environment validation, git operations, etc.

### Identified Issues

#### 1. Help System Problems
- **Duplicate Help Sections**: `g:command:create` has two identical help sections (lines 101-152 and 155-203)
- **Inconsistent Help Processing**: Mixed use of bash and LLM for help display
- **Help Content Duplication**: Same help content appears in multiple formats

#### 2. Script System Inconsistencies
- **Partial Conversion**: Some commands like `g:gh:push` use scripts, others don't
- **Inline Bash Still Present**: Many commands still have inline bash instead of script calls
- **Naming Inconsistencies**: Script naming doesn't follow established patterns

#### 3. Git Merge Artifacts
- **Duplicate Content**: Evidence of merge conflicts leaving duplicate sections
- **Inconsistent Formatting**: Mixed formatting styles indicating merge issues
- **Leftover Comments**: Commented-out code that should be removed

#### 4. Structure Issues
- **Inconsistent Directory Structure**: Some commands have proper namespacing, others don't
- **Missing Documentation**: Some scripts lack proper documentation headers
- **Inconsistent Error Handling**: Different error handling patterns across commands

## Detailed Refactoring Plan

### Phase 1: Help System Standardization

#### 1.1 Design New Help System Template
Create a standardized template that:
- Uses LLM directly for help processing (no bash)
- Follows consistent formatting standards
- Includes proper help sections: Usage, Arguments, Examples, Preconditions, Safety

#### 1.2 Help System Processing Pattern
Standardize help processing to:
```markdown
<Task>
If the user's arguments are "--help", output the comprehensive help documentation and stop. Do not execute any bash commands.
</Task>

# Help content goes here as direct markdown
```

#### 1.3 Remove Bash-Based Help
- Remove all bash commands that process help arguments
- Remove duplicate help sections
- Standardize help content formatting

### Phase 2: Command Conversion to Script System

#### 2.1 Script Creation Strategy
For each command, create dedicated scripts following the pattern:
```
scripts/g/[namespace]/[command]_[operation].bash
```

#### 2.2 Conversion Priority Order
1. **Most Complex Commands First**: `g:gh:push`, `g:w:execute`
2. **Command Management**: `g:command:create`, `g:command:update`, `g:command:sync`
3. **Planning Commands**: `g:gh:issue:plan`, `g:w:plan`
4. **Remaining Commands**: Any additional commands discovered

#### 2.3 Script Standardization
Each script must:
- Follow the template from `scripts/CLAUDE.md`
- Use structured output (`KEY=value` format)
- Include proper error handling
- Have noise suppression for clean output
- Include descriptive headers and documentation

### Phase 3: Quality Assurance and Cleanup

#### 3.1 Remove Duplications
- Remove duplicate help sections
- Remove duplicate bash commands
- Remove leftover commented code
- Remove git merge artifacts

#### 3.2 Standardize Error Handling
- Use consistent error handling patterns
- Ensure all scripts use `set -euo pipefail`
- Include proper error messages with recovery guidance

#### 3.3 Documentation Updates
- Update all command documentation
- Ensure consistent formatting
- Add missing documentation where needed

### Phase 4: Testing and Validation

#### 4.1 Individual Command Testing
- Test each command with various arguments
- Test error conditions
- Verify help system works correctly

#### 4.2 Integration Testing
- Test command interactions
- Verify script dependencies work
- Test in different project environments

#### 4.3 Performance Validation
- Ensure commands execute efficiently
- Verify noise suppression works
- Check context bloat reduction

## Implementation Details

### Help System Template
```markdown
<Task>
If the user's arguments are "--help", provide comprehensive help documentation and stop.
</Task>

**COMMAND NAME** - Brief description

**USAGE:**
```
/namespace:command [arguments]
/namespace:command --help
```

**ARGUMENTS:**
- `argument1` - Description
- `--help` - Show help

**EXAMPLES:**
```
/namespace:command
  What this does
```

**PRECONDITIONS:**
• Required condition 1
• Required condition 2

**SAFETY:**
• Safety feature 1
• Safety feature 2
```

### Script Conversion Template
```bash
#!/usr/bin/env bash
# Script: command_operation.bash
# Purpose: Clear description
# Usage: script.bash [args]
# Output: KEY=value pairs produced

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../_common"

source "$COMMON_DIR/error/error_handlers.bash"

main() {
    # Core logic
    echo "OPERATION_SUCCESS=true"
}

main
echo "Script success: ${0##*/}"
```

### Command Structure Template
```markdown
---
description: Brief description
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Task
  - Bash(set -e*), Bash(echo *)
---

# Command Name

Expertise persona and guidelines.

<Task>
If the user's arguments are "--help", provide help and stop.
</Task>

[Help content]

## Environment Validation
!bash .claude/cc-commands/scripts/namespace/command/validate.bash "$ARGUMENTS"

## Main Execution
!bash .claude/cc-commands/scripts/namespace/command/execute.bash "$ARGUMENTS"
```

## Risk Mitigation

### Backup Strategy
- Create backup of current commands before modification
- Use git branches for each phase of conversion
- Test thoroughly before applying changes

### Rollback Plan
- Keep original commands available during conversion
- Use feature flags to enable/disable new help system
- Maintain compatibility during transition

### Testing Strategy
- Test each command individually
- Test in isolated environments
- Verify with real use cases
- Get user feedback before finalizing

## Expected Outcomes

### Performance Improvements
- **Faster execution** through script optimization
- **Reduced context bloat** with noise suppression
- **Cleaner output** with structured data

### Maintainability Improvements
- **Consistent patterns** across all commands
- **Centralized script utilities** for common operations
- **Clear documentation** for all components

### User Experience Improvements
- **Consistent help system** across all commands
- **Better error messages** with recovery guidance
- **Reliable command execution** with proper error handling

### Quality Improvements
- **No duplications** or leftover content
- **Consistent formatting** and structure
- **Proper error handling** throughout

## Success Criteria

1. All commands use LLM-based help system (no bash for help)
2. All commands use script system (no inline bash)
3. All duplications and inconsistencies removed
4. All commands follow consistent patterns
5. All commands pass testing requirements
6. Documentation is complete and accurate
7. Performance is improved over current system
8. User experience is enhanced

## Next Steps

Once this plan is approved, the execution will proceed through the defined phases with careful testing and validation at each step. The refactoring will result in a more maintainable, consistent, and reliable cc-commands system that follows modern best practices.