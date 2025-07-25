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
import { IProjectDetectionArgs, projectDetectionOrchServ } from '../projectDetectionOrchServ'
import { ActivityService } from '../services/ActivityService'
import { AuthService } from '../services/AuthService'
import { GitHubGraphQLService } from '../services/GitHubGraphQLService'
import { GitHubRestApiService } from '../services/GitHubRestApiService'
import { ProjectService } from '../services/ProjectService'
import { RepositoryService } from '../services/RepositoryService'
import { ArgumentParser, IActivityAnalysisArgs } from '../types/ArgumentTypes'
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
      activityAnalysisOrchServ(args: string, _services: TOrchestratorServiceMap) {
        // Parse string args to typed object for migration compatibility
        const typedArgs = parseActivityAnalysisArgs(args)
        return activityAnalysisOrchServ(typedArgs, githubServices)
      },
      projectDataCollectionOrchServ: (args: string, _services: TOrchestratorServiceMap) => 
        projectDataCollectionOrchServ(args, githubServices),
      projectDetectionOrchServ(args: string, _services: TOrchestratorServiceMap) {
        // Parse string args to typed object for migration compatibility
        const typedArgs = parseProjectDetectionArgs(args)
        return projectDetectionOrchServ(typedArgs, githubServices)
      },
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

/**
 * Parse string arguments to typed ActivityAnalysisArgs
 * Temporary function during string-to-object migration
 */
function parseActivityAnalysisArgs(args: string): IActivityAnalysisArgs {
  // Try JSON parsing first
  if (args.startsWith('{')) {
    try {
      const parsed = JSON.parse(args)
      return {
        owner: parsed.owner,
        repositories: parsed.repositories,
        timeWindowDays: parsed.timeWindowDays || ArgumentParser.parseTimeWindow(parsed.since)
      }
    } catch {
      // Fall through to legacy parsing
    }
  }
  
  // Legacy pipe-delimited parsing
  const parts = args.split('|')
  const params = new Map<string, string>()
  
  for (const part of parts) {
    const colonIndex = part.indexOf(':')
    if (colonIndex > 0) {
      const key = part.slice(0, Math.max(0, colonIndex))
      const value = part.slice(Math.max(0, colonIndex + 1))
      params.set(key, value)
    }
  }
  
  const repositories = (params.get('repositories') || '').split(',').map(repo => repo.trim()).filter(Boolean)
  const timeWindowDays = ArgumentParser.parseTimeWindow(params.get('timeWindow'))
  
  return {
    owner: params.get('owner') || '',
    repositories,
    timeWindowDays
  }
}

/**
 * Parse project detection arguments from string format
 * Determines detection mode based on input format
 */
function parseProjectDetectionArgs(args: string): IProjectDetectionArgs {
  const trimmedArgs = args.trim()
  
  if (!trimmedArgs) {
    return { input: '', mode: 'auto' }
  }
  
  // Check if it's a GitHub project URL
  const urlMatch = trimmedArgs.match(/^https:\/\/github\.com\/orgs\/([^/]+)\/projects\/(\d+)/)
  if (urlMatch) {
    return { input: trimmedArgs, mode: 'url' }
  }
  
  // Check if it's a GitHub project URL with different format
  const altUrlMatch = trimmedArgs.match(/^https:\/\/github\.com\/users\/([^/]+)\/projects\/(\d+)/)
  if (altUrlMatch) {
    return { input: trimmedArgs, mode: 'url' }
  }
  
  // Otherwise treat as owner/organization name
  return { input: trimmedArgs, mode: 'owner' }
}