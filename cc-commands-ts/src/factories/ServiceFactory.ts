/**
 * @file Service factory for dependency injection
 * 
 * This factory creates all services with their dependencies properly wired.
 * Used by commands to get fully configured service instances.
 */

import type { IOrchestrationService } from '../interfaces/IOrchestrationService.js'

import { DataCollectionService } from '../services/github/DataCollectionService.js'
import { GitHubApiService } from '../services/github/GitHubApiService.js'
import { ProjectDetectionService } from '../services/github/ProjectDetectionService.js'
import { DataCollectionOrchestrationService } from '../services/orchestration/DataCollectionOrchestrationService.js'
import { EnvironmentValidationService } from '../services/orchestration/EnvironmentValidationService.js'
import { ProjectDetectionOrchestrationService } from '../services/orchestration/ProjectDetectionOrchestrationService.js'
import { getGitHubToken } from '../utils/getGitHubToken.js'

/**
 * Services needed for project summary command
 */
export interface ProjectSummaryServices {
  dataCollector: IOrchestrationService
  envValidator: IOrchestrationService
  projectDetector: IOrchestrationService
}

/**
 * Factory for creating services with dependency injection
 */
export const ServiceFactory = {
  /**
   * Create services for project summary command
   */
  createProjectSummaryServices(token?: string): ProjectSummaryServices {
    // Create GitHub API service with token from various sources
    const githubApi = new GitHubApiService({ 
      auth: getGitHubToken(token)
    })
    
    // Create base services
    const projectDetectionService = new ProjectDetectionService(githubApi)
    const dataCollectionService = new DataCollectionService(githubApi)
    
    // Wrap in orchestration services
    return {
      dataCollector: new DataCollectionOrchestrationService(dataCollectionService),
      envValidator: new EnvironmentValidationService(),
      projectDetector: new ProjectDetectionOrchestrationService(projectDetectionService)
    }
  },
};