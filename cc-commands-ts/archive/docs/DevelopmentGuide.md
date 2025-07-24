# Development Guide

## Setup

```bash
# Install dependencies
npm install

# Run initial QA check
npm run qa

# Start development
npm run test:watch
```

## Development Workflow

### 1. Creating a New Feature

Always start with the DTO:

```typescript
// 1. Define the data structure
// src/dto/MyFeatureDataDTO.ts
export class MyFeatureDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    FEATURE_NAME: 'FEATURE_NAME',
    FEATURE_STATUS: 'FEATURE_STATUS',
  } as const

  constructor(
    public readonly name: string,
    public readonly status: 'active' | 'inactive'
  ) {}

  toLLMData(): Record<string, string> {
    return {
      [MyFeatureDataDTO.Keys.FEATURE_NAME]: this.name,
      [MyFeatureDataDTO.Keys.FEATURE_STATUS]: this.status
    }
  }
}
```

### 2. Create Service Interface

```typescript
// src/interfaces/IMyFeatureService.ts
export interface IMyFeatureService {
  /**
   * Get feature data
   * @returns Feature information
   */
  getFeatureData(id: string): Promise<MyFeatureDataDTO>
}
```

### 3. Implement Service

```typescript
// src/services/MyFeatureService.ts
export class MyFeatureService implements IMyFeatureService {
  constructor(private readonly api: IApiClient) {}

  async getFeatureData(id: string): Promise<MyFeatureDataDTO> {
    const response = await this.api.get(`/features/${id}`)
    
    if (!response.name) {
      throw new Error(`Feature ${id} not found`)
    }
    
    return new MyFeatureDataDTO(
      response.name,
      response.status
    )
  }
}
```

### 4. Create Orchestrator

```typescript
// src/orchestrators/myfeature/executeMyFeature.ts
export interface MyFeatureServices {
  featureService: IMyFeatureService
  envValidator: IOrchestrationService
}

export async function executeMyFeature(
  services: MyFeatureServices,
  args: { featureId: string },
  flags: { verbose?: boolean }
): Promise<LLMInfo> {
  const result = LLMInfo.create()
  
  // Validate environment
  const envResult = await services.envValidator.execute({
    params: { requiredEnvVars: ['API_KEY'] }
  })
  
  result.merge(envResult)
  if (envResult.hasError()) {
    return result
  }
  
  // Get feature data
  try {
    const featureData = await services.featureService.getFeatureData(args.featureId)
    result.addDataFromDTO(featureData)
    result.addAction('Feature retrieval', 'success')
  } catch (error) {
    result.setError(error)
    result.addAction('Feature retrieval', 'failed')
  }
  
  return result
}
```

### 5. Create Command

```typescript
// src/commands/myfeature.ts
export default class MyFeature extends BaseCommand {
  static override description = 'Get feature information'
  
  static override args = {
    featureId: Args.string({
      description: 'Feature ID to retrieve',
      required: true
    })
  }
  
  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output'
    })
  }
  
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(MyFeature)
    const services = ServiceFactory.createMyFeatureServices()
    return executeMyFeature(services, args, flags)
  }
}
```

### 6. Write Tests

```typescript
// test/unit/orchestrators/executeMyFeature.test.ts
describe('executeMyFeature', () => {
  it('should retrieve feature data', async () => {
    const mockFeatureData = new MyFeatureDataDTO('test-feature', 'active')
    
    const mockServices: MyFeatureServices = {
      featureService: {
        getFeatureData: vi.fn().mockResolvedValue(mockFeatureData)
      },
      envValidator: {
        execute: vi.fn().mockResolvedValue(
          LLMInfo.create().addData(DataKeys.VALID, 'true')
        )
      }
    }
    
    const result = await executeMyFeature(
      mockServices,
      { featureId: 'test-123' },
      { verbose: false }
    )
    
    expect(result.hasError()).toBe(false)
    expect(result.getData()).toMatchObject({
      FEATURE_NAME: 'test-feature',
      FEATURE_STATUS: 'active'
    })
  })
})
```

## Quality Checks

### After Every Change

```bash
npm run qa
```

This runs:
1. TypeScript compilation
2. ESLint with auto-fix
3. All tests

### Individual Checks

```bash
npm run typecheck    # TypeScript only
npm run lint         # ESLint with auto-fix
npm run test         # Tests only
npm run test:watch   # TDD mode
```

## Common Tasks

### Adding a New Data Field

1. Add to DTO Keys:
   ```typescript
   private static readonly Keys = {
     EXISTING_FIELD: 'EXISTING_FIELD',
     NEW_FIELD: 'NEW_FIELD',  // Add here
   } as const
   ```

2. Add to constructor:
   ```typescript
   constructor(
     public readonly existingField: string,
     public readonly newField: string  // Add here
   ) {}
   ```

3. Add to toLLMData:
   ```typescript
   toLLMData(): Record<string, string> {
     return {
       [MyDTO.Keys.EXISTING_FIELD]: this.existingField,
       [MyDTO.Keys.NEW_FIELD]: this.newField  // Add here
     }
   }
   ```

### Handling Optional Data

```typescript
toLLMData(): Record<string, string> {
  const data: Record<string, string> = {
    [MyDTO.Keys.REQUIRED_FIELD]: this.requiredField
  }
  
  // Only add if present
  if (this.optionalField) {
    data[MyDTO.Keys.OPTIONAL_FIELD] = this.optionalField
  }
  
  return data
}
```

### Error Handling

Always fail fast with context:

```typescript
// In service
if (!response.data) {
  throw new CommandError('No data returned from API', {
    recovery: 'Check your API key and network connection',
    context: { endpoint: '/features', id: featureId }
  })
}

// In orchestrator
try {
  const data = await service.getData()
  result.addDataFromDTO(data)
} catch (error) {
  result.setError(error)
  result.addAction('Data retrieval', 'failed')
}
```

## Debugging

### Enable Debug Logging

```bash
DEBUG=* npm run test
```

### Check Generated JavaScript

```bash
npm run build
cat dist/commands/mycommand.js
```

### Test Specific File

```bash
npm run test src/services/MyService.test.ts
```

## Common Issues

### TypeScript Errors

**"No implicit any"**
```typescript
// Bad
function process(data) { }

// Good
function process(data: unknown) { }
// or
function process(data: MyDataDTO) { }
```

**"Object is possibly null"**
```typescript
// Bad
const name = response.user.name

// Good
const name = response.user?.name ?? 'Unknown'
```

### ESLint Errors

**"Orchestrators must not instantiate"**
```typescript
// Bad - in orchestrator
const service = new MyService()

// Good - inject via parameter
function executeMyFeature(services: { myService: IMyService })
```

**"Prefer DTO over addData"**
```typescript
// Bad
result.addData('KEY', 'value')

// Good
result.addDataFromDTO(myDto)
```

## Performance Tips

1. **Batch API calls** when possible
2. **Use DTOs** to avoid repeated transformations
3. **Cache expensive operations** in services
4. **Fail fast** to avoid unnecessary work

## Code Style

### Naming Conventions

- **DTOs**: `*DTO` suffix (e.g., `RepositoryDataDTO`)
- **Services**: `*Service` suffix (e.g., `DataCollectionService`)
- **Interfaces**: `I*` prefix (e.g., `IDataCollectionService`)
- **Orchestrators**: `execute*` prefix (e.g., `executeProjectSummary`)

### File Organization

```
src/
├── commands/          # Oclif command classes
├── constants/         # Shared constants
├── dto/              # Data Transfer Objects
├── factories/        # Service factories
├── interfaces/       # TypeScript interfaces
├── orchestrators/    # Pure orchestration functions
├── services/         # Business logic services
├── types/           # Type definitions
└── utils/           # Utility functions
```