/**
 * @file Parsed Arguments Data Transfer Object
 * 
 * Represents the result of parsing command-line arguments into structured
 * positional arguments, flags, and key-value pairs.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { ARGUMENT_DATA_KEYS } from '../constants/ArgumentConstants.js'
import { ArgumentParsingConfig, FlagResult, KeyValuePair, ParsedArgument, ParsingContext } from '../types/ArgumentTypes.js'

/**
 * Data Transfer Object for parsed command-line arguments
 * 
 * Contains the structured result of parsing a command-line argument string
 * into positional arguments, boolean flags, and key-value pairs.
 */
export class ParsedArgumentsDTO implements ILLMDataDTO {
  private static readonly Keys = ARGUMENT_DATA_KEYS

  constructor(
    public readonly positionalArgs: ParsedArgument[],
    public readonly flags: FlagResult[],
    public readonly keyValuePairs: KeyValuePair[],
    public readonly rawInput: string,
    public readonly parsingContext: ParsingContext
  ) {}

  /**
   * Create ParsedArgumentsDTO from parsing results
   * 
   * @param positionalArgs - Array of positional argument objects
   * @param flags - Array of flag results
   * @param keyValuePairs - Array of key-value pairs
   * @param rawInput - Original command string
   * @param config - Parsing configuration used
   * @param warnings - Any parsing warnings
   * @returns New ParsedArgumentsDTO instance
   */
  static fromParsingResults(
    positionalArgs: ParsedArgument[],
    flags: FlagResult[],
    keyValuePairs: KeyValuePair[],
    rawInput: string,
    config: ArgumentParsingConfig,
    warnings: string[] = []
  ): ParsedArgumentsDTO {
    const context: ParsingContext = {
      config,
      originalInput: rawInput,
      parsedAt: new Date(),
      warnings
    }

    return new ParsedArgumentsDTO(
      positionalArgs,
      flags,
      keyValuePairs,
      rawInput,
      context
    )
  }

  /**
   * Get array of enabled flag names
   * 
   * @returns Array of flag names that are enabled
   */
  getEnabledFlags(): string[] {
    return this.flags.filter(flag => flag.enabled).map(flag => flag.name)
  }

  /**
   * Get flags as boolean record
   * 
   * @returns Record of flag names to boolean values
   */
  getFlagsRecord(): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const flag of this.flags) {
      result[flag.name] = flag.enabled
    }

    return result
  }

  /**
   * Get comprehensive jq query hints for parsed arguments data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw parsing results
      {
        description: 'All positional arguments',
        query: '.raw.parsed_arguments.positional_args',
        scope: 'all_items'
      },
      {
        description: 'All enabled flags',
        query: '.raw.parsed_arguments.flags | map(select(.enabled == true)) | map(.name)',
        scope: 'all_items'
      },
      {
        description: 'All key-value pairs',
        query: '.raw.parsed_arguments.key_value_pairs',
        scope: 'all_items'
      },
      {
        description: 'Original raw input',
        query: '.raw.parsed_arguments.raw_input',
        scope: 'single_item'
      },
      
      // Calculated summaries
      {
        description: 'Total argument count',
        query: '.calculated.argument_summary.total_arguments',
        scope: 'single_item'
      },
      {
        description: 'Positional arguments count',
        query: '.calculated.argument_summary.positional_count',
        scope: 'single_item'
      },
      {
        description: 'Enabled flags count',
        query: '.calculated.argument_summary.flags_count',
        scope: 'single_item'
      },
      {
        description: 'Key-value pairs count',
        query: '.calculated.argument_summary.key_value_count',
        scope: 'single_item'
      },
      
      // Pattern detection
      {
        description: 'Detected GitHub repositories',
        query: '.calculated.pattern_detection.github_repos',
        scope: 'all_items'
      },
      {
        description: 'Detected date arguments',
        query: '.calculated.pattern_detection.date_args',
        scope: 'all_items'
      },
      
      // Parsing context
      {
        description: 'Parsing warnings',
        query: '.raw.parsing_context.warnings',
        scope: 'all_items'
      },
      {
        description: 'Has quoted arguments',
        query: '.calculated.parsing_analysis.has_quoted_args',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Find a specific key-value pair
   * 
   * @param key - Key to search for
   * @returns Value if found, undefined otherwise
   */
  getKeyValue(key: string): string | undefined {
    const pair = this.keyValuePairs.find(p => p.key === key)
    return pair?.value
  }

  /**
   * Get key-value pairs as simple record
   * 
   * @returns Record of keys to values
   */
  getKeyValueRecord(): Record<string, string> {
    const result: Record<string, string> = {}
    for (const pair of this.keyValuePairs) {
      result[pair.key] = pair.value
    }

    return result
  }

  /**
   * Get positional arguments as simple string array
   * 
   * @returns Array of positional argument values
   */
  getPositionalValues(): string[] {
    return this.positionalArgs.map(arg => arg.value)
  }

  /**
   * Get total number of arguments parsed
   * 
   * @returns Total count of all arguments (positional + flags + key-value)
   */
  getTotalArgumentCount(): number {
    return this.positionalArgs.length + this.flags.length + this.keyValuePairs.length
  }

  /**
   * Check if any arguments are quoted
   * 
   * @returns True if any positional arguments were quoted
   */
  hasQuotedArguments(): boolean {
    return this.positionalArgs.some(arg => arg.isQuoted)
  }

  /**
   * Check if parsing has any warnings
   * 
   * @returns True if parsing generated warnings
   */
  hasWarnings(): boolean {
    return this.parsingContext.warnings.length > 0
  }

  /**
   * Check if a flag is enabled
   * 
   * @param flagName - Flag name to check
   * @returns True if flag is enabled
   */
  isFlagEnabled(flagName: string): boolean {
    const flag = this.flags.find(f => f.name === flagName)
    return flag?.enabled ?? false
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete parsed arguments data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'argument_summary': this.buildArgumentSummary(),
        'parsing_analysis': this.buildParsingAnalysis(),
        'pattern_detection': this.buildPatternDetection()
      },
      raw: {
        'parsed_arguments': this.buildRawArgumentData(),
        'parsing_context': this.buildParsingContextData()
      }
    }
  }

  /**
   * Convert parsed arguments data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ParsedArgumentsDTO.Keys.DATE_ARGS_DETECTED]: String(this.detectDateArguments().length > 0),
      [ParsedArgumentsDTO.Keys.FLAGS]: this.getEnabledFlags().join(', '),
      // Pattern detection results
      [ParsedArgumentsDTO.Keys.GITHUB_REPO_DETECTED]: String(this.detectGitHubRepos().length > 0),
      [ParsedArgumentsDTO.Keys.HAS_QUOTED_ARGS]: String(this.hasQuotedArguments()),
      [ParsedArgumentsDTO.Keys.KEY_VALUE_PAIRS]: Object.keys(this.getKeyValueRecord()).join(', '),
      [ParsedArgumentsDTO.Keys.PARSING_TIMESTAMP]: this.parsingContext.parsedAt.toISOString(),
      [ParsedArgumentsDTO.Keys.PARSING_WARNINGS]: this.parsingContext.warnings.join('; '),
      [ParsedArgumentsDTO.Keys.PATH_ARGS_DETECTED]: String(this.detectPathArguments().length > 0),
      [ParsedArgumentsDTO.Keys.POSITIONAL_ARGS]: this.getPositionalValues().join(', '),
      [ParsedArgumentsDTO.Keys.RAW_INPUT]: this.rawInput,
      [ParsedArgumentsDTO.Keys.TOTAL_ARGUMENTS]: String(this.getTotalArgumentCount())
    }
  }

  /**
   * Build argument summary with counts and analysis
   * 
   * @returns Summary statistics for arguments
   */
  private buildArgumentSummary(): JsonObject {
    return {
      'enabled_flags': this.getEnabledFlags(),
      'flags_count': this.flags.filter(f => f.enabled).length,
      'key_names': this.keyValuePairs.map(p => p.key),
      'key_value_count': this.keyValuePairs.length,
      'positional_count': this.positionalArgs.length,
      'total_arguments': this.getTotalArgumentCount()
    }
  }

  /**
   * Build parsing analysis results
   * 
   * @returns Analysis of parsing characteristics
   */
  private buildParsingAnalysis(): JsonObject {
    return {
      'has_quoted_args': this.hasQuotedArguments(),
      'has_warnings': this.hasWarnings(),
      'parsing_successful': true, // If we have a DTO, parsing succeeded
      'warning_count': this.parsingContext.warnings.length
    }
  }

  /**
   * Build parsing context data structure
   * 
   * @returns Parsing context information
   */
  private buildParsingContextData(): JsonObject {
    return {
      'config': {
        normalize_flag_names: this.parsingContext.config.normalizeFlagNames,
        preserve_quotes: this.parsingContext.config.preserveQuotes,
        trim_values: this.parsingContext.config.trimValues
      },
      'original_input': this.parsingContext.originalInput,
      'parsed_at': this.parsingContext.parsedAt.toISOString(),
      'warnings': this.parsingContext.warnings
    }
  }

  /**
   * Build pattern detection results
   * 
   * @returns Detected patterns in arguments
   */
  private buildPatternDetection(): JsonObject {
    return {
      'date_args': this.detectDateArguments(),
      'github_repos': this.detectGitHubRepos(),
      'path_args': this.detectPathArguments(),
      'url_args': this.detectUrlArguments()
    }
  }

  /**
   * Build raw argument data structure
   * 
   * @returns Raw argument data exactly as parsed
   */
  private buildRawArgumentData(): JsonObject {
    return {
      'flags': this.flags.map(flag => ({
        enabled: flag.enabled,
        name: flag.name,
        original_format: flag.originalFormat
      })),
      'key_value_pairs': this.keyValuePairs.map(pair => ({
        key: pair.key,
        raw_format: pair.rawFormat,
        value: pair.value
      })),
      'positional_args': this.positionalArgs.map(arg => ({
        is_quoted: arg.isQuoted,
        position: arg.position,
        raw_value: arg.rawValue,
        value: arg.value
      })),
      'raw_input': this.rawInput
    }
  }

  /**
   * Detect date patterns in arguments
   * 
   * @returns Array of detected date strings
   */
  private detectDateArguments(): string[] {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    const dates: string[] = []
    
    // Check positional arguments
    for (const arg of this.positionalArgs) {
      if (datePattern.test(arg.value)) {
        dates.push(arg.value)
      }
    }
    
    // Check key-value pairs
    for (const pair of this.keyValuePairs) {
      if (datePattern.test(pair.value)) {
        dates.push(pair.value)
      }
    }
    
    return dates
  }

  /**
   * Detect GitHub repository patterns in arguments
   * 
   * @returns Array of detected GitHub repository strings
   */
  private detectGitHubRepos(): string[] {
    const githubPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/
    const repos: string[] = []
    
    for (const arg of this.positionalArgs) {
      if (githubPattern.test(arg.value)) {
        repos.push(arg.value)
      }
    }
    
    return repos
  }

  /**
   * Detect path patterns in arguments
   * 
   * @returns Array of detected path strings
   */
  private detectPathArguments(): string[] {
    const pathPattern = /^[^\0]+$/
    const paths: string[] = []
    
    for (const arg of this.positionalArgs) {
      if (pathPattern.test(arg.value) && (arg.value.includes('/') || arg.value.includes('\\'))) {
        paths.push(arg.value)
      }
    }
    
    return paths
  }

  /**
   * Detect URL patterns in arguments
   * 
   * @returns Array of detected URL strings
   */
  private detectUrlArguments(): string[] {
    const urlPattern = /^https?:\/\/[^\s]+$/
    const urls: string[] = []
    
    // Check positional arguments
    for (const arg of this.positionalArgs) {
      if (urlPattern.test(arg.value)) {
        urls.push(arg.value)
      }
    }
    
    // Check key-value pairs
    for (const pair of this.keyValuePairs) {
      if (urlPattern.test(pair.value)) {
        urls.push(pair.value)
      }
    }
    
    return urls
  }
}