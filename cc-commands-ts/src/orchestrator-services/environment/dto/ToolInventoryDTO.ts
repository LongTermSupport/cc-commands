/**
 * @file Tool Inventory Data Transfer Object
 * 
 * Represents a comprehensive inventory of all tools in the environment,
 * including availability status and validation results.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { ENVIRONMENT_DATA_KEYS } from '../constants/EnvironmentConstants.js'
import { ToolName } from '../types/EnvironmentTypes.js'
import { ToolValidationResultDTO } from './ToolValidationResultDTO.js'

/**
 * Data Transfer Object for complete tool inventory
 * 
 * Aggregates all tool validation results to provide a comprehensive
 * overview of the development environment's tool availability.
 */
export class ToolInventoryDTO implements ILLMDataDTO {
  private static readonly Keys = ENVIRONMENT_DATA_KEYS

  constructor(
    public readonly toolResults: ToolValidationResultDTO[],
    public readonly requiredTools: ToolName[],
    public readonly optionalTools: ToolName[]
  ) {}

  /**
   * Create ToolInventoryDTO from individual tool results
   * 
   * @param toolResults - Array of tool validation results
   * @param requiredTools - List of required tool names
   * @param optionalTools - List of optional tool names
   * @returns New ToolInventoryDTO instance
   */
  static fromToolResults(
    toolResults: ToolValidationResultDTO[],
    requiredTools: ToolName[],
    optionalTools: ToolName[]
  ): ToolInventoryDTO {
    return new ToolInventoryDTO(toolResults, requiredTools, optionalTools)
  }

  /**
   * Get available tools
   * 
   * @returns Array of tool results for available tools
   */
  getAvailableTools(): ToolValidationResultDTO[] {
    return this.toolResults.filter(tool => tool.isAvailable)
  }

  /**
   * Get comprehensive jq query hints for tool inventory data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw data queries
      {
        description: 'All tool validation results',
        query: '.raw.tool_inventory.tools',
        scope: 'all_items'
      },
      {
        description: 'Required tools list',
        query: '.raw.tool_inventory.required_tools',
        scope: 'all_items'
      },
      {
        description: 'Optional tools list',
        query: '.raw.tool_inventory.optional_tools',
        scope: 'all_items'
      },
      
      // Calculated data queries
      {
        description: 'Available tools count (calculated)',
        query: '.calculated.inventory_summary.available_count',
        scope: 'single_item'
      },
      {
        description: 'Missing tools count (calculated)',
        query: '.calculated.inventory_summary.missing_count',
        scope: 'single_item'
      },
      {
        description: 'Tools with version issues (calculated)',
        query: '.calculated.inventory_analysis.tools_with_version_issues',
        scope: 'all_items'
      },
      {
        description: 'Missing required tools (calculated)',
        query: '.calculated.inventory_analysis.missing_required_tools',
        scope: 'all_items'
      },
      
      // Collection queries
      {
        description: 'Available tools by name',
        query: '.calculated.inventory_analysis.available_tools | map(.name)',
        scope: 'all_items'
      },
      {
        description: 'Missing tools by name',
        query: '.calculated.inventory_analysis.missing_tools | map(.name)',
        scope: 'all_items'
      }
    ]
  }

  /**
   * Get missing required tools
   * 
   * @returns Array of required tools that are not available
   */
  getMissingRequiredTools(): ToolValidationResultDTO[] {
    return this.toolResults.filter(tool => 
      this.requiredTools.includes(tool.toolName) && !tool.isAvailable
    )
  }

  /**
   * Get missing tools
   * 
   * @returns Array of tool results for missing tools
   */
  getMissingTools(): ToolValidationResultDTO[] {
    return this.toolResults.filter(tool => !tool.isAvailable)
  }

  /**
   * Get a summary of the tool inventory
   * 
   * @returns Human-readable summary for logging/debugging
   */
  getSummary(): string {
    const available = this.getAvailableTools().length
    const total = this.toolResults.length
    const missing = this.getMissingTools().length
    const missingRequired = this.getMissingRequiredTools().length
    
    return `Tool Inventory: ${available}/${total} available, ${missing} missing` +
           (missingRequired > 0 ? ` (${missingRequired} required missing)` : '')
  }

  /**
   * Get tools with version issues
   * 
   * @returns Array of tools that are available but have version problems
   */
  getToolsWithVersionIssues(): ToolValidationResultDTO[] {
    return this.toolResults.filter(tool => tool.hasVersionIssue())
  }

  /**
   * Check if all required tools are available
   * 
   * @returns True if all required tools are available with valid versions
   */
  hasAllRequiredTools(): boolean {
    return this.getMissingRequiredTools().length === 0 &&
           this.getRequiredToolsWithVersionIssues().length === 0
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete inventory data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'inventory_analysis': this.buildInventoryAnalysis(),
        'inventory_summary': this.buildInventorySummary()
      },
      raw: {
        'tool_inventory': this.buildRawInventoryData()
      }
    }
  }

  /**
   * Convert tool inventory data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    const availableTools = this.getAvailableTools()
    const missingTools = this.getMissingTools()
    
    return {
      [ToolInventoryDTO.Keys.TOOL_COUNT_AVAILABLE]: String(availableTools.length),
      [ToolInventoryDTO.Keys.TOOL_COUNT_MISSING]: String(missingTools.length),
      [ToolInventoryDTO.Keys.TOOL_COUNT_TOTAL]: String(this.toolResults.length),
      [ToolInventoryDTO.Keys.TOOLS_AVAILABLE]: availableTools.map(t => t.toolName).join(', '),
      [ToolInventoryDTO.Keys.TOOLS_MISSING]: missingTools.map(t => t.toolName).join(', ')
    }
  }

  /**
   * Build inventory analysis with categorized tools
   * 
   * @returns Analysis of tool categories and issues
   */
  private buildInventoryAnalysis(): JsonObject {
    return {
      'available_tools': this.getAvailableTools().map(tool => ({
        name: tool.toolName,
        path: tool.path,
        version: tool.version
      })),
      'missing_required_tools': this.getMissingRequiredTools().map(tool => tool.toolName),
      'missing_tools': this.getMissingTools().map(tool => tool.toolName),
      'tools_with_version_issues': this.getToolsWithVersionIssues().map(tool => ({
        detected_version: tool.version,
        name: tool.toolName,
        version_valid: tool.versionMeetsRequirements
      }))
    }
  }

  /**
   * Build inventory summary with counts and status
   * 
   * @returns Summary statistics and overall status
   */
  private buildInventorySummary(): JsonObject {
    return {
      'all_required_tools_available': this.hasAllRequiredTools(),
      'available_count': this.getAvailableTools().length,
      'missing_count': this.getMissingTools().length,
      'missing_required_count': this.getMissingRequiredTools().length,
      'summary': this.getSummary(),
      'total_count': this.toolResults.length,
      'version_issues_count': this.getToolsWithVersionIssues().length
    }
  }

  /**
   * Build raw inventory data structure
   * 
   * @returns Raw inventory data exactly as collected
   */
  private buildRawInventoryData(): JsonObject {
    return {
      'optional_tools': this.optionalTools,
      'required_tools': this.requiredTools,
      'tools': this.toolResults.map(tool => tool.toJsonData().raw['tool_detection'])
    }
  }

  /**
   * Get required tools that have version issues
   * 
   * @returns Array of required tools with version problems
   */
  private getRequiredToolsWithVersionIssues(): ToolValidationResultDTO[] {
    return this.toolResults.filter(tool => 
      this.requiredTools.includes(tool.toolName) && tool.hasVersionIssue()
    )
  }
}