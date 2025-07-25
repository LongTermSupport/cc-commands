/**
 * @file Activity Service Interface
 * 
 * Interface contract for high-level activity analysis operations.
 * Provides cross-repository activity aggregation and project-level insights.
 */

import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO'
import { ProjectSummaryDTO } from '../dto/ProjectSummaryDTO'

/**
 * Interface for high-level activity analysis operations
 * 
 * This interface defines the contract for activity analysis operations that
 * span multiple repositories and provide project-level insights. Implementations
 * coordinate repository services to provide comprehensive activity analysis.
 */
export interface IActivityService {
  /**
   * Aggregate activity metrics across multiple repositories
   * 
   * Collects and combines activity data from multiple repositories to
   * provide unified project-level statistics. Useful for multi-repo
   * project analysis and reporting.
   * 
   * @param repos - Array of repository names in 'owner/repo' format
   * @param owner - Repository owner (user or organization)
   * @param since - Start date for activity analysis
   * @returns Aggregated activity metrics DTO
   * @throws {OrchestratorError} When any repository analysis fails
   */
  aggregateActivityAcrossRepos(repos: string[], owner: string, since: Date): Promise<ActivityMetricsDTO>

  /**
   * Calculate high-level project summary from activity metrics
   * 
   * Transforms activity metrics into a comprehensive project summary
   * with health scores, activity levels, and key statistics. Useful
   * for executive reporting and project health monitoring.
   * 
   * @param activities - Array of activity metrics from different repositories
   * @returns Project summary DTO with aggregated insights
   * @throws {OrchestratorError} When summary calculation fails
   */
  calculateActivitySummary(activities: ActivityMetricsDTO[]): Promise<ProjectSummaryDTO>

  /**
   * Identify most active repositories from activity metrics
   * 
   * Analyzes activity patterns to rank repositories by activity level.
   * Uses weighted scoring based on commits, issues, PRs, and contributors.
   * 
   * @param activities - Array of activity metrics from different repositories
   * @returns Array of repository names sorted by activity level (highest first)
   * @throws {OrchestratorError} When activity analysis fails
   */
  identifyMostActiveRepositories(activities: ActivityMetricsDTO[]): Promise<string[]>
}