# cc-commands TypeScript Development Guide

## Core Architecture Principle

**Orchestrators provide raw data, LLMs make decisions.**

TypeScript code (orchestrators) performs deterministic operations and returns raw KEY=value data. The LLM interprets commands and decides how to format output based on audience needs.

## 🚨 FAIL FAST Principle

**Never hide errors. When something is wrong, throw immediately with a clear error message.**

### What "Fail Fast" Means

Fail fast means detecting and reporting errors as soon as they occur, rather than attempting to continue with potentially corrupt or invalid state. This principle:

1. **Catches bugs early** - Problems are identified at their source, not in unrelated code later
2. **Makes debugging easier** - Stack traces point to the actual problem
3. **Prevents data corruption** - Invalid operations stop before causing damage
4. **Improves reliability** - Explicit failures are better than silent incorrect behavior

### Examples

❌ **BAD - Error Hiding**:
```typescript
// DON'T DO THIS - hides the real problem
const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
return {
  owner: match?.[1] || '',  // Returns empty string if no match
  repo: match?.[2] || ''    // Hides the parsing failure
}
```

✅ **GOOD - Fail Fast**:
```typescript
// DO THIS - fail immediately with clear error
const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
if (!match || !match[1] || !match[2]) {
  throw new Error(`Invalid GitHub URL format: ${url}`)
}
return {
  owner: match[1],
  repo: match[2]
}
```

❌ **BAD - Swallowing Exceptions**:
```typescript
// DON'T DO THIS - catches and ignores errors
try {
  const data = await api.fetchData()
  return data
} catch (error) {
  console.log('Failed to fetch data')
  return null  // Caller doesn't know what went wrong
}
```

✅ **GOOD - Fail Fast with Context**:
```typescript
// DO THIS - wrap with meaningful context
try {
  const data = await api.fetchData()
  return data
} catch (error) {
  throw new CommandError('Failed to fetch repository data', {
    cause: error,
    recovery: 'Check your GitHub token and network connection',
    context: { repository: repoName }
  })
}
```

### When to Apply Fail Fast

1. **Input validation** - Invalid arguments should throw immediately
2. **Precondition checks** - Missing requirements should fail before proceeding
3. **Parse failures** - If a regex/parser expects a format and doesn't get it, throw
4. **API errors** - Don't return null/undefined, throw with context
5. **Type assertions** - If something should never be null/undefined, throw if it is

## Quality Assurance Requirements

### 🚨 CRITICAL: Run QA After Every Change

**After ANY file edit, create, or update, you MUST run:**

```bash
npm run qa
```

This runs:
1. `npm run typecheck` - TypeScript type checking
2. `npm run lint` - ESLint validation 
3. `npm run test` - Test suite execution

**If ANY step fails, fix immediately before proceeding.**

### Test-First Development

**Write tests FIRST whenever possible:**

1. Create test file: `src/[path]/[name].test.ts`
2. Write tests describing expected behavior
3. Run `npm run test:watch` to see tests fail
4. Implement code to make tests pass
5. Run `npm run qa` to ensure all checks pass

### After Progress Steps

**Run tests after each meaningful progress step:**

- After implementing a new service → `npm run test`
- After refactoring existing code → `npm run qa`
- After fixing a bug → `npm run test`
- Before committing → `npm run qa`

## Development Workflow

### 1. Starting Development

```bash
# Install dependencies
npm install

# Run initial QA to ensure clean state
npm run qa

# Start test watcher for TDD
npm run test:watch
```

### 2. Creating New Components

#### Commands (Two-Part Pattern)

**Part 1: Pure Orchestration Function**
```bash
# 1. Create orchestration test
touch src/orchestrators/g/namespace/executeMyCommand.test.ts

# 2. Write test cases with mocked services
# 3. Create orchestration implementation
touch src/orchestrators/g/namespace/executeMyCommand.ts

# 4. Run tests
npm run test
```

**Part 2: Oclif Command Wrapper**
```bash
# 1. Create thin command wrapper
touch src/commands/g/namespace/mycommand.ts

# 2. Import orchestration function
# 3. Wire up with ServiceFactory

# 4. Run full QA
npm run qa
```

#### Example Implementation

```typescript
// src/orchestrators/g/namespace/executeMyCommand.ts
export interface MyCommandServices {
  service1: IService1
  service2: IService2
}

export async function executeMyCommand(
  services: MyCommandServices,
  args: { input?: string },
  flags: { option: string }
): Promise<LLMInfo> {
  // Pure orchestration logic here
  const result = LLMInfo.create()
  // ... use services to do work ...
  return result
}

// src/commands/g/namespace/mycommand.ts
import { executeMyCommand } from '../../../orchestrators/g/namespace/executeMyCommand.js'

export default class MyCommand extends BaseCommand {
  static override args = {
    input: Args.string({ required: false })
  }
  
  static override flags = {
    option: Flags.string({ default: 'default' })
  }
  
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(MyCommand)
    const services = ServiceFactory.createMyCommandServices()
    return executeMyCommand(services, args, flags)
  }
}
```

#### Services
```bash
# 1. Define interface
touch src/interfaces/IMyService.ts

# 2. Create test with mock
touch src/services/MyService.test.ts

# 3. Implement service
touch src/services/MyService.ts

# 4. Run full QA
npm run qa
```

### 3. Fixing Issues

```bash
# Auto-fix linting issues
npm run lint:fix

# Check types only
npm run typecheck

# Run specific test file
npm run test src/services/MyService.test.ts
```

## ESLint Configuration

### Strict Rules Enforced

1. **TypeScript Strictness**
   - Explicit return types required
   - No `any` types allowed
   - Strict null checks
   - No floating promises

2. **Architecture Enforcement**
   - No `new` in orchestrators (use DI)
   - Services injected via constructor
   - Interfaces over implementations

3. **Code Quality**
   - JSDoc comments required
   - Import ordering enforced
   - No console.log (use proper logging)
   - Prefer arrow functions

4. **Best Practices**
   - Error messages required
   - Nullish coalescing over ||
   - Optional chaining required
   - No array forEach/reduce

### Architecture-Specific Rules

#### Orchestrators (`**/orchestrators/**`, `**/commands/**`)
- **NO `new` keyword** (except Error, Date, RegExp, Map, Set, Promise)
- Must use dependency injection
- Explicit return types on all methods
- Return only LLMInfo instances

#### Services (`**/services/**`)
- Can instantiate objects
- Must implement interfaces
- Handle errors with context
- Be stateless and reusable

#### Tests (`**/*.test.ts`, `**/*.spec.ts`)
- Relaxed rules for testing
- `any` allowed for mocks
- console.log allowed
- No JSDoc required

## Testing Standards

### Test Structure

```typescript
describe('executeMyCommand', () => {
  it('should handle success case', async () => {
    // Arrange - Mock services
    const mockServices: MyCommandServices = {
      service1: {
        method1: vi.fn().mockResolvedValue({ data: 'test' })
      },
      service2: {
        method2: vi.fn().mockResolvedValue({ status: 'ok' })
      }
    }
    
    // Act - Call pure function
    const result = await executeMyCommand(
      mockServices,
      { input: 'test' },
      { option: 'value' }
    )
    
    // Assert - Check result
    expect(result.hasError()).toBe(false)
    expect(result.getData()).toMatchObject({
      SOME_KEY: 'expected_value'
    })
    expect(mockServices.service1.method1).toHaveBeenCalledWith('test')
  })
  
  it('should handle error case', async () => {
    // Test error scenarios with mocked failures
  })
})
```

### Testing Benefits

With the functional pattern, testing is incredibly clean:

1. **No oclif overhead** - Test pure functions directly
2. **Easy mocking** - Just pass mock objects, no DI container setup
3. **Fast tests** - No command framework initialization
4. **Clear assertions** - Direct access to all inputs/outputs

### Coverage Requirements

- **Minimum 80% coverage** for all metrics
- Run coverage: `npm run test:coverage`
- View report: `open coverage/index.html`

### Mocking Strategy

```typescript
// For orchestration services that return LLMInfo
const mockEnvValidator: IOrchestrationService = {
  execute: vi.fn().mockResolvedValue(
    LLMInfo.create()
      .addData('ENV_VALID', 'true')
      .addAction('Environment check', 'success')
  )
}

// For regular services
const mockGitHubApi: IGitHubApiService = {
  getRepository: vi.fn().mockResolvedValue({ 
    name: 'test-repo',
    owner: { login: 'test-owner' }
  })
}
```

## Common Commands

```bash
# Full QA suite
npm run qa

# Individual checks
npm run typecheck
npm run lint        # Always auto-fixes now
npm run test

# Development
npm run test:watch

# Build
npm run build

# Coverage
npm run test:coverage
```

## Troubleshooting

### ESLint Errors

1. **"Orchestrators must not instantiate services"**
   - Use factory pattern or inject via constructor
   - Only Error, Date, RegExp, Map, Set, Promise allowed

2. **"Explicit return type required"**
   - Add return type annotation: `: Promise<LLMInfo>`
   - All public methods need explicit types

3. **"No console.log"**
   - Use proper logging service
   - Or use console.warn/console.error for critical messages

### TypeScript Errors

1. **"No implicit any"**
   - Add explicit type annotations
   - Use `unknown` if type truly unknown

2. **"Strict null checks"**
   - Use optional chaining: `obj?.property`
   - Use nullish coalescing: `value ?? default`

3. **"No floating promises"**
   - Always await async calls
   - Or explicitly void them: `void asyncCall()`

### Test Failures

1. **"Cannot find module"**
   - Check import paths
   - Ensure tsconfig paths are correct

2. **"Timeout errors"**
   - Increase timeout for slow operations
   - Mock external services

3. **"Coverage too low"**
   - Write tests for edge cases
   - Test error scenarios
   - Remove unreachable code

## Best Practices

1. **Always run `npm run qa` before committing**
2. **Write tests first (TDD)**
3. **Keep orchestrators thin** - logic in services
4. **Use interfaces** for all service contracts
5. **Mock external dependencies** in tests
6. **Handle errors** with meaningful context
7. **Document with JSDoc** for public APIs
8. **Follow functional DI pattern** - no `new` in orchestration functions

## Anti-Patterns to Avoid

### ❌ Don't Create Services in Commands
```typescript
// WRONG - Hard to test, violates DI
export default class Summary extends BaseCommand {
  async execute() {
    const githubApi = new GitHubApiService() // ❌ Hard dependency
    const detector = new ProjectDetectionService(githubApi) // ❌ 
  }
}
```

### ✅ Do Use Factory + Functional Pattern
```typescript
// RIGHT - Testable, clean separation
export default class Summary extends BaseCommand {
  async execute() {
    const services = ServiceFactory.createServices() // ✅ Factory for production
    return executeProjectSummary(services, args, flags) // ✅ Pure function
  }
}
```

### Why This Matters
- **Testing**: Can test `executeProjectSummary` with mocked services
- **Flexibility**: Easy to swap implementations
- **Clarity**: Command only handles CLI concerns
- **Type Safety**: Full TypeScript checking on dependencies

## Quick Reference

- Architecture docs: `CLAUDE/Architecture.md`
- DI patterns: `CLAUDE/OrchestratorArchitecture.md`
- Example orchestrator: `src/commands/g/gh/project/summary.ts`
- Example service: `src/services/DataCollectionService.ts`
- Example test: `test/commands/g/gh/project/summary.test.ts`

---

Remember: **Quality over speed**. A well-tested, properly architected codebase is easier to maintain and extend.