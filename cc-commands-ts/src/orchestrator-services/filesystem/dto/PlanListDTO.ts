/**
 * @file Plan List Data Transfer Object
 * 
 * Represents a collection of plan files with categorization, sorting,
 * and filtering capabilities. Provides comprehensive analysis of plan
 * collections and organizational patterns.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { PlanFileDTO } from './PlanFileDTO.js'

/**
 * Data Transfer Object for collections of plan files
 * 
 * This DTO represents organized collections of plans with analysis
 * of completion patterns, priority distributions, and organizational insights.
 */
export class PlanListDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PLAN_LIST_COUNT: 'PLAN_LIST_COUNT',
    PLAN_LIST_CREATED_AT: 'PLAN_LIST_CREATED_AT',
    PLAN_LIST_TYPE: 'PLAN_LIST_TYPE'
  } as const

  constructor(
    public readonly plans: PlanFileDTO[],
    public readonly listType: 'active' | 'all' | 'archived' | 'filtered',
    public readonly createdAt: Date = new Date(),
    public readonly filterCriteria?: {
      completionRange?: { max: number; min: number; }
      priority?: string
      status?: string
    }
  ) {}

  /**
   * Create PlanListDTO from array of plans
   * 
   * @param plans - Array of plan file DTOs
   * @param listType - Type of plan list
   * @param filterCriteria - Optional filter criteria applied
   * @returns New PlanListDTO instance
   */
  static fromPlanArray(
    plans: PlanFileDTO[],
    listType: 'active' | 'all' | 'archived' | 'filtered',
    filterCriteria?: {
      completionRange?: { max: number; min: number; }
      priority?: string
      status?: string
    }
  ): PlanListDTO {
    return new PlanListDTO(plans, listType, new Date(), filterCriteria)
  }

  /**
   * Get total number of plans in the list
   * 
   * @returns Count of plans
   */
  get count(): number {
    return this.plans.length
  }

  /**
   * Filter plans by completion percentage range
   * 
   * @param min - Minimum completion percentage
   * @param max - Maximum completion percentage
   * @returns New PlanListDTO with filtered results
   */
  filterByCompletion(min: number, max: number): PlanListDTO {
    const filtered = this.plans.filter(
      plan => plan.completionPercentage >= min && plan.completionPercentage <= max
    )
    
    return new PlanListDTO(
      filtered,
      'filtered',
      new Date(),
      { ...this.filterCriteria, completionRange: { max, min } }
    )
  }

  /**
   * Filter plans by priority
   * 
   * @param priority - Priority level to filter by
   * @returns New PlanListDTO with filtered results
   */
  filterByPriority(priority: string): PlanListDTO {
    const filtered = this.plans.filter(plan => plan.priority === priority)
    
    return new PlanListDTO(
      filtered,
      'filtered',
      new Date(),
      { ...this.filterCriteria, priority }
    )
  }

  /**
   * Filter plans by status
   * 
   * @param status - Status to filter by
   * @returns New PlanListDTO with filtered results
   */
  filterByStatus(status: string): PlanListDTO {
    const filtered = this.plans.filter(plan => plan.status === status)
    
    return new PlanListDTO(
      filtered,
      'filtered',
      new Date(),
      { ...this.filterCriteria, status }
    )
  }

  /**
   * Get average completion percentage across all plans
   * 
   * @returns Average completion percentage
   */
  getAverageCompletion(): number {
    if (this.plans.length === 0) return 0
    
    const total = this.plans.reduce((sum, plan) => sum + plan.completionPercentage, 0)
    return Math.round((total / this.plans.length) * 100) / 100
  }

  /**
   * Get completion statistics for the plan collection
   * 
   * @returns Detailed completion statistics
   */
  getCompletionStatistics(): {
    average: number
    completed: number
    inProgress: number
    notStarted: number
    totalPlans: number
  } {
    const completed = this.plans.filter(plan => plan.isCompleted).length
    const inProgress = this.plans.filter(plan => plan.hasInProgressTasks).length
    const notStarted = this.plans.filter(plan => 
      !plan.isCompleted && !plan.hasInProgressTasks
    ).length

    return {
      average: this.getAverageCompletion(),
      completed,
      inProgress,
      notStarted,
      totalPlans: this.plans.length
    }
  }

  /**
   * Get comprehensive jq query hints for plan list data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw plan list data
      { 
        description: 'Array of all plans in list', 
        query: '.raw.plan_list.plans',
        scope: 'single_item'
      },
      { 
        description: 'Plan list type (active/archived/all/filtered)', 
        query: '.raw.plan_list.list_type',
        scope: 'single_item'
      },
      { 
        description: 'Number of plans in list', 
        query: '.raw.plan_list.count',
        scope: 'single_item'
      },
      { 
        description: 'Filter criteria applied to list', 
        query: '.raw.plan_list.filter_criteria',
        scope: 'single_item'
      },
      { 
        description: 'Plan names only', 
        query: '.raw.plan_list.plans[].name',
        scope: 'single_item'
      },
      { 
        description: 'Plan completion percentages', 
        query: '.raw.plan_list.plans[].completion_percentage',
        scope: 'single_item'
      },
      
      // Calculated list analysis
      { 
        description: 'Average completion across all plans (calculated)', 
        query: '.calculated.collection_analysis.average_completion',
        scope: 'single_item'
      },
      { 
        description: 'Completion status distribution (calculated)', 
        query: '.calculated.collection_analysis.completion_distribution',
        scope: 'single_item'
      },
      { 
        description: 'Priority distribution analysis (calculated)', 
        query: '.calculated.collection_analysis.priority_distribution',
        scope: 'single_item'
      },
      { 
        description: 'Collection health indicators (calculated)', 
        query: '.calculated.collection_analysis.health_indicators',
        scope: 'single_item'
      },
      
      // Status-specific queries
      { 
        description: 'Completed plans only', 
        query: '.raw.plan_list.plans[] | select(.is_completed == true)',
        scope: 'single_item'
      },
      { 
        description: 'Plans with in-progress tasks', 
        query: '.raw.plan_list.plans[] | select(.has_in_progress_tasks == true)',
        scope: 'single_item'
      },
      { 
        description: 'High priority plans', 
        query: '.raw.plan_list.plans[] | select(.priority | test("high|critical|urgent"; "i"))',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get most recently modified plan
   * 
   * @returns Most recent plan or null if list is empty
   */
  getMostRecentPlan(): null | PlanFileDTO {
    if (this.plans.length === 0) return null
    
    let mostRecent = this.plans[0]
    if (!mostRecent) return null
    
    for (const plan of this.plans) {
      if (plan.lastModified > mostRecent.lastModified) {
        mostRecent = plan
      }
    }

    return mostRecent
  }

  /**
   * Get plans by priority distribution
   * 
   * @returns Plans grouped by priority level
   */
  getPriorityDistribution(): Record<string, PlanFileDTO[]> {
    const distribution: Record<string, PlanFileDTO[]> = {}
    
    for (const plan of this.plans) {
      const priority = plan.priority || 'unknown'
      if (!distribution[priority]) {
        distribution[priority] = []
      }

      distribution[priority].push(plan)
    }
    
    return distribution
  }

  /**
   * Get summary of plan list
   * 
   * @returns Brief list description for logging/debugging
   */
  getSummary(): string {
    const avg = this.getAverageCompletion()
    const filter = this.filterCriteria ? ' (filtered)' : ''
    return `${this.listType} plans: ${this.count} items, ${avg}% avg completion${filter}`
  }

  /**
   * Sort plans by completion percentage
   * 
   * @param ascending - Sort order (true for ascending, false for descending)
   * @returns New PlanListDTO with sorted plans
   */
  sortByCompletion(ascending = false): PlanListDTO {
    const sorted = [...this.plans].sort((a, b) => ascending ? 
        a.completionPercentage - b.completionPercentage :
        b.completionPercentage - a.completionPercentage)
    
    return new PlanListDTO(sorted, this.listType, new Date(), this.filterCriteria)
  }

  /**
   * Sort plans by last modified date
   * 
   * @param ascending - Sort order (true for ascending, false for descending)
   * @returns New PlanListDTO with sorted plans
   */
  sortByLastModified(ascending = false): PlanListDTO {
    const sorted = [...this.plans].sort((a, b) => ascending ? 
        a.lastModified.getTime() - b.lastModified.getTime() :
        b.lastModified.getTime() - a.lastModified.getTime())
    
    return new PlanListDTO(sorted, this.listType, new Date(), this.filterCriteria)
  }

  /**
   * Sort plans by name
   * 
   * @param ascending - Sort order (true for ascending, false for descending)
   * @returns New PlanListDTO with sorted plans
   */
  sortByName(ascending = true): PlanListDTO {
    const sorted = [...this.plans].sort((a, b) => ascending ? 
        a.name.localeCompare(b.name) :
        b.name.localeCompare(a.name))
    
    return new PlanListDTO(sorted, this.listType, new Date(), this.filterCriteria)
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete plan list data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'collection_analysis': this.calculateCollectionAnalysis()
      },
      raw: {
        'plan_list': this.buildRawPlanListData()
      }
    }
  }

  /**
   * Convert plan list data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PlanListDTO.Keys.PLAN_LIST_COUNT]: String(this.count),
      [PlanListDTO.Keys.PLAN_LIST_CREATED_AT]: this.createdAt.toISOString(),
      [PlanListDTO.Keys.PLAN_LIST_TYPE]: this.listType
    }
  }

  /**
   * Build raw plan list data structure
   * 
   * @returns Raw plan list data exactly as organized
   */
  private buildRawPlanListData(): JsonObject {
    return {
      'count': this.count,
      'created_at': this.createdAt.toISOString(),
      'filter_criteria': this.filterCriteria,
      'list_type': this.listType,
      'plans': this.plans.map(plan => plan.toJsonData().raw['plan_file'])
    }
  }

  /**
   * Calculate comprehensive collection analysis
   * 
   * @returns Analysis of the plan collection's characteristics
   */
  private calculateCollectionAnalysis(): JsonObject {
    const completionStats = this.getCompletionStatistics()
    const priorityDistribution = this.getPriorityDistribution()
    const mostRecent = this.getMostRecentPlan()
    
    // Convert priority distribution to counts
    const priorityCounts: Record<string, number> = {}
    for (const [priority, plans] of Object.entries(priorityDistribution)) {
      priorityCounts[priority] = plans.length
    }
    
    // Health indicators
    const healthIndicators = {
      has_active_plans: completionStats.inProgress > 0,
      has_completed_plans: completionStats.completed > 0,
      has_recent_activity: mostRecent ? mostRecent.getAgeInDays() <= 7 : false,
      is_balanced_portfolio: this.isBalancedPortfolio(completionStats),
      is_empty_collection: this.count === 0,
      is_stagnant_collection: completionStats.inProgress === 0 && completionStats.completed > 0
    }
    
    return {
      'average_completion': completionStats.average,
      'completion_distribution': {
        'completed_count': completionStats.completed,
        'completed_ratio': this.count > 0 ? Math.round((completionStats.completed / this.count) * 100) / 100 : 0,
        'in_progress_count': completionStats.inProgress,
        'in_progress_ratio': this.count > 0 ? Math.round((completionStats.inProgress / this.count) * 100) / 100 : 0,
        'not_started_count': completionStats.notStarted,
        'not_started_ratio': this.count > 0 ? Math.round((completionStats.notStarted / this.count) * 100) / 100 : 0
      },
      'health_indicators': healthIndicators,
      'most_recent_modification': mostRecent ? mostRecent.lastModified.toISOString() : null,
      'plan_diversity': {
        'priority_categories': Object.keys(priorityCounts).length,
        'size_variation': this.calculateSizeVariation()
      },
      'priority_distribution': priorityCounts,
      'total_plans': this.count
    }
  }

  /**
   * Calculate size variation across plans
   * 
   * @returns Analysis of file size distribution
   */
  private calculateSizeVariation(): JsonObject {
    if (this.plans.length === 0) {
      return { average_size: 0, max_size: 0, min_size: 0, size_range: 0 }
    }

    const sizes = this.plans.map(plan => plan.size)
    const avgSize = Math.round(sizes.reduce((sum, size) => sum + size, 0) / sizes.length)
    const minSize = Math.min(...sizes)
    const maxSize = Math.max(...sizes)

    return {
      'average_size': avgSize,
      'max_size': maxSize,
      'min_size': minSize,
      'size_range': maxSize - minSize
    }
  }

  /**
   * Check if the plan portfolio is balanced
   * 
   * @param stats - Completion statistics
   * @returns True if portfolio shows healthy balance of plan states
   */
  private isBalancedPortfolio(stats: {
    completed: number
    inProgress: number
    notStarted: number
    totalPlans: number
  }): boolean {
    if (stats.totalPlans === 0) return false
    
    // A balanced portfolio has some plans in each major state
    const hasCompleted = stats.completed > 0
    const hasInProgress = stats.inProgress > 0
    const hasNotStarted = stats.notStarted > 0
    
    // At least 2 of the 3 states should be represented
    const statesRepresented = [hasCompleted, hasInProgress, hasNotStarted].filter(Boolean).length
    
    return statesRepresented >= 2
  }
}