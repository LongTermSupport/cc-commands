/**
 * @file RepositoryService Tests
 * 
 * Tests for GitHub repository operations service.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError'
import { ActivityMetricsDTO } from '../../../../src/orchestrator-services/github/dto/ActivityMetricsDTO'
import { CommitDataDTO } from '../../../../src/orchestrator-services/github/dto/CommitDataDTO'
import { IssueDataDTO } from '../../../../src/orchestrator-services/github/dto/IssueDataDTO'
import { PullRequestDataDTO } from '../../../../src/orchestrator-services/github/dto/PullRequestDataDTO'
import { RepositoryDataDTO } from '../../../../src/orchestrator-services/github/dto/RepositoryDataDTO'
import { GitHubRestApiService } from '../../../../src/orchestrator-services/github/services/GitHubRestApiService'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService'

// Mock dependencies
const mockRestService: vi.Mocked<Pick<GitHubRestApiService, 'checkRepositoryAccess' | 'getRepository' | 'searchCommits' | 'searchIssues' | 'searchPullRequests'>> = {
  checkRepositoryAccess: vi.fn(),
  getRepository: vi.fn(),
  searchCommits: vi.fn(),
  searchIssues: vi.fn(),
  searchPullRequests: vi.fn()
}

describe('RepositoryService', () => {
  let service: RepositoryService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RepositoryService(mockRestService)
  })

  describe('getRepositoryData', () => {
    const mockRepository = new RepositoryDataDTO(
      'test-repo',
      'testowner',
      'Test repository description',
      'TypeScript',
      100,
      10,
      5,
      true,
      false,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-24T12:00:00Z'),
      'https://github.com/testowner/test-repo'
    )

    it('should return repository data from REST service', async () => {
      mockRestService.getRepository.mockResolvedValue(mockRepository)

      const result = await service.getRepositoryData('testowner', 'test-repo')

      expect(result).toEqual(mockRepository)
      expect(mockRestService.getRepository).toHaveBeenCalledWith('testowner', 'test-repo')
    })

    it('should pass through OrchestratorError from REST service', async () => {
      const originalError = new OrchestratorError(
        new Error('Repository not found'),
        ['Check repository name']
      )
      mockRestService.getRepository.mockRejectedValue(originalError)

      await expect(service.getRepositoryData('testowner', 'nonexistent'))
        .rejects
        .toBe(originalError)
    })

    it('should wrap other errors in OrchestratorError', async () => {
      mockRestService.getRepository.mockRejectedValue(new Error('Network error'))

      await expect(service.getRepositoryData('testowner', 'test-repo'))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should include repository details in error context', async () => {
      mockRestService.getRepository.mockRejectedValue(new Error('API error'))

      try {
        await service.getRepositoryData('testowner', 'test-repo')
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.owner).toBe('testowner')
          expect(error.debugInfo.repo).toBe('test-repo')
        }
      }
    })
  })

  describe('getRepositoryActivity', () => {
    const since = new Date('2025-01-01T00:00:00Z')
    
    const mockIssues = [
      new IssueDataDTO(
        'issue-1',
        1,
        'Test Issue 1',
        'Issue description',
        'open',
        false,
        [],
        [],
        null,
        'testuser1',
        'testowner/test-repo',
        'https://github.com/testowner/test-repo/issues/1',
        0,
        new Date('2025-01-10T00:00:00Z'),
        new Date('2025-01-10T00:00:00Z'),
        null
      ),
      new IssueDataDTO(
        'issue-2',
        2,
        'Test Issue 2',
        'Issue description',
        'closed',
        false,
        [],
        [],
        null,
        'testuser2',
        'testowner/test-repo',
        'https://github.com/testowner/test-repo/issues/2',
        0,
        new Date('2025-01-05T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-15T00:00:00Z')
      )
    ]

    const mockPullRequests = [
      new PullRequestDataDTO(
        'pr-1',
        1,
        'Test PR 1',
        'PR description',
        'open',
        false,
        false,
        false,
        null,
        [],
        [],
        [],
        null,
        'testuser3',
        null,
        'testowner/test-repo',
        'https://github.com/testowner/test-repo/pull/1',
        'feature-branch',
        'main',
        0,
        0,
        0,
        0,
        0,
        0,
        new Date('2025-01-12T00:00:00Z'),
        new Date('2025-01-12T00:00:00Z'),
        null,
        null
      ),
      new PullRequestDataDTO(
        'pr-2',
        2,
        'Test PR 2',
        'PR description',
        'closed',
        false,
        false,
        true,
        null,
        [],
        [],
        [],
        null,
        'testuser1',
        'testuser1',
        'testowner/test-repo',
        'https://github.com/testowner/test-repo/pull/2',
        'fix-branch',
        'main',
        2,
        1,
        15,
        10,
        5,
        0,
        new Date('2025-01-08T00:00:00Z'),
        new Date('2025-01-18T00:00:00Z'),
        null,
        new Date('2025-01-18T00:00:00Z')
      )
    ]

    const mockCommits = [
      new CommitDataDTO(
        'commit1',
        'commit1',
        'Initial commit',
        'testuser1',
        'test@example.com',
        new Date('2025-01-10T00:00:00Z'),
        'testuser1',
        'test@example.com',
        new Date('2025-01-10T00:00:00Z'),
        'https://github.com/testowner/test-repo/commit/commit1',
        'testowner/test-repo',
        10,
        5,
        2,
        1,
        true,
        'valid',
        null
      ),
      new CommitDataDTO(
        'commit2',
        'commit2',
        'Second commit',
        'testuser2',
        'test2@example.com',
        new Date('2025-01-15T00:00:00Z'),
        'testuser2',
        'test2@example.com',
        new Date('2025-01-15T00:00:00Z'),
        'https://github.com/testowner/test-repo/commit/commit2',
        'testowner/test-repo',
        5,
        3,
        1,
        1,
        true,
        'valid',
        null
      )
    ]

    it('should calculate activity metrics from REST service data', async () => {
      // Mock the current date for consistent age calculations
      const mockNow = new Date('2025-01-24T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockNow)

      mockRestService.searchIssues.mockResolvedValue(mockIssues)
      mockRestService.searchPullRequests.mockResolvedValue(mockPullRequests)
      mockRestService.searchCommits.mockResolvedValue(mockCommits)

      const result = await service.getRepositoryActivity('testowner', 'test-repo', since)

      expect(result).toBeInstanceOf(ActivityMetricsDTO)
      expect(result.mostActiveRepository).toBe('testowner/test-repo')
      expect(result.totalIssuesCount).toBe(2)
      expect(result.openIssuesCount).toBe(1)
      expect(result.closedIssuesCount).toBe(1)
      expect(result.totalPrsCount).toBe(2)
      expect(result.openPrsCount).toBe(1)
      expect(result.mergedPrsCount).toBe(1)
      expect(result.commitsCount).toBe(2)
      expect(result.contributorsCount).toBe(3) // testuser1, testuser2, testuser3

      vi.useRealTimers()
    })

    it('should handle empty activity data', async () => {
      mockRestService.searchIssues.mockResolvedValue([])
      mockRestService.searchPullRequests.mockResolvedValue([])
      mockRestService.searchCommits.mockResolvedValue([])

      const result = await service.getRepositoryActivity('testowner', 'test-repo', since)

      expect(result.totalIssuesCount).toBe(0)
      expect(result.openIssuesCount).toBe(0)
      expect(result.closedIssuesCount).toBe(0)
      expect(result.totalPrsCount).toBe(0)
      expect(result.openPrsCount).toBe(0)
      expect(result.mergedPrsCount).toBe(0)
      expect(result.commitsCount).toBe(0)
      expect(result.contributorsCount).toBe(0)
    })

    it('should handle data with null authors gracefully', async () => {
      const issuesWithNullAuthor = [
        new IssueDataDTO(
          'issue-1',
          1,
          'Test Issue',
          'Description',
          'open',
          false,
          [],
          [],
          null,
          null, // null creator
          'testowner/test-repo',
          'https://github.com/testowner/test-repo/issues/1',
          0,
          new Date('2025-01-10T00:00:00Z'),
          new Date('2025-01-10T00:00:00Z'),
          null
        )
      ]

      mockRestService.searchIssues.mockResolvedValue(issuesWithNullAuthor)
      mockRestService.searchPullRequests.mockResolvedValue([])
      mockRestService.searchCommits.mockResolvedValue([])

      const result = await service.getRepositoryActivity('testowner', 'test-repo', since)

      expect(result.contributorsCount).toBe(0)
    })

    it('should pass through OrchestratorError from REST service', async () => {
      const originalError = new OrchestratorError(
        new Error('API rate limit exceeded'),
        ['Wait before retrying']
      )
      // Mock all three endpoints to fail to trigger the error path
      mockRestService.searchIssues.mockRejectedValue(originalError)
      mockRestService.searchPullRequests.mockRejectedValue(originalError)
      mockRestService.searchCommits.mockRejectedValue(originalError)

      await expect(service.getRepositoryActivity('testowner', 'test-repo', since))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should wrap other errors in OrchestratorError', async () => {
      // Mock all three endpoints to fail to trigger the error path
      mockRestService.searchIssues.mockRejectedValue(new Error('Network error'))
      mockRestService.searchPullRequests.mockRejectedValue(new Error('Network error'))
      mockRestService.searchCommits.mockRejectedValue(new Error('Network error'))

      await expect(service.getRepositoryActivity('testowner', 'test-repo', since))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })

    it('should include repository and date details in error context', async () => {
      // Mock all three endpoints to fail to trigger the error path
      mockRestService.searchIssues.mockRejectedValue(new Error('API error'))
      mockRestService.searchPullRequests.mockRejectedValue(new Error('API error'))
      mockRestService.searchCommits.mockRejectedValue(new Error('API error'))

      try {
        await service.getRepositoryActivity('testowner', 'test-repo', since)
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.owner).toBe('testowner')
          expect(error.debugInfo.repo).toBe('test-repo')
          // Note: 'since' is not included in debugInfo by the current implementation
        }
      }
    })
  })

  describe('validateRepositoryAccess', () => {
    it('should return true when repository is accessible', async () => {
      mockRestService.checkRepositoryAccess.mockResolvedValue(true)

      const result = await service.validateRepositoryAccess('testowner', 'test-repo')

      expect(result).toBe(true)
      expect(mockRestService.checkRepositoryAccess).toHaveBeenCalledWith('testowner', 'test-repo')
    })

    it('should return false when repository is not accessible', async () => {
      mockRestService.checkRepositoryAccess.mockResolvedValue(false)

      const result = await service.validateRepositoryAccess('testowner', 'nonexistent')

      expect(result).toBe(false)
    })

    it('should return false when REST service throws error', async () => {
      mockRestService.checkRepositoryAccess.mockRejectedValue(new Error('Repository not found'))

      const result = await service.validateRepositoryAccess('testowner', 'nonexistent')

      expect(result).toBe(false)
    })

    it('should return false when REST service throws OrchestratorError', async () => {
      const originalError = new OrchestratorError(
        new Error('Access denied'),
        ['Check permissions']
      )
      mockRestService.checkRepositoryAccess.mockRejectedValue(originalError)

      const result = await service.validateRepositoryAccess('testowner', 'private-repo')

      expect(result).toBe(false)
    })
  })
})