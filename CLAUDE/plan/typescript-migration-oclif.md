# CC-Commands TypeScript Migration Plan

## Overview
This document outlines the migration strategy for converting cc-commands from Bash to TypeScript using the oclif framework. The migration follows a command-by-command approach with test-driven development and modern TypeScript best practices.

## Core Principles
1. **Test-Driven Development**: Write tests first, implementation second
2. **Composition over Inheritance**: Use dependency injection and service composition
3. **Complete Command Migration**: Each command fully migrated with no Bash dependencies
4. **Parallel Development**: Structure allows multiple developers to work simultaneously
5. **High Testability**: Every component designed for easy testing and mocking

## Documentation Links
- [oclif Documentation](https://oclif.io/docs/)
- [oclif TypeScript Guide](https://oclif.io/docs/typescript)
- [oclif Testing Guide](https://oclif.io/docs/testing)
- [@oclif/test Package](https://www.npmjs.com/package/@oclif/test)
- [Octokit (GitHub SDK)](https://github.com/octokit/rest.js)
- [Slack Bolt SDK](https://tools.slack.dev/bolt-js/)
- [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk)
- [Vitest Documentation](https://vitest.dev/)

## Architecture Enforcement
- [Issue #19: Enforce orchestrator architecture with ESLint rules](https://github.com/LongTermSupport/cc-commands/issues/19)

## Build System

### oclif Build Configuration
- **TypeScript Compilation**: Native TypeScript support via ts-node
- **Build Output**: Compiled to `lib/` directory for distribution
- **Module System**: ES modules with CommonJS compatibility
- **Testing Framework**: Vitest (recommended for 2025) with @oclif/test utilities
- **Code Coverage**: Built-in via c8 (successor to nyc)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier integration

### Project Setup Commands
```bash
# Generate new oclif project with TypeScript
npx oclif generate cc-commands-ts --yes

# Additional dependencies
npm install --save-dev vitest @vitest/ui c8 @types/node
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier
npm install @octokit/rest @slack/bolt @anthropic-ai/claude-code
```

## Phase 0: Initial Setup

### Step 1: Setup .gitignore
Create comprehensive .gitignore before any other work:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
lib/
dist/
*.tsbuildinfo
.cache/

# Testing
coverage/
.nyc_output/
test-results/
*.lcov

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
tmp/
temp/
var/
*.tmp

# OS
Thumbs.db
```

### Step 2: Create Branch
```bash
cd .claude/cc-commands
git checkout -b oclif
```

### Step 3: Initialize Project Structure
```
cc-commands/
├── scripts/              # Existing Bash scripts (unchanged)
├── cc-commands-ts/       # New TypeScript implementation
│   ├── src/
│   │   ├── commands/     # oclif commands
│   │   ├── services/     # Business logic (composition-based)
│   │   ├── interfaces/   # TypeScript interfaces
│   │   ├── utils/        # Shared utilities
│   │   └── types/        # Type definitions
│   ├── test/
│   │   ├── commands/     # Command tests
│   │   ├── services/     # Service tests
│   │   └── fixtures/     # Test fixtures
│   ├── docs/            # Architecture documentation
│   └── plans/           # Command-specific plan files
└── TYPESCRIPT_MIGRATION_PLAN.md
```

## Architecture Design

### Service-Based Architecture (Composition Pattern)
```typescript
// interfaces/INamespaceValidator.ts
export interface INamespaceValidator {
  validate(namespace: string): ValidationResult;
  suggestCorrections(namespace: string): string[];
}

// interfaces/IFileService.ts
export interface IFileService {
  createFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
}

// interfaces/IGitService.ts
export interface IGitService {
  add(files: string[]): Promise<void>;
  commit(message: string): Promise<void>;
  getCurrentBranch(): Promise<string>;
  getStatus(): Promise<GitStatus>;
}

// services/CommandCreationService.ts
export class CommandCreationService {
  constructor(
    private namespaceValidator: INamespaceValidator,
    private fileService: IFileService,
    private gitService: IGitService,
    private templateEngine: ITemplateEngine
  ) {}
  
  async createCommand(options: CreateCommandOptions): Promise<CommandResult> {
    // Orchestrates the command creation process
  }
}
```

### Testing Strategy
```typescript
// test/services/CommandCreationService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CommandCreationService', () => {
  let service: CommandCreationService;
  let mockNamespaceValidator: INamespaceValidator;
  let mockFileService: IFileService;
  
  beforeEach(() => {
    // Setup mocks
    mockNamespaceValidator = {
      validate: vi.fn(),
      suggestCorrections: vi.fn()
    };
    
    // Inject mocks
    service = new CommandCreationService(
      mockNamespaceValidator,
      mockFileService,
      mockGitService,
      mockTemplateEngine
    );
  });
  
  it('should validate namespace before creating command', async () => {
    // Test implementation
  });
});
```

## GitHub Issues for Tracking

### Epic Issues Created

1. **[#1 - TypeScript Migration Foundation](https://github.com/LongTermSupport/cc-commands/issues/1)**
   - Setup oclif project structure
   - Configure build system
   - Setup testing framework
   - Create base interfaces and types

2. **[#2 - Core Services Implementation](https://github.com/LongTermSupport/cc-commands/issues/2)**
   - Git service implementation
   - File service implementation
   - Validation services
   - Template engine

3. **[#3 - Command Migrations - Phase 1](https://github.com/LongTermSupport/cc-commands/issues/3)**
   - g:command:create migration
   - g:command:update migration
   - g:command:sync migration

4. **[#4 - GitHub Integration Services](https://github.com/LongTermSupport/cc-commands/issues/4)**
   - Octokit service wrapper
   - Issue management service
   - Workflow monitoring service

5. **[#5 - External Integrations](https://github.com/LongTermSupport/cc-commands/issues/5)**
   - Slack Bolt integration
   - Claude Code SDK integration

6. **[#8 - Pre-Migration Command Analysis](https://github.com/LongTermSupport/cc-commands/issues/8)**
   - Comprehensive analysis of all 9 commands
   - Documentation before TypeScript implementation

### Specific Command Migration Issues

- [#6 - Migrate g:command:create to TypeScript](https://github.com/LongTermSupport/cc-commands/issues/6)
- **[Create New] - Migrate g:gh:project:summary to TypeScript** (First implementation)

### Issue Templates
```markdown
## Command Migration: [command-name]

### Current Implementation
- Main orchestrator: `scripts/[path]/orchestrate.bash`
- Sub-scripts: [list of bash scripts]

### Requirements
- [ ] Feature parity with Bash version
- [ ] Unit tests with >90% coverage
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] Documentation

### Plan Document
See: `cc-commands-ts/plans/[command-name].plan.md`

### Dependencies
- Depends on: #[issue-numbers]
- Blocks: #[issue-numbers]
```

## Parallel Development Strategy

### Independent Work Streams

#### Stream 1: Core Infrastructure
- Developer A: Base interfaces and types
- Developer B: Testing framework setup
- Can work simultaneously without conflicts

#### Stream 2: Services Layer
- Developer C: Git service
- Developer D: File service
- Developer E: Validation services
- Each service has clear interface contracts

#### Stream 3: Command Migrations
- Each command can be assigned to different developers
- Commands depend on services but not on each other
- Use feature flags to enable/disable migrated commands

### Coordination Points
1. **Interface Definitions**: Must be agreed upon early
2. **Service Contracts**: Define before implementation
3. **Testing Standards**: Establish patterns early
4. **Code Reviews**: Ensure consistency across teams

## Testing Best Practices

### Test Structure
```typescript
// Unit Tests: Focus on single responsibility
describe('NamespaceValidator', () => {
  describe('validate', () => {
    it('should accept valid namespace format', () => {});
    it('should reject namespace with invalid characters', () => {});
    it('should reject namespace exceeding max length', () => {});
  });
});

// Integration Tests: Test service interactions
describe('Create Command Integration', () => {
  it('should create command file and update git', async () => {
    // Test full flow with real file system (in temp dir)
  });
});
```

### Testing Guidelines
1. **AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Names**: Test names should explain behavior
4. **Mock External Dependencies**: No real API calls in tests
5. **Use Factories**: Create test data factories for consistency

## Configuration Management

### Environment Variables
```typescript
// config/index.ts
export const config = {
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
  },
  slack: {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  },
  paths: {
    commandsDir: process.env.COMMANDS_DIR || './scripts',
    tempDir: process.env.TEMP_DIR || './var',
  }
};
```

## Success Criteria

### For Each Migrated Command
- [ ] 100% feature parity with Bash version
- [ ] >90% test coverage
- [ ] Performance equal or better than Bash
- [ ] No runtime errors in production scenarios
- [ ] Clear error messages for all failure cases
- [ ] Comprehensive logging for debugging

### For Overall Migration
- [ ] All critical commands migrated
- [ ] Consistent architecture across all commands
- [ ] Comprehensive documentation
- [ ] Easy to onboard new developers
- [ ] Clear migration path for remaining commands

## Command Migration Priority

### Phase 1: Foundation Commands
1. `g:gh:project:summary` - External API focus, well-defined scope (FIRST)
2. `g:command:create` - Establishes patterns
3. `g:command:sync` - Critical for workflow

### Phase 2: GitHub Integration
4. `g:gh:push` - Demonstrates GitHub integration
5. `g:gh:issue` - Complex GitHub operations
6. `g:gh:project` - Data aggregation patterns

### Phase 3: Workflow Commands
7. `g:w:plan` - File discovery patterns
8. `g:w:execute` - Command execution patterns

## Pre-Migration Analysis Task

### Command Documentation and Analysis

Before writing any TypeScript code, conduct comprehensive analysis of each command:

1. **Create documentation structure**: `CLAUDE/Commands/` respecting namespacing
   - `CLAUDE/Commands/g/command/create.md`
   - `CLAUDE/Commands/g/command/sync.md`
   - `CLAUDE/Commands/g/command/update.md`
   - `CLAUDE/Commands/g/gh/issue/plan.md`
   - `CLAUDE/Commands/g/gh/project/summary.md`
   - `CLAUDE/Commands/g/gh/push.md`
   - `CLAUDE/Commands/g/symfony/create/command.md`
   - `CLAUDE/Commands/g/w/execute.md`
   - `CLAUDE/Commands/g/w/plan.md`

2. **For each command, document**:
   - What the command does (high-level purpose)
   - Complete workflow in terse pseudocode
   - All bash scripts involved and their roles
   - Data flow between scripts (KEY=value outputs)
   - Error handling patterns
   - User interaction points
   - **(bug:)** markers for any bugs found
   - **(quirk:)** markers for unusual behaviors

3. **Analysis deliverables per command**:
   - Input/output specifications
   - State management requirements
   - External service dependencies
   - Performance characteristics
   - Testing considerations

### GitHub Issues for Command Analysis

Epic: [#8 - Pre-Migration Command Analysis](https://github.com/LongTermSupport/cc-commands/issues/8)

Analysis tasks are tracked as GitHub issues:
- [#9 - g:command:create](https://github.com/LongTermSupport/cc-commands/issues/9)
- [#10 - g:command:sync](https://github.com/LongTermSupport/cc-commands/issues/10)
- [#11 - g:command:update](https://github.com/LongTermSupport/cc-commands/issues/11)
- [#12 - g:gh:issue:plan](https://github.com/LongTermSupport/cc-commands/issues/12)
- [#13 - g:gh:project:summary](https://github.com/LongTermSupport/cc-commands/issues/13)
- [#14 - g:gh:push](https://github.com/LongTermSupport/cc-commands/issues/14)
- [#15 - g:symfony:create:command](https://github.com/LongTermSupport/cc-commands/issues/15)
- [#16 - g:w:execute](https://github.com/LongTermSupport/cc-commands/issues/16)
- [#17 - g:w:plan](https://github.com/LongTermSupport/cc-commands/issues/17)

## Next Steps

1. Create GitHub issues using gh CLI (including analysis sub-tasks)
2. Complete command analysis and documentation
3. Setup oclif project with proper .gitignore
4. Define core interfaces based on analysis findings
5. Create detailed plan documents for first 3 commands
6. Begin TDD implementation of g:command:create

## Notes

- Each command gets its own plan document in `plans/` directory
- Use dependency injection for all services
- Prefer small, focused classes over large monoliths
- Use TypeScript strict mode from the start
- Document architectural decisions in ADR format

## Current Status (2025-07-23)

### ✅ Completed
- Project structure initialized with oclif
- Core architecture implemented (BaseCommand, LLMInfo, CommandError)
- Service-based architecture with dependency injection
- ESLint configured with strict architecture enforcement
- DTO pattern implemented with no-magic-strings policy
- First command attempt: g:gh:project:summary

### 🚨 Major Finding
**We fundamentally misunderstood the g:gh:project:summary command.**
- Built: Repository analyzer (single repo)
- Needed: GitHub Projects v2 analyzer (kanban boards)

Detailed plan: [fix-project-repository-confusion.md](fix-project-repository-confusion.md)

### 📋 Next Steps
1. Fix the project/repository confusion (6-8 days estimated)
2. Achieve true feature parity with bash implementation
3. Continue with remaining command migrations

### 📊 Metrics
- TypeScript: Compiles successfully
- Tests: 31 passing, 8 failing (error format issues)
- ESLint: 24 errors, 22 warnings (being addressed)
- Coverage: Not yet measured due to compilation issues

### 🔗 Related Issues
- [#18](https://github.com/LongTermSupport/cc-commands/issues/18) - Migrate g:gh:project:summary
- [#19](https://github.com/LongTermSupport/cc-commands/issues/19) - ESLint architecture enforcement
- [#20](https://github.com/LongTermSupport/cc-commands/issues/20) - Documentation consolidation