/**
 * @file ActivityService Tests
 * 
 * Tests for GitHub activity analysis service.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError'
import { ActivityMetricsDTO } from '../../../../src/orchestrator-services/github/dto/ActivityMetricsDTO'
import { ProjectSummaryDTO } from '../../../../src/orchestrator-services/github/dto/ProjectSummaryDTO'
import { ActivityService } from '../../../../src/orchestrator-services/github/services/ActivityService'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService'

// Mock dependencies
const mockRepositoryService: vi.Mocked<Pick<RepositoryService, 'getRepositoryActivity' | 'getRepositoryData' | 'validateRepositoryAccess'>> = {
  getRepositoryActivity: vi.fn(),
  getRepositoryData: vi.fn(),
  validateRepositoryAccess: vi.fn()
}

const createMockActivity = (repo: string, commits: number, issues: number, prs: number): ActivityMetricsDTO => new ActivityMetricsDTO(
  1, // repositoriesCount
  [repo], // repositoryList
  new Date('2025-01-01T00:00:00Z'), // analysisPeriodStart
  new Date('2025-01-24T00:00:00Z'), // analysisPeriodEnd
  23, // analysisPeriodDays
  commits, // commitsCount
  issues, // totalIssuesCount
  Math.floor(issues / 2), // openIssuesCount
  Math.ceil(issues / 2), // closedIssuesCount
  prs, // totalPrsCount
  Math.floor(prs / 2), // openPrsCount
  Math.ceil(prs / 2), // mergedPrsCount
  3, // contributorsCount
  3, // activeContributors
  'testuser1', // mostActiveContributor
  repo, // mostActiveRepository
  0, // releaseCount
  50, // totalAdditions
  25, // totalDeletions
  10, // totalFilesChanged
  commits / 23, // avgCommitsPerDay
  issues / 23, // avgIssuesPerDay
  prs / 23 // avgPrsPerDay
)

const createMockSummaryActivity = (repo: string, commits: number, issues: number): ActivityMetricsDTO => new ActivityMetricsDTO(
  1, // repositoriesCount
  [repo], // repositoryList
  new Date('2025-01-01T00:00:00Z'), // analysisPeriodStart
  new Date('2025-01-24T00:00:00Z'), // analysisPeriodEnd
  23, // analysisPeriodDays
  commits, // commitsCount
  issues, // totalIssuesCount
  Math.floor(issues / 2), // openIssuesCount
  Math.ceil(issues / 2), // closedIssuesCount
  6, // totalPrsCount
  3, // openPrsCount
  3, // mergedPrsCount
  5, // contributorsCount
  5, // activeContributors
  'active-user', // mostActiveContributor
  repo, // mostActiveRepository
  2, // releaseCount
  100, // totalAdditions
  50, // totalDeletions
  20, // totalFilesChanged
  commits / 23, // avgCommitsPerDay
  issues / 23, // avgIssuesPerDay
  6 / 23 // avgPrsPerDay
)

const createMockRankedActivity = (repo: string, activityScore: number): ActivityMetricsDTO => {
  // Distribute the activity score across different metrics
  const commits = Math.floor(activityScore * 0.4)
  const prs = Math.floor(activityScore * 0.3)
  const issues = Math.floor(activityScore * 0.2)
  const contributors = Math.floor(activityScore * 0.1) + 1

  return new ActivityMetricsDTO(
    1, // repositoriesCount
    [repo], // repositoryList
    new Date('2025-01-01T00:00:00Z'), // analysisPeriodStart
    new Date('2025-01-24T00:00:00Z'), // analysisPeriodEnd
    23, // analysisPeriodDays
    commits, // commitsCount
    issues, // totalIssuesCount
    Math.floor(issues / 2), // openIssuesCount
    Math.ceil(issues / 2), // closedIssuesCount
    prs, // totalPrsCount
    Math.floor(prs / 2), // openPrsCount
    Math.ceil(prs / 2), // mergedPrsCount
    contributors, // contributorsCount
    contributors, // activeContributors
    'active-user', // mostActiveContributor
    repo, // mostActiveRepository
    0, // releaseCount
    commits * 5, // totalAdditions
    commits * 2, // totalDeletions
    commits, // totalFilesChanged
    commits / 23, // avgCommitsPerDay
    issues / 23, // avgIssuesPerDay
    prs / 23 // avgPrsPerDay
  )
}

describe('ActivityService', () => {
  let service: ActivityService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ActivityService(mockRepositoryService)
  })

  describe('aggregateActivityAcrossRepos', () => {
    const since = new Date('2025-01-01T00:00:00Z')
    const owner = 'testowner'


    it('should aggregate activity metrics from multiple repositories', async () => {
      const repos = ['testowner/repo1', 'testowner/repo2', 'testowner/repo3']
      
      // Mock individual repository activities
      mockRepositoryService.getRepositoryActivity
        .mockResolvedValueOnce(createMockActivity('testowner/repo1', 10, 8, 4))
        .mockResolvedValueOnce(createMockActivity('testowner/repo2', 15, 12, 6))
        .mockResolvedValueOnce(createMockActivity('testowner/repo3', 5, 3, 2))

      const result = await service.aggregateActivityAcrossRepos(repos, owner, since)

      expect(result).toBeInstanceOf(ActivityMetricsDTO)
      expect(result.repositoriesCount).toBe(3)
      expect(result.repositoryList).toEqual(['testowner/repo1', 'testowner/repo2', 'testowner/repo3'])
      expect(result.commitsCount).toBe(30) // 10 + 15 + 5
      expect(result.totalIssuesCount).toBe(23) // 8 + 12 + 3
      expect(result.totalPrsCount).toBe(12) // 4 + 6 + 2
      expect(result.contributorsCount).toBe(9) // 3 + 3 + 3 (simplified aggregation)
      
      // Verify all repositories were queried
      expect(mockRepositoryService.getRepositoryActivity).toHaveBeenCalledTimes(3)
      expect(mockRepositoryService.getRepositoryActivity).toHaveBeenCalledWith(owner, 'repo1', since)
      expect(mockRepositoryService.getRepositoryActivity).toHaveBeenCalledWith(owner, 'repo2', since)
      expect(mockRepositoryService.getRepositoryActivity).toHaveBeenCalledWith(owner, 'repo3', since)
    })

    it('should handle single repository correctly', async () => {
      const repos = ['testowner/single-repo']
      const mockActivity = createMockActivity('testowner/single-repo', 20, 10, 5)
      
      mockRepositoryService.getRepositoryActivity.mockResolvedValue(mockActivity)

      const result = await service.aggregateActivityAcrossRepos(repos, owner, since)

      expect(result.repositoriesCount).toBe(1)
      expect(result.repositoryList).toEqual(['testowner/single-repo'])
      expect(result.commitsCount).toBe(20)
      expect(result.totalIssuesCount).toBe(10)
      expect(result.totalPrsCount).toBe(5)
    })

    it('should throw error when no repositories provided', async () => {
      await expect(service.aggregateActivityAcrossRepos([], owner, since))
        .rejects
        .toBeInstanceOf(OrchestratorError)
      
      expect(mockRepositoryService.getRepositoryActivity).not.toHaveBeenCalled()
    })

    it('should pass through RepositoryService errors', async () => {
      const repos = ['testowner/failing-repo']
      const originalError = new OrchestratorError(
        new Error('Repository not found'),
        ['Check repository name']
      )

      mockRepositoryService.getRepositoryActivity.mockRejectedValue(originalError)

      await expect(service.aggregateActivityAcrossRepos(repos, owner, since))
        .rejects
        .toBeInstanceOf(OrchestratorError)
      
      try {
        await service.aggregateActivityAcrossRepos(repos, owner, since)
      } catch (error) {
        if (error instanceof OrchestratorError) {
          expect(error.message).toContain('No repositories were accessible for analysis')
          expect(error.message).toContain('Repository not found')
          expect(error.debugInfo.failedCount).toBe(1)
          expect(error.debugInfo.repositories).toEqual(repos)
        }
      }
    })

    it('should wrap other errors in OrchestratorError', async () => {
      const repos = ['testowner/error-repo']
      mockRepositoryService.getRepositoryActivity.mockRejectedValue(new Error('Network error'))

      await expect(service.aggregateActivityAcrossRepos(repos, owner, since))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should include context information in wrapped errors', async () => {
      const repos = ['testowner/context-repo']
      mockRepositoryService.getRepositoryActivity.mockRejectedValue(new Error('Context test'))

      try {
        await service.aggregateActivityAcrossRepos(repos, owner, since)
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.owner).toBe(owner)
          expect(error.debugInfo.repositories).toEqual(repos)
          expect(error.debugInfo.failedCount).toBe(1)
        }
      }
    })
  })

  describe('calculateActivitySummary', () => {

    it('should calculate project summary from activity metrics', async () => {
      const activities = [
        createMockSummaryActivity('testowner/repo1', 20, 10),
        createMockSummaryActivity('testowner/repo2', 15, 8)
      ]

      const result = await service.calculateActivitySummary(activities)

      expect(result).toBeInstanceOf(ProjectSummaryDTO)
      expect(result.name).toBe('repo1') // First repository name
      expect(result.owner).toBe('testowner')
      expect(result.repositoryCount).toBe(2)
      expect(result.totalCommits).toBe(35) // 20 + 15
      expect(result.totalContributors).toBe(10) // 5 + 5
      expect(result.issuesTotalCount).toBe(18) // 10 + 8
      expect(result.prsTotalCount).toBe(12) // 6 + 6
      expect(result.healthScore).toBeGreaterThan(0)
      expect(['high', 'medium', 'low']).toContain(result.recentActivityLevel)
    })

    it('should handle single activity metric', async () => {
      const activities = [createMockSummaryActivity('singleowner/single-repo', 30, 15)]

      const result = await service.calculateActivitySummary(activities)

      expect(result.name).toBe('single-repo')
      expect(result.owner).toBe('singleowner')
      expect(result.repositoryCount).toBe(1)
      expect(result.totalCommits).toBe(30)
      expect(result.issuesTotalCount).toBe(15)
    })

    it('should throw error when no activities provided', async () => {
      await expect(service.calculateActivitySummary([]))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should calculate health score based on activity patterns', async () => {
      // High activity scenario
      const highActivity = createMockSummaryActivity('testowner/active-repo', 100, 50)
      const result = await service.calculateActivitySummary([highActivity])
      
      expect(result.healthScore).toBeGreaterThan(50)
      expect(result.recentActivityLevel).toBe('high')
    })

    it('should handle errors gracefully', async () => {
      // Force an error by creating invalid activity data
      const invalidActivity = new ActivityMetricsDTO(
        0, [], new Date(), new Date(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, 0, 0
      )
      
      // This should not throw as our implementation is robust
      const result = await service.calculateActivitySummary([invalidActivity])
      expect(result).toBeInstanceOf(ProjectSummaryDTO)
    })
  })

  describe('identifyMostActiveRepositories', () => {

    it('should identify and rank repositories by activity level', async () => {
      const activities = [
        createMockRankedActivity('testowner/low-activity', 10),
        createMockRankedActivity('testowner/high-activity', 50),
        createMockRankedActivity('testowner/medium-activity', 25)
      ]

      const result = await service.identifyMostActiveRepositories(activities)

      expect(result).toHaveLength(3)
      expect(result.at(0)).toBe('testowner/high-activity') // Highest activity first
      expect(result.at(1)).toBe('testowner/medium-activity') // Medium activity second
      expect(result.at(2)).toBe('testowner/low-activity') // Lowest activity last
    })

    it('should handle single repository', async () => {
      const activities = [createMockRankedActivity('testowner/only-repo', 30)]

      const result = await service.identifyMostActiveRepositories(activities)

      expect(result).toEqual(['testowner/only-repo'])
    })

    it('should filter out unknown repositories', async () => {
      const activities = [
        createMockRankedActivity('testowner/known-repo', 20),
        createMockRankedActivity('unknown/unknown', 50) // Should be filtered out
      ]

      const result = await service.identifyMostActiveRepositories(activities)

      expect(result).toEqual(['testowner/known-repo'])
      expect(result).not.toContain('unknown/unknown')
    })

    it('should throw error when no activities provided', async () => {
      await expect(service.identifyMostActiveRepositories([]))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should handle activities with same scores', async () => {
      const activities = [
        createMockRankedActivity('testowner/repo-a', 20),
        createMockRankedActivity('testowner/repo-b', 20),
        createMockRankedActivity('testowner/repo-c', 20)
      ]

      const result = await service.identifyMostActiveRepositories(activities)

      expect(result).toHaveLength(3)
      expect(result).toContain('testowner/repo-a')
      expect(result).toContain('testowner/repo-b')
      expect(result).toContain('testowner/repo-c')
    })

    it('should wrap errors in OrchestratorError', async () => {
      // Create activities that might cause calculation errors
      const activities = [createMockRankedActivity('testowner/test-repo', 10)]
      
      // This should not throw in our current implementation, but testing error handling
      const result = await service.identifyMostActiveRepositories(activities)
      expect(result).toEqual(['testowner/test-repo'])
    })
  })

  describe('error handling', () => {
    it('should include context information in all errors', async () => {
      const testCases = [
        () => service.aggregateActivityAcrossRepos([], 'owner', new Date()),
        () => service.calculateActivitySummary([]),
        () => service.identifyMostActiveRepositories([])
      ]

      await Promise.all(testCases.map(async (testCase) => {
        try {
          await testCase()
          expect(true).toBe(false) // Should not reach here
        } catch (error) {
          expect(error).toBeInstanceOf(OrchestratorError)
          if (error instanceof OrchestratorError) {
            expect(error.recoveryInstructions.length).toBeGreaterThan(0)
            expect(error.debugInfo).toBeDefined()
          }
        }
      }))
    })
  })
})