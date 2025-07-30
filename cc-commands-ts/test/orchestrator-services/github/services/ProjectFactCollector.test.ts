/**
 * @file ProjectFactCollector Tests
 * 
 * Comprehensive test suite validating pure fact aggregation across multiple repositories.
 * Tests ensure no analysis or interpretation is performed - only mathematical
 * aggregation and statistical calculations.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ProjectFactCollector } from '../../../../src/orchestrator-services/github/services/ProjectFactCollector.js'
import { ContributorData, TimeSeriesData } from '../../../../src/orchestrator-services/github/types/FactCollectionTypes.js'

describe('ProjectFactCollector', () => {
  let factCollector: ProjectFactCollector

  beforeEach(() => {
    factCollector = new ProjectFactCollector()
  })

  describe('aggregateRepositoryFacts', () => {
    it('should aggregate facts from multiple repositories without analysis', async () => {
      const repoFacts = [
        {
          COMMITS_TOTAL: '10',
          ISSUES_TOTAL: '5',
          PRS_TOTAL: '4',
          REPO_FORKS_COUNT: '8',
          REPO_STARS_COUNT: '20',
          REPO_WATCHERS_COUNT: '15'
        },
        {
          COMMITS_TOTAL: '15',
          ISSUES_TOTAL: '8',
          PRS_TOTAL: '6',
          REPO_FORKS_COUNT: '12',
          REPO_STARS_COUNT: '35',
          REPO_WATCHERS_COUNT: '25'
        }
      ]

      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      // Verify mathematical aggregation
      expect(result.PROJECT_TOTAL_COMMITS).toBe('25') // 10 + 15
      expect(result.PROJECT_TOTAL_ISSUES).toBe('13') // 5 + 8
      expect(result.PROJECT_TOTAL_PRS).toBe('10') // 4 + 6
      expect(result.PROJECT_TOTAL_STARS).toBe('55') // 20 + 35
      expect(result.PROJECT_TOTAL_FORKS).toBe('20') // 8 + 12
      expect(result.PROJECT_TOTAL_WATCHERS).toBe('40') // 15 + 25
      expect(result.PROJECT_TOTAL_REPOSITORIES).toBe('2')

      // Verify calculated ratios (implementation uses MathematicalCalculator.calculateRatio which rounds to 2 decimal places)
      expect(result.PROJECT_COMMITS_TO_ISSUES_RATIO).toBe('1.92') // 25/13 = 1.92 (rounded)
      expect(result.PROJECT_COMMITS_TO_PRS_RATIO).toBe('2.5') // 25/10 = 2.5
      expect(result.PROJECT_ISSUES_TO_PRS_RATIO).toBe('1.3') // 13/10 = 1.3

      // Verify averages  
      expect(result.PROJECT_AVERAGE_COMMITS_PER_REPO).toBe('12.5') // 25/2 = 12.5
      expect(result.PROJECT_AVERAGE_ISSUES_PER_REPO).toBe('6.5') // 13/2 = 6.5
      expect(result.PROJECT_AVERAGE_PRS_PER_REPO).toBe('5') // 10/2 = 5
      expect(result.PROJECT_AVERAGE_STARS_PER_REPO).toBe('27.5') // 55/2 = 27.5

      // Verify no analysis/interpretation
      expect(result).not.toHaveProperty('PROJECT_HEALTH_SCORE')
      expect(result).not.toHaveProperty('PROJECT_ACTIVITY_LEVEL')
      expect(result).not.toHaveProperty('PROJECT_QUALITY_RATING')
    })

    it('should handle empty repository list', async () => {
      const result = await factCollector.aggregateRepositoryFacts([])

      expect(result.PROJECT_ANALYSIS_STATUS).toBe('NO_REPOSITORIES')
      expect(result.PROJECT_TOTAL_REPOSITORIES).toBe('0')
    })

    it('should handle single repository correctly', async () => {
      const repoFacts = [{
        COMMITS_TOTAL: '42',
        ISSUES_TOTAL: '10',
        PRS_TOTAL: '5',
        REPO_FORKS_COUNT: '15',
        REPO_STARS_COUNT: '100',
        REPO_WATCHERS_COUNT: '50'
      }]

      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      expect(result.PROJECT_TOTAL_REPOSITORIES).toBe('1')
      expect(result.PROJECT_TOTAL_COMMITS).toBe('42')
      expect(result.PROJECT_TOTAL_ISSUES).toBe('10')
      expect(result.PROJECT_TOTAL_STARS).toBe('100')
    })

    it('should handle missing fields gracefully', async () => {
      const repoFacts = [
        { COMMITS_TOTAL: '10' }, // Missing other fields
        { ISSUES_TOTAL: '5', REPO_STARS_COUNT: '20' } // Partial data
      ]

      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      expect(result.PROJECT_TOTAL_COMMITS).toBe('10') // Only from first repo
      expect(result.PROJECT_TOTAL_ISSUES).toBe('5') // Only from second repo
      expect(result.PROJECT_TOTAL_STARS).toBe('20') // Only from second repo
      expect(result.PROJECT_TOTAL_REPOSITORIES).toBe('2')
    })
  })

  describe('calculateCrossRepoMetrics', () => {
    it('should calculate cross-repository distribution metrics without analysis', async () => {
      const repoFacts = [
        { ACTIVITY_DENSITY: '10.5' },
        { ACTIVITY_DENSITY: '8.2' },
        { ACTIVITY_DENSITY: '15.7' },
        { ACTIVITY_DENSITY: '3.1' }
      ]

      const result = await factCollector.calculateCrossRepoMetrics(repoFacts)

      expect(result.CROSS_REPO_ANALYSIS_STATUS).toBe('COMPLETED')
      expect(result.CROSS_REPO_ACTIVE_REPOSITORIES).toBe('4')
      expect(result.CROSS_REPO_REPOSITORIES_ANALYZED).toBe('4')

      // Verify statistical calculations without interpretation
      expect(result).toHaveProperty('MEAN_ACTIVITY_DENSITY')
      expect(result).toHaveProperty('MEDIAN_ACTIVITY_DENSITY')
      expect(result).toHaveProperty('ACTIVITY_DENSITY_VARIANCE')
      expect(result).toHaveProperty('ACTIVITY_DISTRIBUTION_GINI')
      expect(result).toHaveProperty('ACTIVITY_DENSITY_P25')
      expect(result).toHaveProperty('ACTIVITY_DENSITY_P75')

      // Verify no subjective assessment
      expect(result).not.toHaveProperty('ACTIVITY_QUALITY_SCORE')
      expect(result).not.toHaveProperty('DISTRIBUTION_HEALTH_RATING')
    })

    it('should handle empty repository list', async () => {
      const result = await factCollector.calculateCrossRepoMetrics([])

      expect(result.CROSS_REPO_ANALYSIS_STATUS).toBe('NO_REPOSITORIES')
    })

    it('should handle repositories with no activity data', async () => {
      const repoFacts = [
        { ACTIVITY_DENSITY: '0' },
        { OTHER_FIELD: 'value' } // No activity density
      ]

      const result = await factCollector.calculateCrossRepoMetrics(repoFacts)

      expect(result.CROSS_REPO_ANALYSIS_STATUS).toBe('NO_ACTIVITY_DATA')
    })
  })

  describe('calculateDistributionMetrics', () => {
    it('should calculate contributor distribution statistics without analysis', async () => {
      const contributors: ContributorData[] = [
        { commitCount: 100, issueCount: 20, login: 'user1', prCount: 15 },
        { commitCount: 50, issueCount: 10, login: 'user2', prCount: 8 },
        { commitCount: 25, issueCount: 5, login: 'user3', prCount: 3 },
        { commitCount: 10, issueCount: 2, login: 'user4', prCount: 1 }
      ]

      const result = await factCollector.calculateDistributionMetrics(contributors)

      expect(result.CONTRIBUTOR_ANALYSIS_STATUS).toBe('COMPLETED')
      expect(result.TOTAL_CONTRIBUTORS).toBe('4')
      expect(result.TOP_CONTRIBUTOR_LOGIN).toBe('user1')
      expect(result.TOP_CONTRIBUTOR_COMMIT_COUNT).toBe('100')

      // Verify mathematical calculations
      expect(result).toHaveProperty('MEAN_COMMITS_PER_CONTRIBUTOR')
      expect(result).toHaveProperty('MEDIAN_COMMITS_PER_CONTRIBUTOR')
      expect(result).toHaveProperty('MEAN_ISSUES_PER_CONTRIBUTOR')
      expect(result).toHaveProperty('MEDIAN_ISSUES_PER_CONTRIBUTOR')
      
      // Verify Gini coefficients for distribution analysis
      expect(result).toHaveProperty('COMMIT_DISTRIBUTION_GINI')
      expect(result).toHaveProperty('ISSUE_DISTRIBUTION_GINI')
      expect(result).toHaveProperty('PR_DISTRIBUTION_GINI')

      // Verify no subjective assessment
      expect(result).not.toHaveProperty('CONTRIBUTOR_DIVERSITY_SCORE')
      expect(result).not.toHaveProperty('TEAM_BALANCE_RATING')
    })

    it('should handle empty contributors list', async () => {
      const result = await factCollector.calculateDistributionMetrics([])

      expect(result.CONTRIBUTOR_ANALYSIS_STATUS).toBe('NO_CONTRIBUTORS')
    })
  })

  describe('calculateGrowthTrends', () => {
    it('should calculate growth trends without interpretation', async () => {
      const currentFacts = {
        PROJECT_TOTAL_COMMITS: '150',
        PROJECT_TOTAL_ISSUES: '50',
        PROJECT_TOTAL_PRS: '30',
        PROJECT_TOTAL_STARS: '200'
      }

      const historicalFacts = {
        PROJECT_TOTAL_COMMITS: '100',
        PROJECT_TOTAL_ISSUES: '40',
        PROJECT_TOTAL_PRS: '25',
        PROJECT_TOTAL_STARS: '150'
      }

      const result = await factCollector.calculateGrowthTrends(currentFacts, historicalFacts)

      expect(result.GROWTH_ANALYSIS_STATUS).toBe('COMPLETED')
      
      // Verify current and historical values are preserved
      expect(result.CURRENT_PERIOD_COMMITS).toBe('150')
      expect(result.HISTORICAL_PERIOD_COMMITS).toBe('100')
      expect(result.CURRENT_PERIOD_ISSUES).toBe('50')
      expect(result.HISTORICAL_PERIOD_ISSUES).toBe('40')

      // Verify mathematical growth rate calculations
      expect(result).toHaveProperty('COMMITS_GROWTH_RATE')
      expect(result).toHaveProperty('ISSUES_GROWTH_RATE')
      expect(result).toHaveProperty('PRS_GROWTH_RATE')
      expect(result).toHaveProperty('STARS_GROWTH_RATE')

      // Verify no trend interpretation
      expect(result).not.toHaveProperty('GROWTH_TREND_ASSESSMENT')
      expect(result).not.toHaveProperty('MOMENTUM_INDICATOR')
    })
  })

  describe('calculateVelocityMetrics', () => {
    it('should calculate velocity metrics without interpretation', async () => {
      const timeSeriesData: TimeSeriesData[] = [
        { commits: 5, date: '2024-01-01', issues: 2, pullRequests: 1 },
        { commits: 8, date: '2024-01-02', issues: 3, pullRequests: 2 },
        { commits: 3, date: '2024-01-03', issues: 1, pullRequests: 0 },
        { commits: 10, date: '2024-01-04', issues: 4, pullRequests: 3 }
      ]

      const result = await factCollector.calculateVelocityMetrics(timeSeriesData)

      expect(result.VELOCITY_ANALYSIS_STATUS).toBe('COMPLETED')
      expect(result.TIME_SERIES_POINTS).toBe('4')
      
      // Verify mathematical velocity calculations
      expect(result).toHaveProperty('MEAN_COMMIT_VELOCITY')
      expect(result).toHaveProperty('MEDIAN_COMMIT_VELOCITY')
      expect(result).toHaveProperty('COMMIT_VELOCITY_VARIANCE')
      expect(result).toHaveProperty('MEAN_ISSUE_VELOCITY')
      expect(result).toHaveProperty('MEDIAN_ISSUE_VELOCITY')
      expect(result).toHaveProperty('MEAN_PR_VELOCITY')
      expect(result).toHaveProperty('MEDIAN_PR_VELOCITY')
      expect(result).toHaveProperty('COMMIT_VELOCITY_TREND')

      // Verify no velocity interpretation
      expect(result).not.toHaveProperty('VELOCITY_ASSESSMENT')
      expect(result).not.toHaveProperty('TEAM_PRODUCTIVITY_LEVEL')
    })

    it('should handle empty time series data', async () => {
      const result = await factCollector.calculateVelocityMetrics([])

      expect(result.VELOCITY_ANALYSIS_STATUS).toBe('NO_TIME_SERIES_DATA')
    })
  })

  describe('fact validation rules', () => {
    it('should return only string values', async () => {
      const repoFacts = [{
        COMMITS_TOTAL: '10',
        ISSUES_TOTAL: '5'
      }]

      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      // All values must be strings for LLMInfo compatibility
      for (const value of Object.values(result)) {
        expect(typeof value).toBe('string')
      }
    })

    it('should use consistent key naming convention', async () => {
      const repoFacts = [{ COMMITS_TOTAL: '10' }]
      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      // All keys should be UPPER_SNAKE_CASE and start with PROJECT_
      for (const key of Object.keys(result)) {
        expect(key).toMatch(/^PROJECT_[A-Z_]+$/)
      }
    })

    it('should handle numeric calculations correctly', async () => {
      const contributors: ContributorData[] = [
        { commitCount: 100, issueCount: 20, login: 'user1', prCount: 15 },
        { commitCount: 50, issueCount: 10, login: 'user2', prCount: 8 }
      ]

      const result = await factCollector.calculateDistributionMetrics(contributors)

      // Verify mathematical precision
      const topContribPercentage = Number.parseFloat(result.TOP_CONTRIBUTOR_COMMIT_PERCENTAGE)
      expect(topContribPercentage).toBeCloseTo(66.67, 2) // 100/150 = 66.67%

      const totalContribs = Number.parseInt(result.TOTAL_CONTRIBUTORS, 10)
      expect(totalContribs).toBe(2)
    })

    it('should not contain any subjective language in keys or values', async () => {
      const repoFacts = [{ COMMITS_TOTAL: '10', REPO_STARS_COUNT: '100' }]
      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      const subjectiveTerms = ['good', 'bad', 'excellent', 'poor', 'high', 'low', 'active', 'inactive', 'healthy', 'quality']
      const allKeysAndValues = [...Object.keys(result), ...Object.values(result)].join(' ').toLowerCase()

      for (const term of subjectiveTerms) {
        expect(allKeysAndValues).not.toContain(term)
      }
    })

    it('should handle edge cases with zero values', async () => {
      const repoFacts = [{
        COMMITS_TOTAL: '0',
        ISSUES_TOTAL: '0',
        REPO_STARS_COUNT: '0'
      }]

      const result = await factCollector.aggregateRepositoryFacts(repoFacts)

      // Should handle division by zero gracefully
      expect(result.PROJECT_COMMITS_TO_ISSUES_RATIO).toBe('0')
      expect(result.PROJECT_TOTAL_COMMITS).toBe('0')
    })
  })
})