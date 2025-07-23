# GitHub Issue: Custom ESLint Rules for Architecture Enforcement

## Title
Implement Custom ESLint Rules for CC Commands Architecture

## Description

We need custom ESLint rules to enforce our architectural patterns and prevent violations of our core principles. These rules will help maintain code quality and consistency across the codebase.

## Motivation

Our architecture relies on several key patterns that are easy to violate accidentally:
1. No magic strings - all data keys must be constants
2. Functional dependency injection - no `new` in orchestrators
3. DTO pattern enforcement - all data exchange via DTOs
4. Explicit return types - no implicit any

Without automated enforcement, these patterns rely entirely on code review, which is error-prone.

## Proposed Rules

### 1. `no-magic-strings-in-dto`

Enforce that DTO `toLLMData()` methods only use const keys:

```typescript
// ❌ BAD
toLLMData() {
  return {
    'REPOSITORY_NAME': this.name,  // Magic string!
  }
}

// ✅ GOOD
toLLMData() {
  return {
    [MyDTO.Keys.REPOSITORY_NAME]: this.name,
  }
}
```

### 2. `no-magic-strings-in-data`

Prevent string literals in `addData()` calls:

```typescript
// ❌ BAD
result.addData('REPO_NAME', name)  // Magic string!

// ✅ GOOD
result.addData(DataKeys.NAME, name)  // Generic key
// or better:
result.addDataFromDTO(repoDto)  // Use DTO
```

### 3. `prefer-dto-over-adddata`

Warn when using `addData()` instead of `addDataFromDTO()`:

```typescript
// ⚠️ WARNING
result.addData(DataKeys.NAME, 'value')

// ✅ PREFERRED
result.addDataFromDTO(myDto)
```

### 4. `no-new-in-orchestrators`

Prevent instantiation in orchestrator functions:

```typescript
// ❌ BAD - in orchestrator
const service = new GitHubApiService()

// ✅ GOOD - injected
function executeCommand(services: { api: IGitHubApiService })
```

Allowed exceptions:
- `new Error()`, `new CommandError()`
- `new Date()`
- `new Map()`, `new Set()`
- `new Promise()`
- `new RegExp()`

### 5. `dto-must-implement-interface`

All DTOs must implement `ILLMDataDTO`:

```typescript
// ❌ BAD
export class MyDataDTO {
  toLLMData() { }
}

// ✅ GOOD
export class MyDataDTO implements ILLMDataDTO {
  toLLMData(): Record<string, string> { }
}
```

### 6. `dto-keys-must-be-const`

DTO key definitions must be readonly constants:

```typescript
// ❌ BAD
class MyDTO {
  static Keys = {  // Mutable!
    FIELD: 'FIELD'
  }
}

// ✅ GOOD
class MyDTO {
  private static readonly Keys = {
    FIELD: 'FIELD'
  } as const
}
```

### 7. `require-explicit-return-types`

All public methods must have explicit return types:

```typescript
// ❌ BAD
async getData(id: string) {
  return await this.api.get(id)
}

// ✅ GOOD
async getData(id: string): Promise<DataDTO> {
  return await this.api.get(id)
}
```

### 8. `service-must-return-dto`

Service methods should return DTOs, not raw data:

```typescript
// ❌ BAD
async getRepo(): Promise<any> { }
async getRepo(): Promise<{ name: string }> { }

// ✅ GOOD
async getRepo(): Promise<RepositoryDTO> { }
async getRepo(): Promise<RepositoryDTO | null> { }
```

## Implementation Plan

### Phase 1: Core Rules
1. `no-magic-strings-in-dto` - Critical for data consistency
2. `no-new-in-orchestrators` - Enforces DI pattern
3. `require-explicit-return-types` - Type safety

### Phase 2: Enhancement Rules
4. `prefer-dto-over-adddata` - Code quality
5. `dto-must-implement-interface` - Pattern enforcement
6. `dto-keys-must-be-const` - Immutability

### Phase 3: Advanced Rules
7. `service-must-return-dto` - Architecture enforcement
8. `no-magic-strings-in-data` - Complete string literal prevention

## Technical Approach

### 1. Create ESLint Plugin

```typescript
// eslint-plugin-cc-commands/index.js
module.exports = {
  rules: {
    'no-magic-strings-in-dto': require('./rules/no-magic-strings-in-dto'),
    'no-new-in-orchestrators': require('./rules/no-new-in-orchestrators'),
    // ... other rules
  }
}
```

### 2. Rule Implementation Example

```typescript
// rules/no-magic-strings-in-dto.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce const keys in DTO toLLMData methods',
      category: 'Best Practices',
    },
    fixable: null,
    schema: []
  },
  
  create(context) {
    return {
      'MethodDefinition[key.name="toLLMData"] ObjectExpression > Property'(node) {
        if (node.key.type === 'Literal') {
          context.report({
            node: node.key,
            message: 'Use const keys instead of string literals in toLLMData()'
          });
        }
      }
    };
  }
};
```

### 3. Integration

```javascript
// eslint.config.mjs
import ccCommands from 'eslint-plugin-cc-commands';

export default [
  {
    plugins: {
      'cc-commands': ccCommands
    },
    rules: {
      'cc-commands/no-magic-strings-in-dto': 'error',
      'cc-commands/no-new-in-orchestrators': 'error',
      'cc-commands/prefer-dto-over-adddata': 'warn',
      // ... other rules
    }
  }
];
```

## Testing

Each rule should have comprehensive tests:

```typescript
// tests/no-magic-strings-in-dto.test.js
const rule = require('../rules/no-magic-strings-in-dto');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-magic-strings-in-dto', rule, {
  valid: [
    {
      code: `
        class MyDTO {
          private static readonly Keys = { FOO: 'FOO' } as const;
          toLLMData() {
            return { [MyDTO.Keys.FOO]: this.foo };
          }
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        class MyDTO {
          toLLMData() {
            return { 'FOO': this.foo };
          }
        }
      `,
      errors: [{ message: 'Use const keys instead of string literals in toLLMData()' }],
    },
  ],
});
```

## Benefits

1. **Automated enforcement** - No reliance on manual code review
2. **Immediate feedback** - Errors shown in IDE
3. **Consistency** - Same rules for everyone
4. **Documentation** - Rules document our patterns
5. **Onboarding** - New developers learn patterns through errors

## Alternatives Considered

1. **TypeScript compiler plugins** - Too complex, poor IDE support
2. **Pre-commit hooks only** - No real-time feedback
3. **Manual code review** - Error-prone, doesn't scale
4. **Generic ESLint rules** - Can't enforce our specific patterns

## Resources

- [ESLint Custom Rules Guide](https://eslint.org/docs/latest/developer-guide/working-with-rules)
- [AST Explorer](https://astexplorer.net/) - For understanding code structure
- [typescript-eslint](https://typescript-eslint.io/) - TypeScript support

## Success Criteria

1. All rules implemented and tested
2. Zero false positives in existing codebase
3. Clear error messages with examples
4. Documentation for each rule
5. Integration with CI/CD pipeline

## Labels

- enhancement
- tooling
- code-quality
- developer-experience