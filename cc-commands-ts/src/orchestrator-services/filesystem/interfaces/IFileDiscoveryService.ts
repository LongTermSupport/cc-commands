/**
 * @file File discovery service interface
 *
 * Defines the contract for file discovery operations including pattern matching,
 * extension filtering, metadata extraction, and directory structure analysis.
 */

import type { DirectoryStructureDTO } from '../dto/DirectoryStructureDTO.js'
import type { FileDiscoveryResultDTO } from '../dto/FileDiscoveryResultDTO.js'
import type { FileMetadataDTO } from '../dto/FileMetadataDTO.js'
import type { TDirectoryScanOptions, TFileSearchOptions } from '../types/FilesystemTypes.js'

/**
 * Service interface for file discovery and metadata extraction
 * 
 * Provides methods to find files by various criteria, extract metadata,
 * and analyze directory structures. All operations are read-only and
 * do not modify the filesystem.
 */
export interface IFileDiscoveryService {
  /**
   * Count files and directories in a path
   * 
   * @param directory - Directory to count contents
   * @param recursive - Whether to count recursively (default: false)
   * @returns Promise resolving to object with file and directory counts
   */
  countDirectoryContents(
    directory: string, 
    recursive?: boolean
  ): Promise<{ directoryCount: number; fileCount: number; totalSize: number }>

  /**
   * Find files matching a glob pattern
   * 
   * @param pattern - Glob pattern to match (e.g., "*.md", "**\/*.ts")
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to discovery results with matching files
   */
  findFiles(directory: string, pattern: string | string[], options?: { caseSensitive?: boolean, includeHidden?: boolean, maxDepth?: number, maxResults?: number }): Promise<FileDiscoveryResultDTO>

  /**
   * Find files by file extensions
   * 
   * @param extensions - Array of file extensions (e.g., ['.md', '.txt'])
   * @param directory - Directory to search in (defaults to current directory)
   * @returns Promise resolving to discovery results with matching files
   */
  findFilesByExtension(extensions: string[], directory?: string): Promise<FileDiscoveryResultDTO>

  /**
   * Find files modified within a specific time range
   * 
   * @param directory - Directory to search in
   * @param since - Start date for modification time filter
   * @param until - End date for modification time filter (optional)
   * @returns Promise resolving to discovery results with matching files
   */
  findFilesByModificationTime(
    directory: string, 
    since: Date, 
    until?: Date
  ): Promise<FileDiscoveryResultDTO>

  /**
   * Find files larger than specified size
   * 
   * @param directory - Directory to search in
   * @param minSize - Minimum file size in bytes
   * @param pattern - Optional pattern to filter by (default: all files)
   * @returns Promise resolving to discovery results with matching files
   */
  findLargeFiles(
    directory: string, 
    minSize: number, 
    pattern?: string
  ): Promise<FileDiscoveryResultDTO>

  /**
   * Get directory structure with optional depth limit
   * 
   * @param path - Directory path to analyze
   * @param options - Scan options including depth, sorting, filtering
   * @returns Promise resolving to directory structure DTO
   */
  getDirectoryStructure(path: string, options?: TDirectoryScanOptions): Promise<DirectoryStructureDTO>

  /**
   * Get detailed metadata for a specific file
   * 
   * @param path - Path to the file
   * @returns Promise resolving to file metadata DTO
   * @throws FileOperationError if file doesn't exist or can't be accessed
   */
  getFileMetadata(path: string): Promise<FileMetadataDTO>

  /**
   * Get file preview with content and metadata
   * 
   * @param filePath - Path to file to preview
   * @param options - Preview options
   * @returns Promise resolving to file preview with content
   */
  getFilePreview(
    filePath: string,
    options?: { encoding?: string; maxBytes?: number; maxLines?: number; }
  ): Promise<{
    content: string
    encoding: string
    filePath: string
    isBinary: boolean
    isComplete: boolean
    lineCount: number
    path: string
    size: number
  }>

  /**
   * Get files by type classification
   * 
   * @param directory - Directory to search
   * @param fileType - Type of files to find
   * @returns Promise resolving to FileDiscoveryResultDTO
   */
  getFilesByType(
    directory: string,
    fileType: string
  ): Promise<FileDiscoveryResultDTO>

  /**
   * Get metadata for multiple files
   * 
   * @param paths - Array of file paths
   * @returns Promise resolving to array of file metadata DTOs
   */
  getMultipleFileMetadata(paths: string[]): Promise<FileMetadataDTO[]>

  /**
   * Scan directory and return directory structure
   * 
   * @param directory - Directory to scan
   * @param options - Scan options
   * @returns Promise resolving to DirectoryStructureDTO
   */
  scanDirectory(
    directory: string,
    options?: { caseSensitive?: boolean; excludePatterns?: string[], includeExtensions?: string[], maxDepth?: number, maxSize?: number, minSize?: number, }
  ): Promise<import('../dto/DirectoryStructureDTO.js').DirectoryStructureDTO>

  /**
   * Advanced file search with multiple criteria
   * 
   * @param options - Search options including patterns, extensions, depth, etc.
   * @returns Promise resolving to discovery results with matching files
   */
  searchFiles(options: TFileSearchOptions): Promise<FileDiscoveryResultDTO>

  /**
   * Check if a file exists and is accessible
   * 
   * @param path - File path to check
   * @returns Promise resolving to true if file exists and is readable
   */
  validateFileExists(path: string): Promise<boolean>
}