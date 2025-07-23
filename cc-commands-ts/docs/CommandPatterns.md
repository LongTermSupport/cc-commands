# Command Patterns

## Command Structure

Commands in this architecture are **thin wrappers** that:
1. Parse CLI arguments using oclif
2. Create services via factory
3. Call the orchestrator
4. Return the result

## Basic Command Pattern

```typescript
import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../BaseCommand.js'
import { ServiceFactory } from '../../factories/ServiceFactory.js'
import { executeMyCommand } from '../../orchestrators/executeMyCommand.js'

export default class MyCommand extends BaseCommand {
  static override description = 'Brief description of what this command does'
  
  static override examples = [
    '<%= config.bin %> <%= command.id %> input-value',
    '<%= config.bin %> <%= command.id %> --flag value',
  ]
  
  static override args = {
    input: Args.string({
      description: 'The input to process',
      required: true
    })
  }
  
  static override flags = {
    option: Flags.string({
      char: 'o',
      description: 'An optional flag',
      default: 'default-value'
    })
  }
  
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(MyCommand)
    const services = ServiceFactory.createMyCommandServices()
    return executeMyCommand(services, args, flags)
  }
}
```

## Common Patterns

### 1. URL or Manual Input

```typescript
static override args = {
  url: Args.string({
    description: 'Resource URL',
    required: false  // Optional because we have flags alternative
  })
}

static override flags = {
  owner: Flags.string({
    char: 'o',
    description: 'Resource owner (use with --name)',
    dependsOn: ['name']  // Requires both flags together
  }),
  name: Flags.string({
    char: 'n',
    description: 'Resource name (use with --owner)',
    dependsOn: ['owner']
  })
}

// In orchestrator, handle both input modes
if (args.url) {
  // Parse URL
} else if (flags.owner && flags.name) {
  // Use manual input
} else {
  // Auto-detect from current directory
}
```

### 2. Authentication Token

```typescript
static override flags = {
  token: Flags.string({
    char: 't',
    description: 'API token (or use TOKEN env var)',
    env: 'API_TOKEN'  // Automatically reads from env
  })
}

// In service factory
createServices(flags.token || process.env['API_TOKEN'])
```

### 3. Output Format

```typescript
static override flags = {
  format: Flags.string({
    char: 'f',
    description: 'Output format',
    options: ['json', 'yaml', 'text'],
    default: 'text'
  })
}
```

### 4. Verbose/Debug Mode

```typescript
static override flags = {
  verbose: Flags.boolean({
    char: 'v',
    description: 'Show detailed output',
    default: false
  }),
  debug: Flags.boolean({
    description: 'Show debug information',
    default: false
  })
}
```

## Complex Command Example

```typescript
// src/commands/analyze/repository.ts
import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../BaseCommand.js'
import { ServiceFactory } from '../../../factories/ServiceFactory.js'
import { executeRepositoryAnalysis } from '../../../orchestrators/analyze/executeRepositoryAnalysis.js'

export default class Repository extends BaseCommand {
  static override description = 'Analyze a code repository for patterns and metrics'
  
  static override examples = [
    // URL mode
    '<%= config.bin %> <%= command.id %> https://github.com/owner/repo',
    
    // Manual mode
    '<%= config.bin %> <%= command.id %> --owner facebook --repo react',
    
    // Auto mode with options
    '<%= config.bin %> <%= command.id %> --depth 10 --include-tests',
    
    // With authentication
    '<%= config.bin %> <%= command.id %> https://github.com/private/repo --token ghp_xxx',
  ]
  
  static override args = {
    repository: Args.string({
      description: 'Repository URL or path',
      required: false
    })
  }
  
  static override flags = {
    // Input alternatives
    owner: Flags.string({
      char: 'o',
      description: 'Repository owner',
      dependsOn: ['repo']
    }),
    repo: Flags.string({
      char: 'r',
      description: 'Repository name',
      dependsOn: ['owner']
    }),
    
    // Analysis options
    depth: Flags.integer({
      char: 'd',
      description: 'Analysis depth (days of history)',
      default: 30,
      min: 1,
      max: 365
    }),
    'include-tests': Flags.boolean({
      description: 'Include test files in analysis',
      default: false
    }),
    branch: Flags.string({
      char: 'b',
      description: 'Branch to analyze',
      default: 'main'
    }),
    
    // Authentication
    token: Flags.string({
      char: 't',
      description: 'GitHub token (or use GITHUB_TOKEN env)',
      env: 'GITHUB_TOKEN'
    }),
    
    // Output control
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['summary', 'detailed', 'json'],
      default: 'summary'
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output file path',
      exclusive: ['owner']  // Can't use -o for both
    })
  }
  
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(Repository)
    
    // Validate input combinations
    if (!args.repository && !flags.owner && !flags.repo) {
      this.error('Provide either a repository URL or --owner and --repo flags')
    }
    
    // Create services with authentication
    const services = ServiceFactory.createAnalysisServices(flags.token)
    
    // Execute orchestrator
    return executeRepositoryAnalysis(services, args, flags)
  }
}
```

## Command Naming

### File Structure
```
src/commands/
├── simple.ts              # Single-word command: /simple
├── analyze/
│   ├── repository.ts      # Subcommand: /analyze:repository
│   └── dependencies.ts    # Subcommand: /analyze:dependencies
└── g/
    └── gh/
        └── project/
            └── summary.ts # Nested: /g:gh:project:summary
```

### Naming Conventions

1. **Use descriptive names**: `analyze` not `a`
2. **Group related commands**: `analyze:repository`, `analyze:dependencies`
3. **Follow domain structure**: `g:gh:*` for GitHub commands

## Error Handling in Commands

```typescript
async execute(): Promise<LLMInfo> {
  const { args, flags } = await this.parse(MyCommand)
  
  // Input validation (throws oclif error)
  if (!args.input && !flags.fallback) {
    this.error('Either input argument or --fallback flag is required', {
      suggestions: ['Try: mycommand "input"', 'Or: mycommand --fallback default']
    })
  }
  
  // Let orchestrator handle business errors
  const services = ServiceFactory.createServices()
  return executeMyCommand(services, args, flags)
}
```

## Testing Commands

### Integration Test (Limited)

```typescript
describe('mycommand', () => {
  beforeEach(() => {
    process.env['TEST_MODE'] = 'true'
  })

  it('should parse arguments correctly', async () => {
    const { error } = await runCommand([
      'mycommand',
      'test-input',
      '--option', 'test-value'
    ])
    
    expect(error).toBeUndefined()
  })
  
  it('should require input', async () => {
    const { error } = await runCommand(['mycommand'])
    
    expect(error).toBeDefined()
    expect(error?.message).toContain('Missing required arg')
  })
})
```

### Unit Test (Preferred)

Test the orchestrator directly - see orchestrator tests.

## Command Best Practices

1. **Keep it thin** - Commands only handle CLI concerns
2. **Validate early** - Check required flag combinations
3. **Clear examples** - Show all usage patterns
4. **Helpful errors** - Provide suggestions for fixes
5. **Use oclif features** - env vars, dependsOn, exclusive
6. **Document flags** - Clear descriptions for --help

## Anti-Patterns to Avoid

❌ **Business logic in command**
```typescript
// Bad - logic should be in orchestrator
async execute() {
  const data = await fetch(url)
  const processed = data.map(...)
  return LLMInfo.create().addData(...)
}
```

❌ **Creating services directly**
```typescript
// Bad - use factory
const service = new DataService()
```

❌ **Complex flag validation**
```typescript
// Bad - too much logic
if (flags.a && !flags.b && (flags.c || flags.d)) {
  if (flags.e > 10 && flags.f < 5) {
    // ...
  }
}

// Good - move to orchestrator
return executeCommand(services, args, flags)
```