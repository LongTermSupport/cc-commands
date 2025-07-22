# TypeScript Migration Plan: g:gh:project:summary

## Overview

This is the detailed implementation plan for migrating `g:gh:project:summary` to TypeScript as our first oclif command. This migration will establish patterns and conventions for all subsequent migrations.

## Command Structure in TypeScript

### Directory Layout
```
cc-commands-ts/
├── src/
│   ├── commands/
│   │   └── g/
│   │       └── gh/
│   │           └── project/
│   │               └── summary.ts
│   ├── services/
│   │   ├── github/
│   │   │   ├── ProjectDetectionService.ts
│   │   │   ├── DataCollectionService.ts
│   │   │   └── GitHubApiService.ts
│   │   └── report/
│   │       ├── ReportGenerationService.ts
│   │       └── AudienceReportFactory.ts
│   ├── interfaces/
│   │   ├── IGitHubProject.ts
│   │   ├── IProjectActivity.ts
│   │   └── IReportGenerator.ts
│   ├── types/
│   │   ├── ArgumentTypes.ts
│   │   └── AudienceTypes.ts
│   └── utils/
│       ├── GitRemoteParser.ts
│       └── DateUtils.ts
├── test/
│   ├── commands/
│   │   └── g/gh/project/summary.test.ts
│   ├── services/
│   └── fixtures/
│       └── github-responses/
└── package.json
```

## Type Definitions

### Argument Types
```typescript
// types/ArgumentTypes.ts
export type AutoDetectArgs = {
  mode: 'auto';
  audience?: AudienceType;
};

export type UrlArgs = {
  mode: 'url';
  url: string;
  audience?: AudienceType;
};

export type ManualArgs = {
  mode: 'manual';
  organization: string;
  projectId: number;
  audience?: AudienceType;
};

export type CommandArgs = AutoDetectArgs | UrlArgs | ManualArgs;
```

### Audience Types
```typescript
// types/AudienceTypes.ts
export enum AudienceType {
  Client = 'client',
  Technical = 'technical',
  Management = 'management',
  ProductOwner = 'product-owner'
}
```

### GitHub Types
```typescript
// interfaces/IGitHubProject.ts
export interface IGitHubProject {
  id: number;
  title: string;
  url: string;
  organization: string;
  updatedAt: Date;
  itemCount: number;
}

// interfaces/IProjectActivity.ts
export interface IProjectActivity {
  repositories: IRepositoryActivity[];
  totalActivity: number;
  activeRepos: number;
  timePeriod: string;
  topRepositories: string[];
}

export interface IRepositoryActivity {
  name: string;
  issues: number;
  pullRequests: number;
  commits: number;
  comments: number;
}
```

## Service Architecture

### ProjectDetectionService
```typescript
export class ProjectDetectionService {
  constructor(
    private githubApi: IGitHubApiService,
    private gitRemoteParser: GitRemoteParser
  ) {}

  async detectFromGitRemote(): Promise<IGitHubProject> {
    // Parse git remote to get organization
    // Find most recent project in org
  }

  async parseProjectUrl(url: string): Promise<{org: string, id: number}> {
    // Parse GitHub project URL
  }

  async validateProject(org: string, id: number): Promise<IGitHubProject> {
    // Validate and fetch project details
  }
}
```

### DataCollectionService
```typescript
export class DataCollectionService {
  constructor(
    private githubApi: IGitHubApiService,
    private dateUtils: DateUtils
  ) {}

  async collectProjectActivity(
    project: IGitHubProject,
    timePeriodHours: number = 24
  ): Promise<IProjectActivity> {
    // Fetch project items
    // Extract repositories
    // Collect activity data
    // Return aggregated data
  }
}
```

### ReportGenerationService
```typescript
export class ReportGenerationService {
  constructor(
    private reportFactory: AudienceReportFactory
  ) {}

  generateReport(
    activity: IProjectActivity,
    project: IGitHubProject,
    audience: AudienceType
  ): string {
    const generator = this.reportFactory.getGenerator(audience);
    return generator.generate(activity, project);
  }
}
```

## Command Implementation

### Main Command Class
```typescript
import { Command, Flags } from '@oclif/core';

export default class Summary extends Command {
  static description = 'Generate comprehensive GitHub project activity summary';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> technical',
    '<%= config.bin %> <%= command.id %> https://github.com/orgs/MyOrg/projects/5',
    '<%= config.bin %> <%= command.id %> MyOrg 3 management',
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
  };

  static args = [
    { name: 'arg1', required: false },
    { name: 'arg2', required: false },
    { name: 'arg3', required: false },
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(Summary);
    
    // Parse arguments to determine mode
    const commandArgs = this.parseArguments(args);
    
    // Initialize services
    const services = await this.initializeServices();
    
    // Detect/validate project
    const project = await this.detectProject(commandArgs, services);
    
    // Collect data
    const activity = await services.dataCollection.collectProjectActivity(project);
    
    // Generate report
    const report = services.reportGeneration.generateReport(
      activity,
      project,
      commandArgs.audience || AudienceType.Client
    );
    
    // Output report
    this.log(report);
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('ProjectDetectionService', () => {
  describe('detectFromGitRemote', () => {
    it('should detect organization from git remote');
    it('should find most recent project');
    it('should handle missing git remote');
  });
});

describe('DataCollectionService', () => {
  describe('collectProjectActivity', () => {
    it('should aggregate repository activity');
    it('should handle API rate limits');
    it('should calculate correct metrics');
  });
});
```

### Integration Tests
```typescript
describe('Summary Command', () => {
  it('should work with auto-detection');
  it('should parse project URLs correctly');
  it('should generate client report');
  it('should handle authentication errors');
});
```

## Migration Steps

### Phase 1: Setup (Week 1)
- [ ] Initialize oclif project structure
- [ ] Set up TypeScript configuration
- [ ] Install dependencies (Octokit, etc.)
- [ ] Create base interfaces and types

### Phase 2: Core Services (Week 2)
- [ ] Implement GitHubApiService wrapper
- [ ] Implement ProjectDetectionService
- [ ] Implement DataCollectionService
- [ ] Create comprehensive unit tests

### Phase 3: Report Generation (Week 3)
- [ ] Implement report generators for each audience
- [ ] Create ReportGenerationService
- [ ] Implement AudienceReportFactory
- [ ] Test all report formats

### Phase 4: Command Integration (Week 4)
- [ ] Implement main command class
- [ ] Handle all argument formats
- [ ] Add error handling
- [ ] Create integration tests

### Phase 5: Polish and Documentation
- [ ] Performance testing
- [ ] Documentation
- [ ] Migration guide for other commands
- [ ] Review and refactor

## Success Metrics

- **Functionality**: 100% feature parity with Bash version
- **Performance**: Equal or better than Bash implementation
- **Test Coverage**: >90% unit test coverage
- **Type Safety**: No `any` types except where absolutely necessary
- **Documentation**: Comprehensive JSDoc comments
- **Patterns**: Establishes clear patterns for other migrations

## Challenges and Solutions

### Challenge 1: Argument Parsing Complexity
**Solution**: Use discriminated unions and type guards

### Challenge 2: GitHub API Rate Limiting
**Solution**: Implement exponential backoff and caching

### Challenge 3: Large Data Sets
**Solution**: Stream processing where possible

### Challenge 4: Report Formatting
**Solution**: Template engine or markdown builder

## Dependencies

### NPM Packages
- `@oclif/core` - CLI framework
- `@octokit/rest` - GitHub API client
- `simple-git` - Git operations
- `date-fns` - Date utilities
- `chalk` - Terminal colors
- `ora` - Progress spinners

### Dev Dependencies
- `@types/node`
- `vitest` - Testing framework
- `@vitest/ui` - Test UI
- `c8` - Code coverage
- `eslint` - Linting
- `prettier` - Formatting

## Notes

This command will serve as the reference implementation for:
- Service architecture patterns
- Testing strategies
- Error handling approaches
- TypeScript best practices
- Documentation standards

The lessons learned from this implementation will be documented and applied to all subsequent command migrations.