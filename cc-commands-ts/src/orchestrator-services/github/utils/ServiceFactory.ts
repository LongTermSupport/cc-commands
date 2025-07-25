/**
 * @file GitHub Service Factory
 * 
 * Factory for creating and configuring GitHub service dependencies.
 * Handles authentication, API client initialization, and service wiring.
 */

import simpleGit, { SimpleGit } from 'simple-git'

import { OrchestratorError } from '../../../core/error/OrchestratorError'
import { TOrchestratorServiceMap } from '../../../core/interfaces/IOrchestratorService'
import { activityAnalysisOrchServ } from '../activityAnalysisOrchServ'
import { projectDataCollectionOrchServ } from '../projectDataCollectionOrchServ'
import { projectDetectionOrchServ } from '../projectDetectionOrchServ'
import { ActivityService } from '../services/ActivityService'
import { AuthService } from '../services/AuthService'
import { GitHubGraphQLService } from '../services/GitHubGraphQLService'
import { GitHubRestApiService } from '../services/GitHubRestApiService'
import { ProjectService } from '../services/ProjectService'
import { RepositoryService } from '../services/RepositoryService'
import { TGitHubServices } from '../types/ServiceTypes'

/**
 * Create and configure all GitHub services with proper dependency injection
 * 
 * This factory handles:
 * - GitHub authentication via gh CLI token
 * - Octokit client initialization for REST and GraphQL
 * - Service instantiation with proper dependencies
 * - Orchestrator service wiring
 * 
 * @returns Configured service map for project summary operations
 * @throws {OrchestratorError} When authentication or initialization fails
 */
export async function createGitHubServices(): Promise<TOrchestratorServiceMap> {
  try {
    // Initialize auth service
    const authService = new AuthService()
    
    // Get GitHub token
    const token = await authService.getGitHubToken()
    
    // Validate token
    const isValid = await authService.validateToken(token)
    if (!isValid) {
      throw new OrchestratorError(
        new Error('GitHub authentication token is invalid'),
        ['Run `gh auth login` to authenticate', 'Check `gh auth status`'],
        { code: 'INVALID_TOKEN' }
      )
    }
    
    // Initialize git client
    const gitClient: SimpleGit = simpleGit()
    
    // Create service instances
    const restApiService = new GitHubRestApiService(token)
    const graphqlService = new GitHubGraphQLService(token)
    const projectService = new ProjectService(graphqlService, gitClient)
    const repositoryService = new RepositoryService(restApiService)
    const activityService = new ActivityService(repositoryService)
    
    // Create typed service collection for regular services
    const githubServices: TGitHubServices = {
      activityService,
      authService,
      graphqlService,
      projectService,
      repositoryService,
      restApiService,
    }
    
    // Create orchestrator services with properly typed dependencies
    // Note: orchestrator services receive only the regular services they need,
    // not other orchestrator services, to avoid circular dependencies
    const orchestratorServices: TOrchestratorServiceMap = {
      activityAnalysisOrchServ: (args: string, _services: TOrchestratorServiceMap) => 
        activityAnalysisOrchServ(args, githubServices),
      projectDataCollectionOrchServ: (args: string, _services: TOrchestratorServiceMap) => 
        projectDataCollectionOrchServ(args, githubServices),
      projectDetectionOrchServ: (args: string, _services: TOrchestratorServiceMap) => 
        projectDetectionOrchServ(args, githubServices),
    }
    
    // Return orchestrator services that conform to IOrchestratorService signature
    return orchestratorServices
  } catch (error) {
    if (error instanceof OrchestratorError) {
      throw error
    }
    
    throw new OrchestratorError(
      error,
      ['Check GitHub authentication', 'Ensure gh CLI is installed'],
      { 
        code: 'SERVICE_INITIALIZATION_FAILED',
        error: error instanceof Error ? error.message : String(error) 
      }
    )
  }
}