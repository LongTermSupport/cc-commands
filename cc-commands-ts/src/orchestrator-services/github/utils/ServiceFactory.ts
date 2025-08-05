/**
 * @file GitHub Service Factory
 * 
 * Factory for creating and configuring GitHub service dependencies.
 * Handles authentication, API client initialization, and service wiring.
 */

import createGitClient, { SimpleGit } from 'simple-git'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { activityAnalysisOrchServ } from '../activityAnalysisOrchServ.js'
import { projectDataCollectionOrchServ } from '../projectDataCollectionOrchServ.js'
import { IProjectDetectionArgs, projectDetectionOrchServ } from '../projectDetectionOrchServ.js'
import { ActivityService } from '../services/ActivityService.js'
import { AuthService } from '../services/AuthService.js'
import { GitHubGraphQLService } from '../services/GitHubGraphQLService.js'
import { GitHubRestApiService } from '../services/GitHubRestApiService.js'
import { ProjectService } from '../services/ProjectService.js'
import { RepositoryService } from '../services/RepositoryService.js'
import { IActivityAnalysisArgs, IProjectDataCollectionArgs } from '../types/ArgumentTypes.js'
import { TGitHubServices } from '../types/ServiceTypes.js'

// Legacy createGitHubServices() function removed - see createTypedGitHubServices() for current implementation

/**
 * Create GitHub services with direct typed orchestrator service access
 * This replaces the string-based service factory for the architectural fix
 */
export async function createTypedGitHubServices() {
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
  const gitClient: SimpleGit = createGitClient()
  
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
  
  // Return typed orchestrator services that accept typed arguments directly
  const typedOrchestratorServices = {
    activityAnalysisOrchServ: (args: IActivityAnalysisArgs) => 
      activityAnalysisOrchServ(args, githubServices),
    projectDataCollectionOrchServ: (args: IProjectDataCollectionArgs) => 
      projectDataCollectionOrchServ(args, githubServices),
    projectDetectionOrchServ: (args: IProjectDetectionArgs) => 
      projectDetectionOrchServ(args, githubServices),
  }
  
  return typedOrchestratorServices
}

// Legacy string parsing functions removed - string parsing now happens only at CLI boundary