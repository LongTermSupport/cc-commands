/**
 * @file RepositoryFactCollector Integration Tests
 * 
 * Integration tests focusing on the architecture principle that fact collectors
 * return pure mathematical facts without analysis or interpretation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommitDataDTO } from '../../../../src/orchestrator-services/github/dto/CommitDataDTO.js'
import { IssueDataDTO } from '../../../../src/orchestrator-services/github/dto/IssueDataDTO.js'
import { PullRequestDataDTO } from '../../../../src/orchestrator-services/github/dto/PullRequestDataDTO.js'
import { RepositoryDataDTO } from '../../../../src/orchestrator-services/github/dto/RepositoryDataDTO.js'
import { IGitHubRestApiService } from '../../../../src/orchestrator-services/github/interfaces/IGitHubRestApiService.js'
import { RepositoryFactCollector } from '../../../../src/orchestrator-services/github/services/RepositoryFactCollector.js'

// Mock the GitHub API service completely
const mockGitHubApi: vi.Mocked<IGitHubRestApiService> = {
  checkRepositoryAccess: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  getRepository: vi.fn(),
  searchCommits: vi.fn(),
  searchIssues: vi.fn(),
  searchPullRequests: vi.fn()
}  

describe('RepositoryFactCollector - Architecture Validation', () => {
  let factCollector: RepositoryFactCollector

  beforeEach(() => {
    vi.clearAllMocks()
    factCollector = new RepositoryFactCollector(mockGitHubApi)
  })

  describe('fact collection principles', () => {
    it('should implement the IRepositoryFactCollector interface', () => {
      // Verify the class implements all required methods
      expect(typeof factCollector.collectActivityFacts).toBe('function')
      expect(typeof factCollector.collectBasicFacts).toBe('function')
      expect(typeof factCollector.collectContributorFacts).toBe('function')
      expect(typeof factCollector.collectIssueAnalysisFacts).toBe('function')
      expect(typeof factCollector.collectPullRequestFacts).toBe('function')
      expect(typeof factCollector.collectTimingPatternFacts).toBe('function')
    })

    it('should return string key-value pairs suitable for LLMInfo', async () => {
      // Mock basic API responses with actual DTOs
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([] as CommitDataDTO[])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([] as IssueDataDTO[])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([] as PullRequestDataDTO[])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // All return values must be Record<string, string>
      expect(typeof result).toBe('object')
      for (const [key, value] of Object.entries(result)) {
        expect(typeof key).toBe('string')
        expect(typeof value).toBe('string')
      }
    })

    it('should use UPPER_SNAKE_CASE naming convention for keys', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // All keys should be UPPER_SNAKE_CASE
      for (const key of Object.keys(result)) {
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/)
      }
    })

    it('should not contain any subjective language in keys or values', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      const subjectiveTerms = ['good', 'bad', 'excellent', 'poor', 'high', 'low', 
                              'active', 'inactive', 'healthy', 'unhealthy', 'quality']
      const allContent = [...Object.keys(result), ...Object.values(result)].join(' ').toLowerCase()

      for (const term of subjectiveTerms) {
        expect(allContent).not.toContain(term)
      }
    })

    it('should handle basic facts collection without analysis', async () => {
      // Mock repository DTO with required methods and properties
      const mockRepoDTO = {
        createdAt: new Date('2023-01-01T00:00:00Z'),
        forksCount: 12,
        fullName: 'owner/test-repo',
        getAgeInDays: vi.fn().mockReturnValue(365),
        getDaysSinceLastPush: vi.fn().mockReturnValue(3),
        getDaysSinceUpdate: vi.fn().mockReturnValue(7),
        name: 'test-repo',
        openIssuesCount: 5,
        pushedAt: new Date('2024-01-05T00:00:00Z'),
        stargazersCount: 42,
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }

      vi.mocked(mockGitHubApi.getRepository).mockResolvedValue(mockRepoDTO)

      const result = await factCollector.collectBasicFacts('owner', 'repo')

      // Should contain basic facts without interpretation
      expect(result).toHaveProperty('REPO_NAME')
      expect(result).toHaveProperty('REPO_STARS_COUNT')
      expect(result).toHaveProperty('REPO_FORKS_COUNT')
      
      // Values should be string representations of numbers/facts
      expect(result.REPO_NAME).toBe('test-repo')
      expect(result.REPO_STARS_COUNT).toBe('42')
      expect(result.REPO_FORKS_COUNT).toBe('12')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockRejectedValue(new Error('API Error'))

      await expect(factCollector.collectActivityFacts('owner', 'repo', new Date()))
        .rejects.toThrow('API Error')
    })
  })

  describe('no analysis violation checks', () => {
    it('should not calculate health scores', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // Should never contain analysis-related keys
      expect(result).not.toHaveProperty('REPO_HEALTH_SCORE')
      expect(result).not.toHaveProperty('REPO_ACTIVITY_LEVEL')
      expect(result).not.toHaveProperty('REPO_QUALITY_RATING')
      expect(result).not.toHaveProperty('REPO_MAINTENANCE_STATUS')
    })

    it('should only return mathematical calculations and counts', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([{} as CommitDataDTO])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([{}, {}] as IssueDataDTO[])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([{} as PullRequestDataDTO])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // Should contain mathematical facts only
      for (const [, value] of Object.entries(result)) {  
        // Values should be either:
        // 1. Numbers as strings
        // 2. ISO dates
        // 3. Simple text identifiers (no subjective descriptions)
        expect(value).toMatch(/^(\d+|\d+\.\d+|[A-Z_]+|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*|[a-zA-Z0-9._-]+)$/)
      }
    })
  })

  describe('mathematical operations validation', () => {
    it('should handle division by zero gracefully', async () => {
      // Test edge case: no data to calculate ratios
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([])  
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // Any ratio calculations should handle division by zero
      for (const [key, value] of Object.entries(result)) {
        if (key.includes('RATIO')) {
          expect(value).not.toBe('NaN')
          expect(value).not.toBe('Infinity')
          expect(Number.parseFloat(value)).not.toBeNaN()
        }
      }
    })

    it('should return consistent precision for decimal values', async () => {
      vi.mocked(mockGitHubApi.searchCommits).mockResolvedValue([{} as CommitDataDTO])
      vi.mocked(mockGitHubApi.searchIssues).mockResolvedValue([{}, {}, {}] as IssueDataDTO[])
      vi.mocked(mockGitHubApi.searchPullRequests).mockResolvedValue([])

      const result = await factCollector.collectActivityFacts('owner', 'repo', new Date())

      // Check that decimal values have consistent precision
      for (const [key, value] of Object.entries(result)) {
        if (key.includes('RATIO') && value.includes('.')) {
          const decimalPlaces = value.split('.')[1]?.length ?? 0 // eslint-disable-line cc-commands/require-typed-data-access
          expect(decimalPlaces).toBeLessThanOrEqual(2) // Maximum 2 decimal places
        }
      }
    })
  })
})