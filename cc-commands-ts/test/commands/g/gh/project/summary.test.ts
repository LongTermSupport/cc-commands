/**
 * @fileoverview Comprehensive test suite for g:gh:project:summary command
 * 
 * Tests all three input modes, four audience types, error handling,
 * and integration with GitHub services.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runCommand } from '@oclif/test'
import Summary from '../../../../../src/commands/g/gh/project/summary.js'
import { GitHubApiService } from '../../../../../src/services/github/GitHubApiService.js'
import { ProjectDetectionService } from '../../../../../src/services/github/ProjectDetectionService.js'
import { DataCollectionService } from '../../../../../src/services/github/DataCollectionService.js'
import { CommandError } from '../../../../../src/errors/CommandError.js'
import type { IGitHubProject } from '../../../../../src/interfaces/IGitHubProject.js'
import type { IProjectActivity } from '../../../../../src/interfaces/IProjectActivity.js'

// Mock the services
vi.mock('../../../../../src/services/github/GitHubApiService.js')
vi.mock('../../../../../src/services/github/ProjectDetectionService.js')
vi.mock('../../../../../src/services/github/DataCollectionService.js')

describe('g:gh:project:summary', () => {
  // Mock data
  const mockProjectInfo: IGitHubProject = {
    owner: 'testuser',
    name: 'testrepo',
    fullName: 'testuser/testrepo',
    description: 'Test repository',
    type: 'library',
    primaryLanguage: 'TypeScript',
    topics: ['typescript', 'cli'],
    license: 'MIT',
    isFork: false,
    isArchived: false,
    visibility: 'public',
    defaultBranch: 'main',
    createdAt: '2023-01-01',
    updatedAt: '2025-01-01',
  }

  const mockProjectData = {
    activity: {
      stars: 100,
      forks: 20,
      watchers: 50,
      openIssues: 5,
      recentCommits: 15,
      recentIssues: 3,
      recentPullRequests: 2,
      lastCommitDate: '2025-01-20',
      lastReleaseDate: '2025-01-15',
    },
    contributors: [
      { login: 'user1', contributions: 100 },
      { login: 'user2', contributions: 50 },
    ],
    releases: [
      { tagName: 'v1.0.0', name: 'Initial Release', isPrerelease: false },
    ],
    workflows: [
      { name: 'CI', state: 'active' },
      { name: 'Deploy', state: 'active' },
    ],
  }

  beforeEach(() => {
    // Reset environment
    delete process.env.GITHUB_TOKEN
    
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input Modes', () => {
    it('should handle URL mode correctly', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      // Verify output contains expected data
      expect(stdout).toContain('INPUT_MODE=url')
      expect(stdout).toContain('REPOSITORY_OWNER=testuser')
      expect(stdout).toContain('REPOSITORY_NAME=testrepo')
      expect(stdout).toContain('PROJECT_TYPE=library')
    })

    it('should handle manual mode with owner/repo flags', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--owner',
        'testuser',
        '--repo',
        'testrepo',
      ])

      expect(stdout).toContain('INPUT_MODE=manual')
      expect(stdout).toContain('REPOSITORY_OWNER=testuser')
      expect(stdout).toContain('REPOSITORY_NAME=testrepo')
    })

    it('should handle auto mode from current directory', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectFromDirectory.mockResolvedValue({
        owner: 'autouser',
        repo: 'autorepo',
      })
      mockDetectionService.prototype.detectProject.mockResolvedValue({
        ...mockProjectInfo,
        owner: 'autouser',
        name: 'autorepo',
      })
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command without flags
      const { stdout } = await runCommand(['g:gh:project:summary'])

      expect(stdout).toContain('INPUT_MODE=auto')
      expect(stdout).toContain('REPOSITORY_OWNER=autouser')
      expect(stdout).toContain('REPOSITORY_NAME=autorepo')
    })
  })

  describe('Audience Parameter', () => {
    it('should pass through audience as raw data', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command with custom audience
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
        '--audience',
        'technical-lead',
      ])

      // Should just pass through the audience value without interpretation
      expect(stdout).toContain('AUDIENCE=technical-lead')
      
      // Should NOT contain any LLM instructions
      expect(stdout).not.toContain('LLM_REPORT_INSTRUCTIONS')
      expect(stdout).not.toContain('Generate a')
    })

    it('should use default audience if not specified', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command without audience flag
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      // Should use default value
      expect(stdout).toContain('AUDIENCE=dev')
    })
  })

  describe('GitHub Authentication', () => {
    it('should use provided token', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command with token
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
        '--token',
        'ghp_test123',
      ])

      // Verify GitHubApiService was initialized with token
      expect(GitHubApiService).toHaveBeenCalledWith({ auth: 'ghp_test123' })
    })

    it('should use GITHUB_TOKEN environment variable', async () => {
      // Set environment variable
      process.env.GITHUB_TOKEN = 'ghp_env123'

      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command without token flag
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      // Verify GitHubApiService was initialized with env token
      expect(GitHubApiService).toHaveBeenCalledWith({ auth: 'ghp_env123' })
    })

    it('should work without authentication', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command without token
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      // Verify warning about unauthenticated access
      expect(stdout).toContain('No token provided')
      expect(GitHubApiService).toHaveBeenCalledWith({ auth: undefined })
    })
  })

  describe('Data Collection', () => {
    it('should collect and format all project data', async () => {
      // Setup mocks
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      // Run command
      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      // Verify all data points are present
      expect(stdout).toContain('PRIMARY_LANGUAGE=TypeScript')
      expect(stdout).toContain('DESCRIPTION=Test repository')
      expect(stdout).toContain('TOPICS=typescript, cli')
      expect(stdout).toContain('LICENSE=MIT')
      expect(stdout).toContain('IS_FORK=false')
      expect(stdout).toContain('IS_ARCHIVED=false')
      expect(stdout).toContain('VISIBILITY=public')
      
      // Activity metrics
      expect(stdout).toContain('STARS_COUNT=100')
      expect(stdout).toContain('FORKS_COUNT=20')
      expect(stdout).toContain('WATCHERS_COUNT=50')
      expect(stdout).toContain('OPEN_ISSUES_COUNT=5')
      expect(stdout).toContain('RECENT_COMMITS_7D=15')
      
      // Contributors
      expect(stdout).toContain('CONTRIBUTOR_COUNT=2')
      expect(stdout).toContain('TOP_CONTRIBUTORS=user1(100), user2(50)')
      
      // Releases
      expect(stdout).toContain('LATEST_RELEASE_VERSION=v1.0.0')
      expect(stdout).toContain('LATEST_RELEASE_NAME=Initial Release')
      
      // Workflows
      expect(stdout).toContain('CI_WORKFLOWS_COUNT=2')
      expect(stdout).toContain('ACTIVE_WORKFLOWS=CI, Deploy')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid URL format', async () => {
      await expect(runCommand([
        'g:gh:project:summary',
        '--url',
        'not-a-github-url',
      ])).rejects.toThrow('Must be a valid GitHub repository URL')
    })

    it('should handle missing repo flag when owner is provided', async () => {
      await expect(runCommand([
        'g:gh:project:summary',
        '--owner',
        'testuser',
      ])).rejects.toThrow()
    })

    it('should handle auto-detection failure', async () => {
      // Mock auto-detection failure
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectFromDirectory.mockRejectedValue(
        new Error('Not a git repository')
      )

      await expect(runCommand(['g:gh:project:summary'])).rejects.toThrow(
        'Could not auto-detect repository'
      )
    })

    it('should handle GitHub API errors', async () => {
      // Mock API error
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockRejectedValue(
        new Error('Repository not found')
      )

      await expect(runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])).rejects.toThrow(CommandError)
    })

    it('should handle rate limit errors', async () => {
      // Mock rate limit error
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).status = 403
      mockDetectionService.prototype.detectProject.mockRejectedValue(rateLimitError)

      await expect(runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])).rejects.toThrow(CommandError)
    })
  })

  describe('Edge Cases', () => {
    it('should handle repositories with no releases', async () => {
      // Setup mocks with no releases
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue({
        ...mockProjectData,
        releases: [],
      })

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('LAST_RELEASE_DATE=No releases')
      expect(stdout).not.toContain('LATEST_RELEASE_VERSION')
    })

    it('should handle repositories with no workflows', async () => {
      // Setup mocks with no workflows
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue(mockProjectInfo)
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue({
        ...mockProjectData,
        workflows: [],
      })

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).not.toContain('CI_WORKFLOWS_COUNT')
      expect(stdout).not.toContain('ACTIVE_WORKFLOWS')
    })

    it('should handle repositories with no description', async () => {
      // Setup mocks with no description
      const mockDetectionService = vi.mocked(ProjectDetectionService)
      mockDetectionService.prototype.detectProject.mockResolvedValue({
        ...mockProjectInfo,
        description: null,
      })
      
      const mockCollectionService = vi.mocked(DataCollectionService)
      mockCollectionService.prototype.collectData.mockResolvedValue(mockProjectData)

      const { stdout } = await runCommand([
        'g:gh:project:summary',
        '--url',
        'https://github.com/testuser/testrepo',
      ])

      expect(stdout).toContain('DESCRIPTION=No description')
    })
  })
})