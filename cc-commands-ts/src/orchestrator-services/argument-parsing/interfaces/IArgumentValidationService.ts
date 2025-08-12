/**
 * @file Argument Validation Service Interface
 * 
 * Interface contract for command-line argument validation operations.
 * Handles format validation, requirement checking, and constraint verification.
 */

import { ArgumentValidationResultDTO } from '../dto/ArgumentValidationResultDTO.js'
import { ParsedArgumentsDTO } from '../dto/ParsedArgumentsDTO.js'
import { ArgumentDefinition, ArgumentFormat } from '../types/ArgumentTypes.js'

/**
 * Interface for command-line argument validation operations
 * 
 * This interface defines the contract for validating parsed arguments
 * against requirements, formats, and constraints without interpreting
 * user intent or making decisions about command execution.
 * 
 * **CRITICAL**: This service performs ONLY validation and format checking.
 * It does NOT interpret what the user wants to do or assess command safety.
 * All intent interpretation is handled by LLM command logic.
 */
export interface IArgumentValidationService {
  /**
   * Check for unknown arguments
   * 
   * Identifies arguments that are not in the allowed/expected list.
   * Useful for catching typos and unsupported arguments.
   * 
   * @param args - Parsed arguments to check
   * @param allowedArguments - List of allowed argument names
   * @returns Array of unknown argument names
   */
  findUnknownArguments(
    args: ParsedArgumentsDTO,
    allowedArguments: string[]
  ): Promise<string[]>

  /**
   * Validate argument count constraints
   * 
   * Verifies that the number of parsed arguments meets minimum and
   * maximum constraints.
   * 
   * @param args - Parsed arguments to count
   * @param min - Minimum required arguments (optional)
   * @param max - Maximum allowed arguments (optional)
   * @returns Validation result with count information
   * @throws {ArgumentParsingError} When count validation fails
   */
  validateArgumentCount(
    args: ParsedArgumentsDTO,
    min?: number,
    max?: number
  ): Promise<ArgumentValidationResultDTO>

  /**
   * Validate single argument format
   * 
   * Validates that a specific argument value matches the expected format.
   * Used for detailed format checking of individual arguments.
   * 
   * @param argumentName - Name of the argument being validated
   * @param value - Value to validate
   * @param format - Expected format
   * @returns True if format is valid, false otherwise
   * @throws {ArgumentParsingError} When format validation fails
   */
  validateArgumentFormat(
    argumentName: string,
    value: string,
    format: ArgumentFormat
  ): Promise<boolean>

  /**
   * Validate parsed arguments against requirements
   * 
   * Checks that all required arguments are present and validates formats
   * according to argument definitions.
   * 
   * @param args - Parsed arguments to validate
   * @param definitions - Argument definitions with requirements and formats
   * @returns Comprehensive validation results
   * @throws {ArgumentParsingError} When validation process fails
   */
  validateArguments(
    args: ParsedArgumentsDTO,
    definitions: ArgumentDefinition[]
  ): Promise<ArgumentValidationResultDTO>

  /**
   * Validate flag combinations
   * 
   * Checks that flag combinations are valid (e.g., mutually exclusive flags).
   * Used to ensure consistent flag usage patterns.
   * 
   * @param flags - Record of flag names to boolean values
   * @param mutuallyExclusive - Arrays of mutually exclusive flag groups
   * @returns True if flag combinations are valid
   * @throws {ArgumentParsingError} When flag combination validation fails
   */
  validateFlagCombinations(
    flags: Record<string, boolean>,
    mutuallyExclusive: string[][]
  ): Promise<boolean>

  /**
   * Validate key-value pair formats
   * 
   * Validates that key-value pairs match expected formats and constraints.
   * 
   * @param keyValuePairs - Key-value pairs to validate
   * @param definitions - Expected key definitions with formats
   * @returns Validation result for key-value pairs
   * @throws {ArgumentParsingError} When key-value validation fails
   */
  validateKeyValuePairs(
    keyValuePairs: Record<string, string>,
    definitions: ArgumentDefinition[]
  ): Promise<ArgumentValidationResultDTO>

  /**
   * Validate required arguments are present
   * 
   * Checks that all specified required arguments are present in the
   * parsed arguments.
   * 
   * @param args - Parsed arguments to check
   * @param required - Array of required argument names
   * @returns Validation result with missing arguments
   * @throws {ArgumentParsingError} When requirement checking fails
   */
  validateRequiredArguments(
    args: ParsedArgumentsDTO,
    required: string[]
  ): Promise<ArgumentValidationResultDTO>

  /**
   * Validate standard patterns
   * 
   * Validates arguments against standard patterns (GitHub repos, dates, etc.)
   * for consistent format enforcement.
   * 
   * @param args - Parsed arguments to validate
   * @param requiredPatterns - Required patterns to validate
   * @returns Validation result for pattern matching
   * @throws {ArgumentParsingError} When pattern validation fails
   */
  validateStandardPatterns(
    args: ParsedArgumentsDTO,
    requiredPatterns: string[]
  ): Promise<ArgumentValidationResultDTO>
}