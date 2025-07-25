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

### 5. Sequential Await in Loops (`no-await-in-loop`)

**❌ Problem:**
```typescript
// Sequential processing - slow and prone to rate limiting
const results = []
for (const item of items) {
  const result = await apiCall(item) // Waits for each call to complete
  results.push(result)
}

// Also problematic with forEach
items.forEach(async (item) => {
  await processItem(item) // Creates uncontrolled concurrent promises
})
```

**✅ Solution - Parallel Processing with Promise.all():**
```typescript
// Parallel processing - much faster
const results = await Promise.all(
  items.map(async (item) => {
    return apiCall(item)
  })
)

// For error handling with partial results
const results = await Promise.allSettled(
  items.map(async (item) => {
    return apiCall(item)
  })
)

// Process results with error handling
const successfulResults = results
  .filter((result) => result.status === 'fulfilled')
  .map((result) => result.value)
```

**GitHub API Specific Considerations:**
```typescript
// ❌ Sequential calls - triggers rate limiting faster
for (const repo of repositories) {
  const details = await octokit.rest.repos.get({ owner, repo: repo.name })
  // Each call waits 200-500ms, total time = n * response_time
}

// ✅ Parallel calls with controlled concurrency
import pLimit from 'p-limit'

const limit = pLimit(5) // Max 5 concurrent requests
const repoDetails = await Promise.all(
  repositories.map((repo) =>
    limit(() => octokit.rest.repos.get({ owner, repo: repo.name }))
  )
)
```

**When Sequential Processing is Acceptable:**
```typescript
// ✅ Acceptable: Operations must be sequential for correctness
for (const migration of migrations) {
  await runMigration(migration) // Each depends on previous completion
}

// ✅ Acceptable: Rate limiting requires sequential processing
for (const heavyOperation of operations) {
  await heavyOperation()
  await sleep(1000) // Required delay between operations
}

// ✅ Acceptable: Memory constraints with large datasets
for (const chunk of largeDataChunks) {
  await processChunk(chunk) // Process one chunk at a time to avoid OOM
  // Clean up memory before next iteration
}
```

**Performance Impact:**
- **Sequential**: 10 API calls × 200ms = 2000ms total
- **Parallel**: 10 API calls = ~200ms total (assuming no rate limits)
- **Rate Limiting**: Sequential calls preserve rate limit budget longer

**Implementation Guidelines:**
1. **Default to `Promise.all()`** for independent operations
2. **Use `Promise.allSettled()`** when some failures are acceptable
3. **Add concurrency limits** for API calls (`p-limit` package)
4. **Only use sequential** when operations have dependencies
5. **Document the reasoning** when sequential processing is required

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

## Custom Rules

### strict-orchestrator-service-typing

This custom rule enforces strict service typing for orchestrators and orchestrator services, preventing the use of the generic `TOrchestratorServiceMap` type.

**❌ Problem:**
```typescript
// Using generic TOrchestratorServiceMap - violates architectural principles
export const myOrch = async (args: string, services: TOrchestratorServiceMap) => {
  // Loses type safety for services
}

export const myOrchServ = async (args: string, services: TOrchestratorServiceMap) => {
  // No compile-time checking of service dependencies
}

// Type aliases extending TOrchestratorServiceMap
type TMyServices = TOrchestratorServiceMap & {
  myService: IMyService
}
```

**✅ Solution:**
```typescript
// Define specific service types for each orchestrator
type TMyOrchServices = {
  projectService: IProjectService
  authService: IAuthService
  // Only the services this orchestrator actually needs
}

export const myOrch = async (args: string, services: TMyOrchServices) => {
  // Full type safety and intellisense for services
}

// For orchestrator services
type TMyOrchServServices = {
  dataService: IDataService
  apiService: IApiService
}

export const myOrchServ = async (args: string, services: TMyOrchServServices) => {
  // Clear dependencies and type checking
}

// Service types should be defined directly, not extended
type TMyServices = {
  projectService: IProjectService
  authService: IAuthService
  [key: string]: IOrchestratorService // If dynamic access needed
}
```

**Why This Rule Exists:**
1. **Type Safety**: Ensures compile-time checking of service dependencies
2. **Clear Dependencies**: Makes it obvious which services each orchestrator requires
3. **Maintainability**: Prevents accidental usage of undefined services
4. **Architecture Enforcement**: Enforces the principle of explicit dependencies

**Rule Detection:**
- Functions/constants ending with `Orch` or `OrchServ`
- Functions/constants typed as `IOrchestrator` or `IOrchestratorService`
- Type aliases that extend `TOrchestratorServiceMap`

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

### No Await in Loop Rule
- **Default to parallel processing** with `Promise.all()` or `Promise.allSettled()`
- **Use controlled concurrency** (`p-limit`) for API calls to avoid rate limiting
- **Only use sequential processing** when operations have dependencies or constraints require it
- **Always document** when sequential processing is intentionally required
- **Consider memory implications** when processing large datasets in parallel

## Custom Rules

### no-direct-abstract-types

**Purpose:** Prevents direct use of abstract types as function parameters or return types. Abstract types are meant to be extended, not used directly.

**❌ Problem:**
```typescript
// Using abstract type directly
export const myOrch: IOrchestrator = async (
  args: string,
  services: TOrchestratorServiceMap // ESLint error! Abstract type used directly
) => {
  // No type safety for services
}

// Another example with future abstract type
function processConfig(config: TAbstractBaseConfig) { // ESLint error!
  // Abstract types should not be used directly
}
```

**✅ Solution:**
```typescript
// Extend abstract type to create concrete type
export type TMyOrchServices = TOrchestratorServiceMap & {
  dataCollector: IDataCollectorService
  projectService: IProjectService
}

export const myOrch: IOrchestrator = async (
  args: string,
  services: TMyOrchServices // Concrete type that extends abstract
) => {
  // Full type safety and autocomplete
}

// Another example
export type TMyConfig = TAbstractBaseConfig & {
  apiKey: string
  timeout: number
}

function processConfig(config: TMyConfig) { // Concrete type
  // Proper type safety
}
```

**Abstract Types Convention:**
- Abstract types should be prefixed with `TAbstract` for clarity
- Currently tracked abstract types:
  - `TOrchestratorServiceMap` (should be renamed to `TAbstractOrchestratorServiceMap`)
  - Future abstract types should follow the `TAbstract` prefix convention

**Why This Rule Exists:**
1. **Type Safety**: Abstract types provide no compile-time guarantees about their contents
2. **Clear Dependencies**: Concrete types explicitly declare what's required
3. **IDE Support**: Abstract types provide no autocomplete or IntelliSense
4. **Architecture Enforcement**: Enforces proper type composition and dependency injection

**Rule Detection:**
- Checks function parameters and return types for direct use of abstract types
- Maintains a list of known abstract types
- Does NOT prevent extending abstract types in type definitions

### no-unsafe-type-casting

**Purpose:** Prevents unsafe type casting patterns that bypass TypeScript's type system.

**❌ Problem:**
```typescript
// Double casting through unknown/any
const services = myServices as unknown as SpecificType
const data = response as any as MyDataType

// Single cast to unknown/any
const result = someValue as unknown
const config = data as any
```

**✅ Solution:**
```typescript
// Use proper type definitions
const services: SpecificType = createTypedServices()

// Use type guards
if (isMyDataType(response)) {
  const data = response // Type is inferred
}

// Create proper types for API responses
interface ApiResponse {
  data: MyDataType
}
const response = await api.get<ApiResponse>(url)
```

### no-string-based-service-args

**Purpose:** Enforces typed argument passing between orchestrator services instead of error-prone string manipulation.

**❌ Problem:**
```typescript
// String concatenation for arguments
const args = projectId + ' ' + commandArgs
const params = `${owner}|${repo}|${since}`

// String parsing
const [owner, repo] = args.split(' ')
const parts = params.split('|')
```

**✅ Solution:**
```typescript
// Use typed interfaces
interface ProjectArgs {
  projectId: string
  commandArgs: string
}

interface ActivityArgs {
  owner: string
  repo: string
  since: Date
}

// Pass objects
const args: ProjectArgs = { projectId, commandArgs }
```

### require-typed-data-access

**Purpose:** Prevents unsafe property access that can cause runtime errors.

**❌ Problem:**
```typescript
// Unsafe bracket notation
const value = data['SOME_KEY']  // What if undefined?

// Array access without bounds checking
const first = array[0]  // What if empty?

// Dynamic property access
const prop = obj[variable]  // No type checking
```

**✅ Solution:**
```typescript
// Use optional chaining
const value = data['SOME_KEY'] ?? defaultValue

// Safe array access
const first = array[0] ?? defaultItem
const first = array.at(0)  // Returns undefined if empty

// Type guards for dynamic access
if (variable in obj && typeof obj[variable] === 'string') {
  const prop = obj[variable]
}
```

### no-api-response-any

**Purpose:** Ensures API responses are properly typed instead of using `any`.

**❌ Problem:**
```typescript
// Lazy typing
const data = response.data as any
const result = (await api.get(url)) as any

// DTO methods
static fromGitHubResponse(response: any) { }
```

**✅ Solution:**
```typescript
// Define response types
interface GitHubRepoResponse {
  name: string
  owner: { login: string }
  // ... other fields
}

const data = response.data as GitHubRepoResponse

// Typed DTO methods
static fromGitHubResponse(response: GitHubRepoResponse) { }
```

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