/**
 * @file Complete structured result type definitions
 * 
 * Defines complete JSON structures for both repository-level and project-level results.
 * These types combine raw API data with calculated metrics in a hierarchical structure.
 * 
 * The hierarchy flows: Project -> Repositories -> Individual Repository Data
 * Each level maintains clear separation between raw and calculated data.
 */

import { 
  ActivityMetrics, 
  DistributionAnalysis, 
  MathematicalRatios, 
  StatisticalMeasures, 
  TimeCalculations 
} from './CalculatedDataTypes.js'
import { GitHubApiRawData } from './GitHubApiTypes.js'
import { DataNamespaceStructure, JsonObject, ResultJsonStructure } from './JsonResultTypes.js'

// Repository-level complete structure
export interface RepositoryJsonStructure extends DataNamespaceStructure {
  readonly calculated: {
    readonly activity_metrics: ActivityMetrics
    readonly distribution_analysis: DistributionAnalysis
    readonly mathematical_ratios: MathematicalRatios
    readonly statistical_measures: StatisticalMeasures
    readonly time_calculations: TimeCalculations
  }
  readonly raw: {
    readonly filesystem?: JsonObject
    readonly git_remote?: JsonObject
    readonly github_api: GitHubApiRawData
  }
}

// Project-level complete structure
export interface ProjectJsonStructure extends ResultJsonStructure {
  readonly calculated: {
    readonly cross_repo_ratios: {
      readonly commits_to_contributors_ratio: number
      readonly cross_repo_contributor_ratio: number
      readonly project_issue_open_close_ratio: number
      readonly project_pr_merge_success_rate: number
    }
    readonly growth_trends: {
      readonly commit_growth_rate_30d: number
      readonly contributor_growth_rate_30d: number
      readonly issue_growth_rate_30d: number
    }
    readonly project_averages: {
      readonly average_commits_per_day_project: number
      readonly average_commits_per_repo_30d: number
      readonly average_issues_per_repo: number
      readonly average_repo_age_days: number
    }
    readonly project_totals: {
      readonly total_closed_issues: number
      readonly total_commits_30d: number
      readonly total_contributors_30d: number
      readonly total_issues: number
      readonly total_open_issues: number
      readonly total_prs: number
      readonly total_repositories: number
    }
  }
  readonly metadata: {
    readonly arguments: string
    readonly command: string
    readonly execution_time_ms: number
    readonly generated_at: string
  }
  readonly raw: {
    readonly github_api: {
      readonly project_detection: {
        readonly input: string
        readonly mode: 'auto' | 'owner' | 'url'
        readonly resolved_project_url: string
      }
      readonly repositories_discovered: readonly string[]
    }
  }
  readonly repositories: {
    readonly [repositoryName: string]: RepositoryJsonStructure
  }
}