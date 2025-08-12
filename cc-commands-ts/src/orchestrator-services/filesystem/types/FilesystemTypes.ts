/**
 * @file Filesystem domain type definitions
 *
 * Defines all types used throughout the filesystem domain for
 * file operations, plan metadata, documentation parsing, etc.
 */

/**
 * File metadata information
 */
export type TFileMetadata = {
  created: Date
  extension?: string
  isDirectory: boolean
  modified: Date
  name: string
  path: string
  permissions: string
  size: number
}

/**
 * Plan file metadata extracted from content
 */
export type TPlanMetadata = {
  completedTasks: number
  completionPercentage: number
  date?: string
  inProgressTasks: number
  isAllDone: boolean
  pendingTasks: number
  priority?: string
  status?: string
  totalTasks: number
}

/**
 * Plan discovery match types
 */
export type TPlanMatchType = 'exact' | 'fuzzy' | 'multiple' | 'none'

/**
 * File discovery search options
 */
export type TFileSearchOptions = {
  directory?: string
  excludePatterns?: string[]
  extensions?: string[]
  includeHidden?: boolean
  maxDepth?: number
  pattern?: string
}

/**
 * Directory structure entry
 */
export type TDirectoryEntry = {
  children?: TDirectoryEntry[]
  modified?: Date
  name: string
  path: string
  size?: number
  type: 'directory' | 'file'
}

/**
 * Documentation content structure
 */
export type TDocumentationContent = {
  codeBlocks: string[]
  frontmatter?: Record<string, string>
  headings: string[]
  links: Array<{ text: string; url: string }>
  rawContent: string
}

/**
 * File operation types
 */
export type TFileOperation = 'append' | 'copy' | 'create_directory' | 'delete' | 'delete_directory' | 'delete_file' | 'move' | 'read' | 'set_permissions' | 'write'

/**
 * File operation result
 */
export type TFileOperationResult = {
  bytesProcessed?: number
  duration?: number
  error?: string
  operation: TFileOperation
  path: string
  size?: number
  sourcePath?: string
  success: boolean
}

/**
 * Plan file classification
 */
export type TPlanFileCategory = 'active' | 'archived' | 'unknown'

/**
 * Plan validation result
 */
export type TPlanValidation = {
  errors: string[]
  hasMetadata: boolean
  hasTasks: boolean
  isValid: boolean
  warnings: string[]
}

/**
 * Documentation file categories
 */
export type TDocumentationType = 'claude' | 'docs' | 'markdown' | 'other' | 'readme'

/**
 * Search result metadata
 */
export type TSearchResultMeta = {
  excludedPaths: string[]
  searchDirectory: string
  searchDuration: number
  searchPattern: string
  totalMatches: number
}

/**
 * Plan task status
 */
export type TTaskStatus = 'completed' | 'in_progress' | 'pending'

/**
 * Plan task definition
 */
export type TPlanTask = {
  lineNumber: number
  status: TTaskStatus
  text: string
}

/**
 * File content preview
 */
export type TFilePreview = {
  encoding?: string
  firstLines: string[]
  isEmpty: boolean
  isReadable: boolean
  path: string
}

/**
 * Directory scan options
 */
export type TDirectoryScanOptions = {
  followSymlinks?: boolean
  includeDirectories?: boolean
  includeFiles?: boolean
  maxDepth?: number
  sortBy?: 'modified' | 'name' | 'size'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Plan discovery options
 */
export type TPlanDiscoveryOptions = {
  filterByStatus?: string[]
  includeArchived?: boolean
  parseMetadata?: boolean
  sortBy?: 'modified' | 'name' | 'status'
  validatePlans?: boolean
}

/**
 * Path resolution context
 */
export type TPathContext = {
  isAbsolute: boolean
  isRelative: boolean
  resolvedPath?: string
  searchPaths: string[]
  workingDirectory: string
}