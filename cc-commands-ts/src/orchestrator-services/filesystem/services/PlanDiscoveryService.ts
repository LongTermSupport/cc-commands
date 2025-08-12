/**
 * @file Plan Discovery Service Implementation
 * 
 * Provides comprehensive plan file discovery and analysis capabilities
 * including metadata extraction, validation, and progress tracking
 * for cc-commands CLAUDE/plan structure.
 */

// import { promises as fs } from 'node:fs' // Not used directly
import * as path from 'node:path'

import { PlanDiscoveryResultDTO } from '../dto/PlanDiscoveryResultDTO.js'
import { PlanFileDTO } from '../dto/PlanFileDTO.js'
import { PlanListDTO } from '../dto/PlanListDTO.js'
import { PlanMetadataDTO } from '../dto/PlanMetadataDTO.js'
import { PlanValidationDTO } from '../dto/PlanValidationDTO.js'
import { FileOperationError } from '../errors/FileOperationError.js'
import { IFileDiscoveryService } from '../interfaces/IFileDiscoveryService.js'
import { IFileOperationsService } from '../interfaces/IFileOperationsService.js'
import { IPlanDiscoveryService } from '../interfaces/IPlanDiscoveryService.js'
import { TPlanDiscoveryOptions, TPlanMatchType, TPlanTask, TTaskStatus } from '../types/FilesystemTypes.js'

/**
 * Implementation of plan discovery service
 * 
 * Handles discovery and analysis of plan files with dependency injection
 * for file operations and discovery services.
 */
export class PlanDiscoveryService implements IPlanDiscoveryService {
  
  constructor(
    private readonly fileOperations: IFileOperationsService,
    private readonly fileDiscovery: IFileDiscoveryService
  ) {}

  /**
   * Analyze task completion across all plans
   */
  async analyzePlanProgress(directory = '.'): Promise<{
    completedPlans: number
    completedTasks: number
    overallCompletionPercentage: number
    plansInProgress: number
    totalPlans: number
    totalTasks: number
  }> {
    try {
      const discoveryResult = await this.findPlanFiles(directory, { parseMetadata: true })
      const allPlans = [...discoveryResult.activePlans, ...discoveryResult.archivedPlans]
      
      let totalTasks = 0
      let completedTasks = 0
      let completedPlans = 0
      let plansInProgress = 0
      
      for (const plan of allPlans) {
        totalTasks += plan.totalTasks
        completedTasks += plan.completedTasks
        
        if (plan.isCompleted) {
          completedPlans++
        } else if (plan.hasInProgressTasks) {
          plansInProgress++
        }
      }
      
      const overallCompletionPercentage = totalTasks > 0 ? 
        Math.round((completedTasks / totalTasks) * 100) : 0
      
      return {
        completedPlans,
        completedTasks,
        overallCompletionPercentage,
        plansInProgress,
        totalPlans: allPlans.length,
        totalTasks
      }
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Find a specific plan by name with fuzzy matching
   */
  async findPlanByName(name: string, directory = '.'): Promise<null | PlanFileDTO> {
    try {
      const searchResult = await this.searchPlans(name, directory)
      
      if (searchResult.matchType === 'exact' && searchResult.matches.length > 0) {
        return searchResult.matches[0] || null
      }
      
      if (searchResult.matchType === 'fuzzy' && searchResult.matches.length === 1) {
        return searchResult.matches[0] || null
      }
      
      return null
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Get plan directory paths (handles case-insensitive discovery)
   */
  async findPlanDirectories(directory = '.'): Promise<{
    archiveDirectory: null | string
    archiveDirectoryExists: boolean
    planDirectory: null | string
    planDirectoryExists: boolean
  }> {
    const searchDirectory = path.resolve(directory)
    
    try {
      // Look for CLAUDE directory (case-insensitive)
      const claudePatterns = ['CLAUDE', 'Claude', 'claude']
      let claudeDir: null | string = null
      
      for (const pattern of claudePatterns) {
        const candidatePath = path.join(searchDirectory, pattern)
        if (await this.fileOperations.pathExists(candidatePath) && 
            await this.fileOperations.isDirectory(candidatePath)) {
          claudeDir = candidatePath
          break
        }
      }
      
      if (!claudeDir) {
        return {
          archiveDirectory: null,
          archiveDirectoryExists: false,
          planDirectory: null,
          planDirectoryExists: false
        }
      }
      
      // Look for plan directory
      const planPatterns = ['plan', 'plans', 'Plan', 'Plans']
      let planDir: null | string = null
      
      for (const pattern of planPatterns) {
        const candidatePath = path.join(claudeDir, pattern)
        if (await this.fileOperations.pathExists(candidatePath) && 
            await this.fileOperations.isDirectory(candidatePath)) {
          planDir = candidatePath
          break
        }
      }
      
      // Look for archive directory
      const archivePatterns = ['archive', 'archived', 'Archive', 'Archived']
      let archiveDir: null | string = null
      
      if (planDir) {
        for (const pattern of archivePatterns) {
          const candidatePath = path.join(planDir, pattern)
          if (await this.fileOperations.pathExists(candidatePath) && 
              await this.fileOperations.isDirectory(candidatePath)) {
            archiveDir = candidatePath
            break
          }
        }
      }
      
      return {
        archiveDirectory: archiveDir,
        archiveDirectoryExists: archiveDir !== null,
        planDirectory: planDir,
        planDirectoryExists: planDir !== null
      }
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Discover all plan files in the project structure
   */
  async findPlanFiles(
    directory = '.', 
    options: TPlanDiscoveryOptions = {}
  ): Promise<PlanDiscoveryResultDTO> {
    const startTime = Date.now()
    const searchDirectory = path.resolve(directory)
    
    try {
      const {
        filterByStatus,
        includeArchived = true,
        parseMetadata = true,
        sortBy = 'modified',
        validatePlans = false
      } = options
      
      const directories = await this.findPlanDirectories(directory)
      const activePlans: PlanFileDTO[] = []
      const archivedPlans: PlanFileDTO[] = []
      
      // Search active plans
      if (directories.planDirectoryExists && directories.planDirectory) {
        const activeFiles = await this.fileDiscovery.findFilesByExtension(
          ['.md'], 
          directories.planDirectory
        )
        
        for (const file of activeFiles.files) {
          // Skip files in archive subdirectory
          if (directories.archiveDirectory && 
              file.path.startsWith(directories.archiveDirectory)) {
            continue
          }
          
          const planFile = await this.createPlanFileDTO(
            file.path, 
            'active',
            parseMetadata,
            validatePlans
          )
          
          if (!filterByStatus || filterByStatus.includes(planFile.status || 'unknown')) {
            activePlans.push(planFile)
          }
        }
      }
      
      // Search archived plans if requested
      if (includeArchived && directories.archiveDirectoryExists && directories.archiveDirectory) {
        const archivedFiles = await this.fileDiscovery.findFilesByExtension(
          ['.md'],
          directories.archiveDirectory
        )
        
        for (const file of archivedFiles.files) {
          const planFile = await this.createPlanFileDTO(
            file.path,
            'archived',
            parseMetadata,
            validatePlans
          )
          
          if (!filterByStatus || filterByStatus.includes(planFile.status || 'unknown')) {
            archivedPlans.push(planFile)
          }
        }
      }
      
      // Sort plans
      this.sortPlans(activePlans, sortBy)
      this.sortPlans(archivedPlans, sortBy)
      
      const duration = Date.now() - startTime
      
      return new PlanDiscoveryResultDTO(
        activePlans,
        archivedPlans,
        searchDirectory,
        duration
      )
    } catch (error) {
      throw FileOperationError.readError(searchDirectory, error as Error)
    }
  }

  /**
   * Extract metadata from a plan file
   */
  async getPlanMetadata(path: string): Promise<PlanMetadataDTO> {
    try {
      if (!(await this.fileOperations.pathExists(path))) {
        throw FileOperationError.fileNotFound(path)
      }
      
      const content = await this.fileOperations.readFile(path)
      const metadata = this.parsePlanContent(content)
      
      return new PlanMetadataDTO(
        metadata.status || 'unknown',
        metadata.priority || 'normal',
        metadata.date || new Date().toISOString(),
        metadata.totalTasks,
        metadata.completedTasks,
        metadata.inProgressTasks,
        metadata.pendingTasks,
        metadata.completionPercentage,
        metadata.isAllDone
      )
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Get recent plans sorted by modification time
   */
  async getRecentPlans(directory = '.', limit = 10): Promise<PlanListDTO> {
    try {
      const discoveryResult = await this.findPlanFiles(directory, { 
        parseMetadata: true,
        sortBy: 'modified'
      })
      
      const allPlans = [...discoveryResult.activePlans, ...discoveryResult.archivedPlans]
      allPlans.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      
      const recentPlans = allPlans.slice(0, limit)
      
      return PlanListDTO.fromPlanArray(recentPlans, 'filtered', {
        // Include filter criteria indicating this is a recency filter
      })
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * List all active plans (not in archive directory)
   */
  async listActivePlans(directory = '.'): Promise<PlanListDTO> {
    try {
      const discoveryResult = await this.findPlanFiles(directory, { 
        includeArchived: false,
        parseMetadata: true
      })
      
      return PlanListDTO.fromPlanArray(discoveryResult.activePlans, 'active')
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * List all archived plans (in archive directory)
   */
  async listArchivedPlans(directory = '.'): Promise<PlanListDTO> {
    try {
      const discoveryResult = await this.findPlanFiles(directory, { 
        includeArchived: true,
        parseMetadata: true
      })
      
      return PlanListDTO.fromPlanArray(discoveryResult.archivedPlans, 'archived')
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Create plan file path for new plan (does not create the file)
   */
  async preparePlanPath(planName: string, directory = '.'): Promise<{
    alreadyExists: boolean
    planDirectory: string
    planName: string
    planPath: string
  }> {
    try {
      const directories = await this.findPlanDirectories(directory)
      
      if (!directories.planDirectoryExists || !directories.planDirectory) {
        throw FileOperationError.directoryNotFound('CLAUDE/plan')
      }
      
      // Sanitize plan name
      const sanitizedName = this.sanitizePlanName(planName)
      const planFileName = sanitizedName.endsWith('.md') ? sanitizedName : `${sanitizedName}.md`
      const planPath = path.join(directories.planDirectory, planFileName)
      
      const alreadyExists = await this.fileOperations.pathExists(planPath)
      
      return {
        alreadyExists,
        planDirectory: directories.planDirectory,
        planName: sanitizedName,
        planPath
      }
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Search for plans matching a pattern
   */
  async searchPlans(
    searchTerm: string, 
    directory = '.'
  ): Promise<{
    matches: PlanFileDTO[]
    matchType: TPlanMatchType
    searchTerm: string
  }> {
    try {
      const discoveryResult = await this.findPlanFiles(directory, { parseMetadata: true })
      const allPlans = [...discoveryResult.activePlans, ...discoveryResult.archivedPlans]
      
      const normalizedSearchTerm = searchTerm.toLowerCase().replace('.md', '')
      
      // Try exact match first
      const exactMatches = allPlans.filter(plan => 
        plan.name.toLowerCase().replace('.md', '') === normalizedSearchTerm
      )
      
      if (exactMatches.length > 0) {
        return {
          matches: exactMatches,
          matchType: 'exact',
          searchTerm
        }
      }
      
      // Try fuzzy matching
      const fuzzyMatches = allPlans.filter(plan => {
        const planName = plan.name.toLowerCase().replace('.md', '')
        return planName.includes(normalizedSearchTerm) ||
               normalizedSearchTerm.includes(planName) ||
               this.calculateSimilarity(planName, normalizedSearchTerm) > 0.6
      })
      
      if (fuzzyMatches.length === 1) {
        return {
          matches: fuzzyMatches,
          matchType: 'fuzzy',
          searchTerm
        }
      }
      
      if (fuzzyMatches.length > 1) {
        return {
          matches: fuzzyMatches,
          matchType: 'multiple',
          searchTerm
        }
      }
      
      return {
        matches: [],
        matchType: 'none',
        searchTerm
      }
    } catch (error) {
      throw FileOperationError.readError(directory, error as Error)
    }
  }

  /**
   * Validate a plan file format and structure
   */
  async validatePlanFile(path: string): Promise<PlanValidationDTO> {
    try {
      if (!(await this.fileOperations.pathExists(path))) {
        throw FileOperationError.fileNotFound(path)
      }
      
      const content = await this.fileOperations.readFile(path)
      const errors: string[] = []
      const warnings: string[] = []
      
      // Check if file is empty
      if (!content.trim()) {
        errors.push('Plan file is empty')
        return new PlanValidationDTO(false, false, false, errors, warnings)
      }
      
      // Check for basic markdown structure
      const hasHeadings = /^#+\s+/m.test(content)
      if (!hasHeadings) {
        warnings.push('No markdown headings found')
      }
      
      // Check for tasks
      const taskPattern = /^\s*[-*+]\s*\[([x\s])\]/gm
      const taskMatches = [...content.matchAll(taskPattern)]
      const hasTasks = taskMatches.length > 0
      
      if (!hasTasks) {
        warnings.push('No task checkboxes found (- [ ] or - [x])')
      }
      
      // Check for metadata patterns
      const hasMetadata = this.hasMetadataPatterns(content)
      if (!hasMetadata) {
        warnings.push('No metadata patterns found (Status:, Priority:, Date:)')
      }
      
      // Validate task format
      if (hasTasks) {
        const invalidTasks = taskMatches.filter(match => 
          match[1] && ![' ', 'x'].includes(match[1])
        )
        
        if (invalidTasks.length > 0) {
          errors.push(`Invalid task status characters found: ${invalidTasks.length} tasks`)
        }
      }
      
      const isValid = errors.length === 0
      
      return new PlanValidationDTO(isValid, hasMetadata, hasTasks, errors, warnings)
    } catch (error) {
      throw FileOperationError.readError(path, error as Error)
    }
  }

  /**
   * Calculate string similarity for fuzzy matching
   * 
   * @private
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Create PlanFileDTO from file path
   * 
   * @private
   * @param filePath - Path to plan file
   * @param category - Plan category (active/archived)
   * @param parseMetadata - Whether to parse metadata
   * @param validate - Whether to validate plan
   * @returns PlanFileDTO instance
   */
  private async createPlanFileDTO(
    filePath: string,
    category: 'active' | 'archived',
    parseMetadata: boolean,
    validate: boolean
  ): Promise<PlanFileDTO> {
    const fileMetadata = await this.fileDiscovery.getFileMetadata(filePath)
    let planMetadata: PlanMetadataDTO | undefined
    let validation: PlanValidationDTO | undefined
    validation; // Unused variable - suppress warning
    
    if (parseMetadata) {
      try {
        planMetadata = await this.getPlanMetadata(filePath)
      } catch {
        // Continue without metadata if parsing fails
        planMetadata = new PlanMetadataDTO('unknown', 'normal', new Date().toISOString(), 0, 0, 0, 0, 0, false)
      }
    }
    
    if (validate) {
      try {
        validation = await this.validatePlanFile(filePath)
      } catch {
        // Continue without validation if it fails
      }
    }
    
    // Extract task information from planMetadata
    const tasks = planMetadata ? this.parseTasks(await this.fileOperations.readFile(filePath)) : []
    
    return new PlanFileDTO(
      fileMetadata.path,
      fileMetadata.name,
      category,
      fileMetadata.modified,
      fileMetadata.size,
      planMetadata?.status,
      planMetadata?.priority,
      tasks,
      planMetadata?.totalTasks || 0,
      planMetadata?.completedTasks || 0,
      planMetadata?.inProgressTasks || 0,
      planMetadata?.pendingTasks || 0
    )
  }

  /**
   * Extract metadata field from content
   * 
   * @private
   * @param content - Plan file content
   * @param fieldName - Field name to extract
   * @returns Field value or undefined
   */
  private extractMetadataField(content: string, fieldName: string): string | undefined {
    const patterns = [
      new RegExp(`^\\s*${fieldName}:\\s*(.+)$`, 'mi'),
      new RegExp(`^\\s*\\*\\*${fieldName}\\*\\*:\\s*(.+)$`, 'mi')
    ]
    
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return undefined
  }

  /**
   * Check if content has metadata patterns
   * 
   * @private
   * @param content - Plan file content
   * @returns True if metadata patterns found
   */
  private hasMetadataPatterns(content: string): boolean {
    const metadataPatterns = [
      /^\s*Status:\s*\w+/mi,
      /^\s*Priority:\s*\w+/mi,
      /^\s*Date:\s*[\d-]+/mi,
      /^\s*\*\*Status\*\*:\s*\w+/mi,
      /^\s*\*\*Priority\*\*:\s*\w+/mi,
      /^\s*\*\*Date\*\*:\s*[\d-]+/mi
    ]
    
    return metadataPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Calculate Levenshtein distance between two strings
   * 
   * @private
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      if (matrix[0]) {
        matrix[0][j] = j
      }
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (!matrix[i]) continue
        
        const currentRow = matrix[i]
        if (!currentRow) continue
        
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          currentRow[j] = matrix[i - 1]?.[j - 1] || 0
        } else {
          currentRow[j] = Math.min(
            (matrix[i - 1]?.[j - 1] || 0) + 1, // substitution
            (currentRow[j - 1] || 0) + 1,      // insertion
            (matrix[i - 1]?.[j] || 0) + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length]?.[str1.length] || 0
  }

  /**
   * Parse plan file content for metadata
   * 
   * @private
   * @param content - Plan file content
   * @returns Parsed metadata
   */
  private parsePlanContent(content: string): {
    completedTasks: number
    completionPercentage: number
    date?: string
    inProgressTasks: number
    isAllDone: boolean
    pendingTasks: number
    priority?: string
    status?: string
    totalTasks: number
  } {
    // Extract tasks
    const tasks = this.parseTasks(content)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length
    const pendingTasks = tasks.filter(task => task.status === 'pending').length
    
    const completionPercentage = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100) : 0
    const isAllDone = totalTasks > 0 && completedTasks === totalTasks
    
    // Extract metadata fields
    const status = this.extractMetadataField(content, 'status')
    const priority = this.extractMetadataField(content, 'priority')
    const date = this.extractMetadataField(content, 'date')
    
    return {
      completedTasks,
      completionPercentage,
      date,
      inProgressTasks,
      isAllDone,
      pendingTasks,
      priority,
      status,
      totalTasks
    }
  }

  /**
   * Parse tasks from plan content
   * 
   * @private
   * @param content - Plan file content
   * @returns Array of parsed tasks
   */
  private parseTasks(content: string): TPlanTask[] {
    const tasks: TPlanTask[] = []
    const lines = content.split('\n')
    
    for (const [i, line] of lines.entries()) {
      if (!line) continue
      const taskMatch = line.match(/^\s*[-*+]\s*\[([x\s~])\]\s*(.+)$/)
      
      if (taskMatch && taskMatch[1] && taskMatch[2]) {
        const [, statusChar, taskText] = taskMatch
        let status: TTaskStatus = 'pending'
        
        if (statusChar === 'x' || statusChar === 'X') {
          status = 'completed'
        } else if (statusChar === '~') {
          status = 'in_progress'
        }
        
        tasks.push({
          lineNumber: i + 1,
          status,
          text: taskText?.trim() || ''
        })
      }
    }
    
    return tasks
  }

  /**
   * Sanitize plan name for file system
   * 
   * @private
   * @param name - Plan name to sanitize
   * @returns Sanitized name
   */
  private sanitizePlanName(name: string): string {
    return name
      .replaceAll(/[<>:"|?*]/g, '') // Remove invalid characters
      .replaceAll(/\s+/g, '-')      // Replace spaces with hyphens
      .toLowerCase()
  }

  /**
   * Sort plans by specified criteria
   * 
   * @private
   * @param plans - Plans to sort (modified in place)
   * @param sortBy - Sort criteria
   */
  private sortPlans(plans: PlanFileDTO[], sortBy: 'modified' | 'name' | 'status'): void {
    plans.sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          return a.name.localeCompare(b.name)
        }

        case 'status': {
          return (a.status || 'unknown').localeCompare(b.status || 'unknown')
        }

        case 'modified':
        default: {
          return b.lastModified.getTime() - a.lastModified.getTime()
        }
      }
    })
  }
}