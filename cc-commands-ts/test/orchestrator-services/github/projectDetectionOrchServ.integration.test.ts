/**
 * @file ProjectDetectionOrchServ Integration Tests
 * 
 * Tests all three detection modes (auto, url, owner) with service mocking.
 * Focuses on orchestrator service coordination and error handling.
 */

import { SimpleGit } from 'simple-git'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LLMInfo } from '../../../src/core/LLMInfo.js'
import { ProjectV2DTO } from '../../../src/orchestrator-services/github/dto/ProjectV2DTO.js'
import { IProjectDetectionArgs, projectDetectionOrchServ } from '../../../src/orchestrator-services/github/projectDetectionOrchServ.js'
import { AuthService } from '../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubGraphQLService } from '../../../src/orchestrator-services/github/services/GitHubGraphQLService.js'
import { ProjectService } from '../../../src/orchestrator-services/github/services/ProjectService.js'
import { TProjectDetectionServices } from '../../../src/orchestrator-services/github/types/ServiceTypes.js'

// Mock the services
const mockAuthService = {
  getAuthenticatedUser: vi.fn(),
  getGitHubToken: vi.fn(),
  validateToken: vi.fn()
} as vi.Mocked<AuthService>

const mockGraphQLService = {
  findProjectsByOwner: vi.fn()
} as vi.Mocked<Pick<GitHubGraphQLService, 'findProjectsByOwner'>>

const mockProjectService = {
  detectProjectFromGitRemote: vi.fn(),
  findRecentProjects: vi.fn()
} as vi.Mocked<Pick<ProjectService, 'detectProjectFromGitRemote' | 'findRecentProjects'>>

const mockGitService = {
  getRemotes: vi.fn()
} as vi.Mocked<Pick<SimpleGit, 'getRemotes'>>

describe('ProjectDetectionOrchServ Integration Tests', () => {
  let services: TProjectDetectionServices

  beforeEach(() => {
    vi.clearAllMocks()
    
    services = {
      authService: mockAuthService,
      gitService: mockGitService as SimpleGit,
      graphqlService: mockGraphQLService as GitHubGraphQLService,
      projectService: mockProjectService as ProjectService
    }
    
    // Default successful auth setup
    mockAuthService.getGitHubToken.mockReturnValue('mock-token')
    mockAuthService.validateToken.mockResolvedValue(true)
    mockAuthService.getAuthenticatedUser.mockResolvedValue('test-user')
  })

  describe('Auto Detection Mode (Git Remote)', () => {
    const autoArgs: IProjectDetectionArgs = { input: '', mode: 'auto' }

    it('should successfully detect project from git remote', async () => {
      const mockProject = new ProjectV2DTO(
        'PVT_test123',
        'Test Project',
        'https://github.com/users/testowner/projects/1',
        'Auto-detected project',
        'testowner',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-24T12:00:00Z'),
        5
      )
      
      mockProjectService.detectProjectFromGitRemote.mockResolvedValue(mockProject)
      
      const result = await projectDetectionOrchServ(autoArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(false)
      expect(result.getData()).toMatchObject({
        AUTHENTICATED_USER: 'test-user',
        DETECTION_MODE: 'auto',
        INPUT_ARGS: 'auto-detect',
        PROJECT_V2_OWNER: 'testowner',
        PROJECT_V2_TITLE: 'Test Project'
      })
      
      expect(mockProjectService.detectProjectFromGitRemote).toHaveBeenCalledOnce()
    })

    it('should handle no project found in git remote', async () => {
      mockProjectService.detectProjectFromGitRemote.mockResolvedValue(null)
      
      const result = await projectDetectionOrchServ(autoArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('STOP PROCESSING')
      expect(output).toContain('Could not detect GitHub project from git remote')
      expect(output).toContain('Ensure you are in a git repository directory')
      expect(output).toContain('DETECTION_MODE=auto')
    })

    it('should handle git service errors gracefully', async () => {
      const gitError = new Error('Not a git repository')
      mockProjectService.detectProjectFromGitRemote.mockRejectedValue(gitError)
      
      const result = await projectDetectionOrchServ(autoArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('STOP PROCESSING')
      expect(output).toContain('Not a git repository')
    })
  })

  describe('URL Detection Mode', () => {
    const urlArgs: IProjectDetectionArgs = { 
      input: 'https://github.com/orgs/testorg/projects/1', 
      mode: 'url' 
    }

    it('should successfully parse and find project from URL', async () => {
      const mockProject = new ProjectV2DTO(
        'PVT_test456',
        'URL Project',
        'https://github.com/orgs/testorg/projects/1',
        'Project from URL',
        'testorg',
        'ORGANIZATION',
        'PRIVATE',
        'OPEN',
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-25T12:00:00Z'),
        12
      )
      
      mockProjectService.findRecentProjects.mockResolvedValue([mockProject])
      
      const result = await projectDetectionOrchServ(urlArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(false)
      expect(result.getData()).toMatchObject({
        DETECTION_MODE: 'url',
        INPUT_ARGS: 'https://github.com/orgs/testorg/projects/1',
        PROJECT_NUMBER: '1',
        PROJECT_OWNER: 'testorg',
        PROJECT_V2_OWNER: 'testorg',
        PROJECT_V2_TITLE: 'URL Project'
      })
      
      expect(mockProjectService.findRecentProjects).toHaveBeenCalledWith('testorg')
    })

    it('should handle invalid URL format', async () => {
      const invalidUrlArgs: IProjectDetectionArgs = { 
        input: 'not-a-valid-url', 
        mode: 'url' 
      }
      
      const result = await projectDetectionOrchServ(invalidUrlArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('Invalid GitHub project URL format')
      expect(output).toContain('Use format: https://github.com/orgs/ORG/projects/123')
    })

    it('should handle no projects found for URL owner', async () => {
      mockProjectService.findRecentProjects.mockResolvedValue([])
      
      const result = await projectDetectionOrchServ(urlArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('No projects found for owner: testorg')
      expect(output).toContain('Verify the owner/organization name is correct')
    })

    it('should handle user project URLs correctly', async () => {
      const userUrlArgs: IProjectDetectionArgs = { 
        input: 'https://github.com/users/testuser/projects/5', 
        mode: 'url' 
      }

      const mockUserProject = new ProjectV2DTO(
        'PVT_user789',
        'User Project',
        'https://github.com/users/testuser/projects/5',
        'User personal project',
        'testuser',
        'USER',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-20T00:00:00Z'),
        new Date('2025-01-26T12:00:00Z'),
        3
      )
      
      mockProjectService.findRecentProjects.mockResolvedValue([mockUserProject])
      
      const result = await projectDetectionOrchServ(userUrlArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(false)
      expect(result.getData()).toMatchObject({
        PROJECT_NUMBER: '5',
        PROJECT_OWNER: 'testuser',
        PROJECT_V2_OWNER: 'testuser',
        PROJECT_V2_TITLE: 'User Project'
      })
    })
  })

  describe('Owner Detection Mode', () => {
    const ownerArgs: IProjectDetectionArgs = { input: 'github', mode: 'owner' }

    it('should successfully find projects by owner', async () => {
      const mockProjects = [
        new ProjectV2DTO(
          'PVT_recent',
          'Recent Project',
          'https://github.com/orgs/github/projects/1',
          'Most recent project',
          'github',
          'ORGANIZATION',
          'PUBLIC',
          'OPEN',
          new Date('2025-01-20T00:00:00Z'),
          new Date('2025-01-27T12:00:00Z'),
          25
        ),
        new ProjectV2DTO(
          'PVT_older',
          'Older Project',
          'https://github.com/orgs/github/projects/2',
          'Older project',
          'github',
          'ORGANIZATION',
          'PUBLIC',
          'CLOSED',
          new Date('2025-01-10T00:00:00Z'),
          new Date('2025-01-20T12:00:00Z'),
          10
        )
      ]
      
      mockProjectService.findRecentProjects.mockResolvedValue(mockProjects)
      
      const result = await projectDetectionOrchServ(ownerArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(false)
      expect(result.getData()).toMatchObject({
        DETECTION_MODE: 'owner',
        INPUT_ARGS: 'github',
        OTHER_PROJECTS: 'Older Project',
        PROJECT_OWNER: 'github',
        PROJECT_V2_TITLE: 'Recent Project',
        PROJECTS_FOUND: '2',
        SELECTED_PROJECT: 'Recent Project'
      })
      
      expect(mockProjectService.findRecentProjects).toHaveBeenCalledWith('github')
    })

    it('should handle no projects found for owner', async () => {
      mockProjectService.findRecentProjects.mockResolvedValue([])
      
      const result = await projectDetectionOrchServ(ownerArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('No projects found for owner: github')
      expect(output).toContain('Check if you have access to the organization\'s projects')
    })

    it('should handle many projects correctly', async () => {
      // Create 10 mock projects to test pagination
      const manyProjects = Array.from({ length: 10 }, (_, i) => 
        new ProjectV2DTO(
          `PVT_${i}`,
          `Project ${i}`,
          `https://github.com/orgs/github/projects/${i}`,
          `Description ${i}`,
          'github',
          'ORGANIZATION',
          'PUBLIC',
          'OPEN',
          new Date('2025-01-01T00:00:00Z'),
          new Date(`2025-01-${20 + i}T12:00:00Z`),
          i * 2
        )
      )
      
      // Sort by updatedAt descending (most recent first) to match real service behavior
      const sortedProjects = manyProjects.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      )
      
      mockProjectService.findRecentProjects.mockResolvedValue(sortedProjects)
      
      const result = await projectDetectionOrchServ(ownerArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(false)
      expect(result.getData()).toMatchObject({
        OTHER_PROJECTS: 'Project 8, Project 7, Project 6, Project 5, Project 4', // Next 5 projects (slice(1, 6))
        PROJECTS_FOUND: '10',
        SELECTED_PROJECT: 'Project 9' // Most recent (highest date)
      })
    })
  })

  describe('Authentication Handling', () => {
    const testArgs: IProjectDetectionArgs = { input: 'github', mode: 'owner' }

    it('should handle invalid authentication token', async () => {
      mockAuthService.validateToken.mockResolvedValue(false)
      
      const result = await projectDetectionOrchServ(testArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('GitHub authentication failed')
      expect(output).toContain('Run "gh auth login" to authenticate')
      expect(output).toContain('DETECTION_MODE=owner')
    })

    it('should handle authentication service errors', async () => {
      mockAuthService.validateToken.mockRejectedValue(new Error('Auth service unavailable'))
      
      const result = await projectDetectionOrchServ(testArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('Auth service unavailable')
    })

    it('should handle token validation but user fetch failure', async () => {
      mockAuthService.validateToken.mockResolvedValue(true)
      mockAuthService.getAuthenticatedUser.mockRejectedValue(new Error('User fetch failed'))
      
      const result = await projectDetectionOrchServ(testArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
    })
  })

  describe('Invalid Detection Mode', () => {
    it('should handle unsupported detection mode', async () => {
      // Force an invalid mode for testing
      const invalidArgs = { input: 'test', mode: 'invalid' } as IProjectDetectionArgs
      
      const result = await projectDetectionOrchServ(invalidArgs, services)
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      expect(result.getExitCode()).toBe(1)
      
      const output = result.toString()
      expect(output).toContain('Unsupported detection mode: invalid')
      expect(output).toContain('Use a GitHub project URL')
    })
  })

  describe('Error Context and Recovery', () => {
    it('should include proper error context for debugging', async () => {
      mockProjectService.findRecentProjects.mockRejectedValue(new Error('Service error'))
      
      const result = await projectDetectionOrchServ(
        { input: 'testorg', mode: 'owner' },
        services
      )
      
      expect(result).toBeInstanceOf(LLMInfo)
      expect(result.hasError()).toBe(true)
      
      const output = result.toString()
      expect(output).toContain('DETECTION_MODE=owner')
      expect(output).toContain('INPUT_ARGS=testorg')
      expect(output).toContain('AUTHENTICATED_USER=test-user')
      expect(output).toContain('Service error')
    })

    it('should provide comprehensive recovery instructions', async () => {
      mockProjectService.detectProjectFromGitRemote.mockResolvedValue(null)
      
      const result = await projectDetectionOrchServ(
        { input: '', mode: 'auto' },
        services
      )
      
      const output = result.toString()
      expect(output).toContain('Ensure you are in a git repository directory')
      expect(output).toContain('Verify the git remote is set to a GitHub repository')
      expect(output).toContain('Check if the repository is associated with a GitHub project')
      expect(output).toContain('Consider specifying the project URL or organization manually')
    })
  })

  describe('LLMInfo Integration', () => {
    it('should include proper instructions for LLM', async () => {
      const mockProject = new ProjectV2DTO(
        'PVT_test',
        'Test Project',
        'https://github.com/orgs/test/projects/1',
        'Test description',
        'test',
        'ORGANIZATION',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-24T12:00:00Z'),
        0
      )
      
      mockProjectService.findRecentProjects.mockResolvedValue([mockProject])
      
      const result = await projectDetectionOrchServ(
        { input: 'test', mode: 'owner' },
        services
      )
      
      const output = result.toString()
      expect(output).toContain('Use the detected project information to proceed with data collection')
      expect(output).toContain('Validate that the project contains repositories for analysis')
    })

    it('should track all actions performed', async () => {
      const mockProject = new ProjectV2DTO(
        'PVT_test',
        'Test Project',
        'https://github.com/orgs/test/projects/1',
        'Test description',
        'test',
        'ORGANIZATION',
        'PUBLIC',
        'OPEN',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-24T12:00:00Z'),
        0
      )
      
      mockProjectService.findRecentProjects.mockResolvedValue([mockProject])
      
      const result = await projectDetectionOrchServ(
        { input: 'test', mode: 'owner' },
        services
      )
      
      const actions = result.getActions()
      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            details: 'Authenticated as test-user',
            event: 'Validate GitHub authentication',
            result: 'success'
          }),
          expect.objectContaining({
            details: 'Found 1 projects',
            event: 'Find projects by owner',
            result: 'success'
          })
        ])
      )
    })
  })
})