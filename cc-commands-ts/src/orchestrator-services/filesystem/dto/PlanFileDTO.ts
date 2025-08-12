/**
 * @file Plan File Data Transfer Object
 * 
 * Represents a single plan file with comprehensive metadata including
 * task tracking, completion status, priority, and file information.
 * Provides analysis of plan structure and progress tracking.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TPlanFileCategory, TPlanTask, TTaskStatus } from '../types/FilesystemTypes.js'

/**
 * Data Transfer Object for individual plan file information
 * 
 * This DTO represents a comprehensive view of a single plan file,
 * including file metadata, task analysis, and completion tracking.
 */
export class PlanFileDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PLAN_COMPLETION_PERCENTAGE: 'PLAN_COMPLETION_PERCENTAGE',
    PLAN_FILE_CATEGORY: 'PLAN_FILE_CATEGORY',
    PLAN_FILE_NAME: 'PLAN_FILE_NAME',
    PLAN_FILE_PATH: 'PLAN_FILE_PATH',
    PLAN_FILE_SIZE: 'PLAN_FILE_SIZE',
    PLAN_HAS_IN_PROGRESS_TASKS: 'PLAN_HAS_IN_PROGRESS_TASKS',
    PLAN_IS_COMPLETED: 'PLAN_IS_COMPLETED',
    PLAN_LAST_MODIFIED: 'PLAN_LAST_MODIFIED',
    PLAN_PRIORITY: 'PLAN_PRIORITY',
    PLAN_STATUS: 'PLAN_STATUS',
    PLAN_TOTAL_TASKS: 'PLAN_TOTAL_TASKS'
  } as const

  constructor(
    public readonly path: string,
    public readonly name: string,
    public readonly category: TPlanFileCategory,
    public readonly lastModified: Date,
    public readonly size: number,
    public readonly status?: string,
    public readonly priority?: string,
    public readonly tasks: TPlanTask[] = [],
    public readonly totalTasks: number = 0,
    public readonly completedTasks: number = 0,
    public readonly inProgressTasks: number = 0,
    public readonly pendingTasks: number = 0
  ) {}

  /**
   * Create PlanFileDTO from file metadata and plan analysis
   * 
   * @param path - Full path to the plan file
   * @param name - Plan file name
   * @param category - Plan file category (active/archived/unknown)
   * @param lastModified - Last modification date
   * @param size - File size in bytes
   * @param options - Additional plan metadata and task analysis
   * @returns New PlanFileDTO instance
   */
  static fromPlanAnalysis(
    path: string,
    name: string,
    category: TPlanFileCategory,
    lastModified: Date,
    size: number,
    options: {
      completedTasks?: number
      inProgressTasks?: number
      pendingTasks?: number
      priority?: string
      status?: string
      tasks?: TPlanTask[]
      totalTasks?: number
    } = {}
  ): PlanFileDTO {
    return new PlanFileDTO(
      path,
      name,
      category,
      lastModified,
      size,
      options.status,
      options.priority,
      options.tasks || [],
      options.totalTasks || 0,
      options.completedTasks || 0,
      options.inProgressTasks || 0,
      options.pendingTasks || 0
    )
  }

  /**
   * Get completion percentage for the plan
   * 
   * @returns Completion percentage (0-100)
   */
  get completionPercentage(): number {
    return this.totalTasks > 0 ? 
      Math.round((this.completedTasks / this.totalTasks) * 100) : 0
  }

  /**
   * Check if plan has any in-progress tasks
   * 
   * @returns True if plan has tasks marked as in_progress
   */
  get hasInProgressTasks(): boolean {
    return this.inProgressTasks > 0
  }

  /**
   * Check if plan is fully completed
   * 
   * @returns True if all tasks are completed
   */
  get isCompleted(): boolean {
    return this.totalTasks > 0 && this.completedTasks === this.totalTasks
  }

  /**
   * Get age of plan file in days
   * 
   * @returns Number of days since plan file was last modified
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.lastModified.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get human-readable file size
   * 
   * @returns File size formatted for human readability
   */
  getHumanReadableSize(): string {
    const units = ['B', 'KB', 'MB', 'GB']
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
   * Get comprehensive jq query hints for plan file data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw plan file data
      { 
        description: 'Plan file path', 
        query: '.raw.plan_file.path',
        scope: 'single_item'
      },
      { 
        description: 'Plan file name', 
        query: '.raw.plan_file.name',
        scope: 'single_item'
      },
      { 
        description: 'Plan category (active/archived)', 
        query: '.raw.plan_file.category',
        scope: 'single_item'
      },
      { 
        description: 'Plan status from metadata', 
        query: '.raw.plan_file.status',
        scope: 'single_item'
      },
      { 
        description: 'Plan priority from metadata', 
        query: '.raw.plan_file.priority',
        scope: 'single_item'
      },
      { 
        description: 'Array of all plan tasks', 
        query: '.raw.plan_file.tasks',
        scope: 'single_item'
      },
      
      // Calculated plan analysis
      { 
        description: 'Plan completion percentage (calculated)', 
        query: '.calculated.task_analysis.completion_percentage',
        scope: 'single_item'
      },
      { 
        description: 'Task completion breakdown counts', 
        query: '.calculated.task_analysis.task_counts',
        scope: 'single_item'
      },
      { 
        description: 'Plan age in days (calculated)', 
        query: '.calculated.plan_characteristics.age_days',
        scope: 'single_item'
      },
      { 
        description: 'Plan activity status analysis', 
        query: '.calculated.plan_characteristics.activity_status',
        scope: 'single_item'
      },
      { 
        description: 'Plan file size analysis', 
        query: '.calculated.plan_characteristics.file_analysis',
        scope: 'single_item'
      },
      
      // Task-specific queries
      { 
        description: 'Completed tasks only', 
        query: '.raw.plan_file.tasks[] | select(.status == "completed")',
        scope: 'single_item'
      },
      { 
        description: 'In-progress tasks only', 
        query: '.raw.plan_file.tasks[] | select(.status == "in_progress")',
        scope: 'single_item'
      },
      { 
        description: 'Pending tasks only', 
        query: '.raw.plan_file.tasks[] | select(.status == "pending")',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get plan progress status
   * 
   * @returns Human-readable progress status
   */
  getProgressStatus(): string {
    if (this.isCompleted) return 'completed'
    if (this.hasInProgressTasks) return 'in-progress'
    if (this.pendingTasks > 0) return 'pending'
    return 'unknown'
  }

  /**
   * Get summary of plan file
   * 
   * @returns Brief plan description for logging/debugging
   */
  getSummary(): string {
    const progress = `${this.completionPercentage}%`
    const status = this.status ? ` [${this.status}]` : ''
    return `${this.name}: ${progress} complete${status} (${this.totalTasks} tasks)`
  }

  /**
   * Get tasks by status
   * 
   * @param status - Task status to filter by
   * @returns Array of tasks with the specified status
   */
  getTasksByStatus(status: TTaskStatus): TPlanTask[] {
    return this.tasks.filter(task => task.status === status)
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete plan file data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'plan_characteristics': this.calculatePlanCharacteristics(),
        'task_analysis': this.calculateTaskAnalysis()
      },
      raw: {
        'plan_file': this.buildRawPlanFileData()
      }
    }
  }

  /**
   * Convert plan file data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PlanFileDTO.Keys.PLAN_COMPLETION_PERCENTAGE]: String(this.completionPercentage),
      [PlanFileDTO.Keys.PLAN_FILE_CATEGORY]: this.category,
      [PlanFileDTO.Keys.PLAN_FILE_NAME]: this.name,
      [PlanFileDTO.Keys.PLAN_FILE_PATH]: this.path,
      [PlanFileDTO.Keys.PLAN_FILE_SIZE]: String(this.size),
      [PlanFileDTO.Keys.PLAN_HAS_IN_PROGRESS_TASKS]: String(this.hasInProgressTasks),
      [PlanFileDTO.Keys.PLAN_IS_COMPLETED]: String(this.isCompleted),
      [PlanFileDTO.Keys.PLAN_LAST_MODIFIED]: this.lastModified.toISOString(),
      [PlanFileDTO.Keys.PLAN_PRIORITY]: this.priority || '',
      [PlanFileDTO.Keys.PLAN_STATUS]: this.status || '',
      [PlanFileDTO.Keys.PLAN_TOTAL_TASKS]: String(this.totalTasks)
    }
  }

  /**
   * Build raw plan file data structure
   * 
   * @returns Raw plan file data exactly as collected
   */
  private buildRawPlanFileData(): JsonObject {
    return {
      'category': this.category,
      'completed_tasks': this.completedTasks,
      'in_progress_tasks': this.inProgressTasks,
      'last_modified': this.lastModified.toISOString(),
      'name': this.name,
      'path': this.path,
      'pending_tasks': this.pendingTasks,
      'priority': this.priority,
      'size': this.size,
      'status': this.status,
      'tasks': this.tasks,
      'total_tasks': this.totalTasks
    }
  }

  /**
   * Calculate plan characteristics and properties
   * 
   * @returns Analysis of plan file characteristics
   */
  private calculatePlanCharacteristics(): JsonObject {
    const age = this.getAgeInDays()
    
    return {
      'activity_status': this.getProgressStatus(),
      'age_days': age,
      'file_analysis': {
        'human_readable_size': this.getHumanReadableSize(),
        'is_large_plan': this.size > 50_000, // > 50KB
        'size_bytes': this.size
      },
      'is_active_plan': this.category === 'active',
      'is_archived_plan': this.category === 'archived',
      'is_recently_modified': age <= 7,
      'is_stale_plan': age > 30
    }
  }

  /**
   * Calculate comprehensive task analysis
   * 
   * @returns Analysis of task completion and distribution
   */
  private calculateTaskAnalysis(): JsonObject {
    const taskDistribution = this.totalTasks > 0 ? {
      completed_ratio: Math.round((this.completedTasks / this.totalTasks) * 100) / 100,
      in_progress_ratio: Math.round((this.inProgressTasks / this.totalTasks) * 100) / 100,
      pending_ratio: Math.round((this.pendingTasks / this.totalTasks) * 100) / 100
    } : {
      completed_ratio: 0,
      in_progress_ratio: 0,
      pending_ratio: 0
    }

    return {
      'completion_percentage': this.completionPercentage,
      'has_tasks': this.totalTasks > 0,
      'is_all_done': this.isCompleted,
      'task_counts': {
        'completed': this.completedTasks,
        'in_progress': this.inProgressTasks,
        'pending': this.pendingTasks,
        'total': this.totalTasks
      },
      'task_distribution': taskDistribution,
      'task_progress_stage': this.determineProgressStage()
    }
  }

  /**
   * Determine the current progress stage of the plan
   * 
   * @returns Progress stage classification
   */
  private determineProgressStage(): string {
    if (this.totalTasks === 0) return 'no-tasks'
    if (this.completionPercentage === 0) return 'not-started'
    if (this.completionPercentage < 25) return 'early-stage'
    if (this.completionPercentage < 50) return 'quarter-progress'
    if (this.completionPercentage < 75) return 'half-progress'
    if (this.completionPercentage < 100) return 'near-completion'
    return 'completed'
  }
}