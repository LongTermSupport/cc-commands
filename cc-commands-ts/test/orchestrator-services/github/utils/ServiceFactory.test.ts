/**
 * @file ServiceFactory Tests
 * 
 * Tests for GitHub service factory and dependency injection.
 * Covers service creation, authentication, and argument parsing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError.js'
// TOrchestratorServiceMap import removed - legacy god object pattern eliminated
import { ActivityService } from '../../../../src/orchestrator-services/github/services/ActivityService.js'
import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubGraphQLService } from '../../../../src/orchestrator-services/github/services/GitHubGraphQLService.js'
import { GitHubRestApiService } from '../../../../src/orchestrator-services/github/services/GitHubRestApiService.js'
import { ProjectService } from '../../../../src/orchestrator-services/github/services/ProjectService.js'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService.js'
import { createTypedGitHubServices } from '../../../../src/orchestrator-services/github/utils/ServiceFactory.js'

// Mock external dependencies
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({ /* mock SimpleGit instance */ }))
}))
vi.mock('../../../../src/orchestrator-services/github/services/AuthService.js')
vi.mock('../../../../src/orchestrator-services/github/services/GitHubRestApiService.js')
vi.mock('../../../../src/orchestrator-services/github/services/GitHubGraphQLService.js')
vi.mock('../../../../src/orchestrator-services/github/services/ProjectService.js')
vi.mock('../../../../src/orchestrator-services/github/services/RepositoryService.js')
vi.mock('../../../../src/orchestrator-services/github/services/ActivityService.js')

describe('ServiceFactory', () => {
  let mockAuthService: vi.Mocked<AuthService>
  let mockRestApiService: vi.Mocked<GitHubRestApiService>
  let mockGraphQLService: vi.Mocked<GitHubGraphQLService>
  let mockProjectService: vi.Mocked<ProjectService>
  let mockRepositoryService: vi.Mocked<RepositoryService>
  let mockActivityService: vi.Mocked<ActivityService>

  const validToken = 'ghp_test_token_123'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mocked services
    mockAuthService = {
      getGitHubToken: vi.fn(),
      validateToken: vi.fn()
    } as vi.Mocked<AuthService>
    mockRestApiService = {} as vi.Mocked<GitHubRestApiService>
    mockGraphQLService = {} as vi.Mocked<GitHubGraphQLService>
    mockProjectService = {} as vi.Mocked<ProjectService>
    mockRepositoryService = {} as vi.Mocked<RepositoryService>
    mockActivityService = {} as vi.Mocked<ActivityService>

    // Setup default successful auth flow
    mockAuthService.getGitHubToken.mockResolvedValue(validToken)
    mockAuthService.validateToken.mockResolvedValue(true)

    // Setup constructor mocks to return our mocked instances
    vi.mocked(AuthService).mockImplementation(() => mockAuthService)
    vi.mocked(GitHubRestApiService).mockImplementation(() => mockRestApiService)
    vi.mocked(GitHubGraphQLService).mockImplementation(() => mockGraphQLService)
    vi.mocked(ProjectService).mockImplementation(() => mockProjectService)
    vi.mocked(RepositoryService).mockImplementation(() => mockRepositoryService)
    vi.mocked(ActivityService).mockImplementation(() => mockActivityService)
  })

  // Legacy createGitHubServices() tests removed - function was deprecated and eliminated

  describe('createTypedGitHubServices', () => {
    it('should create typed orchestrator services', async () => {
      const typedServices = await createTypedGitHubServices()

      expect(typedServices).toBeDefined()
      expect(typeof typedServices).toBe('object')
      
      // Verify typed orchestrator services exist and are functions
      expect(typedServices.activityAnalysisOrchServ).toBeTypeOf('function')
      expect(typedServices.projectDataCollectionOrchServ).toBeTypeOf('function')
      expect(typedServices.projectDetectionOrchServ).toBeTypeOf('function')

      // Verify function arity (should accept only typed args parameter)
      expect(typedServices.activityAnalysisOrchServ.length).toBe(1)
      expect(typedServices.projectDataCollectionOrchServ.length).toBe(1)
      expect(typedServices.projectDetectionOrchServ.length).toBe(1)
    })

    it('should handle authentication failure', async () => {
      mockAuthService.validateToken.mockResolvedValue(false)

      await expect(createTypedGitHubServices()).rejects.toThrow(OrchestratorError)
      await expect(createTypedGitHubServices()).rejects.toThrow('GitHub authentication token is invalid')
    })

    it('should create services with same auth flow as createGitHubServices', async () => {
      await createTypedGitHubServices()

      // Verify auth flow was called
      expect(mockAuthService.getGitHubToken).toHaveBeenCalledOnce()
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(validToken)
      
      // Verify all services were instantiated
      expect(AuthService).toHaveBeenCalledOnce()
      expect(GitHubRestApiService).toHaveBeenCalledWith(validToken)
      expect(GitHubGraphQLService).toHaveBeenCalledWith(validToken)
      expect(ProjectService).toHaveBeenCalledOnce()
      expect(RepositoryService).toHaveBeenCalledOnce()
      expect(ActivityService).toHaveBeenCalledOnce()
    })
  })

  describe('Orchestrator Service Integration', () => {
    // Legacy string argument test removed - string-based services deprecated

    it('should create typed services that accept typed arguments', async () => {
      const typedServices = await createTypedGitHubServices()

      // Test that typed orchestrator services can be called with typed arguments
      expect(() => {
        typedServices.activityAnalysisOrchServ({
          owner: 'test-owner',
          repositories: ['repo1', 'repo2'],
          timeWindowDays: 30
        })
      }).not.toThrow()

      expect(() => {
        typedServices.projectDataCollectionOrchServ({
          projectNodeId: 'test-node-id'
        })
      }).not.toThrow()

      expect(() => {
        typedServices.projectDetectionOrchServ({
          input: 'test-input',
          mode: 'auto'
        })
      }).not.toThrow()
    })
  })

  // Legacy error context preservation tests removed - function was deprecated

  // Legacy service instance validation tests removed - function was deprecated
})