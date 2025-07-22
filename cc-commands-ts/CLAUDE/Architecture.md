# cc-commands TypeScript Architecture

## Core Principle

Commands do deterministic work and return raw data. The LLM generates reports.

## Key Components

### Command Structure
- **Base Class**: @src/commands/BaseCommand.ts
- **Return Type**: @src/types/LLMInfo.ts  
- **Error Type**: @src/errors/CommandError.ts

### Architectural Enforcement

1. **Commands MUST extend BaseCommand**
   - See abstract `execute()` method
   - Final `run()` method prevents override

2. **Commands MUST return LLMInfo**
   - Private constructor prevents extension
   - Factory method: `LLMInfo.create()`
   - Structured KEY=value output format

3. **Errors MUST be CommandError**
   - Mandatory recovery instructions
   - Rich debug context
   - See error factories: @src/errors/GitHubErrorFactory.ts

4. **Commands MUST NOT generate reports**
   - Only structured data output
   - LLM handles all formatting
   - No markdown, no rich text

## Example Implementation

See the reference implementation:
- @src/commands/g/gh/project/summary.ts (once implemented)

## Directory Structure

```
src/
├── commands/       # Command implementations (extend BaseCommand)
├── services/       # Business logic (return domain objects)
├── types/          # Type definitions
├── interfaces/     # Interface contracts
├── errors/         # Error factories
└── utils/          # Utilities
```

## Testing

Commands are easily testable:
```typescript
const result = await command.execute()
expect(result.getData()).toEqual({ PROJECT_ID: '123' })
expect(result.getActions()).toContainEqual({ 
  event: 'Fetch data', 
  result: 'success' 
})
```

## Debug Logging

All commands automatically log to `var/debug/[command]-[timestamp].log`
See @src/commands/BaseCommand.ts `CommandDebugger` class.