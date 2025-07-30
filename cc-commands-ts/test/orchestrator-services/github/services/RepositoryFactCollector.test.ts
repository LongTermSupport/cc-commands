/**
 * @file RepositoryFactCollector Tests
 * 
 * Comprehensive test suite validating pure fact collection from GitHub repositories.
 * Tests ensure no analysis or interpretation is performed - only mathematical
 * calculations and raw data extraction.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommitDataDTO } from '../../../../src/orchestrator-services/github/dto/CommitDataDTO.js'
import { IssueDataDTO } from '../../../../src/orchestrator-services/github/dto/IssueDataDTO.js'
import { PullRequestDataDTO } from '../../../../src/orchestrator-services/github/dto/PullRequestDataDTO.js'
import { RepositoryDataDTO } from '../../../../src/orchestrator-services/github/dto/RepositoryDataDTO.js'
import { IGitHubRestApiService } from '../../../../src/orchestrator-services/github/interfaces/IGitHubRestApiService.js'
import { RepositoryFactCollector } from '../../../../src/orchestrator-services/github/services/RepositoryFactCollector.js'

// Mock dependencies
const mockGitHubApi: vi.Mocked<IGitHubRestApiService> = {
  checkRepositoryAccess: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  getRepository: vi.fn(),
  searchCommits: vi.fn(),
  searchIssues: vi.fn(),
  searchPullRequests: vi.fn()
}

describe('RepositoryFactCollector', () => {
  let factCollector: RepositoryFactCollector
  const sinceDate = new Date('2024-01-01T00:00:00Z')

  beforeEach(() => {
    vi.clearAllMocks()
    factCollector = new RepositoryFactCollector(mockGitHubApi)
  })

  describe('collectActivityFacts', () => {
    it('should collect basic activity facts without analysis', async () => {
      // Mock API responses with actual DTOs
      const mockCommits = [
        { sha: 'abc123' },
        { sha: 'def456' }
      ] as CommitDataDTO[]
      
      const mockIssues = [
        { id: 1, state: 'open' },
        { id: 2, state: 'closed' }
      ] as IssueDataDTO[]

      const mockPullRequests = [
        { id: 1, state: 'open' },
        { id: 2, state: 'merged' }
      ] as PullRequestDataDTO[]

      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue(mockCommits)
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue(mockIssues)
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue(mockPullRequests)

      const result = await factCollector.collectActivityFacts('owner', 'repo', sinceDate)

      // Verify pure mathematical facts are returned (using actual implementation keys)
      expect(result).toHaveProperty('COMMITS_TOTAL', '2')
      expect(result).toHaveProperty('ISSUES_TOTAL', '2')
      expect(result).toHaveProperty('PRS_TOTAL', '2')
      expect(result).toHaveProperty('TOTAL_ACTIVITY', '6') // 2+2+2
      expect(result).toHaveProperty('ACTIVITY_DENSITY')
      expect(result).toHaveProperty('COMMITS_PER_DAY')
      expect(result).toHaveProperty('ISSUES_PER_DAY')
      expect(result).toHaveProperty('PRS_PER_DAY')
      expect(result).toHaveProperty('ANALYSIS_PERIOD_DAYS')
      expect(result).toHaveProperty('ANALYSIS_BUSINESS_DAYS')

      // Verify no analysis/interpretation keys exist
      expect(result).not.toHaveProperty('REPO_HEALTH_SCORE')
      expect(result).not.toHaveProperty('REPO_ACTIVITY_LEVEL')
      expect(result).not.toHaveProperty('REPO_QUALITY_ASSESSMENT')
      expect(result).not.toHaveProperty('REPO_MAINTENANCE_STATUS')
    })

    it('should handle zero activity correctly', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', sinceDate)

      expect(result.COMMITS_TOTAL).toBe('0')
      expect(result.ISSUES_TOTAL).toBe('0')
      expect(result.PRS_TOTAL).toBe('0')
      expect(result.TOTAL_ACTIVITY).toBe('0')
      expect(result.ACTIVITY_DENSITY).toBe('0')
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockRejectedValue(new Error('API Error'))

      await expect(factCollector.collectActivityFacts('owner', 'repo', sinceDate))
        .rejects.toThrow('API Error')
    })
  })

  describe('collectBasicFacts', () => {
    it('should collect repository metadata facts', async () => {
      const mockRepo = {
        createdAt: new Date('2023-01-01T00:00:00Z'),
        defaultBranch: 'main',
        description: 'Test repository',
        forksCount: 12,
        fullName: 'owner/test-repo',
        getAgeInDays: vi.fn().mockReturnValue(365),
        getDaysSinceLastPush: vi.fn().mockReturnValue(3),
        getDaysSinceUpdate: vi.fn().mockReturnValue(7),
        isArchived: false,
        isFork: false,
        isPrivate: false,
        language: 'TypeScript',
        name: 'test-repo',
        openIssuesCount: 5,
        owner: 'owner',
        pushedAt: new Date('2024-01-05T00:00:00Z'),
        size: 1024,
        stargazersCount: 42,
        updatedAt: new Date('2024-01-30T15:30:00Z'),
        watchersCount: 25
      } as RepositoryDataDTO

      vi.mocked(mockGitHubApi.getRepository).mockResolvedValue(mockRepo)

      const result = await factCollector.collectBasicFacts('owner', 'repo')

      expect(result.REPO_NAME).toBe('test-repo')
      expect(result.REPO_STARS_COUNT).toBe('42')
      expect(result.REPO_FORKS_COUNT).toBe('12')
      expect(result.REPO_OPEN_ISSUES_COUNT).toBe('5')
      expect(result.REPO_SIZE_KB).toBe('1024')
      expect(result.REPO_LANGUAGE).toBe('TypeScript')
      expect(result.REPO_IS_ARCHIVED).toBe('false')
      expect(result.REPO_IS_PRIVATE).toBe('false')
      
      // Check calculated age and ratios
      expect(result).toHaveProperty('REPO_AGE_DAYS')
      expect(result).toHaveProperty('REPO_DAYS_SINCE_UPDATED')
      expect(result).toHaveProperty('REPO_ENGAGEMENT_RATIO')
      expect(result).toHaveProperty('REPO_FORKS_TO_STARS_RATIO')
      expect(result).toHaveProperty('REPO_WATCHERS_TO_STARS_RATIO')

      // Verify no quality judgments
      expect(result).not.toHaveProperty('REPO_POPULARITY_LEVEL')
      expect(result).not.toHaveProperty('REPO_MAINTENANCE_QUALITY')  
    })

    it('should handle null/undefined metadata gracefully', async () => {
      const mockRepo = {
        createdAt: new Date('2023-01-01T00:00:00Z'),
        defaultBranch: 'main',
        description: null,
        forksCount: 0,
        fullName: 'owner/test-repo',
        getAgeInDays: vi.fn().mockReturnValue(365),
        getDaysSinceLastPush: vi.fn().mockReturnValue(3),
        getDaysSinceUpdate: vi.fn().mockReturnValue(7),
        isArchived: false,
        isFork: false,
        isPrivate: false,
        language: null,
        name: 'test-repo',
        openIssuesCount: 0,
        owner: 'owner',
        pushedAt: new Date('2024-01-05T00:00:00Z'),
        size: 0,
        stargazersCount: 0,
        updatedAt: new Date('2024-01-30T15:30:00Z'),
        watchersCount: 0
      }

      vi.mocked(mockGitHubApi.getRepository).mockResolvedValue(mockRepo)

      const result = await factCollector.collectBasicFacts('owner', 'repo')

      expect(result.REPO_LANGUAGE).toBe('') // null language becomes empty string
      expect(result.REPO_STARS_COUNT).toBe('0')
      expect(result.REPO_FORKS_COUNT).toBe('0')
    })
  })

  describe('fact validation rules', () => {
    it('should return only string values', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', sinceDate)

      // All values must be strings for LLMInfo compatibility
      for (const value of Object.values(result)) {
        expect(typeof value).toBe('string')
      }
    })

    it('should use only mathematical calculations', async () => {
      const mockCommits = [{ sha: 'abc' }]
      const mockIssues = [
        { createdAt: '2024-01-10T09:00:00Z', id: 1, state: 'open' },
        { createdAt: '2024-01-12T14:00:00Z', id: 2, state: 'closed' }
      ]

      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue(mockCommits)
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue(mockIssues)
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', sinceDate)

      // Verify mathematical calculations (using actual implementation keys)
      const commitsPerDay = Number.parseFloat(result.COMMITS_PER_DAY)
      expect(commitsPerDay).toBeGreaterThanOrEqual(0) // Should be a valid ratio

      const activityDensity = Number.parseFloat(result.ACTIVITY_DENSITY)
      expect(activityDensity).toBeGreaterThanOrEqual(0) // Should be a valid density calculation
    })

    it('should not contain subjective language', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', sinceDate)

      // Check that no result contains subjective terms
      const subjectiveTerms = ['good', 'bad', 'excellent', 'poor', 'high', 'low', 'active', 'inactive', 'healthy', 'unhealthy']
      const allValues = Object.values(result).join(' ').toLowerCase()

      for (const term of subjectiveTerms) {
        expect(allValues).not.toContain(term)
      }
    })
  })
})