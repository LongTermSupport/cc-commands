/**
 * @fileoverview Factory for creating validation-specific CommandErrors
 * 
 * This factory creates CommandError instances for input validation failures
 * with helpful recovery instructions specific to the validation problem.
 * 
 * @example
 * ```typescript
 * // Validate a URL
 * if (!isValidUrl(input)) {
 *   throw ValidationErrorFactory.invalidUrl('projectUrl', input)
 * }
 * ```
 */

import { CommandError } from './CommandError.js'

/**
 * Factory for creating validation-related errors with appropriate recovery instructions
 */
export class ValidationErrorFactory {
  /**
   * Create an invalid argument format error
   * 
   * @param argName - Name of the argument
   * @param providedValue - What the user provided
   * @param expectedFormat - What format was expected
   * @param examples - Optional examples of valid values
   * @returns CommandError with format correction instructions
   */
  static invalidArgument(
    argName: string, 
    providedValue: any, 
    expectedFormat: string,
    examples?: string[]
  ): CommandError {
    const instructions = [
      `Check the format of '${argName}'`,
      `Expected format: ${expectedFormat}`,
      `You provided: ${providedValue}`,
      'Run command with --help for usage examples',
      'Ensure special characters are properly escaped'
    ]
    
    if (examples && examples.length > 0) {
      instructions.push('Valid examples:')
      examples.forEach(example => {
        instructions.push(`  ${example}`)
      })
    }
    
    return new CommandError(
      new Error(`Invalid argument '${argName}': expected ${expectedFormat}, got '${providedValue}'`),
      instructions,
      {
        errorDomain: 'validation',
        errorType: 'invalidArgument',
        argument: argName,
        providedValue,
        expectedFormat,
        examples
      }
    )
  }
  
  /**
   * Create a missing required argument error
   * 
   * @param argName - Name of the missing argument
   * @param purpose - What this argument is used for
   * @param position - Optional position in command (1st, 2nd, etc)
   * @returns CommandError with argument provision instructions
   */
  static missingRequiredArgument(
    argName: string, 
    purpose: string,
    position?: number
  ): CommandError {
    const positionText = position ? ` (${position}${this.getOrdinalSuffix(position)} argument)` : ''
    
    return new CommandError(
      new Error(`Missing required argument: ${argName}${positionText}`),
      [
        `Provide the ${argName} argument${positionText}`,
        `This argument is needed to: ${purpose}`,
        'Run command with --help for usage examples',
        'Check if you have the correct number of arguments',
        'Arguments are position-sensitive unless using flags'
      ],
      {
        errorDomain: 'validation',
        errorType: 'missingArgument',
        argument: argName,
        purpose,
        position
      }
    )
  }
  
  /**
   * Create an invalid URL error
   * 
   * @param argName - Name of the URL argument
   * @param providedValue - The invalid URL provided
   * @param expectedPattern - Optional pattern description
   * @returns CommandError with URL format instructions
   */
  static invalidUrl(
    argName: string,
    providedValue: string,
    expectedPattern?: string
  ): CommandError {
    const pattern = expectedPattern || 'https://example.com/path'
    
    return new CommandError(
      new Error(`Invalid URL for '${argName}': ${providedValue}`),
      [
        'Check the URL format',
        `Expected pattern: ${pattern}`,
        'Ensure the URL includes the protocol (https://)',
        'Check for typos or missing parts',
        'URL encode special characters if needed',
        'For GitHub URLs: https://github.com/owner/repo'
      ],
      {
        errorDomain: 'validation',
        errorType: 'invalidUrl',
        argument: argName,
        providedValue,
        expectedPattern: pattern
      }
    )
  }
  
  /**
   * Create an out of range error for numeric values
   * 
   * @param argName - Name of the argument
   * @param value - The provided value
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns CommandError with range correction instructions
   */
  static outOfRange(
    argName: string,
    value: number,
    min?: number,
    max?: number
  ): CommandError {
    let rangeDesc = ''
    if (min !== undefined && max !== undefined) {
      rangeDesc = `between ${min} and ${max}`
    } else if (min !== undefined) {
      rangeDesc = `at least ${min}`
    } else if (max !== undefined) {
      rangeDesc = `at most ${max}`
    }
    
    return new CommandError(
      new Error(`Value for '${argName}' is out of range: ${value} (must be ${rangeDesc})`),
      [
        `Provide a value ${rangeDesc}`,
        `You provided: ${value}`,
        'Check the command documentation for valid ranges',
        'Consider if you meant to use a different unit',
        'Use --help to see valid value ranges'
      ],
      {
        errorDomain: 'validation',
        errorType: 'outOfRange',
        argument: argName,
        value,
        min,
        max,
        rangeDescription: rangeDesc
      }
    )
  }
  
  /**
   * Create an invalid choice error (value not in allowed set)
   * 
   * @param argName - Name of the argument
   * @param value - The invalid value provided
   * @param validChoices - List of valid choices
   * @returns CommandError with valid choices listed
   */
  static invalidChoice(
    argName: string,
    value: string,
    validChoices: string[]
  ): CommandError {
    return new CommandError(
      new Error(`Invalid choice for '${argName}': '${value}'`),
      [
        `Choose one of: ${validChoices.join(', ')}`,
        `You provided: ${value}`,
        'Check for typos or case sensitivity',
        'Use --help to see all valid options',
        'Some options may require specific permissions'
      ],
      {
        errorDomain: 'validation',
        errorType: 'invalidChoice',
        argument: argName,
        providedValue: value,
        validChoices
      }
    )
  }
  
  /**
   * Create a mutually exclusive arguments error
   * 
   * @param args - The conflicting arguments
   * @returns CommandError with conflict resolution instructions
   */
  static mutuallyExclusiveArgs(...args: string[]): CommandError {
    return new CommandError(
      new Error(`Cannot use these arguments together: ${args.join(', ')}`),
      [
        'Use only one of these arguments at a time',
        `Conflicting arguments: ${args.join(', ')}`,
        'Check the command logic for which argument to use',
        'Run with --help to understand argument relationships',
        'Some arguments represent different modes of operation'
      ],
      {
        errorDomain: 'validation',
        errorType: 'mutuallyExclusive',
        conflictingArguments: args
      }
    )
  }
  
  /**
   * Create a dependent arguments error (A requires B)
   * 
   * @param providedArg - The argument that was provided
   * @param requiredArg - The argument that is required when using providedArg
   * @returns CommandError with dependency instructions
   */
  static dependentArgument(providedArg: string, requiredArg: string): CommandError {
    return new CommandError(
      new Error(`Argument '${providedArg}' requires '${requiredArg}' to also be specified`),
      [
        `Add the required argument: ${requiredArg}`,
        `When using '${providedArg}', you must also provide '${requiredArg}'`,
        'Check --help for argument dependencies',
        'Some arguments work together as a group',
        'Consider if you meant to use a different argument'
      ],
      {
        errorDomain: 'validation',
        errorType: 'dependentArgument',
        providedArgument: providedArg,
        requiredArgument: requiredArg
      }
    )
  }
  
  /**
   * Helper to get ordinal suffix (1st, 2nd, 3rd, etc)
   * @private
   */
  private static getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }
}