# g:w:plan - Workflow Plan Generator

## Overview

The `g:w:plan` command creates structured project plans following a two-mode workflow pattern (Planning Mode and Execution Mode). It provides a systematic approach to documenting tasks before implementation, ensuring thorough research and planning before any code changes.

## Command Structure

### Main Components

1. **Command File**: `/export/commands/g/w/plan.md`
   - Contains the Claude-specific command implementation
   - Uses ultrathink mode for comprehensive planning
   - Enforces strict planning mode rules (NO CODE CHANGES)

2. **Orchestrator**: `/scripts/g/w/plan/plan_orchestrate.bash`
   - Coordinates the planning workflow in two modes:
     - `analyze`: Parses arguments and discovers workflow documentation
     - `create`: Creates the plan directory structure
   - Uses the `capture_script_output` pattern for sub-script execution

3. **Supporting Scripts**:
   - `analysis/arg_parse.bash`: Parses task name and generates filename
   - `analysis/workflow_discover.bash`: Finds project-specific workflow documentation
   - `pre/check_existing.bash`: Checks for existing plans and determines plan directory
   - `execute/create_directory.bash`: Creates the plan directory structure

## Workflow Pattern

### Two-Mode Planning System

1. **Planning Mode** (Default):
   - Full research of relevant files and systems
   - Detailed documentation of required actions
   - Code snippets for reference
   - NO CODE CHANGES allowed

2. **Execution Mode** (Explicit approval required):
   - Implements the approved plan
   - Tracks progress with status symbols
   - Updates plan document during execution
   - Makes actual code changes

### Plan Structure

Plans follow a standardized template with:
- Progress tracking section with status symbols: `[ ]`, `[⏳]`, `[✓]`
- Summary of task goals
- Detailed implementation steps
- Code snippets for key changes
- References to relevant documentation

## Implementation Details

### Argument Parsing

The `arg_parse.bash` script:
- Accepts the entire argument string as the task name
- Converts to kebab-case for filename generation
- Handles both provided task names and interactive mode

```bash
# Convert to kebab-case for filename
FILENAME=$(echo "$TASK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
```

### Workflow Discovery

The system checks multiple locations for project-specific workflows:
1. `CLAUDE/PlanWorkflow.md`
2. `.claude/PlanWorkflow.md`
3. `docs/planning-workflow.md`
4. `docs/workflow.md`

Falls back to embedded generic template if none found.

### Plan Directory Logic

Determines plan directory based on project structure:
- Prefers `CLAUDE/plan` if it exists
- Falls back to `CLAUDE/Plan` or creates under `CLAUDE/`
- Uses `plans/` as last resort

## Usage Examples

### Basic Usage
```bash
g:w:plan "implement user authentication"
# Creates: CLAUDE/plan/implement-user-authentication.md
```

### Interactive Mode
```bash
g:w:plan
# Prompts for task details interactively
```

### Help Documentation
```bash
g:w:plan --help
# Shows comprehensive help and usage examples
```

## Key Features

### Intelligent Plan Management
- Automatically detects existing plans
- Prevents accidental overwrites
- Shows plan metadata (size, modification time)

### Project Integration
- Discovers and uses project-specific workflows
- References project documentation automatically
- Maintains consistent plan structure across projects

### Progress Tracking
- Clear status symbols for task tracking
- Enforces completion criteria
- Maintains audit trail of changes

## Patterns and Conventions

### Orchestrator Pattern
- Two-phase execution: analyze → create
- Captures outputs from sub-scripts via associative arrays
- Clear separation of concerns between phases

### Error Handling
- Comprehensive error checking at each step
- Graceful fallbacks for missing project workflows
- Clear error messages with actionable feedback

### Interactive Elements
- Uses Task blocks for user prompts
- Confirmation required before creating plans
- Provides clear next steps after plan creation

## Known Issues and Quirks

### Filename Generation
- Special characters are converted to hyphens
- Multiple consecutive hyphens are collapsed
- Leading/trailing hyphens are removed

### Workflow Template Embedding
The command embeds a complete generic workflow template as a fallback, making it quite large. This ensures consistency even without project-specific workflows.

### Mode Enforcement
- Strictly enforces planning mode rules
- Requires explicit user action to enter execution mode
- No automated transitions between modes

### Directory Creation
- Only creates directories when explicitly confirmed
- Preserves existing directory structures
- Reports creation status accurately

## Integration Points

### With g:w:execute
Plans created by this command are designed to be executed by `g:w:execute`, which:
- Reads the plan file
- Enters execution mode
- Updates progress tracking
- Implements the documented changes

### With Project Documentation
- Automatically references CLAUDE folder documentation
- Ensures plans follow project standards
- Links to relevant technical docs

### With Version Control
- Plans are version-controlled documents
- Changes tracked through git history
- Supports collaborative planning workflows

## Best Practices

### Plan Creation
1. Use descriptive task names that clearly indicate the work
2. Allow workflow discovery to find project-specific templates
3. Review generated plans before proceeding to execution

### Plan Maintenance
1. Keep plans updated during execution
2. Mark tasks complete only when fully verified
3. Add discovered tasks as you work
4. Never create duplicate plans for the same task

### Mode Discipline
1. Stay in planning mode until plan is complete
2. Get explicit approval before execution
3. Never mix research and implementation
4. Document findings thoroughly before coding

## File Structure Example

```
CLAUDE/
├── plan/
│   ├── implement-user-authentication.md
│   ├── refactor-database-layer.md
│   └── archive/
│       └── completed-task.md
└── PlanWorkflow.md  # Project-specific workflow template
```

---

*This command exemplifies the two-mode workflow philosophy: thorough planning before implementation, with clear separation between research and execution phases.*