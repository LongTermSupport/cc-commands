# g:symfony:create:command - Symfony Console Command Creator

## Overview

The `g:symfony:create:command` command is an expert-guided tool for creating new Symfony console commands. Unlike the other commands we've analyzed, this one doesn't have associated orchestration scripts or a traditional bash implementation. Instead, it operates as a pure Claude-based command that leverages AI assistance for the entire workflow.

## Command Structure

```
/g:symfony:create:command [command-name]
/g:symfony:create:command --help
```

## Arguments

- `[command-name]` - Optional. Pre-fill the command name (e.g., 'app:user:create')
- `--help` - Display help documentation

## Workflow Analysis

### 1. Help Documentation
The command starts by checking if the user requested help (`--help`) and displays comprehensive documentation if so.

### 2. Environment Analysis

The command executes two detection scripts:

#### Symfony Project Detection
```bash
!bash .claude/cc-commands/scripts/_common/symfony/detect_project.bash
```

This script performs comprehensive Symfony detection:
- Checks `composer.json` for Symfony packages (framework-bundle, console)
- Examines `symfony.lock` for version information
- Runs `bin/console --version` if available
- Analyzes project structure (src/, config/, var/, etc.)
- Outputs structured data including:
  - `SYMFONY_DETECTED=true/false`
  - `SYMFONY_VERSION`, `SYMFONY_MAJOR`, `SYMFONY_MINOR`
  - `SYMFONY_COMPONENTS` list
  - `SYMFONY_PROJECT_TYPE` (full-framework, console-only, components)

#### PHP Version Detection
```bash
!bash .claude/cc-commands/scripts/_common/php/detect_version.bash
```

This script detects PHP version and available features:
- Checks `composer.json` for PHP requirements
- Falls back to system PHP version
- Determines available language features (enums, typed properties, etc.)
- Outputs:
  - `PHP_VERSION`, `PHP_MAJOR`, `PHP_MINOR`
  - `PHP_FEATURES` (comma-separated list)
  - Individual feature flags like `PHP_HAS_ENUMS=true`

### 3. Documentation Discovery

```bash
!bash .claude/cc-commands/scripts/_common/file/find_docs.bash
```

Searches for project documentation:
- Looks for CLAUDE/*.md, README.md, docs/*.md
- Excludes cc-commands directories
- Provides file paths and previews

### 4. Documentation Fetching

The command uses WebFetch to retrieve official Symfony documentation based on the detected version:
- For Symfony 6.x/7.x: Links to current docs
- For Symfony 5.x: Links to 5.4 docs
- Fetches console, input, and helpers documentation

### 5. Code Research Phase

Uses Task blocks to analyze existing commands in the project:
- Naming conventions
- Class structure and inheritance patterns
- Service dependencies and injection
- Error handling approaches
- Testing patterns

### 6. Requirements Gathering

Interactive requirements specification through Task blocks:
1. Command name (format: `app:domain:action`)
2. Command purpose and target user
3. Input requirements (arguments, options, interactive prompts)
4. Output requirements (console format, files, return codes)
5. Dependencies (services, APIs, database)
6. Error handling scenarios

### 7. Plan Creation

Creates a detailed implementation plan in `CLAUDE/plan/symfony-command-[command-name].md`:
- Environment setup
- Command structure with dependency injection
- Implementation steps
- Testing strategy
- Documentation
- Best practices for detected PHP version
- Project integration guidelines

### 8. Execution Workflow

Offers options to:
- Review the created plan
- Execute implementation immediately
- Use `/compact` before execution (recommended for context optimization)

## Key Features

### No Orchestration Scripts
Unlike other commands, this one operates entirely through Claude's capabilities without bash orchestration. This makes sense because:
- The workflow is highly interactive
- Most work involves AI analysis and code generation
- The detection scripts provide all necessary environment data upfront

### Expert Guidance
The command provides:
- Version-specific documentation links
- PHP feature recommendations based on version
- Pattern analysis from existing code
- Best practice suggestions

### Comprehensive Detection
The detection scripts are sophisticated:
- Multiple fallback methods for version detection
- Structural analysis for projects without clear version markers
- Component-level detection for granular understanding

## Quirks and Considerations

### 1. No Traditional Implementation
This command exists only as a Claude prompt template, not as bash scripts. This is intentional - it leverages AI for the entire workflow.

### 2. WebFetch Dependency
The command relies on WebFetch for documentation, which requires internet connectivity. There's no offline fallback.

### 3. Interactive by Design
The command is designed for interactive use with multiple Task blocks. It's not suitable for automation.

### 4. Context Management
The command recommends using `/compact` before execution, acknowledging the potential for large context usage during implementation.

### 5. Detection Script Robustness
The detection scripts handle multiple edge cases:
- Projects with only Symfony components
- Missing composer.json
- Various version string formats
- Both jq and fallback parsing methods

## Error Handling

The command includes specific error recovery guidance:
- Symfony detection issues → Check composer.json
- PHP version issues → Verify requirements
- Documentation fetch failures → Check connectivity
- Code analysis problems → Verify permissions
- Plan creation errors → Check CLAUDE directory

## Best Practices Demonstrated

1. **Comprehensive Detection**: Multiple detection methods with fallbacks
2. **Structured Output**: Consistent variable naming for script outputs
3. **Feature Detection**: PHP version determines available language features
4. **Interactive Design**: Guides users through complex requirements
5. **Documentation Integration**: Links to official docs for the detected version

## Summary

The `g:symfony:create:command` represents a different approach from the other commands we've analyzed. Rather than using bash orchestration, it leverages Claude's capabilities for the entire workflow. This makes it ideal for complex, creative tasks like generating new code with best practices tailored to the specific project environment.

The supporting detection scripts are well-crafted with multiple fallback mechanisms and comprehensive output that provides Claude with all necessary context to make informed decisions about code generation.