/**
 * @file Argument Validation Service Implementation
 * 
 * Service for validating parsed command-line arguments against requirements,
 * formats, and constraints. Provides comprehensive validation with detailed
 * error reporting and recovery instructions.
 */

import { ARGUMENT_FORMATS, ARGUMENT_PATTERNS } from '../constants/ArgumentConstants.js'
import { ArgumentValidationResultDTO } from '../dto/ArgumentValidationResultDTO.js'
import { ParsedArgumentsDTO } from '../dto/ParsedArgumentsDTO.js'
import { ArgumentParsingError } from '../errors/ArgumentParsingError.js'
import { IArgumentValidationService } from '../interfaces/IArgumentValidationService.js'
import { 
  ArgumentDefinition, 
  ArgumentFormat, 
  ArgumentFormatError,
  ArgumentValidationResult 
} from '../types/ArgumentTypes.js'

/**
 * Service for validating command-line arguments
 * 
 * Provides comprehensive argument validation including format checking,
 * requirement validation, and constraint verification.
 * 
 * **CRITICAL**: This service performs ONLY validation operations.
 * It does NOT interpret user intent or make decisions about commands.
 */
export class ArgumentValidationService implements IArgumentValidationService {

  /**
   * Check for unknown arguments
   * 
   * @param args - Parsed arguments to check
   * @param allowedArguments - List of allowed argument names
   * @returns Array of unknown argument names
   */
  async findUnknownArguments(
    args: ParsedArgumentsDTO,
    allowedArguments: string[]
  ): Promise<string[]> {
    const unknown: string[] = []
    const allowed = new Set(allowedArguments)
    
    // Check flags
    for (const flag of args.getEnabledFlags()) {
      if (!allowed.has(flag)) {
        unknown.push(flag)
      }
    }
    
    // Check key-value pairs
    for (const key of Object.keys(args.getKeyValueRecord())) {
      if (!allowed.has(key)) {
        unknown.push(key)
      }
    }
    
    return unknown
  }

  /**
   * Validate argument count constraints
   * 
   * @param args - Parsed arguments to count
   * @param min - Minimum required arguments (optional)
   * @param max - Maximum allowed arguments (optional)
   * @returns Validation result with count information
   * @throws {ArgumentParsingError} When count validation fails
   */
  async validateArgumentCount(
    args: ParsedArgumentsDTO,
    min?: number,
    max?: number
  ): Promise<ArgumentValidationResultDTO> {
    const totalCount = args.getTotalArgumentCount()
    const isValid = this.isValidCount(totalCount, min, max)
    
    if (isValid) {
      return ArgumentValidationResultDTO.success({
        ARGUMENT_COUNT: String(totalCount)
      })
    }
    
    // Create error for invalid count
    throw ArgumentParsingError.argumentCountInvalid(totalCount, min, max)
  }

  /**
   * Validate single argument format
   * 
   * @param argumentName - Name of the argument being validated
   * @param value - Value to validate
   * @param format - Expected format
   * @returns True if format is valid, false otherwise
   * @throws {ArgumentParsingError} When format validation fails
   */
  async validateArgumentFormat(
    argumentName: string,
    value: string,
    format: ArgumentFormat
  ): Promise<boolean> {
    try {
      return this.isValidFormat(value, format)
    } catch {
      throw ArgumentParsingError.formatInvalid(
        argumentName,
        format,
        value,
        this.getFormatExample(format)
      )
    }
  }

  /**
   * Validate parsed arguments against requirements
   * 
   * @param args - Parsed arguments to validate
   * @param definitions - Argument definitions with requirements and formats
   * @returns Comprehensive validation results
   * @throws {ArgumentParsingError} When validation process fails
   */
  async validateArguments(
    args: ParsedArgumentsDTO,
    definitions: ArgumentDefinition[]
  ): Promise<ArgumentValidationResultDTO> {
    try {
      const validationResults: ArgumentValidationResult[] = []
      const formatErrors: ArgumentFormatError[] = []
      const validatedArguments: Record<string, string> = {}
      
      // Check required arguments
      const missingRequired = await this.findMissingRequiredArguments(args, definitions)
      
      // Validate each argument that is present
      await this.validatePresentArguments(
        args, 
        definitions, 
        { formatErrors, validatedArguments, validationResults }
      )
      
      // Determine overall validity
      const isValid = missingRequired.length === 0 && formatErrors.length === 0 &&
                     validationResults.every(r => r.isValid)
      
      return ArgumentValidationResultDTO.fromValidationResults(
        isValid,
        missingRequired,
        formatErrors,
        validationResults,
        validatedArguments
      )
    } catch (error) {
      if (error instanceof ArgumentParsingError) {
        throw error
      }
      
      throw ArgumentParsingError.validationFailed(
        'general',
        'unknown',
        error instanceof Error ? error.message : 'Unknown validation error'
      )
    }
  }

  /**
   * Validate flag combinations
   * 
   * @param flags - Record of flag names to boolean values
   * @param mutuallyExclusive - Arrays of mutually exclusive flag groups
   * @returns True if flag combinations are valid
   * @throws {ArgumentParsingError} When flag combination validation fails
   */
  async validateFlagCombinations(
    flags: Record<string, boolean>,
    mutuallyExclusive: string[][]
  ): Promise<boolean> {
    const enabledFlags = Object.keys(flags).filter(flag => flags[flag])
    
    for (const exclusiveGroup of mutuallyExclusive) {
      const enabledInGroup = enabledFlags.filter(flag => exclusiveGroup.includes(flag))
      
      if (enabledInGroup.length > 1) {
        throw ArgumentParsingError.validationFailed(
          'flag_combination',
          'mutually_exclusive',
          `Mutually exclusive flags used together: ${enabledInGroup.join(', ')}`
        )
      }
    }
    
    return true
  }

  /**
   * Validate key-value pair formats
   * 
   * @param keyValuePairs - Key-value pairs to validate
   * @param definitions - Expected key definitions with formats
   * @returns Validation result for key-value pairs
   * @throws {ArgumentParsingError} When key-value validation fails
   */
  async validateKeyValuePairs(
    keyValuePairs: Record<string, string>,
    definitions: ArgumentDefinition[]
  ): Promise<ArgumentValidationResultDTO> {
    const validationResults: ArgumentValidationResult[] = []
    const formatErrors: ArgumentFormatError[] = []
    const validatedArguments: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      const definition = definitions.find(def => def.name === key)
      
      if (definition && definition.format) {
        // eslint-disable-next-line no-await-in-loop -- Sequential validation is necessary for proper error handling
        const isValid = await this.validateArgumentFormat(key, value, definition.format)
        
        validationResults.push({
          argumentName: key,
          isValid,
          validatedValue: isValid ? value : undefined
        })
        
        if (isValid) {
          validatedArguments[key] = value
        } else {
          formatErrors.push({
            argumentName: key,
            error: `Invalid ${definition.format} format`,
            expectedFormat: definition.format,
            providedValue: value
          })
        }
      } else {
        // No format specified, consider valid
        validationResults.push({
          argumentName: key,
          isValid: true,
          validatedValue: value
        })
        validatedArguments[key] = value
      }
    }
    
    const isValid = formatErrors.length === 0 && validationResults.every(r => r.isValid)
    
    return ArgumentValidationResultDTO.fromValidationResults(
      isValid,
      [],
      formatErrors,
      validationResults,
      validatedArguments
    )
  }

  /**
   * Validate required arguments are present
   * 
   * @param args - Parsed arguments to check
   * @param required - Array of required argument names
   * @returns Validation result with missing arguments
   * @throws {ArgumentParsingError} When requirement checking fails
   */
  async validateRequiredArguments(
    args: ParsedArgumentsDTO,
    required: string[]
  ): Promise<ArgumentValidationResultDTO> {
    const definitions = required.map(name => ({
      description: `Required argument: ${name}`,
      name,
      required: true
    }))
    
    return this.validateArguments(args, definitions)
  }

  /**
   * Validate standard patterns
   * 
   * @param args - Parsed arguments to validate
   * @param requiredPatterns - Required patterns to validate
   * @returns Validation result for pattern matching
   * @throws {ArgumentParsingError} When pattern validation fails
   */
  async validateStandardPatterns(
    args: ParsedArgumentsDTO,
    requiredPatterns: string[]
  ): Promise<ArgumentValidationResultDTO> {
    const validationResults: ArgumentValidationResult[] = []
    const formatErrors: ArgumentFormatError[] = []
    const validatedArguments: Record<string, string> = {}
    
    const allValues = [
      ...args.getPositionalValues(),
      ...Object.values(args.getKeyValueRecord())
    ]
    
    for (const pattern of requiredPatterns) {
      const matchingValues = this.findValuesMatchingPattern(allValues, pattern)
      
      if (matchingValues.length === 0) {
        formatErrors.push({
          argumentName: `pattern_${pattern}`,
          error: `No arguments match required pattern: ${pattern}`,
          expectedFormat: pattern as ArgumentFormat,
          providedValue: 'none'
        })
      } else {
        validationResults.push({
          argumentName: `pattern_${pattern}`,
          isValid: true,
          // eslint-disable-next-line cc-commands/require-typed-data-access -- Length check above ensures array has elements
          validatedValue: matchingValues[0]!
        })
        validatedArguments[`pattern_${pattern}`] = matchingValues.join(', ')
      }
    }
    
    const isValid = formatErrors.length === 0
    
    return ArgumentValidationResultDTO.fromValidationResults(
      isValid,
      [],
      formatErrors,
      validationResults,
      validatedArguments
    )
  }

  /**
   * Find missing required arguments
   * 
   * @param args - Parsed arguments
   * @param definitions - Argument definitions
   * @returns Array of missing required argument names
   */
  private async findMissingRequiredArguments(
    args: ParsedArgumentsDTO,
    definitions: ArgumentDefinition[]
  ): Promise<string[]> {
    const missing: string[] = []
    const positionalValues = args.getPositionalValues()
    const keyValues = args.getKeyValueRecord()
    const flags = args.getFlagsRecord()
    
    for (const definition of definitions) {
      if (!definition.required) continue
      
      // Check if argument is present in any form
      const isPresent = 
        positionalValues.includes(definition.name) ||
        Object.hasOwn(keyValues, definition.name) ||
        Object.hasOwn(flags, definition.name) ||
        definition.aliases?.some(alias => 
          positionalValues.includes(alias) ||
          Object.hasOwn(keyValues, alias) ||
          Object.hasOwn(flags, alias)
        )
      
      if (!isPresent) {
        missing.push(definition.name)
      }
    }
    
    return missing
  }

  /**
   * Find values matching a pattern
   * 
   * @param values - Values to search
   * @param pattern - Pattern name
   * @returns Matching values
   */
  private findValuesMatchingPattern(values: string[], pattern: string): string[] {
    const regex = this.getPatternRegex(pattern)
    if (!regex) return []
    
    return values.filter(value => regex.test(value))
  }

  /**
   * Get example for a format type
   * 
   * @param format - Format type
   * @returns Example string for the format
   */
  private getFormatExample(format: ArgumentFormat): string {
    switch (format) {
      case ARGUMENT_FORMATS.BOOLEAN: {
        return 'true'
      }

      case ARGUMENT_FORMATS.DATE: {
        return '2024-01-01'
      }

      case ARGUMENT_FORMATS.EMAIL: {
        return 'user@example.com'
      }

      case ARGUMENT_FORMATS.GITHUB_REPO: {
        return 'owner/repo'
      }

      case ARGUMENT_FORMATS.JSON: {
        return '{"key": "value"}'
      }

      case ARGUMENT_FORMATS.NUMBER: {
        return '42'
      }

      case ARGUMENT_FORMATS.PATH: {
        return '/path/to/file'
      }

      case ARGUMENT_FORMATS.PERMISSION_LEVEL: {
        return 'medium'
      }

      case ARGUMENT_FORMATS.URL: {
        return 'https://example.com'
      }

      default: {
        return 'text'
      }
    }
  }

  /**
   * Get regex for a pattern name
   * 
   * @param pattern - Pattern name
   * @returns Regex or undefined
   */
  private getPatternRegex(pattern: string): RegExp | undefined {
    switch (pattern) {
      case 'date': {
        return ARGUMENT_PATTERNS.DATE
      }

      case 'email': {
        return ARGUMENT_PATTERNS.EMAIL
      }

      case 'github_repo': {
        return ARGUMENT_PATTERNS.GITHUB_REPO
      }

      case 'path': {
        return ARGUMENT_PATTERNS.PATH
      }

      case 'url': {
        return ARGUMENT_PATTERNS.URL
      }

      default: {
        return undefined
      }
    }
  }

  /**
   * Check if count is valid
   * 
   * @param count - Actual count
   * @param min - Minimum required
   * @param max - Maximum allowed
   * @returns True if count is valid
   */
  private isValidCount(count: number, min?: number, max?: number): boolean {
    if (min !== undefined && count < min) return false
    if (max !== undefined && count > max) return false
    return true
  }

  /**
   * Check if value matches the specified format
   * 
   * @param value - Value to check
   * @param format - Expected format
   * @returns True if format is valid
   */
  private isValidFormat(value: string, format: ArgumentFormat): boolean {
    switch (format) {
      case ARGUMENT_FORMATS.BOOLEAN: {
        return ['0', '1', 'false', 'no', 'true', 'yes'].includes(value.toLowerCase())
      }

      case ARGUMENT_FORMATS.DATE: {
        return ARGUMENT_PATTERNS.DATE.test(value)
      }

      case ARGUMENT_FORMATS.EMAIL: {
        return ARGUMENT_PATTERNS.EMAIL.test(value)
      }

      case ARGUMENT_FORMATS.GITHUB_REPO: {
        return ARGUMENT_PATTERNS.GITHUB_REPO.test(value)
      }

      case ARGUMENT_FORMATS.JSON: {
        try {
          JSON.parse(value)
          return true
        } catch {
          return false
        }
      }

      case ARGUMENT_FORMATS.PERMISSION_LEVEL: {
        return ARGUMENT_PATTERNS.PERMISSION_LEVEL.test(value)
      }

      case ARGUMENT_FORMATS.NUMBER: {
        return !Number.isNaN(Number(value))
      }

      case ARGUMENT_FORMATS.PATH: {
        return ARGUMENT_PATTERNS.PATH.test(value)
      }

      case ARGUMENT_FORMATS.URL: {
        return ARGUMENT_PATTERNS.URL.test(value)
      }

      default: {
        return true
      } // String format always valid
    }
  }

  /**
   * Validate positional arguments
   * 
   * @param positionalValues - Positional argument values
   * @param definitions - Argument definitions
   * @param context - Validation context containing results arrays
   */
  private async validatePositionalArguments(
    positionalValues: string[],
    definitions: ArgumentDefinition[],
    context: {
      formatErrors: ArgumentFormatError[]
      validatedArguments: Record<string, string>
      validationResults: ArgumentValidationResult[]
    }
  ): Promise<void> {
    const positionalDefinitions = definitions.filter(def => !def.name.startsWith('--'))
    
    for (const [i, value] of positionalValues.entries()) {
      if (!value) continue
      
      const definition = positionalDefinitions[i]
      
      if (definition && definition.format) {
        const isValid = this.isValidFormat(value, definition.format)
        
        context.validationResults.push({
          argumentName: definition.name,
          expectedFormat: definition.format,
          isValid,
          validatedValue: isValid ? value : undefined
        })
        
        if (isValid) {
          context.validatedArguments[definition.name] = value
        } else {
          context.formatErrors.push({
            argumentName: definition.name,
            error: `Invalid ${definition.format} format`,
            expectedFormat: definition.format,
            providedValue: value
          })
        }
      }
    }
  }

  /**
   * Validate arguments that are present
   * 
   * @param args - Parsed arguments
   * @param definitions - Argument definitions
   * @param context - Validation context containing results arrays
   */
  private async validatePresentArguments(
    args: ParsedArgumentsDTO,
    definitions: ArgumentDefinition[],
    context: {
      formatErrors: ArgumentFormatError[]
      validatedArguments: Record<string, string>
      validationResults: ArgumentValidationResult[]
    }
  ): Promise<void> {
    // Validate positional arguments
    await this.validatePositionalArguments(
      args.getPositionalValues(), 
      definitions, 
      context
    )
    
    // Validate key-value pairs
    const keyValueResult = await this.validateKeyValuePairs(args.getKeyValueRecord(), definitions)
    context.validationResults.push(...keyValueResult.validationResults)
    context.formatErrors.push(...keyValueResult.formatErrors)
    Object.assign(context.validatedArguments, keyValueResult.validatedArguments)
  }
}