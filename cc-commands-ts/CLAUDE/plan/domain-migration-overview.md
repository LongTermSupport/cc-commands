# Domain Migration Overview

**Date**: 2025-01-29  
**Status**: Planning Mode  
**Priority**: High

## Executive Summary

Migrate bash functionality to TypeScript using **proper domain-driven architecture** instead of copying bash's flat `_common/` structure. Focus on 4 clean, focused domains with clear boundaries and no architectural violations.

**Key Insight**: We already have excellent core infrastructure and GitHub API services. No need for "common infrastructure" - we need focused domain services.

## Domain Architecture Strategy

### ✅ **What We Already Have (Excellent):**
- **Core Framework**: LLMInfo, OrchestratorError, type system, testing patterns
- **GitHub API Domain**: Comprehensive GitHub REST/GraphQL API services with 180x data improvement
- **Mathematical Utilities**: Calculation, statistics, time handling

### 🎯 **What We Actually Need (4 Focused Domains):**

## 1. **Environment Domain**
**Plan**: `environment-domain-migration.md`  
**Scope**: 2-3 days  
**Dependencies**: None

- Tool detection (git, gh, npm, node, jq)
- Version validation  
- Environment prerequisites
- Project structure validation

## 2. **Git Domain** 
**Plan**: `git-domain-migration.md`  
**Scope**: 3-4 days  
**Dependencies**: None

- Repository operations (init, clone, fetch, pull, push)
- Working directory status  
- Branch operations
- Commit operations (**message generation → LLM**)

## 3. **Filesystem Domain**
**Plan**: `filesystem-domain-migration.md`  
**Scope**: 2-3 days  
**Dependencies**: None

- File discovery and operations
- Plan file discovery  
- Documentation parsing (**content interpretation → LLM**)
- Directory structure management

## 4. **Argument Parsing Domain**
**Plan**: `argument-parsing-domain-migration.md`  
**Scope**: 1 day  
**Dependencies**: None

- Command-line argument parsing
- Flag and parameter processing
- Validation (**intent interpretation → LLM**)

## Implementation Strategy

### **Parallel Development Possible:**
All 4 domains are **independent** - no artificial dependencies like the old plans had. Each can be developed in parallel.

### **Recommended Order (Optional):**
1. **Environment Domain** - Used by other commands for validation
2. **Git Domain** - Used by command sync and workflows  
3. **Filesystem Domain** - Used by plan discovery and file operations
4. **Argument Parsing Domain** - Used by all commands for consistent arg handling

### **Total Timeline**: 8-11 days (sequential implementation required)

## Architectural Principles

### ✅ **TypeScript Domain Services Will Do:**
- **Data Collection**: Gather raw information from tools, APIs, filesystem
- **Operations**: Execute git commands, file operations, tool detection  
- **Validation**: Check formats, existence, prerequisites
- **Mathematical Processing**: Counts, sums, basic statistics

### ❌ **TypeScript Domain Services Will NOT Do:**
- **Analysis**: Interpret data significance or meaning
- **Decision Making**: Choose strategies, approaches, or priorities
- **Content Generation**: Create commit messages, documentation, recommendations
- **User Intent Interpretation**: Analyze what users want to accomplish

### 🔄 **LLM Command Logic Will Handle:**
- **Intent Analysis**: Understanding what users want to achieve
- **Strategy Decisions**: Choosing approaches based on context
- **Content Generation**: Creating commit messages, documentation, summaries
- **Recommendations**: Providing guidance and next steps
- **Complex Analysis**: Interpreting data patterns and significance

## Responsibility Violation Fixes

### **Git Domain Violations:**
- `git_smart_commit.bash` generates commit messages → **Move to LLM**
- TypeScript: Collect diff data, create commit with provided message
- LLM: Analyze changes and generate appropriate commit message

### **Filesystem Domain Violations:**  
- `docshelper.inc.bash` interprets content relevance → **Move to LLM**
- TypeScript: Parse documentation files, extract structured content
- LLM: Determine relevance, suggest reading order, provide guidance

### **Argument Parsing Violations:**
- Command-specific `arg_parse.bash` interpret user intent → **Move to LLM**  
- TypeScript: Parse argument structure, validate formats
- LLM: Analyze user intent, assess complexity, recommend approaches

## Success Criteria

1. **Clean Domain Boundaries**: Each domain handles its specific responsibility  
2. **No Analysis in TypeScript**: All interpretation moved to LLM command logic
3. **Architectural Compliance**: Follow existing patterns from GitHub domain
4. **Performance**: Maintain or improve performance over bash
5. **Type Safety**: Full TypeScript typing with comprehensive error handling
6. **Test Coverage**: 90% unit test coverage for each domain
7. **Maintainability**: Clear, focused services that are easy to understand and extend

## Domain Service Structure

Each domain follows the established pattern:
```typescript
src/orchestrator-services/{domain}/
├── interfaces/           # Service contracts
├── services/            # Service implementations  
├── dto/                 # Data transfer objects
├── types/               # Domain-specific types
├── constants/           # Domain constants
└── errors/              # Domain-specific errors
```

## Integration Points

### **Command Usage:**
Commands will use domain services via orchestrators:
```typescript
// Command orchestrator coordinates multiple domains
const envStatus = await environmentService.validateEnvironment()
const gitStatus = await gitService.getRepositoryStatus()  
const planFiles = await filesystemService.findPlanFiles()
const parsedArgs = await argumentService.parseArguments(args)

// LLM analyzes all collected data and makes decisions
```

### **Cross-Domain Coordination:**
Orchestrators coordinate multiple domains but each domain remains independent and focused.

---

**Next Steps**: Choose which domain to implement first, or implement multiple domains in parallel. Each plan is ready for immediate execution with clear requirements and boundaries.