# cc-commands TypeScript Architecture

## Core Principle

**Commands are markdown files. TypeScript code provides orchestrators that do work FOR commands.**

The LLM interprets the command and uses orchestrators to perform deterministic operations.

## Critical Distinctions

### Commands (Markdown Files)
- Located in `.claude/commands/` (e.g., `g/gh/project/summary.md`)
- Interpreted by the LLM
- Contain instructions for the LLM
- Decide how to format output
- Make audience-specific decisions
- Generate human-readable reports

### Orchestrators (TypeScript)
- Located in `cc-commands-ts/src/` 
- Do NOT interpret anything
- Do NOT make formatting decisions
- Do NOT understand audience types
- Only perform deterministic operations
- Return raw KEY=value data via LLMInfo

## Key Components

### Orchestrator Structure
- **Base Class**: @src/commands/BaseCommand.ts (TODO: rename to BaseOrchestrator)
- **Return Type**: @src/types/LLMInfo.ts  
- **Error Type**: @src/errors/CommandError.js

### Architectural Enforcement

1. **Orchestrators MUST extend BaseCommand** (TODO: rename)
   - See abstract `execute()` method
   - Final `run()` method prevents override

2. **Orchestrators MUST return LLMInfo**
   - Private constructor prevents extension
   - Factory method: `LLMInfo.create()`
   - Structured KEY=value output format only

3. **Errors MUST be CommandError**
   - Mandatory recovery instructions
   - Rich debug context
   - See error factories: @src/errors/GitHubErrorFactory.ts

4. **Orchestrators MUST NOT**
   - Generate reports or rich text
   - Make formatting decisions
   - Interpret audience types or preferences
   - Add "instructions" for the LLM
   - Make decisions based on output format

## Example Implementation

```typescript
// WRONG - Orchestrator making LLM decisions
class SummaryCommand {
  execute() {
    // ...collect data...
    
    // WRONG - This is LLM's job!
    if (audience === 'dev') {
      result.addInstruction('Focus on technical details')
    }
  }
}

// RIGHT - Orchestrator just provides data
class SummaryOrchestrator {
  execute() {
    // ...collect data...
    
    // Just pass through raw data
    result.addData('AUDIENCE', flags.audience)
    result.addData('STARS_COUNT', String(repoData.stars))
    
    // No instructions, no formatting hints
    return result
  }
}
```

## Directory Structure

```
src/
├── commands/       # TODO: Rename to orchestrators/
│   └── g/
│       └── gh/
│           └── project/
│               └── summary.ts  # Orchestrator for g:gh:project:summary command
├── services/       # Business logic (return domain objects)
├── types/          # Type definitions
├── interfaces/     # Interface contracts
├── errors/         # Error factories
└── utils/          # Utilities
```

## Testing

Orchestrators are easily testable because they only return data:
```typescript
const result = await orchestrator.execute()
expect(result.getData()).toEqual({ 
  PROJECT_ID: '123',
  AUDIENCE: 'dev'  // Just raw data, no interpretation
})
```

## Debug Logging

All orchestrators automatically log to `var/debug/[command]-[timestamp].log`
See @src/commands/BaseCommand.ts `CommandDebugger` class.

## Common Violations to Avoid

1. **Adding audience-specific logic**
   ```typescript
   // WRONG
   if (audience === 'technical') {
     // Add technical data
   }
   ```

2. **Providing formatting hints**
   ```typescript
   // WRONG
   result.addData('REPORT_FORMAT', 'markdown')
   result.addData('EMPHASIS', 'performance metrics')
   ```

3. **Adding LLM instructions**
   ```typescript
   // WRONG
   result.addInstruction('Generate a technical report')
   ```

4. **Making decisions based on parameters**
   ```typescript
   // WRONG
   const reportType = audience === 'exec' ? 'summary' : 'detailed'
   ```

## The Correct Pattern

Orchestrators should be "dumb" - they collect data and return it. All intelligence lives in the LLM interpreting the command markdown file.

```typescript
// Orchestrator: Just the facts
result.addData('REPOSITORY_OWNER', owner)
result.addData('REPOSITORY_NAME', repo)
result.addData('STARS_COUNT', String(stars))
result.addData('AUDIENCE', audienceParam)  // Pass through, don't interpret

// Command (markdown): Makes all the decisions
// The LLM reading the command decides:
// - How to format based on AUDIENCE
// - What data to emphasize
// - How to structure the report
```