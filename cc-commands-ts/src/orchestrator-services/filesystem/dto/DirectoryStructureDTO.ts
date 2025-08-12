/**
 * @file Directory Structure Data Transfer Object
 * 
 * Represents a hierarchical directory structure with files and subdirectories.
 * Provides comprehensive analysis of directory contents, depth, and organization
 * patterns for filesystem navigation and analysis.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TDirectoryEntry } from '../types/FilesystemTypes.js'

/**
 * Data Transfer Object for hierarchical directory structure
 * 
 * This DTO represents a complete directory tree with files, subdirectories,
 * and comprehensive metadata about the directory organization and contents.
 */
export class DirectoryStructureDTO implements ILLMDataDTO {
  private static readonly Keys = {
    DIRECTORY_DEPTH: 'DIRECTORY_DEPTH',
    DIRECTORY_FILE_COUNT: 'DIRECTORY_FILE_COUNT',
    DIRECTORY_PATH: 'DIRECTORY_PATH',
    DIRECTORY_SUBDIRECTORY_COUNT: 'DIRECTORY_SUBDIRECTORY_COUNT',
    DIRECTORY_TOTAL_SIZE: 'DIRECTORY_TOTAL_SIZE',
    DIRECTORY_TREE_CREATED: 'DIRECTORY_TREE_CREATED'
  } as const

  constructor(
    public readonly rootPath: string,
    public readonly entries: TDirectoryEntry[],
    public readonly maxDepthScanned: number,
    public readonly totalFiles: number,
    public readonly totalDirectories: number,
    public readonly totalSize: number,
    public readonly scanDuration: number,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Create DirectoryStructureDTO from directory scan results
   * 
   * @param rootPath - Root directory path that was scanned
   * @param entries - Hierarchical directory entries
   * @param options - Scan metadata and options
   * @returns New DirectoryStructureDTO instance
   */
  static fromDirectoryScan(
    rootPath: string,
    entries: TDirectoryEntry[],
    options: {
      maxDepthScanned: number
      scanDuration: number
      totalDirectories?: number
      totalFiles?: number
      totalSize?: number
    }
  ): DirectoryStructureDTO {
    const totalFiles = options.totalFiles ?? DirectoryStructureDTO.countFiles(entries)
    const totalDirectories = options.totalDirectories ?? DirectoryStructureDTO.countDirectories(entries)
    const totalSize = options.totalSize ?? DirectoryStructureDTO.calculateTotalSize(entries)

    return new DirectoryStructureDTO(
      rootPath,
      entries,
      options.maxDepthScanned,
      totalFiles,
      totalDirectories,
      totalSize,
      options.scanDuration
    )
  }

  /**
   * Calculate total number of files in directory entries recursively
   * 
   * @param entries - Directory entries to count
   * @returns Total number of files
   */
  private static calculateTotalSize(entries: TDirectoryEntry[]): number {
    let totalSize = 0
    
    for (const entry of entries) {
      if (entry.type === 'file' && entry.size !== undefined && entry.size > 0) {
        totalSize += entry.size
      }
      
      if (entry.children) {
        totalSize += DirectoryStructureDTO.calculateTotalSize(entry.children)
      }
    }
    
    return totalSize
  }

  /**
   * Count directories in directory entries recursively
   * 
   * @param entries - Directory entries to count
   * @returns Total number of directories
   */
  private static countDirectories(entries: TDirectoryEntry[]): number {
    let count = 0
    
    for (const entry of entries) {
      if (entry.type === 'directory') {
        count++
        
        if (entry.children) {
          count += DirectoryStructureDTO.countDirectories(entry.children)
        }
      }
    }
    
    return count
  }

  /**
   * Count files in directory entries recursively
   * 
   * @param entries - Directory entries to count
   * @returns Total number of files
   */
  private static countFiles(entries: TDirectoryEntry[]): number {
    let count = 0
    
    for (const entry of entries) {
      if (entry.type === 'file') {
        count++
      }
      
      if (entry.children) {
        count += DirectoryStructureDTO.countFiles(entry.children)
      }
    }
    
    return count
  }

  /**
   * Get actual depth of the directory tree
   * 
   * @returns Maximum depth found in the directory structure
   */
  getActualDepth(): number {
    return this.calculateMaxDepth(this.entries)
  }

  /**
   * Get all directory paths in the directory structure
   * 
   * @returns Array of all directory paths found in the structure
   */
  getAllDirectoryPaths(): string[] {
    return this.extractDirectoryPaths(this.entries)
  }

  /**
   * Get all file paths in the directory structure
   * 
   * @returns Array of all file paths found in the structure
   */
  getAllFilePaths(): string[] {
    return this.extractFilePaths(this.entries)
  }

  /**
   * Get average files per directory
   * 
   * @returns Average number of files per directory
   */
  getAverageFilesPerDirectory(): number {
    return this.totalDirectories > 0 ? 
      Math.round((this.totalFiles / this.totalDirectories) * 100) / 100 : 0
  }

  /**
   * Get human-readable directory size
   * 
   * @returns Directory size formatted for human readability
   */
  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = this.totalSize
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    const rounded = unitIndex === 0 ? size : Math.round(size * 100) / 100
    return `${rounded} ${units[unitIndex]}`
  }

  /**
   * Get comprehensive jq query hints for directory structure data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw directory structure
      { 
        description: 'Root directory path', 
        query: '.raw.directory_scan.root_path',
        scope: 'single_item'
      },
      { 
        description: 'Complete directory tree structure', 
        query: '.raw.directory_scan.entries',
        scope: 'single_item'
      },
      { 
        description: 'All file entries in tree', 
        query: '.raw.directory_scan.entries[] | select(.type == "file")',
        scope: 'single_item'
      },
      { 
        description: 'All directory entries in tree', 
        query: '.raw.directory_scan.entries[] | select(.type == "directory")',
        scope: 'single_item'
      },
      { 
        description: 'Maximum scan depth used', 
        query: '.raw.directory_scan.max_depth_scanned',
        scope: 'single_item'
      },
      
      // Calculated directory analysis
      { 
        description: 'Total file count (calculated)', 
        query: '.calculated.structure_analysis.total_files',
        scope: 'single_item'
      },
      { 
        description: 'Total directory count (calculated)', 
        query: '.calculated.structure_analysis.total_directories',
        scope: 'single_item'
      },
      { 
        description: 'Directory tree actual depth (calculated)', 
        query: '.calculated.structure_analysis.actual_depth',
        scope: 'single_item'
      },
      { 
        description: 'Average files per directory (calculated)', 
        query: '.calculated.structure_analysis.avg_files_per_directory',
        scope: 'single_item'
      },
      { 
        description: 'Directory scan performance (calculated)', 
        query: '.calculated.scan_performance.entries_per_second',
        scope: 'single_item'
      },
      
      // Structure organization analysis
      { 
        description: 'Directory organization complexity score', 
        query: '.calculated.organization_analysis.complexity_score',
        scope: 'single_item'
      },
      { 
        description: 'Directory structure balance ratio', 
        query: '.calculated.organization_analysis.structure_balance',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get summary of directory structure
   * 
   * @returns Brief directory description for logging/debugging
   */
  getSummary(): string {
    const duration = this.scanDuration > 1000 ? 
      `${Math.round(this.scanDuration / 1000)}s` : 
      `${this.scanDuration}ms`
    return `${this.rootPath}: ${this.totalFiles} files, ${this.totalDirectories} dirs (${duration})`
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete directory structure with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'organization_analysis': this.calculateOrganizationAnalysis(),
        'scan_performance': this.calculateScanPerformance(),
        'structure_analysis': this.calculateStructureAnalysis()
      },
      raw: {
        'directory_scan': this.buildRawDirectoryScanData()
      }
    }
  }

  /**
   * Convert directory structure to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [DirectoryStructureDTO.Keys.DIRECTORY_DEPTH]: String(this.getActualDepth()),
      [DirectoryStructureDTO.Keys.DIRECTORY_FILE_COUNT]: String(this.totalFiles),
      [DirectoryStructureDTO.Keys.DIRECTORY_PATH]: this.rootPath,
      [DirectoryStructureDTO.Keys.DIRECTORY_SUBDIRECTORY_COUNT]: String(this.totalDirectories),
      [DirectoryStructureDTO.Keys.DIRECTORY_TOTAL_SIZE]: String(this.totalSize),
      [DirectoryStructureDTO.Keys.DIRECTORY_TREE_CREATED]: this.createdAt.toISOString()
    }
  }

  /**
   * Build raw directory scan data structure
   * 
   * @returns Raw directory structure exactly as scanned
   */
  private buildRawDirectoryScanData(): JsonObject {
    return {
      'created_at': this.createdAt.toISOString(),
      'entries': this.convertEntriesToJson(this.entries),
      'max_depth_scanned': this.maxDepthScanned,
      'root_path': this.rootPath,
      'scan_duration_ms': this.scanDuration,
      'total_directories': this.totalDirectories,
      'total_files': this.totalFiles,
      'total_size_bytes': this.totalSize
    }
  }

  /**
   * Calculate maximum depth in directory entries recursively
   * 
   * @param entries - Directory entries to analyze
   * @param currentDepth - Current recursion depth
   * @returns Maximum depth found
   */
  private calculateMaxDepth(entries: TDirectoryEntry[], currentDepth = 0): number {
    if (entries.length === 0) return currentDepth

    let maxDepth = currentDepth
    
    for (const entry of entries) {
      if (entry.children && entry.children.length > 0) {
        const childDepth = this.calculateMaxDepth(entry.children, currentDepth + 1)
        maxDepth = Math.max(maxDepth, childDepth)
      }
    }
    
    return maxDepth
  }

  /**
   * Calculate directory organization and complexity metrics
   * 
   * @returns Analysis of directory organization patterns
   */
  private calculateOrganizationAnalysis(): JsonObject {
    const actualDepth = this.getActualDepth()
    const avgFilesPerDir = this.getAverageFilesPerDirectory()
    
    // Calculate organization complexity (higher = more complex structure)
    const depthComplexity = Math.min(actualDepth / 10, 1)
    const distributionComplexity = avgFilesPerDir > 0 ? 
      Math.min(Math.abs(avgFilesPerDir - 5) / 10, 1) : 0
    const complexityScore = (depthComplexity + distributionComplexity) / 2

    // Calculate structure balance (files vs directories ratio)
    const structureBalance = this.totalDirectories > 0 ? 
      Math.round((this.totalFiles / this.totalDirectories) * 100) / 100 : 0

    return {
      'avg_files_per_directory': avgFilesPerDir,
      'complexity_score': Math.round(complexityScore * 1000) / 1000,
      'directory_to_file_ratio': this.totalFiles > 0 ? 
        Math.round((this.totalDirectories / this.totalFiles) * 100) / 100 : 0,
      'is_deep_structure': actualDepth > 5,
      'is_flat_structure': actualDepth <= 2,
      'structure_balance': structureBalance
    }
  }

  /**
   * Calculate directory scan performance metrics
   * 
   * @returns Performance statistics for the directory scan operation
   */
  private calculateScanPerformance(): JsonObject {
    const totalEntries = this.totalFiles + this.totalDirectories
    const entriesPerSecond = this.scanDuration > 0 ? 
      Math.round((totalEntries / this.scanDuration) * 1000 * 100) / 100 : 0

    return {
      'entries_per_second': entriesPerSecond,
      'scan_duration_ms': this.scanDuration,
      'scan_efficiency_score': Math.min(entriesPerSecond / 100, 1),
      'total_entries_scanned': totalEntries
    }
  }

  /**
   * Calculate comprehensive structure analysis
   * 
   * @returns Detailed analysis of directory structure characteristics
   */
  private calculateStructureAnalysis(): JsonObject {
    return {
      'actual_depth': this.getActualDepth(),
      'avg_files_per_directory': this.getAverageFilesPerDirectory(),
      'human_readable_size': this.getHumanReadableSize(),
      'size_per_file_avg': this.totalFiles > 0 ? 
        Math.round(this.totalSize / this.totalFiles) : 0,
      'total_directories': this.totalDirectories,
      'total_files': this.totalFiles,
      'total_size_bytes': this.totalSize
    }
  }

  /**
   * Convert directory entries to JSON-safe format
   * 
   * @param entries - Directory entries to convert
   * @returns JSON-safe representation of entries
   */
  private convertEntriesToJson(entries: TDirectoryEntry[]): JsonObject[] {
    return entries.map(entry => ({
      children: entry.children ? this.convertEntriesToJson(entry.children) : [],
      modified: entry.modified ? entry.modified.toISOString() : null,
      name: entry.name,
      path: entry.path,
      size: entry.size,
      type: entry.type
    }))
  }

  /**
   * Extract all directory paths from entries recursively
   * 
   * @param entries - Directory entries to extract from
   * @returns Array of directory paths
   */
  private extractDirectoryPaths(entries: TDirectoryEntry[]): string[] {
    const paths: string[] = []
    
    for (const entry of entries) {
      if (entry.type === 'directory') {
        paths.push(entry.path)
        
        if (entry.children) {
          paths.push(...this.extractDirectoryPaths(entry.children))
        }
      }
    }
    
    return paths
  }

  /**
   * Extract all file paths from entries recursively
   * 
   * @param entries - Directory entries to extract from
   * @returns Array of file paths
   */
  private extractFilePaths(entries: TDirectoryEntry[]): string[] {
    const paths: string[] = []
    
    for (const entry of entries) {
      if (entry.type === 'file') {
        paths.push(entry.path)
      }
      
      if (entry.children) {
        paths.push(...this.extractFilePaths(entry.children))
      }
    }
    
    return paths
  }
}