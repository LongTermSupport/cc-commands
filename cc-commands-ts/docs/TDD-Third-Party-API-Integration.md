# TDD for Third-Party API Integration

## Method

Use integration tests that call real APIs to drive implementation. Let test failures reveal the actual API structure.

## Prerequisites

- Real API credentials/tokens available in test environment
- Test API endpoint or sandbox environment

## Steps

### 1. Write Integration Test That Calls Real API

```typescript
describe('ExternalGraphQLService - Integration', () => {
  let service: ExternalGraphQLService
  
  beforeEach(() => {
    const token = process.env.API_TOKEN || getAuthToken()
    service = new ExternalGraphQLService(token)
  })

  it('should fetch project by ID', async () => {
    // This will fail initially - we don't know the real structure yet
    const project = await service.getProject('EXAMPLE_PROJECT_ID')
    
    expect(project.title).toBe('Test Project')
    expect(project.description).toBeDefined() // Will fail - field is shortDescription
    expect(project.owner).toBe('test-org')
  })
})
```

### 2. Implement Service Method (Will Fail)

```typescript
async getProject(projectNodeId: string): Promise<ExampleProjectDTO> {
  const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          id
          title
          description  # WRONG - real field is shortDescription
          owner { login }
        }
      }
    }
  `
  
  const result = await this.executeQuery(query, { projectId: projectNodeId })
  return ExampleProjectDTO.fromGraphQLResponse(result)
}
```

### 3. Run Test - It Fails and Reveals Real Structure

```bash
❯ npm test
GraphQL Error: Field 'description' doesn't exist on type 'ProjectV2'
# Test failure reveals: field is called 'shortDescription'
```

### 4. Fix Service Based on Test Failure

```typescript
async getProject(projectNodeId: string): Promise<ExampleProjectDTO> {
  const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          id
          title
          shortDescription  # FIXED based on test failure
          owner { login }
        }
      }
    }
  `
  
  const result = await this.executeQuery(query, { projectId: projectNodeId })
  return ExampleProjectDTO.fromGraphQLResponse(result)
}
```

### 5. Update DTO and Types

```typescript
static fromGraphQLResponse(response: ExampleGraphQLResponse): ExampleProjectDTO {
  return new ExampleProjectDTO(
    response.node.id,
    response.node.title,
    response.node.shortDescription, // FIXED - was description
    response.node.owner.login
  )
}
```

### 6. Test Passes - Add More Test Cases

```typescript
it('should handle projects with no items', async () => {
  const project = await service.getProject('EMPTY_PROJECT_ID')
  expect(project.itemCount).toBe(0) // Drives empty handling
})

it('should handle organization vs user projects', async () => {
  const orgProject = await service.getProject('ORG_PROJECT_ID')
  expect(orgProject.ownerType).toBe('ORGANIZATION') // Drives owner type logic
})
```

### 7. Repeat for Complex Structures

Each test failure teaches you something new about the API:

```typescript
it('should handle field values correctly', async () => {
  const project = await service.getProject('PROJECT_WITH_FIELDS_ID')
  const item = project.items[0]
  
  expect(item.fieldValues['Status']).toBe('In Progress') // Fails, reveals field structure
  expect(item.fieldValues['Priority']).toBe('High')      // Drives field value parsing
})
```

## Benefits

- **Real feedback**: Tests fail with actual API errors, not guesses
- **Incremental discovery**: Each test failure teaches something new
- **No waste**: Only implement what tests require
- **Natural evolution**: Service grows based on real needs
- **Confidence**: If tests pass with real API, code works

## Rules

- Write integration tests that call real APIs first
- Let test failures drive implementation changes
- Don't write separate API exploration scripts
- Each red-green cycle teaches you about the real API structure