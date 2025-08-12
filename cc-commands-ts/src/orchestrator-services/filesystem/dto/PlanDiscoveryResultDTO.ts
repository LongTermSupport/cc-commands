/**
 * @file Plan Discovery Result Data Transfer Object
 * 
 * Represents the result of plan file discovery operations including
 * active plans, archived plans, and comprehensive metadata about
 * the plan file structure and organization.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { JqHint } from '../../../core/interfaces/JqHint.js'
import { DataNamespaceStructure, JsonObject } from '../../../core/types/JsonResultTypes.js'
import { PlanFileDTO } from './PlanFileDTO.js'

/**
 * Data Transfer Object for plan discovery operation results
 * 
 * This DTO encapsulates the complete result of plan file discovery,
 * including categorized plans, metadata, and organizational analysis.
 */
export class PlanDiscoveryResultDTO implements ILLMDataDTO {
  private static readonly Keys = {
    ACTIVE_PLANS_COUNT: 'ACTIVE_PLANS_COUNT',
    ARCHIVED_PLANS_COUNT: 'ARCHIVED_PLANS_COUNT',
    PLAN_DISCOVERY_DIRECTORY: 'PLAN_DISCOVERY_DIRECTORY',
    PLAN_DISCOVERY_DURATION_MS: 'PLAN_DISCOVERY_DURATION_MS',
    TOTAL_PLANS: 'TOTAL_PLANS'
  } as const

  constructor(
    public readonly activePlans: PlanFileDTO[],
    public readonly archivedPlans: PlanFileDTO[],
    public readonly searchDirectory: string,
    public readonly discoveryDuration: number,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Create PlanDiscoveryResultDTO from discovery operation
   * 
   * @param activePlans - Array of active plan files discovered
   * @param archivedPlans - Array of archived plan files discovered
   * @param searchDirectory - Directory where plans were searched
   * @param discoveryDuration - Time taken for discovery operation in milliseconds
   * @returns New PlanDiscoveryResultDTO instance
   */
  static fromDiscoveryResults(
    activePlans: PlanFileDTO[],
    archivedPlans: PlanFileDTO[],
    searchDirectory: string,
    discoveryDuration: number
  ): PlanDiscoveryResultDTO {
    return new PlanDiscoveryResultDTO(
      activePlans,
      archivedPlans,
      searchDirectory,
      discoveryDuration
    )
  }

  /**
   * Get total number of plans discovered
   * 
   * @returns Sum of active and archived plans
   */
  get totalPlans(): number {
    return this.activePlans.length + this.archivedPlans.length
  }

  /**
   * Get all plans combined (active and archived)
   * 
   * @returns Array of all plan files
   */
  getAllPlans(): PlanFileDTO[] {
    return [...this.activePlans, ...this.archivedPlans]
  }

  /**
   * Get comprehensive jq query hints for plan discovery data
   * 
   * @returns Array of jq hints for efficient data querying
   */
  getJqHints(): JqHint[] {
    return [
      // Raw plan discovery data
      { 
        description: 'Array of active plan files', 
        query: '.raw.plan_discovery.active_plans',
        scope: 'single_item'
      },
      { 
        description: 'Array of archived plan files', 
        query: '.raw.plan_discovery.archived_plans',
        scope: 'single_item'
      },
      { 
        description: 'Directory where plans were discovered', 
        query: '.raw.plan_discovery.search_directory',
        scope: 'single_item'
      },
      { 
        description: 'Active plan names only', 
        query: '.raw.plan_discovery.active_plans[].name',
        scope: 'single_item'
      },
      { 
        description: 'Active plan paths only', 
        query: '.raw.plan_discovery.active_plans[].path',
        scope: 'single_item'
      },
      
      // Calculated plan analysis
      { 
        description: 'Total number of plans discovered (calculated)', 
        query: '.calculated.plan_metrics.total_plans',
        scope: 'single_item'
      },
      { 
        description: 'Plan discovery rate (calculated)', 
        query: '.calculated.discovery_performance.plans_per_second',
        scope: 'single_item'
      },
      { 
        description: 'Plans organized by completion status', 
        query: '.calculated.plan_organization.by_completion_status',
        scope: 'single_item'
      },
      { 
        description: 'Plans organized by priority level', 
        query: '.calculated.plan_organization.by_priority',
        scope: 'single_item'
      },
      { 
        description: 'Average completion percentage across all plans', 
        query: '.calculated.plan_metrics.avg_completion_percentage',
        scope: 'single_item'
      },
      
      // Plan status queries
      { 
        description: 'Count of completed plans', 
        query: '.calculated.plan_organization.by_completion_status.completed | length',
        scope: 'single_item'
      },
      { 
        description: 'Most recent plan modification date', 
        query: '.calculated.plan_metrics.most_recent_modification',
        scope: 'single_item'
      }
    ]
  }

  /**
   * Get most recently modified plan
   * 
   * @returns Most recently modified plan or null if no plans
   */
  getMostRecentlyModifiedPlan(): null | PlanFileDTO {
    const allPlans = this.getAllPlans()
    if (allPlans.length === 0) return null
    
    let mostRecent = allPlans[0]
    if (!mostRecent) return null
    
    for (const plan of allPlans) {
      if (plan.lastModified > mostRecent.lastModified) {
        mostRecent = plan
      }
    }

    return mostRecent
  }

  /**
   * Get plans by completion status
   * 
   * @returns Object with plans categorized by completion status
   */
  getPlansByCompletionStatus(): {
    completed: PlanFileDTO[]
    inProgress: PlanFileDTO[]
    notStarted: PlanFileDTO[]
  } {
    const allPlans = this.getAllPlans()
    
    return {
      completed: allPlans.filter(plan => plan.isCompleted),
      inProgress: allPlans.filter(plan => plan.hasInProgressTasks),
      notStarted: allPlans.filter(plan => !plan.hasInProgressTasks && !plan.isCompleted)
    }
  }

  /**
   * Get plans by priority
   * 
   * @returns Object with plans categorized by priority level
   */
  getPlansByPriority(): Record<string, PlanFileDTO[]> {
    const allPlans = this.getAllPlans()
    const priorities: Record<string, PlanFileDTO[]> = {}
    
    for (const plan of allPlans) {
      const priority = plan.priority || 'unknown'
      if (!priorities[priority]) {
        priorities[priority] = []
      }

      priorities[priority].push(plan)
    }
    
    return priorities
  }

  /**
   * Get summary of plan discovery operation
   * 
   * @returns Brief summary for logging/debugging
   */
  getSummary(): string {
    const duration = this.discoveryDuration > 1000 ? 
      `${Math.round(this.discoveryDuration / 1000)}s` : 
      `${this.discoveryDuration}ms`
    return `Discovered ${this.totalPlans} plans (${this.activePlans.length} active, ${this.archivedPlans.length} archived) in ${duration}`
  }

  /**
   * Convert to structured JSON data with clear data provenance
   * 
   * @returns Complete plan discovery data with raw and calculated namespaces
   */
  toJsonData(): DataNamespaceStructure {
    return {
      calculated: {
        'discovery_performance': this.calculateDiscoveryPerformance(),
        'plan_metrics': this.calculatePlanMetrics(),
        'plan_organization': this.calculatePlanOrganization()
      },
      raw: {
        'plan_discovery': this.buildRawPlanDiscoveryData()
      }
    }
  }

  /**
   * Convert plan discovery data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PlanDiscoveryResultDTO.Keys.ACTIVE_PLANS_COUNT]: String(this.activePlans.length),
      [PlanDiscoveryResultDTO.Keys.ARCHIVED_PLANS_COUNT]: String(this.archivedPlans.length),
      [PlanDiscoveryResultDTO.Keys.PLAN_DISCOVERY_DIRECTORY]: this.searchDirectory,
      [PlanDiscoveryResultDTO.Keys.PLAN_DISCOVERY_DURATION_MS]: String(this.discoveryDuration),
      [PlanDiscoveryResultDTO.Keys.TOTAL_PLANS]: String(this.totalPlans)
    }
  }

  /**
   * Build raw plan discovery data structure
   * 
   * @returns Raw plan discovery data exactly as collected
   */
  private buildRawPlanDiscoveryData(): JsonObject {
    return {
      'active_plans': this.activePlans.map(plan => plan.toJsonData().raw['plan_file']),
      'archived_plans': this.archivedPlans.map(plan => plan.toJsonData().raw['plan_file']),
      'created_at': this.createdAt.toISOString(),
      'discovery_duration_ms': this.discoveryDuration,
      'search_directory': this.searchDirectory,
      'total_plans': this.totalPlans
    }
  }

  /**
   * Calculate discovery performance metrics
   * 
   * @returns Performance statistics for plan discovery operation
   */
  private calculateDiscoveryPerformance(): JsonObject {
    const plansPerSecond = this.discoveryDuration > 0 ? 
      Math.round((this.totalPlans / this.discoveryDuration) * 1000 * 100) / 100 : 0

    return {
      'discovery_duration_ms': this.discoveryDuration,
      'discovery_efficiency_score': Math.min(plansPerSecond * 10, 1),
      'plans_per_second': plansPerSecond
    }
  }

  /**
   * Calculate comprehensive plan metrics
   * 
   * @returns Statistical analysis of discovered plans
   */
  private calculatePlanMetrics(): JsonObject {
    const allPlans = this.getAllPlans()
    const completionPercentages = allPlans.map(plan => plan.completionPercentage)
    const avgCompletion = completionPercentages.length > 0 ? 
      Math.round((completionPercentages.reduce((sum, pct) => sum + pct, 0) / completionPercentages.length) * 100) / 100 : 0

    const mostRecent = this.getMostRecentlyModifiedPlan()

    return {
      'active_plans_count': this.activePlans.length,
      'archived_plans_count': this.archivedPlans.length,
      'avg_completion_percentage': avgCompletion,
      'has_active_plans': this.activePlans.length > 0,
      'has_archived_plans': this.archivedPlans.length > 0,
      'most_recent_modification': mostRecent ? mostRecent.lastModified.toISOString() : null,
      'total_plans': this.totalPlans
    }
  }

  /**
   * Calculate plan organization analysis
   * 
   * @returns Analysis of how plans are organized and categorized
   */
  private calculatePlanOrganization(): JsonObject {
    const byCompletion = this.getPlansByCompletionStatus()
    const byPriority = this.getPlansByPriority()

    // Convert plan arrays to counts for JSON serialization
    const completionStatusCounts = {
      completed: byCompletion.completed.length,
      in_progress: byCompletion.inProgress.length,
      not_started: byCompletion.notStarted.length
    }

    const priorityCounts: Record<string, number> = {}
    for (const [priority, plans] of Object.entries(byPriority)) {
      priorityCounts[priority] = plans.length
    }

    return {
      'by_completion_status': completionStatusCounts,
      'by_priority': priorityCounts,
      'completion_status_categories': Object.keys(completionStatusCounts).length,
      'priority_categories': Object.keys(priorityCounts).length
    }
  }
}