# Filesystem Domain Migration Plan

**Date**: 2025-01-29  
**Status**: Planning Mode  
**Priority**: Medium  
**Domain**: File system operations, plan discovery, documentation handling

## Summary

Migrate bash filesystem functionality to a focused **Filesystem Domain** in TypeScript. This domain handles file discovery, plan file management, and documentation parsing - pure file operations with **no content interpretation** (that stays with LLM).

**Scope**: Small domain (2-3 days implementation)  
**Dependencies**: None - uses only core TypeScript infrastructure

## Bash Functionality Analysis

### Current Bash Scripts:
```
scripts/_common/file/
├── file_find_plans.bash      # Find plan files in project structure
└── find_docs.bash           # Documentation file discovery

scripts/_common/_inc/
└── docshelper.inc.bash      # ⚠️ VIOLATION: Documentation interpretation
```

### Key Functionality:
- **Plan Discovery**: Find .md plan files, validate structure
- **Documentation Discovery**: Locate README, CLAUDE.md, docs/ files  
- **File Operations**: Read, write, validate file existence
- **Path Resolution**: Resolve relative paths, validate directories
- **Content Parsing**: Extract file metadata, structured content

### ⚠️ **Responsibility Violation to Fix:**
- `docshelper.inc.bash` interprets content relevance - **MOVE TO LLM**

## TypeScript Domain Architecture

### Service Organization:
```typescript
src/orchestrator-services/filesystem/
├── interfaces/
│   ├── IFileDiscoveryService.ts
│   ├── IPlanDiscoveryService.ts
│   ├── IDocumentationService.ts
│   └── IFileOperationsService.ts
├── services/
│   ├── FileDiscoveryService.ts
│   ├── PlanDiscoveryService.ts
│   ├── DocumentationService.ts
│   └── FileOperationsService.ts
├── dto/
│   ├── FileDiscoveryResultDTO.ts
│   ├── PlanDiscoveryResultDTO.ts
│   ├── DocumentationDiscoveryDTO.ts
│   ├── FileMetadataDTO.ts
│   └── DirectoryStructureDTO.ts
├── types/
│   └── FilesystemTypes.ts
├── constants/
│   └── FilesystemConstants.ts
└── errors/
    └── FileOperationError.ts
```

## Implementation

### Core Interfaces:

```typescript
interface IFileDiscoveryService {
  findFiles(pattern: string, directory?: string): Promise<FileDiscoveryResultDTO>
  findFilesByExtension(extensions: string[], directory?: string): Promise<FileDiscoveryResultDTO>
  validateFileExists(path: string): Promise<boolean>
  getFileMetadata(path: string): Promise<FileMetadataDTO>
  getDirectoryStructure(path: string, depth?: number): Promise<DirectoryStructureDTO>
}

interface IPlanDiscoveryService {
  findPlanFiles(directory?: string): Promise<PlanDiscoveryResultDTO>
  findPlanByName(name: string): Promise<PlanFileDTO | null>
  validatePlanFile(path: string): Promise<PlanValidationDTO>
  getPlanMetadata(path: string): Promise<PlanMetadataDTO>
  listActivePlans(): Promise<PlanListDTO>
  listArchivedPlans(): Promise<PlanListDTO>
}

interface IDocumentationService {
  findDocumentationFiles(directory?: string): Promise<DocumentationDiscoveryDTO>
  parseDocumentationFile(path: string): Promise<DocumentationContentDTO>
  extractStructuredContent(path: string): Promise<StructuredContentDTO>
  getDocumentationMetadata(path: string): Promise<DocumentationMetadataDTO>
  
  // ❌ NO CONTENT INTERPRETATION - LLM responsibility
  // ❌ NO relevance assessment, reading order suggestions, etc.
}

interface IFileOperationsService {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<boolean>
  copyFile(source: string, destination: string): Promise<boolean>
  moveFile(source: string, destination: string): Promise<boolean>
  deleteFile(path: string): Promise<boolean>
  createDirectory(path: string): Promise<boolean>
  deleteDirectory(path: string, recursive?: boolean): Promise<boolean>
}
```

### Key DTOs:

```typescript
export class PlanDiscoveryResultDTO {
  constructor(
    public readonly activePlans: PlanFileDTO[],
    public readonly archivedPlans: PlanFileDTO[],
    public readonly totalPlans: number,
    public readonly searchDirectory: string
  ) {}

  toLLMData(): Record<string, string> {
    return {
      ACTIVE_PLANS_COUNT: this.activePlans.length.toString(),
      ARCHIVED_PLANS_COUNT: this.archivedPlans.length.toString(),
      TOTAL_PLANS: this.totalPlans.toString(),
      SEARCH_DIRECTORY: this.searchDirectory
    }
  }
}

export class PlanFileDTO {
  constructor(
    public readonly path: string,
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly lastModified: Date,
    public readonly size: number,
    public readonly status?: string,
    public readonly priority?: string
  ) {}
}

export class DocumentationDiscoveryDTO {
  constructor(
    public readonly readmeFiles: FileMetadataDTO[],
    public readonly claudeFiles: FileMetadataDTO[],
    public readonly docsDirectory: FileMetadataDTO[],
    public readonly markdownFiles: FileMetadataDTO[],
    public readonly totalDocumentationFiles: number
  ) {}

  toLLMData(): Record<string, string> {
    return {
      README_FILES: this.readmeFiles.length.toString(),
      CLAUDE_FILES: this.claudeFiles.length.toString(), 
      DOCS_DIRECTORY_FILES: this.docsDirectory.length.toString(),
      MARKDOWN_FILES: this.markdownFiles.length.toString(),
      TOTAL_DOCUMENTATION: this.totalDocumentationFiles.toString()
    }
  }
}

export class DocumentationContentDTO {
  constructor(
    public readonly filePath: string,
    public readonly rawContent: string,
    public readonly headings: string[],
    public readonly codeBlocks: string[],
    public readonly links: string[],
    public readonly metadata: Record<string, string>
  ) {}

  // ❌ NO interpretation methods like getRelevanceScore(), suggestReadingOrder()
}
```

## Major Refactoring Required

### Documentation Interpretation (Critical Fix):
```typescript
// ❌ WRONG: Current bash does this  
// docshelper.inc.bash interprets which docs are relevant, suggests reading order

// ✅ CORRECT: TypeScript provides data, LLM interprets relevance
interface IDocumentationService {
  // TypeScript: Extract structured content
  parseDocumentationFile(path: string): Promise<DocumentationContentDTO>
  findDocumentationFiles(): Promise<DocumentationDiscoveryDTO>
  
  // ❌ NO interpretation of relevance, importance, reading order
}

// ✅ LLM Command Logic will:  
// 1. Call findDocumentationFiles() and parseDocumentationFile()
// 2. Analyze content relevance and determine reading order
// 3. Provide documentation guidance to users
```

## Bash Scripts Being Replaced:

- `_common/file/file_find_plans.bash` → PlanDiscoveryService
- `_common/file/find_docs.bash` → DocumentationService  
- `_common/_inc/docshelper.inc.bash` → DocumentationService (interpretation → LLM)
- Various file operation patterns → FileOperationsService

## Plan File Structure Recognition:

The service will recognize cc-commands plan structure:
```
CLAUDE/plan/
├── active-plan.md              # Status: Active
├── another-plan.md             # Status: Planning  
└── archive/
    ├── completed-plan.md       # Archived: Complete
    └── cancelled-plan.md       # Archived: Cancelled
```

## Testing Strategy:

- **Unit Tests**: Mock filesystem operations, test path resolution
- **Integration Tests**: Real file operations in test directories  
- **Plan Discovery**: Test plan file recognition and metadata extraction
- **Documentation Parsing**: Test markdown parsing and content extraction
- **Error Scenarios**: Missing files, permission issues, corrupted content
- **Responsibility Compliance**: No content interpretation in TypeScript

## Success Criteria:

1. **Complete File Operations**: All bash file functionality preserved  
2. **Plan Discovery**: Accurate plan file discovery and metadata extraction
3. **Documentation Parsing**: Clean content extraction without interpretation
4. **Clean Separation**: Content interpretation moved to LLM
5. **Performance**: Fast file operations and directory scanning  
6. **Type Safety**: Full TypeScript typing
7. **Cross-platform**: File path handling across operating systems

---

**Critical Success Factor**: Successfully extracting documentation interpretation from TypeScript services and integrating it into LLM command logic while preserving all file operational functionality.