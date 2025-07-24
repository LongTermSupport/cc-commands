# Core Directory - Shared Foundation

## Purpose

The `src/core/` directory contains **only** truly generic, domain-agnostic components that are shared across the entire application. This is the foundation layer that all other code builds upon.

## ✅ What BELONGS in Core

### Fundamental Architecture Components
- **LLMInfo.ts** - The universal return type for all cc-commands
- **OrchestratorError.ts** - Base error handling for all orchestrators
- **ILLMDataDTO.ts** - Interface that all DTOs must implement

### Generic Data Structures
- **DataKeys.ts** - Truly generic keys used across multiple domains (STATUS, VALID, etc.)
- **BaseCommand.ts** - Generic OCLIF command base class

### Core Types
- **Shared interfaces** that multiple domains need (but are domain-agnostic)
- **Generic utility types** (e.g., `Record<string, string>` aliases if needed)

### Universal Constants
- **Generic validation patterns** 
- **Shared configuration keys**
- **Universal error codes**

### Cross-Domain Utilities
- **Generic helper functions** that work on any data type
- **Shared validation logic** that applies to all domains

## ❌ What does NOT belong in Core

### Domain-Specific Components
- **GitHub types** → `orchestrator-services/github/types/`
- **File system types** → `orchestrator-services/filesystem/types/`
- **Database types** → `orchestrator-services/database/types/`

### Domain-Specific Utilities
- **getGitHubToken()** → `orchestrator-services/github/utils/`
- **parseGitUrl()** → `orchestrator-services/git/utils/`
- **validateFilePath()** → `orchestrator-services/filesystem/utils/`

### Domain-Specific DTOs
- **RepositoryDataDTO** → `orchestrator-services/github/dto/`
- **FileMetadataDTO** → `orchestrator-services/filesystem/dto/`

### Domain-Specific Errors
- **GitHubApiError** → `orchestrator-services/github/errors/`
- **FileSystemError** → `orchestrator-services/filesystem/errors/`

### Business Logic
- **Any logic specific to a domain or use case**
- **API client implementations**
- **Service implementations**

## 🧪 The "Multiple Domains" Test

**Rule**: If a component is used by only one domain, it does NOT belong in core.

**Examples:**
```typescript
// ✅ BELONGS in core - used by GitHub, Git, File services
export const DataKeys = {
  STATUS: 'STATUS',
  OWNER: 'OWNER',
  URL: 'URL'
} as const

// ❌ Does NOT belong in core - only used by GitHub services  
export interface GitHubRepository {
  name: string
  owner: GitHubUser
}

// ✅ BELONGS in core - all DTOs implement this
export interface ILLMDataDTO {
  toLLMData(): Record<string, string>
}

// ❌ Does NOT belong in core - specific to GitHub domain
export function parseGitHubUrl(url: string): { owner: string, repo: string }
```

## 📁 Core Structure

```
src/core/
├── CLAUDE.md                    # This file
├── LLMInfo.ts                   # Universal return type
├── constants/
│   └── DataKeys.ts              # Generic keys only
├── error/
│   └── OrchestratorError.ts     # Base error class
├── interfaces/
│   └── ILLMDataDTO.ts           # DTO contract
└── types/
    └── DataTypes.ts             # Generic utility types
```

## 🚨 Enforcement Rules

### Before Adding to Core, Ask:
1. **Is this used by 2+ different domains?** If no → move to domain folder
2. **Is this truly generic?** If no → move to domain folder  
3. **Could this work without any domain knowledge?** If no → move to domain folder
4. **Would removing this break multiple domains?** If no → move to domain folder

### Regular Cleanup
- **Monthly review** of core directory
- **Move domain-specific code** that crept in back to proper locations
- **Consolidate** truly generic patterns that emerged in domains

## 🎯 Benefits of This Approach

1. **Clear Boundaries** - Easy to understand what's shared vs domain-specific
2. **Reduced Coupling** - Domains don't depend on each other through core
3. **Easy Testing** - Core components are simple and focused
4. **Scalability** - Adding new domains doesn't pollute core
5. **Maintenance** - Changes to domain logic don't affect core stability

## ⚠️ Anti-Patterns to Avoid

```typescript
// ❌ DON'T - Domain-specific in core
// src/core/GitHubService.ts
export class GitHubService { ... }

// ❌ DON'T - Business logic in core  
// src/core/calculateRepositoryScore.ts
export function calculateRepositoryScore(repo: Repository): number

// ❌ DON'T - Domain constants in core
// src/core/constants/GitHubConstants.ts  
export const GITHUB_API_BASE = 'https://api.github.com'

// ✅ DO - Generic, reusable
// src/core/constants/DataKeys.ts
export const DataKeys = {
  SCORE: 'SCORE',
  TIMESTAMP: 'TIMESTAMP'
} as const
```

## 🧹 Migration Guide

**If you find domain-specific code in core:**

1. **Identify the domain** (GitHub, filesystem, etc.)
2. **Create domain structure** if it doesn't exist:
   ```
   orchestrator-services/domain/
   ├── types/
   ├── utils/
   ├── constants/
   └── errors/
   ```
3. **Move the file** to appropriate domain folder
4. **Update imports** in consuming code
5. **Run tests** to ensure nothing broke

**Remember**: Core should be small, stable, and truly generic. When in doubt, put it in the domain folder - you can always move it to core later if it proves to be truly generic.