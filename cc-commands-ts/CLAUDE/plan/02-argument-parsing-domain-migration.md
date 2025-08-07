# Argument Parsing Domain Migration Plan

**Date**: 2025-01-29  
**Status**: Planning Mode  
**Priority**: Low  
**Domain**: Argument parsing utilities and command-line processing

## Summary

Migrate bash argument parsing functionality to a focused **Argument Parsing Domain** in TypeScript. This domain handles command-line argument parsing, validation, and standardization - pure parsing operations with **no interpretation of user intent** (that stays with LLM).

**Scope**: Very small domain (1 day implementation)  
**Dependencies**: None - uses only core TypeScript infrastructure

## Bash Functionality Analysis

### Current Bash Scripts:
```
scripts/_common/arg/
└── arg_parse_standard.bash    # Standard argument parsing utilities

scripts/g/*/analysis/arg_parse.bash  # ⚠️ VIOLATIONS: Intent interpretation
├── command/create/analysis/arg_parse.bash
├── command/update/analysis/arg_parse.bash
└── gh/issue/plan/analysis/arg_parse.bash
```

### Key Functionality:
- **Argument Parsing**: Parse command-line arguments into structured data
- **Flag Processing**: Handle -f, --flag, --key=value patterns
- **Validation**: Validate required arguments, check formats
- **Standardization**: Convert arguments to consistent format

### ⚠️ **Responsibility Violations to Fix:**
- Command-specific `arg_parse.bash` scripts interpret user intent - **MOVE TO LLM**

## TypeScript Domain Architecture

### Service Organization:
```typescript
src/orchestrator-services/argument-parsing/
├── interfaces/
│   ├── IArgumentParsingService.ts
│   └── IArgumentValidationService.ts
├── services/
│   ├── ArgumentParsingService.ts
│   └── ArgumentValidationService.ts
├── dto/
│   ├── ParsedArgumentsDTO.ts
│   ├── ArgumentValidationResultDTO.ts
│   └── ArgumentDefinitionDTO.ts
├── types/
│   └── ArgumentTypes.ts
├── constants/
│   └── ArgumentConstants.ts
└── errors/
    └── ArgumentParsingError.ts
```

## Implementation

### Core Interfaces:

```typescript
interface IArgumentParsingService {
  parseArguments(args: string): Promise<ParsedArgumentsDTO>
  parseArgumentArray(args: string[]): Promise<ParsedArgumentsDTO>
  extractFlags(args: string): Promise<FlagsDTO>
  extractKeyValuePairs(args: string): Promise<KeyValueDTO>
  standardizeArguments(args: ParsedArgumentsDTO): Promise<StandardizedArgumentsDTO>
}

interface IArgumentValidationService {
  validateRequiredArguments(
    args: ParsedArgumentsDTO, 
    required: string[]
  ): Promise<ArgumentValidationResultDTO>
  
  validateArgumentFormat(
    argName: string, 
    value: string, 
    format: ArgumentFormat
  ): Promise<boolean>
  
  validateArgumentCount(
    args: ParsedArgumentsDTO,
    min?: number,
    max?: number
  ): Promise<ArgumentValidationResultDTO>
  
  // ❌ NO interpretation of user intent, command complexity assessment, etc.
}
```

### Key DTOs:

```typescript
export class ParsedArgumentsDTO {
  constructor(
    public readonly positionalArgs: string[],
    public readonly flags: Record<string, boolean>,
    public readonly keyValuePairs: Record<string, string>,
    public readonly rawInput: string,
    public readonly totalArguments: number
  ) {}

  toLLMData(): Record<string, string> {
    return {
      POSITIONAL_ARGS: this.positionalArgs.join(','),
      FLAGS: Object.keys(this.flags).join(','),
      KEY_VALUE_PAIRS: Object.keys(this.keyValuePairs).join(','),
      TOTAL_ARGUMENTS: this.totalArguments.toString(),
      RAW_INPUT: this.rawInput
    }
  }
}

export class ArgumentValidationResultDTO {
  constructor(
    public readonly isValid: boolean,
    public readonly missingRequired: string[],
    public readonly invalidFormats: ArgumentFormatError[],
    public readonly validatedArguments: Record<string, string>
  ) {}

  toLLMData(): Record<string, string> {
    return {
      ARGUMENTS_VALID: this.isValid.toString(),
      MISSING_REQUIRED: this.missingRequired.join(','),
      INVALID_FORMATS: this.invalidFormats.length.toString(),
      VALIDATED_COUNT: Object.keys(this.validatedArguments).length.toString()
    }
  }
}
```

### Argument Format Types:

```typescript
export enum ArgumentFormat {
  URL = 'url',
  EMAIL = 'email',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  PATH = 'path',
  GITHUB_REPO = 'github-repo',
  DATE = 'date',
  JSON = 'json'
}

export interface ArgumentDefinitionDTO {
  name: string
  required: boolean
  format?: ArgumentFormat
  description: string
  defaultValue?: string
}
```

## Major Refactoring Required

### Intent Interpretation (Critical Fix):
```typescript
// ❌ WRONG: Current bash does this
// Command-specific arg_parse.bash scripts interpret what user wants to do

// ✅ CORRECT: TypeScript parses structure, LLM interprets intent
interface IArgumentParsingService {
  // TypeScript: Parse argument structure
  parseArguments(args: string): Promise<ParsedArgumentsDTO>
  validateArguments(args: ParsedArgumentsDTO, requirements: ArgumentDefinitionDTO[]): Promise<ArgumentValidationResultDTO>
  
  // ❌ NO interpretation of user intent, complexity assessment, safety analysis
}

// ✅ LLM Command Logic will:
// 1. Call parseArguments() to get structured data  
// 2. Analyze user intent and command complexity
// 3. Make decisions about implementation approach and safety
```

## Standard Argument Patterns:

The service will handle common cc-commands patterns:
```typescript
// Examples of what it will parse:
// "owner/repo --force --since=2024-01-01"  
// "--help --verbose"
// "create my-command --template=basic --permissions=high"
// "sync --dry-run --conflict-resolution=manual"

export interface StandardArgumentPatterns {
  GITHUB_REPO: RegExp    // owner/repo format
  DATE: RegExp          // ISO date format  
  PERMISSION_LEVEL: RegExp  // low/medium/high
  BOOLEAN_FLAGS: string[]   // --force, --dry-run, --verbose, --help
}
```

## Bash Scripts Being Replaced:

- `_common/arg/arg_parse_standard.bash` → ArgumentParsingService
- `g/command/create/analysis/arg_parse.bash` → ArgumentParsingService (interpretation → LLM)
- `g/command/update/analysis/arg_parse.bash` → ArgumentParsingService (interpretation → LLM)  
- `g/gh/issue/plan/analysis/arg_parse.bash` → ArgumentParsingService (interpretation → LLM)

## Testing Strategy:

- **Unit Tests**: Parse various argument formats, edge cases
- **Validation Tests**: Required arguments, format validation  
- **Edge Cases**: Empty args, malformed input, special characters
- **Cross-platform**: Argument handling consistency
- **Responsibility Compliance**: No intent interpretation in TypeScript

## Success Criteria:

1. **Complete Parsing**: All bash argument parsing functionality preserved
2. **Standard Patterns**: Consistent parsing across all commands  
3. **Validation**: Robust argument validation and error reporting
4. **Clean Separation**: Intent interpretation moved to LLM
5. **Performance**: Fast parsing (under 50ms typical)
6. **Type Safety**: Full TypeScript typing
7. **Reusability**: Used by all command implementations

---

**Implementation Notes**: 

This is the smallest domain - implement last after other domains are complete. Most orchestrators will use this for consistent argument handling.

**Critical Success Factor**: Creating a simple, fast, reusable argument parsing system that provides structured data without interpreting user intent or making decisions about command complexity.