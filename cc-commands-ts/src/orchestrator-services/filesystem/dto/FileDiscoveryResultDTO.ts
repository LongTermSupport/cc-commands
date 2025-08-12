/**
 * @file File Discovery Result Data Transfer Object
 * 
 * Represents the result of file discovery operations including file search,
 * pattern matching, and directory scanning. Contains comprehensive metadata
 * about found files and search context for LLM consumption.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { FileMetadataDTO } from './FileMetadataDTO.js'

/**
 * Data Transfer Object for file discovery operation results
 * 
 * This DTO encapsulates the results of file discovery operations,
 * including found files, search metadata, and performance information.
 */
export class FileDiscoveryResultDTO implements ILLMDataDTO {
  private static readonly Keys = {
    DISCOVERY_DIRECTORY: 'DISCOVERY_DIRECTORY',
    DISCOVERY_DURATION_MS: 'DISCOVERY_DURATION_MS',
    DISCOVERY_EXCLUDED_COUNT: 'DISCOVERY_EXCLUDED_COUNT',
    DISCOVERY_EXCLUDED_PATHS: 'DISCOVERY_EXCLUDED_PATHS',
    DISCOVERY_PATTERN: 'DISCOVERY_PATTERN',
    DISCOVERY_TOTAL_FILES: 'DISCOVERY_TOTAL_FILES',
    FILES_FOUND: 'FILES_FOUND'
  } as const

  constructor(
    public readonly files: FileMetadataDTO[],
    public readonly searchPattern: string,
    public readonly searchDirectory: string,
    public readonly totalMatches: number,
    public readonly searchDuration: number,
    public readonly excludedPaths: string[] = [],
    public readonly searchDepth?: number,
    public readonly extensions?: string[]
  ) {}

  /**
   * Create FileDiscoveryResultDTO from search operation
   * 
   * @param files - Array of discovered file metadata
   * @param searchPattern - Pattern used for file discovery
   * @param searchDirectory - Root directory searched
   * @param options - Additional search options and metadata
   * @returns New FileDiscoveryResultDTO instance
   */
  static fromSearchResults(
    files: FileMetadataDTO[],
    searchPattern: string,
    searchDirectory: string,
    options: {
      excludedPaths?: string[]
      extensions?: string[]
      searchDepth?: number
      searchDuration: number
    }
  ): FileDiscoveryResultDTO {
    return new FileDiscoveryResultDTO(
      files,
      searchPattern,
      searchDirectory,
      files.length,
      options.searchDuration,
      options.excludedPaths || [],
      options.searchDepth,
      options.extensions
    )
  }

  /**
   * Get comprehensive jq query hints for file discovery data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw discovery data
      { 
        description: 'Search pattern used for discovery', 
        query: '.raw.filesystem_discovery.search_pattern',
        scope: 'single_item'
      },
      { 
        description: 'Directory searched', 
        query: '.raw.filesystem_discovery.search_directory',
        scope: 'single_item'
      },
      { 
        description: 'Array of discovered files', 
        query: '.raw.filesystem_discovery.files',
        scope: 'single_item'
      },
      { 
        description: 'File names only', 
        query: '.raw.filesystem_discovery.files[].name',
        scope: 'single_item'
      },
      { 
        description: 'File paths only', 
        query: '.raw.filesystem_discovery.files[].path',
        scope: 'single_item'
      },
      
      // Calculated metrics
      { 
        description: 'Total number of files discovered', 
        query: '.calculated.discovery_metrics.total_files',
        scope: 'single_item'
      },
      { 
        description: 'Search execution time in milliseconds', 
        query: '.calculated.discovery_metrics.search_duration_ms',
        scope: 'single_item'
      },
      { 
        description: 'Files per second discovery rate', 
        query: '.calculated.discovery_metrics.files_per_second',
        scope: 'single_item'
      },
      
      // Filtering analysis
      { 
        description: 'Files organized by extension', 
        query: '.calculated.file_analysis.files_by_extension',
        scope: 'single_item'
      },
      { 
        description: 'Average file size in bytes', 
        query: '.calculated.file_analysis.average_file_size',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get summary of discovery operation
   * 
   * @returns Brief summary for logging/debugging
   */
  getSummary(): string {
    const duration = this.searchDuration > 1000 ? 
      `${Math.round(this.searchDuration / 1000)}s` : 
      `${this.searchDuration}ms`
    return `Found ${this.totalMatches} files in "${this.searchDirectory}" (${duration})`
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete file discovery data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'discovery_metrics': this.calculateDiscoveryMetrics(),
        'file_analysis': this.calculateFileAnalysis()
      },
      raw: {
        'filesystem_discovery': this.buildRawDiscoveryData()
      }
    }
  }

  /**
   * Convert file discovery data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [FileDiscoveryResultDTO.Keys.DISCOVERY_DIRECTORY]: this.searchDirectory,
      [FileDiscoveryResultDTO.Keys.DISCOVERY_DURATION_MS]: String(this.searchDuration),
      [FileDiscoveryResultDTO.Keys.DISCOVERY_EXCLUDED_COUNT]: String(this.excludedPaths.length),
      [FileDiscoveryResultDTO.Keys.DISCOVERY_EXCLUDED_PATHS]: this.excludedPaths.join(', '),
      [FileDiscoveryResultDTO.Keys.DISCOVERY_PATTERN]: this.searchPattern,
      [FileDiscoveryResultDTO.Keys.DISCOVERY_TOTAL_FILES]: String(this.totalMatches),
      [FileDiscoveryResultDTO.Keys.FILES_FOUND]: String(this.files.length)
    }
  }

  /**
   * Build raw filesystem discovery data structure
   * 
   * @returns Raw discovery data exactly as collected
   */
  private buildRawDiscoveryData(): JsonObject {
    return {
      'excluded_paths': this.excludedPaths,
      'extensions_filter': this.extensions || [],
      'files': this.files.map(file => file.toJsonData().raw['filesystem_metadata']),
      'search_depth': this.searchDepth,
      'search_directory': this.searchDirectory,
      'search_pattern': this.searchPattern,
      'total_matches': this.totalMatches
    }
  }

  /**
   * Calculate discovery performance metrics
   * 
   * @returns Mathematical metrics about the discovery operation
   */
  private calculateDiscoveryMetrics(): JsonObject {
    const filesPerSecond = this.searchDuration > 0 ? 
      Math.round((this.totalMatches / this.searchDuration) * 1000 * 100) / 100 : 0

    return {
      'files_per_second': filesPerSecond,
      'search_depth_used': this.searchDepth || 0,
      'search_duration_ms': this.searchDuration,
      'search_efficiency_score': Math.min(filesPerSecond / 10, 1),
      'total_files': this.totalMatches
    }
  }

  /**
   * Calculate file analysis metrics
   * 
   * @returns Analysis of discovered files by type, size, etc.
   */
  private calculateFileAnalysis(): JsonObject {
    const filesByExtension: Record<string, number> = {}
    let totalSize = 0

    for (const file of this.files) {
      const extension = file.extension || 'no-extension'
      filesByExtension[extension] = (filesByExtension[extension] || 0) + 1
      totalSize += file.size
    }

    const averageSize = this.files.length > 0 ? Math.round(totalSize / this.files.length) : 0

    return {
      'average_file_size': averageSize,
      'file_extensions_count': Object.keys(filesByExtension).length,
      'files_by_extension': filesByExtension,
      'largest_file_size': Math.max(...this.files.map(f => f.size), 0),
      'smallest_file_size': this.files.length > 0 ? Math.min(...this.files.map(f => f.size)) : 0,
      'total_size_bytes': totalSize
    }
  }
}