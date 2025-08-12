/**
 * @file File Discovery Service Implementation
 * 
 * Provides comprehensive file discovery capabilities including pattern matching,
 * extension filtering, metadata extraction, and directory structure analysis.
 * All operations are read-only.
 */

import { glob } from 'glob'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

import { DirectoryStructureDTO } from '../dto/DirectoryStructureDTO.js'
import { FileDiscoveryResultDTO } from '../dto/FileDiscoveryResultDTO.js'
import { FileMetadataDTO } from '../dto/FileMetadataDTO.js'
import { FileOperationError } from '../errors/FileOperationError.js'
import { IFileDiscoveryService } from '../interfaces/IFileDiscoveryService.js'
import { IFileOperationsService } from '../interfaces/IFileOperationsService.js'
import { TDirectoryEntry, TDirectoryScanOptions, TFileSearchOptions } from '../types/FilesystemTypes.js'

/**
 * Implementation of file discovery service
 * 
 * Provides comprehensive file discovery capabilities with dependency injection.
 * Uses the file operations service for basic file access.
 */
export class FileDiscoveryService implements IFileDiscoveryService {
  
  constructor(
    private readonly fileOperations: IFileOperationsService
  ) {}

  /**
   * Count files and directories in a path
   */
  async countDirectoryContents(
    directory: string, 
    recursive = false
  ): Promise<{ directoryCount: number; fileCount: number; totalSize: number }> {
    
    try {
      if (!(await this.fileOperations.pathExists(directory))) {
        throw FileOperationError.directoryNotFound(directory)
      }
      
      if (!(await this.fileOperations.isDirectory(directory))) {
        throw FileOperationError.invalidPath(directory, 'not a directory')
      }
      
      let fileCount = 0
      let directoryCount = 0
      let totalSize = 0
      
      const entries = await fs.readdir(directory, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)
        
        if (entry.isFile()) {
          fileCount++
          const stat = await fs.stat(fullPath)
          totalSize += stat.size
        } else if (entry.isDirectory()) {
          directoryCount++
          
          if (recursive) {
            const subCounts = await this.countDirectoryContents(fullPath, true)
            fileCount += subCounts.fileCount
            directoryCount += subCounts.directoryCount
            totalSize += subCounts.totalSize
          }
        }
      }
      
      return { directoryCount, fileCount, totalSize }
    } catch (error) {
      if (error instanceof Error && error.message.includes('directory')) {
        throw error
      }

      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Find files matching a glob pattern
   */
  async findFiles(pattern: string, directory = '.'): Promise<FileDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = path.resolve(directory)
    
    try {
      if (!(await this.fileOperations.pathExists(searchDirectory))) {
        throw FileOperationError.directoryNotFound(searchDirectory)
      }
      
      const searchPattern = path.join(searchDirectory, pattern)
      const matches = await glob(searchPattern, { 
        dot: false, // Don't include hidden files by default
        ignore: ['**/node_modules/**', '**/.git/**'] // Common excludes
      })
      
      const files: FileMetadataDTO[] = []
      
      for (const match of matches) {
        if (await this.fileOperations.isFile(match)) {
          const metadata = await this.getFileMetadata(match)
          files.push(metadata)
        }
      }
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        files,
        pattern,
        searchDirectory,
        { searchDuration: duration }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files by file extensions
   */
  async findFilesByExtension(extensions: string[], directory = '.'): Promise<FileDiscoveryResultDTO> {
    const searchDirectory = path.resolve(directory)
    
    try {
      // Create glob pattern for extensions
      const extensionPattern = extensions.length === 1 
        ? `**/*${extensions[0]}`
        : `**/*.{${extensions.map(ext => ext.replace('.', '')).join(',')}}`
      
      return await this.findFiles(extensionPattern, directory)
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files modified within a specific time range
   */
  async findFilesByModificationTime(
    directory: string, 
    since: Date, 
    until?: Date
  ): Promise<FileDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = path.resolve(directory)
    
    try {
      // First find all files
      const allFilesResult = await this.findFiles('**/*', directory)
      
      // Filter by modification time
      const filteredFiles = allFilesResult.files.filter(file => {
        const modTime = file.modified
        const withinSince = modTime >= since
        const withinUntil = until ? modTime <= until : true
        return withinSince && withinUntil
      })
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        filteredFiles,
        `modified between ${since.toISOString()} and ${until?.toISOString() || 'now'}`,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Find files larger than specified size
   */
  async findLargeFiles(
    directory: string, 
    minSize: number, 
    pattern = '**/*'
  ): Promise<FileDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = path.resolve(directory)
    
    try {
      // First find all matching files
      const allFilesResult = await this.findFiles(pattern, directory)
      
      // Filter by size
      const largeFiles = allFilesResult.files.filter(file => file.size >= minSize)
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        largeFiles,
        `${pattern} (min size: ${minSize} bytes)`,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Get directory structure with optional depth limit
   */
  async getDirectoryStructure(
    dirPath: string, 
    options: TDirectoryScanOptions = {}
  ): Promise<DirectoryStructureDTO> {
    const startTime = Date.now()
    const rootPath = path.resolve(dirPath)
    
    try {
      if (!(await this.fileOperations.pathExists(rootPath))) {
        throw FileOperationError.directoryNotFound(rootPath)
      }
      
      if (!(await this.fileOperations.isDirectory(rootPath))) {
        throw FileOperationError.invalidPath(rootPath, 'not a directory')
      }
      
      const {
        followSymlinks = false,
        includeDirectories = true,
        includeFiles = true,
        maxDepth = 10,
        sortBy = 'name',
        sortOrder = 'asc'
      } = options
      
      const entries = await this.scanDirectoryRecursive(
        rootPath,
        0,
        maxDepth,
        { followSymlinks, includeDirectories, includeFiles, sortBy, sortOrder }
      )
      
      const duration = Date.now() - startTime
      const counts = await this.countDirectoryContents(rootPath, true)
      
      return DirectoryStructureDTO.fromDirectoryScan(
        rootPath,
        entries,
        {
          maxDepthScanned: maxDepth,
          scanDuration: duration,
          totalDirectories: counts.directoryCount,
          totalFiles: counts.fileCount,
          totalSize: counts.totalSize
        }
      )
    } catch (error) {
      throw FileOperationError.readError(rootPath, error as Error)
    }
  }

  /**
   * Get detailed metadata for a specific file
   */
  async getFileMetadata(filePath: string): Promise<FileMetadataDTO> {
    const resolvedPath = path.resolve(filePath)
    
    try {
      if (!(await this.fileOperations.pathExists(resolvedPath))) {
        throw FileOperationError.fileNotFound(resolvedPath)
      }
      
      const stat = await fs.stat(resolvedPath)
      const parsedPath = path.parse(resolvedPath)
      
      return new FileMetadataDTO(
        resolvedPath,
        parsedPath.name,
        stat.size,
        stat.birthtime,
        stat.mtime,
        this.formatPermissions(stat.mode),
        stat.isDirectory(),
        parsedPath.ext || undefined
      )
    } catch (error) {
      throw FileOperationError.readError(resolvedPath, error as Error)
    }
  }

  /**
   * Get metadata for multiple files
   */
  async getMultipleFileMetadata(paths: string[]): Promise<FileMetadataDTO[]> {
    const results: FileMetadataDTO[] = []
    
    for (const filePath of paths) {
      try {
        const metadata = await this.getFileMetadata(filePath)
        results.push(metadata)
      } catch (error) {
        // Continue with other files if one fails
        console.warn(`Warning: Could not get metadata for ${filePath}:`, error)
      }
    }
    
    return results
  }

  /**
   * Advanced file search with multiple criteria
   */
  async searchFiles(options: TFileSearchOptions): Promise<FileDiscoveryResultDTO> {
    const {
      directory = '.',
      excludePatterns = [],
      extensions,
      includeHidden = false,
      maxDepth,
      pattern = '**/*'
    } = options
    
    const startTime = Date.now()
    const searchDirectory = path.resolve(directory)
    
    try {
      let searchPattern = pattern
      
      // If extensions specified, modify pattern
      if (extensions && extensions.length > 0) {
        const extPattern = extensions.length === 1 
          ? `**/*${extensions[0]}`
          : `**/*.{${extensions.map(ext => ext.replace('.', '')).join(',')}}`
        searchPattern = extPattern
      }
      
      const fullPattern = path.join(searchDirectory, searchPattern)
      const ignorePatterns = [
        ...excludePatterns,
        '**/node_modules/**',
        '**/.git/**'
      ]
      
      const matches = await glob(fullPattern, {
        dot: includeHidden,
        ignore: ignorePatterns,
        maxDepth
      })
      
      const files: FileMetadataDTO[] = []
      
      for (const match of matches) {
        if (await this.fileOperations.isFile(match)) {
          const metadata = await this.getFileMetadata(match)
          files.push(metadata)
        }
      }
      
      const duration = Date.now() - startTime
      
      return FileDiscoveryResultDTO.fromSearchResults(
        files,
        searchPattern,
        searchDirectory,
        { 
          searchDuration: duration
        }
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Check if a file exists and is accessible
   */
  async validateFileExists(path: string): Promise<boolean> {
    try {
      return await this.fileOperations.pathExists(path) && await this.fileOperations.isFile(path)
    } catch {
      return false
    }
  }

  /**
   * Format file permissions from mode number
   * 
   * @private
   * @param mode - File mode from fs.Stats
   * @returns Formatted permissions string (e.g., 'rwxr-xr-x')
   */
  private formatPermissions(mode: number): string {
    const perms = mode & 0o777
    const owner = (perms >> 6) & 7
    const group = (perms >> 3) & 7
    const other = perms & 7
    
    const toRwx = (n: number): string => (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-')
    
    return toRwx(owner) + toRwx(group) + toRwx(other)
  }

  /**
   * Recursively scan directory structure
   * 
   * @private
   * @param dirPath - Directory to scan
   * @param currentDepth - Current recursion depth
   * @param maxDepth - Maximum depth to scan
   * @param options - Scan options
   * @returns Array of directory entries
   */
  private async scanDirectoryRecursive(
    dirPath: string,
    currentDepth: number,
    maxDepth: number,
    options: {
      followSymlinks: boolean
      includeDirectories: boolean
      includeFiles: boolean
      sortBy: 'modified' | 'name' | 'size'
      sortOrder: 'asc' | 'desc'
    }
  ): Promise<TDirectoryEntry[]> {
    if (currentDepth >= maxDepth) {
      return []
    }
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const results: TDirectoryEntry[] = []
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        // Handle symlinks
        if (entry.isSymbolicLink() && !options.followSymlinks) {
          continue
        }
        
        let stat: Awaited<ReturnType<typeof fs.stat>>
        try {
          stat = await fs.stat(fullPath)
        } catch {
          continue // Skip inaccessible entries
        }
        
        const isDirectory = stat.isDirectory()
        const isFile = stat.isFile()
        
        // Filter by type
        if (isFile && !options.includeFiles) continue
        if (isDirectory && !options.includeDirectories) continue
        
        const directoryEntry: TDirectoryEntry = {
          modified: stat.mtime,
          name: entry.name,
          path: fullPath,
          size: isFile ? stat.size : undefined,
          type: isDirectory ? 'directory' : 'file'
        }
        
        // Recursively scan subdirectories
        if (isDirectory && currentDepth + 1 < maxDepth) {
          try {
            directoryEntry.children = await this.scanDirectoryRecursive(
              fullPath,
              currentDepth + 1,
              maxDepth,
              options
            )
          } catch {
            // Continue if subdirectory is inaccessible
            directoryEntry.children = []
          }
        }
        
        results.push(directoryEntry)
      }
      
      // Sort results
      return this.sortDirectoryEntries(results, options.sortBy, options.sortOrder)
    } catch (error) {
      throw FileOperationError.readError(dirPath, error as Error)
    }
  }

  /**
   * Sort directory entries by specified criteria
   * 
   * @private
   * @param entries - Entries to sort
   * @param sortBy - Sort criteria
   * @param sortOrder - Sort order
   * @returns Sorted entries
   */
  private sortDirectoryEntries(
    entries: TDirectoryEntry[],
    sortBy: 'modified' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ): TDirectoryEntry[] {
    return entries.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'modified': {
          comparison = (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0)
          break
        }

        case 'name': {
          comparison = a.name.localeCompare(b.name)
          break
        }

        case 'size': {
          comparison = (a.size || 0) - (b.size || 0)
          break
        }
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }
}