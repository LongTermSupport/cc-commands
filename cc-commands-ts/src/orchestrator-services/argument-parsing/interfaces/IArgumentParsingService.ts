/**
 * @file Argument Parsing Service Interface
 * 
 * Interface contract for command-line argument parsing operations.
 * Handles parsing, extraction, and standardization of command arguments.
 */

import { ParsedArgumentsDTO } from '../dto/ParsedArgumentsDTO.js'
import { ArgumentParsingConfig } from '../types/ArgumentTypes.js'

/**
 * Interface for command-line argument parsing operations
 * 
 * This interface defines the contract for parsing command-line arguments
 * into structured data without interpreting user intent or making decisions
 * about command complexity or safety.
 * 
 * **CRITICAL**: This service performs ONLY parsing and structure extraction.
 * It does NOT interpret what the user wants to do or assess command safety.
 * All intent interpretation is handled by LLM command logic.
 */
export interface IArgumentParsingService {
  /**
   * Detect standard argument patterns
   * 
   * Identifies common argument patterns (GitHub repos, dates, URLs, etc.)
   * in the parsed arguments for pattern-based processing.
   * 
   * @param parsedArgs - Previously parsed arguments
   * @returns Record of pattern names to detected values
   */
  detectStandardPatterns(parsedArgs: ParsedArgumentsDTO): Promise<Record<string, string[]>>

  /**
   * Extract only flags from arguments
   * 
   * Identifies and extracts boolean flags (--flag, -f) from the argument string.
   * Used for specialized flag processing.
   * 
   * @param args - Raw argument string
   * @returns Record of flag names to boolean values
   * @throws {ArgumentParsingError} When flag parsing fails
   */
  extractFlags(args: string): Promise<Record<string, boolean>>

  /**
   * Extract only key-value pairs from arguments
   * 
   * Identifies and extracts key-value assignments (--key=value) from arguments.
   * Used for specialized parameter processing.
   * 
   * @param args - Raw argument string
   * @returns Record of key names to string values
   * @throws {ArgumentParsingError} When key-value parsing fails
   */
  extractKeyValuePairs(args: string): Promise<Record<string, string>>

  /**
   * Get positional arguments only
   * 
   * Extracts only the positional (non-flag, non-key-value) arguments.
   * Useful for commands that need to process positional args separately.
   * 
   * @param args - Raw argument string
   * @returns Array of positional argument strings
   * @throws {ArgumentParsingError} When positional parsing fails
   */
  getPositionalArguments(args: string): Promise<string[]>

  /**
   * Parse command-line arguments from array
   * 
   * Takes an array of argument strings and parses them into structured data.
   * Useful when arguments are already tokenized.
   * 
   * @param args - Array of argument strings
   * @param config - Optional parsing configuration
   * @returns Structured parsed arguments
   * @throws {ArgumentParsingError} When parsing fails
   */
  parseArgumentArray(args: string[], config?: ArgumentParsingConfig): Promise<ParsedArgumentsDTO>

  /**
   * Parse command-line arguments from string
   * 
   * Takes a raw command argument string and parses it into structured
   * positional arguments, flags, and key-value pairs.
   * 
   * @param args - Raw command argument string
   * @param config - Optional parsing configuration
   * @returns Structured parsed arguments
   * @throws {ArgumentParsingError} When parsing fails or input is malformed
   * 
   * @example
   * ```typescript
   * // Input: "owner/repo --force --since=2024-01-01"
   * // Output: ParsedArgumentsDTO with:
   * // - positionalArgs: ['owner/repo']
   * // - flags: { force: true }
   * // - keyValuePairs: { since: '2024-01-01' }
   * ```
   */
  parseArguments(args: string, config?: ArgumentParsingConfig): Promise<ParsedArgumentsDTO>

  /**
   * Standardize argument format
   * 
   * Converts parsed arguments to a standardized format for consistent
   * processing across different command implementations.
   * 
   * @param parsedArgs - Previously parsed arguments
   * @returns Standardized argument representation
   * @throws {ArgumentParsingError} When standardization fails
   */
  standardizeArguments(parsedArgs: ParsedArgumentsDTO): Promise<ParsedArgumentsDTO>
}