/**
 * @file Argument Parsing Service Implementation
 * 
 * Service for parsing command-line arguments into structured data.
 * Handles positional arguments, flags, and key-value pairs with
 * proper quoting and escaping support.
 */

import { 
  ARGUMENT_PATTERNS, 
  DEFAULT_PARSING_CONFIG, 
  MAX_ARGUMENT_LENGTH,
  MAX_ARGUMENTS 
} from '../constants/ArgumentConstants.js'
import { ParsedArgumentsDTO } from '../dto/ParsedArgumentsDTO.js'
import { ArgumentParsingError } from '../errors/ArgumentParsingError.js'
import { IArgumentParsingService } from '../interfaces/IArgumentParsingService.js'
import { 
  ArgumentParsingConfig, 
  FlagResult, 
  KeyValuePair, 
  ParsedArgument 
} from '../types/ArgumentTypes.js'

/**
 * Service for parsing command-line arguments
 * 
 * Provides comprehensive argument parsing functionality including
 * tokenization, flag extraction, key-value parsing, and pattern detection.
 * 
 * **CRITICAL**: This service performs ONLY parsing operations.
 * It does NOT interpret user intent or make decisions about commands.
 */
export class ArgumentParsingService implements IArgumentParsingService {

  /**
   * Detect standard argument patterns
   * 
   * @param parsedArgs - Previously parsed arguments
   * @returns Record of pattern names to detected values
   */
  async detectStandardPatterns(parsedArgs: ParsedArgumentsDTO): Promise<Record<string, string[]>> {
    const patterns: Record<string, string[]> = {}
    const allValues = [
      ...parsedArgs.getPositionalValues(),
      ...Object.values(parsedArgs.getKeyValueRecord())
    ]

    // GitHub repository pattern
    patterns['github_repos'] = allValues.filter(value => 
      ARGUMENT_PATTERNS.GITHUB_REPO.test(value)
    )

    // Date pattern
    patterns['dates'] = allValues.filter(value => 
      ARGUMENT_PATTERNS.DATE.test(value)
    )

    // URL pattern
    patterns['urls'] = allValues.filter(value => 
      ARGUMENT_PATTERNS.URL.test(value)
    )

    // Email pattern
    patterns['emails'] = allValues.filter(value => 
      ARGUMENT_PATTERNS.EMAIL.test(value)
    )

    // Path pattern (basic check for paths)
    patterns['paths'] = allValues.filter(value => 
      ARGUMENT_PATTERNS.PATH.test(value) && (value.includes('/') || value.includes('\\'))
    )

    return patterns
  }

  /**
   * Extract only flags from arguments
   * 
   * @param args - Raw argument string
   * @returns Record of flag names to boolean values
   * @throws {ArgumentParsingError} When flag parsing fails
   */
  async extractFlags(args: string): Promise<Record<string, boolean>> {
    const parsed = await this.parseArguments(args)
    return parsed.getFlagsRecord()
  }

  /**
   * Extract only key-value pairs from arguments
   * 
   * @param args - Raw argument string
   * @returns Record of key names to string values
   * @throws {ArgumentParsingError} When key-value parsing fails
   */
  async extractKeyValuePairs(args: string): Promise<Record<string, string>> {
    const parsed = await this.parseArguments(args)
    return parsed.getKeyValueRecord()
  }

  /**
   * Get positional arguments only
   * 
   * @param args - Raw argument string
   * @returns Array of positional argument strings
   * @throws {ArgumentParsingError} When positional parsing fails
   */
  async getPositionalArguments(args: string): Promise<string[]> {
    const parsed = await this.parseArguments(args)
    return parsed.getPositionalValues()
  }

  /**
   * Parse command-line arguments from array
   * 
   * @param args - Array of argument strings
   * @param config - Optional parsing configuration
   * @returns Structured parsed arguments
   * @throws {ArgumentParsingError} When parsing fails
   */
  async parseArgumentArray(args: string[], config?: ArgumentParsingConfig): Promise<ParsedArgumentsDTO> {
    // Join array with spaces and parse as string
    // This preserves the structure while allowing unified parsing
    const argsString = args.join(' ')
    return this.parseArguments(argsString, config)
  }

  /**
   * Parse command-line arguments from string
   * 
   * @param args - Raw command argument string
   * @param config - Optional parsing configuration
   * @returns Structured parsed arguments
   * @throws {ArgumentParsingError} When parsing fails or input is malformed
   */
  async parseArguments(args: string, config?: ArgumentParsingConfig): Promise<ParsedArgumentsDTO> {
    const effectiveConfig = { ...DEFAULT_PARSING_CONFIG, ...config }
    
    try {
      // Input validation
      this.validateInput(args)
      
      // Tokenize the input string
      const tokens = this.tokenizeArguments(args)
      
      // Parse tokens into structured data
      const { flags, keyValuePairs, positionalArgs, warnings } = this.parseTokens(tokens, effectiveConfig)
      
      return ParsedArgumentsDTO.fromParsingResults(
        positionalArgs,
        flags,
        keyValuePairs,
        args,
        effectiveConfig,
        warnings
      )
    } catch (error) {
      if (error instanceof ArgumentParsingError) {
        throw error
      }
      
      throw ArgumentParsingError.parsingFailed(
        args,
        error instanceof Error ? error.message : 'Unknown parsing error'
      )
    }
  }

  /**
   * Standardize argument format
   * 
   * @param parsedArgs - Previously parsed arguments
   * @returns Standardized argument representation
   * @throws {ArgumentParsingError} When standardization fails
   */
  async standardizeArguments(parsedArgs: ParsedArgumentsDTO): Promise<ParsedArgumentsDTO> {
    // For now, return the same arguments
    // Future: Could implement normalization like case conversion, alias resolution, etc.
    return parsedArgs
  }

  /**
   * Check if token is a flag
   * 
   * @param token - Token to check
   * @returns True if token is flag format
   */
  private isFlag(token: string): boolean {
    return ARGUMENT_PATTERNS.SHORT_FLAG.test(token) || ARGUMENT_PATTERNS.LONG_FLAG.test(token)
  }

  /**
   * Check if token is a key-value pair
   * 
   * @param token - Token to check
   * @returns True if token is key-value format
   */
  private isKeyValuePair(token: string): boolean {
    return ARGUMENT_PATTERNS.KEY_VALUE.test(token)
  }

  /**
   * Parse a flag token
   * 
   * @param token - Flag token (--flag or -f)
   * @param config - Parsing configuration
   * @returns Parsed flag result
   */
  private parseFlag(token: string, config: ArgumentParsingConfig): FlagResult {
    let name: string
    
    if (ARGUMENT_PATTERNS.SHORT_FLAG.test(token)) {
      // Short flag (-f)
      name = token.slice(1)
    } else if (ARGUMENT_PATTERNS.LONG_FLAG.test(token)) {
      // Long flag (--flag)
      name = token.slice(2)
    } else {
      throw ArgumentParsingError.malformedInput(token)
    }
    
    // Apply configuration
    if (config.normalizeFlagNames) {
      name = name.toLowerCase()
    }
    
    return {
      enabled: true,
      name,
      originalFormat: token
    }
  }

  /**
   * Parse a key-value pair token
   * 
   * @param token - Key-value token (--key=value)
   * @param config - Parsing configuration
   * @returns Parsed key-value pair
   */
  private parseKeyValuePair(token: string, config: ArgumentParsingConfig): KeyValuePair {
    const match = token.match(ARGUMENT_PATTERNS.KEY_VALUE)
    const key1 = match?.[1]
    const value2 = match?.[2]
    
    if (!match || !key1 || !value2) {
      throw ArgumentParsingError.malformedInput(token)
    }
    
    let key = key1
    let value = value2
    
    // Apply configuration
    if (config.normalizeFlagNames) {
      key = key.toLowerCase()
    }
    
    if (config.trimValues) {
      value = value.trim()
    }
    
    // Remove quotes if not preserving them
    if (!config.preserveQuotes && ARGUMENT_PATTERNS.QUOTED_STRING.test(value)) {
      value = value.slice(1, -1)
    }
    
    return {
      key,
      rawFormat: token,
      value
    }
  }

  /**
   * Parse a positional argument
   * 
   * @param token - Positional argument token
   * @param position - Position index
   * @param config - Parsing configuration
   * @returns Parsed positional argument
   */
  private parsePositionalArgument(token: string, position: number, config: ArgumentParsingConfig): ParsedArgument {
    let value = token
    const isQuoted = ARGUMENT_PATTERNS.QUOTED_STRING.test(token)
    
    // Apply configuration
    if (config.trimValues) {
      value = value.trim()
    }
    
    // Remove quotes if not preserving them
    if (!config.preserveQuotes && isQuoted) {
      value = value.slice(1, -1)
    }
    
    return {
      isQuoted,
      position,
      rawValue: token,
      value
    }
  }

  /**
   * Parse tokens into structured argument data
   * 
   * @param tokens - Array of tokenized arguments
   * @param config - Parsing configuration
   * @returns Parsed argument structures and warnings
   */
  private parseTokens(tokens: string[], config: ArgumentParsingConfig): {
    flags: FlagResult[]
    keyValuePairs: KeyValuePair[]
    positionalArgs: ParsedArgument[]
    warnings: string[]
  } {
    const positionalArgs: ParsedArgument[] = []
    const flags: FlagResult[] = []
    const keyValuePairs: KeyValuePair[] = []
    const warnings: string[] = []
    
    let position = 0
    
    for (const token of tokens) {
      if (this.isKeyValuePair(token)) {
        // Key-value pair (--key=value)
        const pair = this.parseKeyValuePair(token, config)
        keyValuePairs.push(pair)
      } else if (this.isFlag(token)) {
        // Flag (--flag or -f)
        const flag = this.parseFlag(token, config)
        flags.push(flag)
      } else {
        // Positional argument
        const arg = this.parsePositionalArgument(token, position, config)
        positionalArgs.push(arg)
        position++
      }
    }
    
    return { flags, keyValuePairs, positionalArgs, warnings }
  }

  /**
   * Tokenize argument string into individual components
   * 
   * @param args - Argument string to tokenize
   * @returns Array of token strings
   */
  private tokenizeArguments(args: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let i = 0

    while (i < args.length) {
      const char = args[i]
      if (char === undefined) break
      
      if (!inQuotes && (char === '"' || char === "'")) {
        // Start quote
        inQuotes = true
        quoteChar = char
        current += char
      } else if (inQuotes && char === quoteChar) {
        // End quote
        inQuotes = false
        current += char
        quoteChar = ''
      } else if (!inQuotes && /\s/.test(char)) {
        // Whitespace outside quotes - end current token
        if (current.trim()) {
          tokens.push(current.trim())
          current = ''
        }
      } else {
        current += char
      }
      
      i++
    }
    
    // Add final token
    if (current.trim()) {
      tokens.push(current.trim())
    }
    
    // Validate token count
    if (tokens.length > MAX_ARGUMENTS) {
      throw ArgumentParsingError.argumentCountInvalid(tokens.length, undefined, MAX_ARGUMENTS)
    }
    
    return tokens
  }

  /**
   * Validate input arguments
   * 
   * @param args - Input string to validate
   * @throws {ArgumentParsingError} If input is invalid
   */
  private validateInput(args: string): void {
    if (args.length > MAX_ARGUMENT_LENGTH * MAX_ARGUMENTS) {
      throw ArgumentParsingError.malformedInput(
        args.slice(0, 100) + '...'
      )
    }
  }
}