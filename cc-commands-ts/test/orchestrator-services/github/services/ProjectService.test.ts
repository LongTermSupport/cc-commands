/**
 * @file ProjectService Tests
 * 
 * Tests for GitHub project operations service.
 */

import { SimpleGit } from 'simple-git'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError'
import { ProjectV2DTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2DTO'
import { ProjectV2ItemDTO } from '../../../../src/orchestrator-services/github/dto/ProjectV2ItemDTO'
import { GitHubGraphQLService } from '../../../../src/orchestrator-services/github/services/GitHubGraphQLService'
import { ProjectService } from '../../../../src/orchestrator-services/github/services/ProjectService'

// Mock dependencies
const mockGraphQLService = {
  findProjectsByOwner: vi.fn(),
  getProject: vi.fn(),
  getProjectItems: vi.fn()
} as unknown as vi.Mocked<GitHubGraphQLService>

const mockGitService = {
  cwd: vi.fn(),
  getRemotes: vi.fn()
} as unknown as vi.Mocked<SimpleGit>

describe('ProjectService', () => {
  let service: ProjectService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ProjectService(mockGraphQLService, mockGitService)
  })

  describe('detectProjectFromGitRemote', () => {
    const mockRemotes = [
      {
        name: 'origin',
        refs: {
          fetch: 'https://github.com/testowner/testrepo.git',
          push: 'https://github.com/testowner/testrepo.git'
        }
      }
    ]

    const mockProject = new ProjectV2DTO(
      'PVT_test123',
      'Test Project',
      'https://github.com/users/testowner/projects/1',
      'Test description',
      'testowner',
      'USER',
      'PUBLIC',
      'OPEN',
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-24T12:00:00Z'),
      0
    )

    it('should detect project from HTTPS git remote', async () => {
      mockGitService.getRemotes.mockResolvedValue(mockRemotes)
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue([mockProject])

      const result = await service.detectProjectFromGitRemote()

      expect(result).toEqual(mockProject)
      expect(mockGitService.getRemotes).toHaveBeenCalledWith(true)
      expect(mockGraphQLService.findProjectsByOwner).toHaveBeenCalledWith('testowner')
    })

    it('should detect project from SSH git remote', async () => {
      const sshRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'git@github.com:testowner/testrepo.git',
            push: 'git@github.com:testowner/testrepo.git'
          }
        }
      ]
      
      mockGitService.getRemotes.mockResolvedValue(sshRemotes)
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue([mockProject])

      const result = await service.detectProjectFromGitRemote()

      expect(result).toEqual(mockProject)
      expect(mockGraphQLService.findProjectsByOwner).toHaveBeenCalledWith('testowner')
    })

    it('should use custom remote path when provided', async () => {
      const mockCwdGit = { getRemotes: vi.fn().mockResolvedValue(mockRemotes) }
      mockGitService.cwd.mockReturnValue(mockCwdGit as SimpleGit)
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue([mockProject])

      const result = await service.detectProjectFromGitRemote('/custom/path')

      expect(result).toEqual(mockProject)
      expect(mockGitService.cwd).toHaveBeenCalledWith('/custom/path')
      expect(mockCwdGit.getRemotes).toHaveBeenCalledWith(true)
    })

    it('should return null when no origin remote found', async () => {
      const noOriginRemotes = [
        {
          name: 'upstream',
          refs: {
            fetch: 'https://github.com/testowner/testrepo.git',
            push: 'https://github.com/testowner/testrepo.git'
          }
        }
      ]
      
      mockGitService.getRemotes.mockResolvedValue(noOriginRemotes)

      const result = await service.detectProjectFromGitRemote()

      expect(result).toBeNull()
      expect(mockGraphQLService.findProjectsByOwner).not.toHaveBeenCalled()
    })

    it('should return null when origin has no fetch URL', async () => {
      const noFetchRemotes = [
        {
          name: 'origin',
          refs: {}
        }
      ]
      
      mockGitService.getRemotes.mockResolvedValue(noFetchRemotes)

      const result = await service.detectProjectFromGitRemote()

      expect(result).toBeNull()
    })

    it('should return null when not a GitHub repository', async () => {
      const nonGitHubRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://gitlab.com/testowner/testrepo.git',
            push: 'https://gitlab.com/testowner/testrepo.git'
          }
        }
      ]
      
      mockGitService.getRemotes.mockResolvedValue(nonGitHubRemotes)

      const result = await service.detectProjectFromGitRemote()

      expect(result).toBeNull()
    })

    it('should return null when owner has no projects', async () => {
      mockGitService.getRemotes.mockResolvedValue(mockRemotes)
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue([])

      const result = await service.detectProjectFromGitRemote()

      expect(result).toBeNull()
    })

    it('should throw OrchestratorError when git operations fail', async () => {
      mockGitService.getRemotes.mockRejectedValue(new Error('Not a git repository'))

      await expect(service.detectProjectFromGitRemote())
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })
  })

  describe('findRecentProjects', () => {
    const mockProjects = [
      new ProjectV2DTO(
        'PVT_old123',
        'Old Project',
        'https://github.com/users/testowner/projects/1',
        'Old description',
        'testowner',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-20T12:00:00Z'), // Older update
        0
      ),
      new ProjectV2DTO(
        'PVT_new123',
        'New Project',
        'https://github.com/users/testowner/projects/2',
        'New description',
        'testowner',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-10T00:00:00Z'),
        new Date('2025-01-24T12:00:00Z'), // Newer update
        0
      )
    ]

    it('should return projects sorted by updated date (newest first)', async () => {
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue(mockProjects)

      const result = await service.findRecentProjects('testowner')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('PVT_new123') // Newer project first
      expect(result[1].id).toBe('PVT_old123') // Older project second
    })

    it('should handle empty projects list', async () => {
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockResolvedValue([])

      const result = await service.findRecentProjects('testowner')

      expect(result).toEqual([])
    })

    it('should pass through OrchestratorError from GraphQL service', async () => {
      const originalError = new OrchestratorError(
        new Error('GraphQL error'),
        ['Check token permissions']
      )
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockRejectedValue(originalError)

      await expect(service.findRecentProjects('testowner'))
        .rejects
        .toBe(originalError)
    })

    it('should wrap other errors in OrchestratorError', async () => {
      vi.mocked(mockGraphQLService.findProjectsByOwner).mockRejectedValue(new Error('Network error'))

      await expect(service.findRecentProjects('testowner'))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })
  })

  describe('getProjectWithItems', () => {
    const mockProject = new ProjectV2DTO(
      'PVT_test123',
      'Test Project',
      'https://github.com/users/testowner/projects/1',
      'Test description',
      'testowner',
      'USER',
      'PUBLIC',
      'OPEN',
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-24T12:00:00Z'),
      0
    )

    it('should return project from GraphQL service', async () => {
      vi.mocked(mockGraphQLService.getProject).mockResolvedValue(mockProject)

      const result = await service.getProjectWithItems('PVT_test123')

      expect(result).toEqual(mockProject)
      expect(mockGraphQLService.getProject).toHaveBeenCalledWith('PVT_test123')
    })

    it('should pass through OrchestratorError from GraphQL service', async () => {
      const originalError = new OrchestratorError(
        new Error('Project not found'),
        ['Check project ID']
      )
      vi.mocked(mockGraphQLService.getProject).mockRejectedValue(originalError)

      await expect(service.getProjectWithItems('PVT_test123'))
        .rejects
        .toBe(originalError)
    })

    it('should wrap other errors in OrchestratorError', async () => {
      vi.mocked(mockGraphQLService.getProject).mockRejectedValue(new Error('Network error'))

      await expect(service.getProjectWithItems('PVT_test123'))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })
  })

  describe('getRepositoriesFromProject', () => {
    const mockItems = [
      new ProjectV2ItemDTO(
        'PVTI_item1',
        'ISSUE',
        'Test Issue 1',
        'https://github.com/owner/repo1/issues/1',
        'owner/repo1',
        {}
      ),
      new ProjectV2ItemDTO(
        'PVTI_item2',
        'PULL_REQUEST',
        'Test PR 1',
        'https://github.com/owner/repo2/pull/1',
        'owner/repo2',
        {}
      ),
      new ProjectV2ItemDTO(
        'PVTI_item3',
        'ISSUE',
        'Test Issue 2',
        'https://github.com/owner/repo1/issues/2',
        'owner/repo1', // Duplicate repository
        {}
      )
    ]

    it('should return unique repository names sorted', async () => {
      vi.mocked(mockGraphQLService.getProjectItems).mockResolvedValue(mockItems)

      const result = await service.getRepositoriesFromProject('PVT_test123')

      expect(result).toEqual(['owner/repo1', 'owner/repo2'])
      expect(mockGraphQLService.getProjectItems).toHaveBeenCalledWith('PVT_test123')
    })

    it('should handle items without repository names', async () => {
      const itemsWithoutRepo = [
        new ProjectV2ItemDTO(
          'PVTI_item1',
          'ISSUE',
          'Test Issue 1',
          'https://github.com/owner/repo1/issues/1',
          'owner/repo1',
          {}
        ),
        new ProjectV2ItemDTO(
          'PVTI_item2',
          'ISSUE',
          'Test Issue without repo',
          null,
          null, // No repository
          {}
        )
      ]
      
      vi.mocked(mockGraphQLService.getProjectItems).mockResolvedValue(itemsWithoutRepo)

      const result = await service.getRepositoriesFromProject('PVT_test123')

      expect(result).toEqual(['owner/repo1'])
    })

    it('should handle empty items list', async () => {
      vi.mocked(mockGraphQLService.getProjectItems).mockResolvedValue([])

      const result = await service.getRepositoriesFromProject('PVT_test123')

      expect(result).toEqual([])
    })

    it('should pass through OrchestratorError from GraphQL service', async () => {
      const originalError = new OrchestratorError(
        new Error('Project not found'),
        ['Check project ID']
      )
      vi.mocked(mockGraphQLService.getProjectItems).mockRejectedValue(originalError)

      await expect(service.getRepositoriesFromProject('PVT_test123'))
        .rejects
        .toBe(originalError)
    })

    it('should wrap other errors in OrchestratorError', async () => {
      vi.mocked(mockGraphQLService.getProjectItems).mockRejectedValue(new Error('Network error'))

      await expect(service.getRepositoriesFromProject('PVT_test123'))
        .rejects
        .toBeInstanceOf(OrchestratorError)
    })
  })
})