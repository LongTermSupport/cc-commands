# Environment Domain Migration Plan

**Date**: 2025-01-29  
**Status**: Planning Mode  
**Priority**: High  
**Domain**: Environment validation, tool detection, prerequisites checking

## Summary

Migrate bash environment validation functionality to a focused **Environment Domain** in TypeScript. This domain handles tool detection, version validation, and environment prerequisites - pure infrastructure validation with no analysis or interpretation.

**Scope**: Small, focused domain (2-3 days implementation)
**Dependencies**: None - uses only core TypeScript infrastructure

## Bash Functionality Analysis

### Current Bash Scripts:
```
scripts/_common/env/
├── env_check_tools.bash      # Tool availability detection
├── env_validate.bash         # Environment validation
└── (other env scripts)

scripts/g/*/pre/env_*.bash    # Environment validation in commands
└── Various command-specific environment checks
```

### Key Functionality:
- **Tool Detection**: Check for git, gh, npm, node, jq, etc.
- **Version Validation**: Verify minimum versions are met
- **Path Resolution**: Validate project directory structure
- **Prerequisites**: Check required files exist (package.json, etc.)

## TypeScript Domain Architecture

### Service Organization:
```typescript
src/orchestrator-services/environment/
├── interfaces/
│   ├── IEnvironmentValidationService.ts
│   ├── IToolDetectionService.ts
│   └── IPrerequisiteCheckService.ts
├── services/
│   ├── EnvironmentValidationService.ts
│   ├── ToolDetectionService.ts
│   └── PrerequisiteCheckService.ts
├── dto/
│   ├── EnvironmentStatusDTO.ts
│   ├── ToolValidationResultDTO.ts
│   ├── ToolInventoryDTO.ts
│   └── PrerequisiteCheckResultDTO.ts
├── types/
│   └── EnvironmentTypes.ts
└── constants/
    └── EnvironmentConstants.ts
```

## Implementation

### Core Interfaces:

```typescript
interface IEnvironmentValidationService {
  validateEnvironment(): Promise<EnvironmentStatusDTO>
  checkAllPrerequisites(): Promise<PrerequisiteCheckResultDTO>
  validateProjectStructure(projectPath?: string): Promise<boolean>
}

interface IToolDetectionService {
  detectTool(toolName: string): Promise<ToolValidationResultDTO>
  validateToolVersion(tool: string, minVersion: string): Promise<boolean>
  getAvailableTools(): Promise<ToolInventoryDTO>
  checkRequiredTools(tools: string[]): Promise<ToolValidationResultDTO[]>
}

interface IPrerequisiteCheckService {
  checkFileExists(path: string): Promise<boolean>
  validateProjectFiles(projectPath: string): Promise<PrerequisiteCheckResultDTO>
  checkDirectoryStructure(expectedPaths: string[]): Promise<boolean>
}
```

### Key DTOs:

```typescript
export class EnvironmentStatusDTO {
  constructor(
    public readonly isValid: boolean,
    public readonly toolsAvailable: ToolValidationResultDTO[],
    public readonly missingTools: string[],
    public readonly projectStructureValid: boolean,
    public readonly prerequisites: PrerequisiteCheckResultDTO
  ) {}

  toLLMData(): Record<string, string> {
    return {
      ENVIRONMENT_VALID: this.isValid.toString(),
      TOOLS_AVAILABLE: this.toolsAvailable.length.toString(),
      MISSING_TOOLS: this.missingTools.join(','),
      PROJECT_STRUCTURE_VALID: this.projectStructureValid.toString()
    }
  }
}

export class ToolValidationResultDTO {
  constructor(
    public readonly toolName: string,
    public readonly isAvailable: boolean,
    public readonly version?: string,
    public readonly path?: string,
    public readonly versionMeetsRequirements?: boolean
  ) {}
}
```

## Bash Scripts Being Replaced:

- `_common/env/env_check_tools.bash` → ToolDetectionService
- `_common/env/env_validate.bash` → EnvironmentValidationService  
- `g/*/pre/env_*.bash` → PrerequisiteCheckService
- Command-specific env validation → Domain services via orchestrators

## Testing Strategy:

- **Unit Tests**: Mock child_process for tool detection
- **Integration Tests**: Real tool detection on CI environment
- **Cross-platform**: Linux, macOS, Windows compatibility
- **Error Scenarios**: Missing tools, invalid versions, permission issues

## Success Criteria:

1. **Complete Tool Detection**: All bash tool detection functionality preserved
2. **Cross-platform**: Works on all supported environments
3. **No Analysis**: Pure validation data, no interpretation
4. **Performance**: Fast validation (under 500ms typical)
5. **Type Safety**: Full TypeScript typing, no `any` types
6. **Error Handling**: Comprehensive error scenarios with recovery instructions

---

**Next Steps**: Implement ToolDetectionService first, then EnvironmentValidationService, then PrerequisiteCheckService.