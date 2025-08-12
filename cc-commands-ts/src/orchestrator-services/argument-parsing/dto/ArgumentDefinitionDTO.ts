/**
 * @file Argument Definition Data Transfer Object
 * 
 * Represents the definition of a command-line argument including
 * requirements, format expectations, and validation rules.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure } from '../../../core/types/JsonResultTypes.js'
import { ArgumentDefinition, ArgumentFormat } from '../types/ArgumentTypes.js'

/**
 * Data Transfer Object for argument definitions
 * 
 * Contains the specification for a command-line argument including
 * validation requirements, expected formats, and metadata.
 */
export class ArgumentDefinitionDTO implements ILLMDataDTO {
  constructor(
    public readonly name: string,
    public readonly required: boolean,
    public readonly format: ArgumentFormat | undefined,
    public readonly description: string,
    public readonly defaultValue: string | undefined,
    public readonly aliases: string[]
  ) {}

  /**
   * Create ArgumentDefinitionDTO from ArgumentDefinition interface
   * 
   * @param definition - Argument definition interface
   * @returns New ArgumentDefinitionDTO instance
   */
  static fromDefinition(definition: ArgumentDefinition): ArgumentDefinitionDTO {
    return new ArgumentDefinitionDTO(
      definition.name,
      definition.required,
      definition.format,
      definition.description,
      definition.defaultValue,
      definition.aliases || []
    )
  }

  /**
   * Create multiple DTOs from definition array
   * 
   * @param definitions - Array of argument definitions
   * @returns Array of ArgumentDefinitionDTO instances
   */
  static fromDefinitions(definitions: ArgumentDefinition[]): ArgumentDefinitionDTO[] {
    return definitions.map(def => ArgumentDefinitionDTO.fromDefinition(def))
  }

  /**
   * Get all possible names for this argument
   * 
   * @returns Array including primary name and all aliases
   */
  getAllNames(): string[] {
    return [this.name, ...this.aliases]
  }

  /**
   * Get comprehensive jq query hints for argument definition data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      {
        description: 'Argument name',
        query: '.raw.argument_definition.name',
        scope: 'single_item'
      },
      {
        description: 'Whether argument is required',
        query: '.raw.argument_definition.required',
        scope: 'single_item'
      },
      {
        description: 'Expected format',
        query: '.raw.argument_definition.format',
        scope: 'single_item'
      },
      {
        description: 'Argument description',
        query: '.raw.argument_definition.description',
        scope: 'single_item'
      },
      {
        description: 'Default value',
        query: '.raw.argument_definition.default_value',
        scope: 'single_item'
      },
      {
        description: 'Argument aliases',
        query: '.raw.argument_definition.aliases',
        scope: 'all_items'
      }
    ]
  }

  /**
   * Check if argument has aliases
   * 
   * @returns True if aliases are defined
   */
  hasAliases(): boolean {
    return this.aliases.length > 0
  }

  /**
   * Check if argument has a default value
   * 
   * @returns True if default value is defined
   */
  hasDefaultValue(): boolean {
    return this.defaultValue !== undefined
  }

  /**
   * Check if argument matches name or alias
   * 
   * @param name - Name to check against
   * @returns True if name matches this argument's name or aliases
   */
  matchesName(name: string): boolean {
    if (this.name === name) return true
    return this.aliases.includes(name)
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete argument definition data
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'argument_metadata': {
          'aliases_count': this.aliases.length,
          'all_names': this.getAllNames(),
          'has_aliases': this.hasAliases(),
          'has_default_value': this.hasDefaultValue()
        }
      },
      raw: {
        'argument_definition': {
          'aliases': this.aliases,
          'default_value': this.defaultValue,
          'description': this.description,
          'format': this.format,
          'name': this.name,
          'required': this.required
        }
      }
    }
  }

  /**
   * Convert argument definition to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      'ALL_NAMES': this.getAllNames().join(', '),
      'ARGUMENT_ALIASES': this.aliases.join(', '),
      'ARGUMENT_DEFAULT': this.defaultValue || '',
      'ARGUMENT_DESCRIPTION': this.description,
      'ARGUMENT_FORMAT': this.format || 'string',
      'ARGUMENT_NAME': this.name,
      'ARGUMENT_REQUIRED': String(this.required),
      'HAS_ALIASES': String(this.hasAliases()),
      'HAS_DEFAULT_VALUE': String(this.hasDefaultValue())
    }
  }
}