/**
 * @file ServiceFactory Tests
 * 
 * Tests for GitHub service factory and dependency injection.
 * Covers service creation, authentication, and argument parsing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrchestratorError } from '../../../../src/core/error/OrchestratorError.js'
import { TOrchestratorServiceMap } from '../../../../src/core/interfaces/IOrchestratorService.js'
import { ActivityService } from '../../../../src/orchestrator-services/github/services/ActivityService.js'
import { AuthService } from '../../../../src/orchestrator-services/github/services/AuthService.js'
import { GitHubGraphQLService } from '../../../../src/orchestrator-services/github/services/GitHubGraphQLService.js'
import { GitHubRestApiService } from '../../../../src/orchestrator-services/github/services/GitHubRestApiService.js'
import { ProjectService } from '../../../../src/orchestrator-services/github/services/ProjectService.js'
import { RepositoryService } from '../../../../src/orchestrator-services/github/services/RepositoryService.js'
import { createGitHubServices, createTypedGitHubServices } from '../../../../src/orchestrator-services/github/utils/ServiceFactory.js'

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

  describe('createGitHubServices', () => {
    it('should create all services with valid authentication', async () => {
      const services = await createGitHubServices()

      expect(services).toBeDefined()
      expect(typeof services).toBe('object')
      
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

    it('should create orchestrator services with correct function signatures', async () => {
      const services = await createGitHubServices()

      // Verify orchestrator services exist and are functions
      expect(services.activityAnalysisOrchServ).toBeTypeOf('function')
      expect(services.projectDataCollectionOrchServ).toBeTypeOf('function')
      expect(services.projectDetectionOrchServ).toBeTypeOf('function')

      // Verify function arity (should accept args and services parameters)
      expect(services.activityAnalysisOrchServ.length).toBe(2)
      expect(services.projectDataCollectionOrchServ.length).toBe(2)
      expect(services.projectDetectionOrchServ.length).toBe(2)
    })

    it('should throw OrchestratorError when token validation fails', async () => {
      mockAuthService.validateToken.mockResolvedValue(false)

      await expect(createGitHubServices()).rejects.toThrow(OrchestratorError)
      await expect(createGitHubServices()).rejects.toThrow('GitHub authentication token is invalid')
    })

    it('should throw OrchestratorError when authentication fails', async () => {
      const authError = new Error('gh command not found')
      mockAuthService.getGitHubToken.mockRejectedValue(authError)

      await expect(createGitHubServices()).rejects.toThrow(OrchestratorError)
    })

    it('should handle OrchestratorError passthrough', async () => {
      const orchError = new OrchestratorError(
        new Error('Custom error'),
        ['Recovery step 1', 'Recovery step 2'],
        { code: 'CUSTOM_ERROR' }
      )
      mockAuthService.getGitHubToken.mockRejectedValue(orchError)

      await expect(createGitHubServices()).rejects.toThrow()
    })

    it('should wrap unexpected errors in OrchestratorError', async () => {
      const unexpectedError = new Error('Unexpected service creation failure')
      vi.mocked(GitHubRestApiService).mockImplementation(() => {
        throw unexpectedError
      })

      await expect(createGitHubServices()).rejects.toThrow(OrchestratorError)
      
      try {
        await createGitHubServices()
      } catch (error) {
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.error).toBe('Unexpected service creation failure')
          expect(error.debugInfo.code).toBe('SERVICE_INITIALIZATION_FAILED')
        }
      }
    })

    it('should handle string error objects', async () => {
      vi.mocked(GitHubRestApiService).mockImplementation(() => {
        throw new Error('String error')
      })

      await expect(createGitHubServices()).rejects.toThrow(OrchestratorError)
      
      try {
        await createGitHubServices()
      } catch (error) {
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.error).toBe('String error')
        }
      }
    })
  })

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
    it('should create services that accept string arguments', async () => {
      const services = await createGitHubServices()
      const mockOrchestratorServices: TOrchestratorServiceMap = {}

      // Test that orchestrator services can be called with string arguments
      // These should not throw during the function call setup
      expect(() => {
        services.activityAnalysisOrchServ('test-args', mockOrchestratorServices)
      }).not.toThrow()

      expect(() => {
        services.projectDataCollectionOrchServ('test-args', mockOrchestratorServices)
      }).not.toThrow()

      expect(() => {
        services.projectDetectionOrchServ('test-args', mockOrchestratorServices)
      }).not.toThrow()
    })

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

  describe('Error Context Preservation', () => {
    it('should preserve error context in OrchestratorError', async () => {
      const customError = new Error('Token retrieval failed')
      mockAuthService.getGitHubToken.mockRejectedValue(customError)

      try {
        await createGitHubServices()
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.debugInfo.code).toBe('SERVICE_INITIALIZATION_FAILED')
          expect(error.debugInfo.error).toBe('Token retrieval failed')
          expect(error.recoveryInstructions).toContain('Check GitHub authentication')
          expect(error.recoveryInstructions).toContain('Ensure gh CLI is installed')
        }
      }
    })

    it('should include proper recovery instructions for auth failures', async () => {
      mockAuthService.validateToken.mockResolvedValue(false)

      try {
        await createGitHubServices()
      } catch (error) {
        expect(error).toBeInstanceOf(OrchestratorError)
        if (error instanceof OrchestratorError) {
          expect(error.recoveryInstructions).toContain('Run `gh auth login` to authenticate')
          expect(error.recoveryInstructions).toContain('Check `gh auth status`')
          expect(error.debugInfo.code).toBe('INVALID_TOKEN')
        }
      }
    })
  })

  describe('Service Instance Validation', () => {
    it('should instantiate services with correct dependencies', async () => {
      await createGitHubServices()

      // Verify service constructors were called with expected parameters
      expect(GitHubRestApiService).toHaveBeenCalledWith(validToken)
      expect(GitHubGraphQLService).toHaveBeenCalledWith(validToken)
      expect(ProjectService).toHaveBeenCalledWith(
        expect.any(Object), // GraphQL service instance
        expect.any(Object)  // Git client instance
      )
      expect(RepositoryService).toHaveBeenCalledWith(
        expect.any(Object)  // REST API service instance
      )
      expect(ActivityService).toHaveBeenCalledWith(
        expect.any(Object)  // Repository service instance
      )
    })

    it('should create service instances only once during factory call', async () => {
      await createGitHubServices()

      // Verify each service constructor was called exactly once
      expect(AuthService).toHaveBeenCalledTimes(1)
      expect(GitHubRestApiService).toHaveBeenCalledTimes(1)
      expect(GitHubGraphQLService).toHaveBeenCalledTimes(1)
      expect(ProjectService).toHaveBeenCalledTimes(1)
      expect(RepositoryService).toHaveBeenCalledTimes(1)
      expect(ActivityService).toHaveBeenCalledTimes(1)
    })
  })
})