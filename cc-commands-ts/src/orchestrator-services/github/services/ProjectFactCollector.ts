/**
 * @file Project Fact Collector Service
 * 
 * Pure fact aggregation service for GitHub projects. Aggregates raw
 * mathematical data from multiple repositories into project-level facts
 * without any interpretation, analysis, or subjective assessment.
 * 
 * CRITICAL: This service performs FACTS-ONLY aggregation. No analysis,
 * interpretation, or quality judgments are made.
 */

import { MathematicalCalculator } from '../../../core/helpers/MathematicalCalculator.js'
import { IProjectFactCollector } from '../interfaces/IProjectFactCollector.js'
import { ContributorData, TimeSeriesData } from '../types/FactCollectionTypes.js'

/**
 * Project fact collector implementation
 * 
 * Aggregates pure mathematical facts from multiple repositories into
 * project-level insights. All methods return key-value string pairs
 * suitable for direct consumption by LLMInfo.
 */
export class ProjectFactCollector implements IProjectFactCollector {
  /**
   * Aggregate facts from multiple repositories into project totals
   */
  async aggregateRepositoryFacts(repoFacts: Record<string, string>[]): Promise<Record<string, string>> {
    if (repoFacts.length === 0) {
      return {
        PROJECT_ANALYSIS_STATUS: 'NO_REPOSITORIES',
        PROJECT_TOTAL_REPOSITORIES: '0'
      }
    }

    // Calculate project totals
    let totalCommits = 0
    let totalIssues = 0
    let totalPRs = 0
    let totalStars = 0
    let totalForks = 0
    let totalWatchers = 0

    for (const facts of repoFacts) {
      totalCommits += Number(facts['COMMITS_TOTAL']) || 0
      totalIssues += Number(facts['ISSUES_TOTAL']) || 0
      totalPRs += Number(facts['PRS_TOTAL']) || 0
      totalStars += Number(facts['REPO_STARS_COUNT']) || 0
      totalForks += Number(facts['REPO_FORKS_COUNT']) || 0
      totalWatchers += Number(facts['REPO_WATCHERS_COUNT']) || 0
    }

    // Calculate project averages
    const avgCommitsPerRepo = MathematicalCalculator.calculateRatio(totalCommits, repoFacts.length)
    const avgIssuesPerRepo = MathematicalCalculator.calculateRatio(totalIssues, repoFacts.length)
    const avgPRsPerRepo = MathematicalCalculator.calculateRatio(totalPRs, repoFacts.length)
    const avgStarsPerRepo = MathematicalCalculator.calculateRatio(totalStars, repoFacts.length)

    // Calculate project ratios
    const projectCommitsToIssuesRatio = MathematicalCalculator.calculateRatio(totalCommits, totalIssues)
    const projectCommitsToPRsRatio = MathematicalCalculator.calculateRatio(totalCommits, totalPRs)
    const projectIssuesToPRsRatio = MathematicalCalculator.calculateRatio(totalIssues, totalPRs)

    return {
      PROJECT_ANALYSIS_STATUS: 'COMPLETED',
      PROJECT_AVERAGE_COMMITS_PER_REPO: String(avgCommitsPerRepo),
      PROJECT_AVERAGE_ISSUES_PER_REPO: String(avgIssuesPerRepo),
      PROJECT_AVERAGE_PRS_PER_REPO: String(avgPRsPerRepo),
      PROJECT_AVERAGE_STARS_PER_REPO: String(avgStarsPerRepo),
      PROJECT_COMMITS_TO_ISSUES_RATIO: String(projectCommitsToIssuesRatio),
      PROJECT_COMMITS_TO_PRS_RATIO: String(projectCommitsToPRsRatio),
      
      PROJECT_ISSUES_TO_PRS_RATIO: String(projectIssuesToPRsRatio),
      PROJECT_TOTAL_COMMITS: String(totalCommits),
      PROJECT_TOTAL_FORKS: String(totalForks),
      PROJECT_TOTAL_ISSUES: String(totalIssues),
      
      PROJECT_TOTAL_PRS: String(totalPRs),
      PROJECT_TOTAL_REPOSITORIES: String(repoFacts.length),
      PROJECT_TOTAL_STARS: String(totalStars),
      
      PROJECT_TOTAL_WATCHERS: String(totalWatchers)
    }
  }

  /**
   * Calculate cross-repository metrics and relationships
   */
  async calculateCrossRepoMetrics(repoFacts: Record<string, string>[]): Promise<Record<string, string>> {
    if (repoFacts.length === 0) {
      return {
        CROSS_REPO_ANALYSIS_STATUS: 'NO_REPOSITORIES'
      }
    }

    // Extract activity density values for distribution analysis
    const activityDensities = repoFacts
      .map(facts => Number(facts['ACTIVITY_DENSITY']) || 0)
      .filter(density => density > 0)

    if (activityDensities.length === 0) {
      return {
        CROSS_REPO_ANALYSIS_STATUS: 'NO_ACTIVITY_DATA'
      }
    }

    // Calculate distribution statistics
    const meanActivityDensity = MathematicalCalculator.calculateMean(activityDensities)
    const medianActivityDensity = MathematicalCalculator.calculateMedian(activityDensities)
    const activityDensityVariance = MathematicalCalculator.calculateVariance(activityDensities)
    const activityGini = MathematicalCalculator.calculateGiniCoefficient(activityDensities)

    // Calculate percentiles
    const percentiles = MathematicalCalculator.calculatePercentiles(activityDensities, [25, 50, 75, 90])

    return {
      ACTIVITY_DENSITY_P25: String(percentiles['P25'] || 0),
      ACTIVITY_DENSITY_P50: String(percentiles['P50'] || 0),
      
      ACTIVITY_DENSITY_P75: String(percentiles['P75'] || 0),
      ACTIVITY_DENSITY_P90: String(percentiles['P90'] || 0),
      ACTIVITY_DENSITY_VARIANCE: String(activityDensityVariance),
      ACTIVITY_DISTRIBUTION_GINI: String(activityGini),
      
      CROSS_REPO_ACTIVE_REPOSITORIES: String(activityDensities.length),
      CROSS_REPO_ANALYSIS_STATUS: 'COMPLETED',
      CROSS_REPO_REPOSITORIES_ANALYZED: String(repoFacts.length),
      MEAN_ACTIVITY_DENSITY: String(meanActivityDensity),
      
      MEDIAN_ACTIVITY_DENSITY: String(medianActivityDensity)
    }
  }

  /**
   * Calculate distribution metrics for contributor data
   */
  async calculateDistributionMetrics(contributorData: ContributorData[]): Promise<Record<string, string>> {
    if (contributorData.length === 0) {
      return {
        CONTRIBUTOR_ANALYSIS_STATUS: 'NO_CONTRIBUTORS'
      }
    }

    // Extract contribution counts
    const commitCounts = contributorData.map(c => c.commitCount)
    const issueCounts = contributorData.map(c => c.issueCount)
    const prCounts = contributorData.map(c => c.prCount)

    // Calculate distribution statistics
    const commitGini = MathematicalCalculator.calculateGiniCoefficient(commitCounts)
    const issueGini = MathematicalCalculator.calculateGiniCoefficient(issueCounts)
    const prGini = MathematicalCalculator.calculateGiniCoefficient(prCounts)

    // Calculate means and medians
    const meanCommitsPerContributor = MathematicalCalculator.calculateMean(commitCounts)
    const medianCommitsPerContributor = MathematicalCalculator.calculateMedian(commitCounts)
    const meanIssuesPerContributor = MathematicalCalculator.calculateMean(issueCounts)
    const medianIssuesPerContributor = MathematicalCalculator.calculateMedian(issueCounts)

    // Find top contributors
    const topCommitContributors = MathematicalCalculator.findTopN(contributorData, 3, 'commitCount')
    const topContributorCommitPercentage = contributorData.length > 0 
      ? MathematicalCalculator.calculatePercentage(
          topCommitContributors.at(0)?.commitCount || 0,
          commitCounts.reduce((sum, count) => sum + count, 0)
        )
      : 0

    return {
      COMMIT_DISTRIBUTION_GINI: String(commitGini),
      
      CONTRIBUTOR_ANALYSIS_STATUS: 'COMPLETED',
      ISSUE_DISTRIBUTION_GINI: String(issueGini),
      MEAN_COMMITS_PER_CONTRIBUTOR: String(meanCommitsPerContributor),
      
      MEAN_ISSUES_PER_CONTRIBUTOR: String(meanIssuesPerContributor),
      MEDIAN_COMMITS_PER_CONTRIBUTOR: String(medianCommitsPerContributor),
      MEDIAN_ISSUES_PER_CONTRIBUTOR: String(medianIssuesPerContributor),
      PR_DISTRIBUTION_GINI: String(prGini),
      
      TOP_CONTRIBUTOR_COMMIT_COUNT: String(topCommitContributors.at(0)?.commitCount || 0),
      TOP_CONTRIBUTOR_COMMIT_PERCENTAGE: String(topContributorCommitPercentage),
      TOP_CONTRIBUTOR_LOGIN: topCommitContributors.at(0)?.login || '',
      
      TOTAL_CONTRIBUTORS: String(contributorData.length)
    }
  }

  /**
   * Calculate growth trends by comparing current and historical facts
   */
  async calculateGrowthTrends(
    currentFacts: Record<string, string>, 
    historicalFacts: Record<string, string>
  ): Promise<Record<string, string>> {
    // Extract current period values
    const currentCommits = Number(currentFacts['PROJECT_TOTAL_COMMITS']) || 0
    const currentIssues = Number(currentFacts['PROJECT_TOTAL_ISSUES']) || 0
    const currentPRs = Number(currentFacts['PROJECT_TOTAL_PRS']) || 0
    const currentStars = Number(currentFacts['PROJECT_TOTAL_STARS']) || 0

    // Extract historical period values
    const historicalCommits = Number(historicalFacts['PROJECT_TOTAL_COMMITS']) || 0
    const historicalIssues = Number(historicalFacts['PROJECT_TOTAL_ISSUES']) || 0
    const historicalPRs = Number(historicalFacts['PROJECT_TOTAL_PRS']) || 0
    const historicalStars = Number(historicalFacts['PROJECT_TOTAL_STARS']) || 0

    // Calculate growth rates
    const commitsGrowthRate = MathematicalCalculator.calculateGrowthRate(currentCommits, historicalCommits)
    const issuesGrowthRate = MathematicalCalculator.calculateGrowthRate(currentIssues, historicalIssues)
    const prsGrowthRate = MathematicalCalculator.calculateGrowthRate(currentPRs, historicalPRs)
    const starsGrowthRate = MathematicalCalculator.calculateGrowthRate(currentStars, historicalStars)

    return {
      COMMITS_GROWTH_RATE: String(commitsGrowthRate),
      CURRENT_PERIOD_COMMITS: String(currentCommits),
      CURRENT_PERIOD_ISSUES: String(currentIssues),
      CURRENT_PERIOD_PRS: String(currentPRs),
      
      CURRENT_PERIOD_STARS: String(currentStars),
      GROWTH_ANALYSIS_STATUS: 'COMPLETED',
      HISTORICAL_PERIOD_COMMITS: String(historicalCommits),
      HISTORICAL_PERIOD_ISSUES: String(historicalIssues),
      
      HISTORICAL_PERIOD_PRS: String(historicalPRs),
      HISTORICAL_PERIOD_STARS: String(historicalStars),
      ISSUES_GROWTH_RATE: String(issuesGrowthRate),
      PRS_GROWTH_RATE: String(prsGrowthRate),
      
      STARS_GROWTH_RATE: String(starsGrowthRate)
    }
  }

  /**
   * Calculate velocity metrics from time series data
   */
  async calculateVelocityMetrics(timeSeriesData: TimeSeriesData[]): Promise<Record<string, string>> {
    if (timeSeriesData.length === 0) {
      return {
        VELOCITY_ANALYSIS_STATUS: 'NO_TIME_SERIES_DATA'
      }
    }

    // Extract velocity measurements
    const commitVelocities = timeSeriesData.map(point => point.commits)
    const issueVelocities = timeSeriesData.map(point => point.issues)
    const prVelocities = timeSeriesData.map(point => point.pullRequests)

    // Calculate velocity statistics
    const meanCommitVelocity = MathematicalCalculator.calculateMean(commitVelocities)
    const medianCommitVelocity = MathematicalCalculator.calculateMedian(commitVelocities)
    const commitVelocityVariance = MathematicalCalculator.calculateVariance(commitVelocities)

    const meanIssueVelocity = MathematicalCalculator.calculateMean(issueVelocities)
    const medianIssueVelocity = MathematicalCalculator.calculateMedian(issueVelocities)

    const meanPRVelocity = MathematicalCalculator.calculateMean(prVelocities)
    const medianPRVelocity = MathematicalCalculator.calculateMedian(prVelocities)

    // Calculate trend (simple linear: compare first half vs second half)
    const midpoint = Math.floor(timeSeriesData.length / 2)
    const firstHalfCommits = timeSeriesData.slice(0, midpoint).reduce((sum, point) => sum + point.commits, 0)
    const secondHalfCommits = timeSeriesData.slice(midpoint).reduce((sum, point) => sum + point.commits, 0)
    const commitVelocityTrend = MathematicalCalculator.calculateGrowthRate(secondHalfCommits, firstHalfCommits)

    return {
      COMMIT_VELOCITY_TREND: String(commitVelocityTrend),
      
      COMMIT_VELOCITY_VARIANCE: String(commitVelocityVariance),
      MEAN_COMMIT_VELOCITY: String(meanCommitVelocity),
      MEAN_ISSUE_VELOCITY: String(meanIssueVelocity),
      MEAN_PR_VELOCITY: String(meanPRVelocity),
      
      MEDIAN_COMMIT_VELOCITY: String(medianCommitVelocity),
      MEDIAN_ISSUE_VELOCITY: String(medianIssueVelocity),
      
      MEDIAN_PR_VELOCITY: String(medianPRVelocity),
      TIME_SERIES_POINTS: String(timeSeriesData.length),
      
      VELOCITY_ANALYSIS_STATUS: 'COMPLETED'
    }
  }
}