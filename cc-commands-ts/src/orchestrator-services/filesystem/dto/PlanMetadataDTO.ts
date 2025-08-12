/**
 * @file Plan Metadata Data Transfer Object
 * 
 * Represents extracted metadata from plan files including status, priority,
 * dates, task counts, and completion analysis. Provides comprehensive
 * tracking of plan progress and organizational information.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { TPlanMetadata } from '../types/FilesystemTypes.js'

/**
 * Data Transfer Object for plan file metadata analysis
 * 
 * This DTO encapsulates metadata extracted from plan files,
 * including task tracking, completion status, and progress analysis.
 */
export class PlanMetadataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PLAN_COMPLETED_TASKS: 'PLAN_COMPLETED_TASKS',
    PLAN_COMPLETION_PERCENTAGE: 'PLAN_COMPLETION_PERCENTAGE',
    PLAN_DATE: 'PLAN_DATE',
    PLAN_IN_PROGRESS_TASKS: 'PLAN_IN_PROGRESS_TASKS',
    PLAN_IS_ALL_DONE: 'PLAN_IS_ALL_DONE',
    PLAN_PENDING_TASKS: 'PLAN_PENDING_TASKS',
    PLAN_PRIORITY: 'PLAN_PRIORITY',
    PLAN_STATUS: 'PLAN_STATUS',
    PLAN_TOTAL_TASKS: 'PLAN_TOTAL_TASKS'
  } as const

  constructor(
    public readonly status: string,
    public readonly priority: string,
    public readonly date: string,
    public readonly totalTasks: number,
    public readonly completedTasks: number,
    public readonly inProgressTasks: number,
    public readonly pendingTasks: number,
    public readonly completionPercentage: number,
    public readonly isAllDone: boolean,
    public readonly extractedAt: Date = new Date()
  ) {}

  /**
   * Create PlanMetadataDTO from raw metadata extraction
   * 
   * @param extracted - Raw extracted metadata from plan parsing
   * @returns New PlanMetadataDTO instance
   */
  static fromExtractedMetadata(extracted: {
    completedTasks: number
    date?: string
    inProgressTasks: number
    pendingTasks: number
    priority?: string
    status?: string
    totalTasks: number
  }): PlanMetadataDTO {
    const {totalTasks} = extracted
    const {completedTasks} = extracted
    const completionPercentage = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100) : 0
    const isAllDone = totalTasks > 0 && completedTasks === totalTasks

    return new PlanMetadataDTO(
      extracted.status || 'unknown',
      extracted.priority || 'unknown',
      extracted.date || '',
      totalTasks,
      completedTasks,
      extracted.inProgressTasks,
      extracted.pendingTasks,
      completionPercentage,
      isAllDone
    )
  }

  /**
   * Create PlanMetadataDTO from TPlanMetadata type
   * 
   * @param metadata - Plan metadata structure
   * @returns New PlanMetadataDTO instance
   */
  static fromPlanMetadata(metadata: TPlanMetadata): PlanMetadataDTO {
    return new PlanMetadataDTO(
      metadata.status || 'unknown',
      metadata.priority || 'unknown',
      metadata.date || '',
      metadata.totalTasks,
      metadata.completedTasks,
      metadata.inProgressTasks,
      metadata.pendingTasks,
      metadata.completionPercentage,
      metadata.isAllDone
    )
  }

  /**
   * Get completion status classification
   * 
   * @returns Human-readable completion status
   */
  getCompletionStatus(): string {
    if (this.isAllDone) return 'completed'
    if (this.inProgressTasks > 0) return 'in-progress'
    if (this.completedTasks > 0) return 'partially-complete'
    if (this.pendingTasks > 0) return 'not-started'
    return 'no-tasks'
  }

  /**
   * Get comprehensive jq query hints for plan metadata
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw plan metadata
      { 
        description: 'Plan status from metadata', 
        query: '.raw.plan_metadata.status',
        scope: 'single_item'
      },
      { 
        description: 'Plan priority from metadata', 
        query: '.raw.plan_metadata.priority',
        scope: 'single_item'
      },
      { 
        description: 'Plan date from metadata', 
        query: '.raw.plan_metadata.date',
        scope: 'single_item'
      },
      { 
        description: 'Task count breakdown', 
        query: '.raw.plan_metadata.task_counts',
        scope: 'single_item'
      },
      { 
        description: 'Total number of tasks in plan', 
        query: '.raw.plan_metadata.task_counts.total',
        scope: 'single_item'
      },
      { 
        description: 'Completed tasks count', 
        query: '.raw.plan_metadata.task_counts.completed',
        scope: 'single_item'
      },
      
      // Calculated analysis
      { 
        description: 'Completion percentage (calculated)', 
        query: '.calculated.progress_analysis.completion_percentage',
        scope: 'single_item'
      },
      { 
        description: 'Progress stage classification (calculated)', 
        query: '.calculated.progress_analysis.progress_stage',
        scope: 'single_item'
      },
      { 
        description: 'Task distribution ratios (calculated)', 
        query: '.calculated.progress_analysis.task_distribution',
        scope: 'single_item'
      },
      { 
        description: 'Plan health assessment (calculated)', 
        query: '.calculated.plan_analysis.health_indicators',
        scope: 'single_item'
      },
      { 
        description: 'Plan completion velocity estimate', 
        query: '.calculated.plan_analysis.velocity_indicators',
        scope: 'single_item'
      },
      
      // Status queries
      { 
        description: 'Is plan fully completed', 
        query: '.calculated.progress_analysis.is_completed',
        scope: 'single_item'
      },
      { 
        description: 'Has any progress been made', 
        query: '.calculated.progress_analysis.has_progress',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get priority level as numeric value
   * 
   * @returns Numeric priority (higher = more important)
   */
  getPriorityLevel(): number {
    const priority = this.priority.toLowerCase()
    
    if (priority.includes('critical') || priority.includes('urgent')) return 5
    if (priority.includes('high')) return 4
    if (priority.includes('medium')) return 3
    if (priority.includes('low')) return 2
    return 1 // unknown or minimal priority
  }

  /**
   * Get progress stage description
   * 
   * @returns Detailed progress stage analysis
   */
  getProgressStage(): string {
    if (this.totalTasks === 0) return 'no-tasks-defined'
    if (this.completionPercentage === 0) return 'planning-stage'
    if (this.completionPercentage < 25) return 'initial-execution'
    if (this.completionPercentage < 50) return 'quarter-milestone'
    if (this.completionPercentage < 75) return 'midpoint-progress'
    if (this.completionPercentage < 100) return 'final-stretch'
    return 'completion-achieved'
  }

  /**
   * Get summary of plan metadata
   * 
   * @returns Brief metadata description for logging/debugging
   */
  getSummary(): string {
    const priority = this.priority === 'unknown' ? '' : ` [${this.priority}]`
    const status = this.status === 'unknown' ? '' : ` (${this.status})`
    return `${this.completionPercentage}% complete${priority}${status} - ${this.totalTasks} tasks`
  }

  /**
   * Get task distribution analysis
   * 
   * @returns Analysis of how tasks are distributed across statuses
   */
  getTaskDistribution(): {
    completedRatio: number
    inProgressRatio: number
    pendingRatio: number
  } {
    if (this.totalTasks === 0) {
      return { completedRatio: 0, inProgressRatio: 0, pendingRatio: 0 }
    }

    return {
      completedRatio: Math.round((this.completedTasks / this.totalTasks) * 100) / 100,
      inProgressRatio: Math.round((this.inProgressTasks / this.totalTasks) * 100) / 100,
      pendingRatio: Math.round((this.pendingTasks / this.totalTasks) * 100) / 100
    }
  }

  /**
   * Check if plan has active work
   * 
   * @returns True if plan has in-progress or pending tasks
   */
  hasActiveWork(): boolean {
    return this.inProgressTasks > 0 || this.pendingTasks > 0
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete plan metadata with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'plan_analysis': this.calculatePlanAnalysis(),
        'progress_analysis': this.calculateProgressAnalysis()
      },
      raw: {
        'plan_metadata': this.buildRawPlanMetadata()
      }
    }
  }

  /**
   * Convert plan metadata to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PlanMetadataDTO.Keys.PLAN_COMPLETED_TASKS]: String(this.completedTasks),
      [PlanMetadataDTO.Keys.PLAN_COMPLETION_PERCENTAGE]: String(this.completionPercentage),
      [PlanMetadataDTO.Keys.PLAN_DATE]: this.date,
      [PlanMetadataDTO.Keys.PLAN_IN_PROGRESS_TASKS]: String(this.inProgressTasks),
      [PlanMetadataDTO.Keys.PLAN_IS_ALL_DONE]: String(this.isAllDone),
      [PlanMetadataDTO.Keys.PLAN_PENDING_TASKS]: String(this.pendingTasks),
      [PlanMetadataDTO.Keys.PLAN_PRIORITY]: this.priority,
      [PlanMetadataDTO.Keys.PLAN_STATUS]: this.status,
      [PlanMetadataDTO.Keys.PLAN_TOTAL_TASKS]: String(this.totalTasks)
    }
  }

  /**
   * Build raw plan metadata structure
   * 
   * @returns Raw plan metadata exactly as extracted
   */
  private buildRawPlanMetadata(): JsonObject {
    return {
      'completion_percentage': this.completionPercentage,
      'date': this.date,
      'extracted_at': this.extractedAt.toISOString(),
      'is_all_done': this.isAllDone,
      'priority': this.priority,
      'status': this.status,
      'task_counts': {
        'completed': this.completedTasks,
        'in_progress': this.inProgressTasks,
        'pending': this.pendingTasks,
        'total': this.totalTasks
      }
    }
  }

  /**
   * Calculate comprehensive plan analysis metrics
   * 
   * @returns Analysis of plan characteristics and health
   */
  private calculatePlanAnalysis(): JsonObject {
    const priorityLevel = this.getPriorityLevel()
    const hasActiveWork = this.hasActiveWork()
    
    // Health indicators
    const healthIndicators = {
      has_date_specified: this.date !== '',
      has_defined_tasks: this.totalTasks > 0,
      has_priority_set: this.priority !== 'unknown',
      has_status_defined: this.status !== 'unknown',
      is_progressing: this.inProgressTasks > 0 || this.completedTasks > 0
    }

    // Velocity indicators (basic heuristics)
    const velocityIndicators = {
      completion_momentum: this.inProgressTasks > 0 && this.completedTasks > 0,
      execution_started: this.completedTasks > 0 || this.inProgressTasks > 0,
      priority_urgency_level: priorityLevel,
      task_complexity_estimate: this.totalTasks > 20 ? 'high' : 
                               this.totalTasks > 10 ? 'medium' : 'low'
    }

    return {
      'has_active_work': hasActiveWork,
      'health_indicators': healthIndicators,
      'metadata_completeness_score': Object.values(healthIndicators).filter(Boolean).length / Object.keys(healthIndicators).length,
      'priority_level_numeric': priorityLevel,
      'velocity_indicators': velocityIndicators
    }
  }

  /**
   * Calculate detailed progress analysis
   * 
   * @returns Progress tracking and completion analysis
   */
  private calculateProgressAnalysis(): JsonObject {
    const distribution = this.getTaskDistribution()
    const progressStage = this.getProgressStage()
    const completionStatus = this.getCompletionStatus()

    return {
      'completion_percentage': this.completionPercentage,
      'completion_status': completionStatus,
      'has_progress': this.completedTasks > 0 || this.inProgressTasks > 0,
      'is_completed': this.isAllDone,
      'is_stalled': this.inProgressTasks === 0 && this.pendingTasks > 0 && this.completedTasks > 0,
      'progress_stage': progressStage,
      'task_distribution': distribution,
      'tasks_remaining': this.pendingTasks + this.inProgressTasks,
      'work_intensity': this.totalTasks > 0 ? 
        Math.round(((this.inProgressTasks + this.completedTasks * 0.5) / this.totalTasks) * 100) / 100 : 0
    }
  }
}