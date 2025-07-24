# ESLint Guidelines and Solutions

This document tracks common ESLint issues encountered in the project and their proper solutions. **All developers must follow these guidelines and update this document when new patterns emerge.**

## Core Principles

1. **Respect ESLint rules** - They exist for good reasons (maintainability, consistency, best practices)
2. **Fix complexity issues** by refactoring, not ignoring
3. **Use ESLint disable comments ONLY as last resort** when architectural constraints prevent proper solutions
4. **Document all disable comments** with clear explanations

## Common Issues and Solutions

### 1. Process Exit in Commands

**❌ Problem:**
```typescript
// ESLint errors: n/no-process-exit, unicorn/no-process-exit
process.exit(1)
process.exit(result.getExitCode())
```

**✅ OCLIF Solution:**
```typescript
import { Command } from '@oclif/core'

export default class MyCommand extends Command {
  async run(): Promise<void> {
    // For success - just return normally
    return
    
    // For errors - throw with exit code
    this.error('Error message', { exit: 1 })
    
    // Or use this.exit() for non-error exits
    this.exit(0) // Success
    this.exit(1) // Error
  }
}
```

**When to use each:**
- `return` - Normal success completion
- `this.error(message, {exit: code})` - Error conditions with message
- `this.exit(code)` - Silent exit with specific code

### 2. Method Complexity (Max: 20)

**❌ Problem:**
```typescript
// Complexity: 25+ 
static fromApiResponse(response: any): DTO {
  // 50+ lines of validation, transformation, error handling
}
```

**✅ Solution - Extract Private Methods:**
```typescript
static fromApiResponse(response: ApiResponse): DTO {
  this.validateApiResponse(response)
  const transformedData = this.transformApiData(response)
  return new DTO(transformedData)
}

private static validateApiResponse(response: ApiResponse): void {
  // Validation logic extracted
}

private static transformApiData(response: ApiResponse): DTOConfig {
  // Transformation logic extracted
}
```

**Refactoring Strategy:**
1. **Extract validation** into separate methods
2. **Extract transformation** logic 
3. **Extract error handling** patterns
4. **Group related conditions** into helper methods
5. **Use early returns** to reduce nesting

### 3. Type Safety (`@typescript-eslint/no-explicit-any`)

**❌ Problem:**
```typescript
function processData(data: any): void {
  // Using any defeats TypeScript benefits
}
```

**✅ Solution:**
```typescript
// Create proper interfaces
interface ApiResponse {
  id: string
  name: string
  // ... other properties
}

function processData(data: ApiResponse): void {
  // Type-safe implementation
}

// For truly unknown data, use unknown
function processUnknownData(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    // Type guard and process
  }
}
```

### 4. Constructor Parameter Limits (`max-params`)

**❌ Problem:**
```typescript
// Regular classes - max 4 parameters
constructor(
  param1: string,
  param2: string,
  param3: number,
  param4: boolean,
  param5: Date // 5+ parameters - ESLint error
) {}
```

**✅ Solution for Regular Classes - Configuration Object:**
```typescript
interface ServiceConfig {
  param1: string
  param2: string
  param3: number
  param4: boolean
  param5: Date
}

constructor(config: ServiceConfig) {
  this.param1 = config.param1
  // ... assign other properties
}
```

**✅ Solution for DTOs - Unlimited Parameters Allowed:**
```typescript
// DTOs (*DTO.ts files) are exempt from max-params rule
export class ProjectDataDTO implements ILLMDataDTO {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly url: string,
    public readonly description: string | null,
    public readonly owner: string,
    public readonly ownerType: 'ORGANIZATION' | 'USER',
    // ... unlimited parameters allowed for DTOs
    public readonly visibility: 'PRIVATE' | 'PUBLIC'
  ) {}
}
```

**Why DTOs are Different:**
- DTOs represent immutable data structures
- All properties must be `readonly` for immutability  
- Constructor injection is the cleanest pattern for DTOs
- Configuration objects add unnecessary complexity for data structures

## ESLint Disable Guidelines

**Only use ESLint disable comments when:**
1. **External API constraints** force specific patterns
2. **Legacy code integration** requires temporary workarounds  
3. **Performance-critical code** where rules conflict with optimization
4. **Generated code** that cannot be modified

**Format for disable comments:**
```typescript
// ESLint-disable-next-line rule-name -- Reason: Specific explanation why this is necessary
const problematicCode = something()

/* ESLint-disable rule-name */
// Multiple lines that need to disable rule
// More problematic code
/* ESLint-enable rule-name */
```

**❌ Never do this:**
```typescript
// ESLint-disable-next-line rule-name
const code = bad() // No explanation

/* ESLint-disable */ // Disables ALL rules
```

## ESLint Configuration

### DTO-Specific Rules

The project's ESLint configuration automatically exempts DTO files from certain rules:

```javascript
// eslint.config.mjs
{
  // Special rules for DTO classes - allow unlimited constructor parameters
  files: ['**/*DTO.ts'],
  rules: {
    'max-params': 'off' // DTOs can have any number of constructor parameters
  }
}
```

This means:
- Files ending in `*DTO.ts` can have unlimited constructor parameters
- Regular classes still have a max of 4 parameters
- No manual ESLint disable comments needed in DTO files

## Rule-Specific Guidelines

### Complexity Rule
- **Max complexity: 20**
- **Always refactor** rather than disable
- **Extract methods** for logical groupings
- **Use early returns** to reduce nesting
- **If unavoidable**, document why complexity cannot be reduced

### Process Exit Rules
- **Always use OCLIF methods** in commands
- **Never use `process.exit()`** directly in commands
- **Use `this.error()` or `this.exit()`** for proper OCLIF integration

### Type Safety Rules  
- **Create proper interfaces** for external data
- **Use `unknown`** for truly unknown data
- **Add type guards** when processing unknown data
- **Never use `any`** except for truly dynamic content

## Updating This Document

**When encountering new ESLint issues:**
1. **Research the proper solution** (don't just disable)
2. **Add the pattern** to this document
3. **Include both wrong and right examples**
4. **Update related team members** about new patterns

**This document should be referenced in:**
- Code review process
- Onboarding documentation  
- Architecture decision records
- Pull request templates