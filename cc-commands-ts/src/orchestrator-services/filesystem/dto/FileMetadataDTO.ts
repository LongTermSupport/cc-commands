/**
 * @file File Metadata Data Transfer Object
 * 
 * Represents detailed metadata about a single file including size, dates,
 * permissions, and derived information. Used throughout the filesystem domain
 * for file information exchange and analysis.
 */

import path from 'node:path'

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TFileMetadata } from '../types/FilesystemTypes.js'

/**
 * Data Transfer Object for individual file metadata
 * 
 * This DTO encapsulates comprehensive metadata about a single file,
 * including filesystem properties, derived information, and file classification.
 */
export class FileMetadataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    FILE_CREATED_AT: 'FILE_CREATED_AT',
    FILE_EXTENSION: 'FILE_EXTENSION',
    FILE_IS_DIRECTORY: 'FILE_IS_DIRECTORY',
    FILE_MODIFIED_AT: 'FILE_MODIFIED_AT',
    FILE_NAME: 'FILE_NAME',
    FILE_PATH: 'FILE_PATH',
    FILE_PERMISSIONS: 'FILE_PERMISSIONS',
    FILE_SIZE_BYTES: 'FILE_SIZE_BYTES'
  } as const

  constructor(
    public readonly path: string,
    public readonly name: string,
    public readonly size: number,
    public readonly created: Date,
    public readonly modified: Date,
    public readonly permissions: string,
    public readonly isDirectory: boolean,
    public readonly extension?: string
  ) {}

  /**
   * Create FileMetadataDTO from filesystem metadata
   * 
   * @param metadata - Raw filesystem metadata
   * @returns New FileMetadataDTO instance
   */
  static fromFilesystemMetadata(metadata: TFileMetadata): FileMetadataDTO {
    return new FileMetadataDTO(
      metadata.path,
      metadata.name,
      metadata.size,
      metadata.created,
      metadata.modified,
      metadata.permissions,
      metadata.isDirectory,
      metadata.extension
    )
  }

  /**
   * Create FileMetadataDTO from Node.js fs.Stats and path info
   * 
   * @param filePath - Full path to the file
   * @param stats - Node.js fs.Stats object
   * @returns New FileMetadataDTO instance
   */
  static fromFsStats(filePath: string, stats: {
    birthtime: Date
    isDirectory(): boolean
    mode: number
    mtime: Date
    size: number
  }): FileMetadataDTO {
    const name = path.basename(filePath)
    const extension = path.extname(filePath).slice(1) // Remove leading dot
    const permissions = (stats.mode & 0o777).toString(8) // eslint-disable-line no-bitwise

    return new FileMetadataDTO(
      filePath,
      name,
      stats.size,
      stats.birthtime,
      stats.mtime,
      permissions,
      stats.isDirectory(),
      extension || undefined
    )
  }

  /**
   * Get file age in days
   * 
   * @returns Number of days since file creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last modification
   * 
   * @returns Number of days since file was last modified
   */
  getDaysSinceModification(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.modified.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get file type classification
   * 
   * @returns Classified file type based on extension
   */
  getFileType(): string {
    if (this.isDirectory) return 'directory'
    if (!this.extension) return 'no-extension'

    const ext = this.extension.toLowerCase().replace(/^\./, '')
    
    // Documentation files
    if (['doc', 'docx', 'md', 'pdf', 'rst', 'txt'].includes(ext)) {
      return 'documentation'
    }
    
    // Code files
    if (['c', 'cpp', 'go', 'java', 'js', 'php', 'py', 'rb', 'rs', 'ts'].includes(ext)) {
      return 'source-code'
    }
    
    // Configuration files
    if (['conf', 'config', 'ini', 'json', 'toml', 'xml', 'yaml', 'yml'].includes(ext)) {
      return 'configuration'
    }
    
    // Web files
    if (['css', 'htm', 'html', 'less', 'scss', 'svg'].includes(ext)) {
      return 'web-content'
    }
    
    // Image files
    if (['bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'webp'].includes(ext)) {
      return 'image'
    }
    
    // Archive files
    if (['7z', 'bz2', 'gz', 'rar', 'tar', 'xz', 'zip'].includes(ext)) {
      return 'archive'
    }

    return 'other'
  }

  /**
   * Get human-readable file size
   * 
   * @returns File size formatted for human readability
   */
  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let {size} = this
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    const rounded = unitIndex === 0 ? size : Math.round(size * 100) / 100
    return `${rounded} ${units[unitIndex]}`
  }

  /**
   * Get comprehensive jq query hints for file metadata
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw filesystem data
      { 
        description: 'File path', 
        query: '.raw.filesystem_metadata.path',
        scope: 'single_item'
      },
      { 
        description: 'File name only', 
        query: '.raw.filesystem_metadata.name',
        scope: 'single_item'
      },
      { 
        description: 'File size in bytes', 
        query: '.raw.filesystem_metadata.size',
        scope: 'single_item'
      },
      { 
        description: 'File extension', 
        query: '.raw.filesystem_metadata.extension',
        scope: 'single_item'
      },
      { 
        description: 'File permissions (octal)', 
        query: '.raw.filesystem_metadata.permissions',
        scope: 'single_item'
      },
      { 
        description: 'Is directory flag', 
        query: '.raw.filesystem_metadata.is_directory',
        scope: 'single_item'
      },
      
      // Calculated file analysis
      { 
        description: 'File age in days (calculated)', 
        query: '.calculated.time_calculations.age_days',
        scope: 'single_item'
      },
      { 
        description: 'Days since last modification (calculated)', 
        query: '.calculated.time_calculations.days_since_modified',
        scope: 'single_item'
      },
      { 
        description: 'File type classification (calculated)', 
        query: '.calculated.file_characteristics.file_type',
        scope: 'single_item'
      },
      { 
        description: 'File size in human-readable format', 
        query: '.calculated.file_characteristics.human_readable_size',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get summary of file metadata
   * 
   * @returns Brief file description for logging/debugging
   */
  getSummary(): string {
    const type = this.isDirectory ? 'DIR' : this.getFileType().toUpperCase()
    const size = this.isDirectory ? '' : ` (${this.getHumanReadableSize()})`
    return `${type}: ${this.name}${size}`
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete file metadata with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'file_characteristics': this.calculateFileCharacteristics(),
        'time_calculations': this.calculateTimeMetrics()
      },
      raw: {
        'filesystem_metadata': this.buildRawFilesystemData()
      }
    }
  }

  /**
   * Convert file metadata to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [FileMetadataDTO.Keys.FILE_CREATED_AT]: this.created.toISOString(),
      [FileMetadataDTO.Keys.FILE_EXTENSION]: this.extension || '',
      [FileMetadataDTO.Keys.FILE_IS_DIRECTORY]: String(this.isDirectory),
      [FileMetadataDTO.Keys.FILE_MODIFIED_AT]: this.modified.toISOString(),
      [FileMetadataDTO.Keys.FILE_NAME]: this.name,
      [FileMetadataDTO.Keys.FILE_PATH]: this.path,
      [FileMetadataDTO.Keys.FILE_PERMISSIONS]: this.permissions,
      [FileMetadataDTO.Keys.FILE_SIZE_BYTES]: String(this.size)
    }
  }

  /**
   * Build raw filesystem metadata structure
   * 
   * @returns Raw filesystem data exactly as collected
   */
  private buildRawFilesystemData(): JsonObject {
    return {
      'created_at': this.created.toISOString(),
      'extension': this.extension,
      'is_directory': this.isDirectory,
      'modified_at': this.modified.toISOString(),
      'name': this.name,
      'path': this.path,
      'permissions': this.permissions,
      'size': this.size
    }
  }

  /**
   * Calculate file characteristics and classification
   * 
   * @returns Analysis of file type, size, and properties
   */
  private calculateFileCharacteristics(): JsonObject {
    return {
      'file_type': this.getFileType(),
      'has_extension': Boolean(this.extension),
      'human_readable_size': this.getHumanReadableSize(),
      'is_empty': this.size === 0,
      'is_executable': this.permissions.includes('1') || this.permissions.includes('5') || this.permissions.includes('7'),
      'is_large_file': this.size > 10 * 1024 * 1024, // > 10MB
      'is_readable': this.permissions.includes('4') || this.permissions.includes('6') || this.permissions.includes('7'),
      'is_recently_created': this.getAgeInDays() <= 7,
      'is_recently_modified': this.getDaysSinceModification() <= 7,
      'is_writable': this.permissions.includes('2') || this.permissions.includes('6') || this.permissions.includes('7')
    }
  }

  /**
   * Calculate time-based metrics for the file
   * 
   * @returns Time calculations for file lifecycle analysis
   */
  private calculateTimeMetrics(): JsonObject {
    return {
      'age_days': this.getAgeInDays(),
      'created_timestamp': this.created.getTime(),
      'days_since_modified': this.getDaysSinceModification(),
      'modification_to_creation_days': Math.ceil(
        Math.abs(this.modified.getTime() - this.created.getTime()) / (1000 * 60 * 60 * 24)
      ),
      'modified_timestamp': this.modified.getTime()
    }
  }
}