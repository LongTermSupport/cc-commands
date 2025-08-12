/**
 * @file Argument Parsing Error Classes
 * 
 * Custom error classes for argument parsing operations with structured
 * error information and recovery instructions.
 */

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ArgumentErrorType } from '../types/ArgumentTypes.js'

/**
 * Factory for creating argument parsing OrchestratorErrors
 * 
 * Provides structured error creation with context and recovery instructions
 * for argument parsing, validation, and format checking failures.
 */
export class ArgumentParsingError {
  /**
   * Create error for invalid argument count
   * 
   * @param actual - Actual number of arguments
   * @param min - Minimum required arguments
   * @param max - Maximum allowed arguments
   * @returns OrchestratorError instance
   */
  static argumentCountInvalid(actual: number, min?: number, max?: number): OrchestratorError {
    let message = `Invalid argument count: ${actual}`
    const constraints = []
    
    if (min !== undefined) constraints.push(`minimum ${min}`)
    if (max !== undefined) constraints.push(`maximum ${max}`)
    
    if (constraints.length > 0) {
      message += ` (expected ${constraints.join(', ')})`
    }

    return ArgumentParsingError.create(
      'ARGUMENT_COUNT_INVALID',
      message,
      [
        'Provide the correct number of arguments',
        'Use --help to see argument requirements',
        'Check command documentation for parameter count',
        'Remove extra arguments or add missing ones'
      ],
      { actual, max, min }
    )
  }

  /**
   * Create OrchestratorError for argument parsing operations
   * 
   * @param errorType - Type of argument parsing error
   * @param message - Error message
   * @param recoveryInstructions - Recovery instructions for the user
   * @param context - Additional context information
   * @returns OrchestratorError instance
   */
  static create(
    errorType: ArgumentErrorType,
    message: string,
    recoveryInstructions: string[],
    context?: Record<string, unknown>
  ): OrchestratorError {
    const error = new Error(message)
    error.name = `ArgumentParsingError[${errorType}]`
    
    return new OrchestratorError(
      error,
      recoveryInstructions,
      { errorType, ...context }
    )
  }

  /**
   * Create error for invalid argument format
   * 
   * @param argumentName - Name of argument with invalid format
   * @param expectedFormat - Expected format
   * @param providedValue - Invalid value provided
   * @param formatExample - Example of valid format
   * @returns OrchestratorError instance
   */
  static formatInvalid(
    argumentName: string,
    expectedFormat: string,
    providedValue: string,
    formatExample?: string
  ): OrchestratorError {
    const exampleText = formatExample ? ` (example: ${formatExample})` : ''
    return ArgumentParsingError.create(
      'FORMAT_INVALID',
      `Argument '${argumentName}' has invalid format: expected ${expectedFormat}${exampleText}, got '${providedValue}'`,
      [
        `Format '${argumentName}' as ${expectedFormat}${exampleText}`,
        'Check argument format requirements',
        'Use --help for format examples',
        'Ensure input matches expected pattern'
      ],
      { argumentName, expectedFormat, formatExample, providedValue }
    )
  }

  /**
   * Create error for malformed input
   * 
   * @param input - Malformed input string
   * @param position - Position where malformation detected
   * @returns OrchestratorError instance
   */
  static malformedInput(input: string, position?: number): OrchestratorError {
    const positionText = position === undefined ? '' : ` at position ${position}`
    return ArgumentParsingError.create(
      'MALFORMED_INPUT',
      `Malformed argument input${positionText}: ${input}`,
      [
        'Check input syntax and format',
        'Ensure proper quoting and escaping',
        'Verify flag and parameter syntax',
        'Remove invalid characters or sequences'
      ],
      { input, position }
    )
  }

  /**
   * Create error for parsing failure
   * 
   * @param input - The input that failed to parse
   * @param reason - Why parsing failed
   * @returns OrchestratorError instance
   */
  static parsingFailed(input: string, reason: string): OrchestratorError {
    return ArgumentParsingError.create(
      'PARSING_FAILED',
      `Failed to parse arguments: ${reason}`,
      [
        'Check argument syntax and format',
        'Ensure proper quoting for arguments with spaces',
        'Verify flag and key-value pair formats',
        'Review input for special characters'
      ],
      { input, reason }
    )
  }

  /**
   * Create error for missing required arguments
   * 
   * @param missingArgs - List of missing required arguments
   * @returns OrchestratorError instance
   */
  static requiredMissing(missingArgs: string[]): OrchestratorError {
    const argList = missingArgs.join(', ')
    return ArgumentParsingError.create(
      'REQUIRED_MISSING',
      `Required arguments missing: ${argList}`,
      [
        `Provide values for required arguments: ${argList}`,
        'Use --help to see all required arguments',
        'Check command documentation for argument requirements',
        'Ensure all mandatory parameters are specified'
      ],
      { missingArgs }
    )
  }

  /**
   * Create error for unknown flag
   * 
   * @param flagName - Unknown flag name
   * @param availableFlags - List of available flags
   * @returns OrchestratorError instance
   */
  static unknownFlag(flagName: string, availableFlags: string[]): OrchestratorError {
    const suggestion = ArgumentParsingError.suggestSimilarFlag(flagName, availableFlags)
    const suggestionText = suggestion ? ` Did you mean --${suggestion}?` : ''
    
    return ArgumentParsingError.create(
      'UNKNOWN_FLAG',
      `Unknown flag: --${flagName}.${suggestionText}`,
      [
        'Use only supported flags',
        'Use --help to see all available flags',
        'Check flag spelling and format',
        ...(suggestion ? [`Try --${suggestion} instead`] : [])
      ],
      { availableFlags, flagName, suggestion }
    )
  }

  /**
   * Create error for validation failure
   * 
   * @param argumentName - Name of argument that failed validation
   * @param expectedFormat - Expected argument format
   * @param providedValue - Value that failed validation
   * @returns OrchestratorError instance
   */
  static validationFailed(
    argumentName: string,
    expectedFormat: string,
    providedValue: string
  ): OrchestratorError {
    return ArgumentParsingError.create(
      'VALIDATION_FAILED',
      `Argument '${argumentName}' validation failed: expected ${expectedFormat}, got '${providedValue}'`,
      [
        `Provide a valid ${expectedFormat} for argument '${argumentName}'`,
        'Check argument format documentation',
        'Use --help to see expected argument formats',
        'Verify input matches required pattern'
      ],
      { argumentName, expectedFormat, providedValue }
    )
  }

  /**
   * Calculate Levenshtein distance between two strings
   * 
   * @param a - First string
   * @param b - Second string
   * @returns Edit distance
   */
  private static levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length
    
    const matrix: number[][] = Array.from({length: a.length + 1}).fill(null).map(() => Array.from({length: b.length + 1}).fill(0) as number[])
    
    // eslint-disable-next-line cc-commands/require-typed-data-access -- Matrix initialization ensures array exists
    for (let i = 0; i <= a.length; i++) matrix[i]![0] = i
    // eslint-disable-next-line cc-commands/require-typed-data-access -- Matrix initialization ensures array exists
    for (let j = 0; j <= b.length; j++) matrix[0]![j] = j
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,     // deletion
          matrix[i]![j - 1]! + 1,     // insertion
          matrix[i - 1]![j - 1]! + indicator  // substitution
        )
      }
    }
    
    return matrix[a.length]![b.length]!
  }

  /**
   * Suggest similar flag name for typos
   * 
   * @param input - Input flag name
   * @param available - Available flag names
   * @returns Suggested flag name or undefined
   */
  private static suggestSimilarFlag(input: string, available: string[]): string | undefined {
    // Simple Levenshtein distance-based suggestion
    let bestMatch: string | undefined
    let bestDistance = Infinity
    
    for (const flag of available) {
      const distance = ArgumentParsingError.levenshteinDistance(input, flag)
      if (distance < bestDistance && distance <= 2) {
        bestDistance = distance
        bestMatch = flag
      }
    }
    
    return bestMatch
  }
}