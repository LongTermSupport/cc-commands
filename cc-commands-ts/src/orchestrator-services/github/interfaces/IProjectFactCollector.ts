/**
 * @file Project Fact Collector Interface
 * 
 * Interface for aggregating repository facts into project-level mathematical
 * insights. All methods perform pure mathematical operations without any
 * interpretation, analysis, or subjective assessment.
 */

import { ContributorData, TimeSeriesData } from '../types/FactCollectionTypes.js'

/**
 * Project fact collector interface
 * 
 * Defines methods for aggregating multiple repository facts into project-level
 * mathematical insights. All methods return key-value pairs of factual data
 * based on statistical calculations and mathematical operations.
 */
export interface IProjectFactCollector {
  /**
   * Aggregate facts from multiple repositories into project totals
   * 
   * @param repoFacts - Array of repository fact collections
   * @returns Promise of aggregated project facts (totals, averages, counts)
   */
  aggregateRepositoryFacts(repoFacts: Record<string, string>[]): Promise<Record<string, string>>

  /**
   * Calculate cross-repository metrics and relationships
   * 
   * @param repoFacts - Array of repository fact collections
   * @returns Promise of cross-repo facts (distribution metrics, balance scores)
   */
  calculateCrossRepoMetrics(repoFacts: Record<string, string>[]): Promise<Record<string, string>>

  /**
   * Calculate distribution metrics for contributor data
   * 
   * @param contributorData - Array of contributor activity data
   * @returns Promise of distribution facts (Gini coefficient, concentration ratios)
   */
  calculateDistributionMetrics(contributorData: ContributorData[]): Promise<Record<string, string>>

  /**
   * Calculate growth trends by comparing current and historical facts
   * 
   * @param currentFacts - Current period facts
   * @param historicalFacts - Historical period facts for comparison
   * @returns Promise of trend facts (growth rates, momentum indicators)
   */
  calculateGrowthTrends(
    currentFacts: Record<string, string>, 
    historicalFacts: Record<string, string>
  ): Promise<Record<string, string>>

  /**
   * Calculate velocity metrics from time series data
   * 
   * @param timeSeriesData - Array of time-based activity data
   * @returns Promise of velocity facts (rates, acceleration, consistency scores)
   */
  calculateVelocityMetrics(timeSeriesData: TimeSeriesData[]): Promise<Record<string, string>>
}