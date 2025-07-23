/**
 * @file Service factory for dependency injection
 * 
 * This factory creates all services with their dependencies properly wired.
 * Used by commands to get fully configured service instances.
 */

import type { IOrchestrationService } from '../interfaces/IOrchestrationService.js'

import { DataCollectionService } from '../services/github/DataCollectionService.js'
import { GitHubApiService } from '../services/github/GitHubApiService.js'
import { RepoDetectionService } from '../services/github/RepoDetectionService.js'
import { DataCollectionOrchestrationService } from '../services/orchestration/DataCollectionOrchestrationService.js'
import { EnvironmentValidationService } from '../services/orchestration/EnvironmentValidationService.js'
import { RepoDetectionOrchestrationService } from '../services/orchestration/RepoDetectionOrchestrationService.js'
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
    // Check if we're in test mode
    if (process.env['TEST_MODE'] === 'true') {
      // Return minimal test doubles that will respond with success
      return {
        dataCollector: {
          async execute() {
            const { LLMInfo } = await import('../types/LLMInfo.js')
            const { RepositoryDataDTO } = await import('../dto/RepositoryDataDTO.js')
            const { ActivityMetricsDTO } = await import('../dto/ActivityMetricsDTO.js')
            const { RepoDataCollectionDTO } = await import('../dto/RepoDataCollectionDTO.js')
            
            const repositoryDTO = new RepositoryDataDTO(
              'testrepo',
              'testuser',
              'Test repository',
              'TypeScript',
              'public',
              'main',
              'MIT',
              new Date('2020-01-01'),
              new Date('2023-01-01'),
              false,
              false,
              ['testing', 'example']
            )
            
            const activityMetricsDTO = new ActivityMetricsDTO(
              100,  // commits
              20,   // issues
              15,   // PRs
              5,    // releases
              10,   // contributors
              7,    // days analyzed
              []    // top contributors
            )
            
            const repoDataCollectionDTO = new RepoDataCollectionDTO(
              repositoryDTO,
              activityMetricsDTO,
              null,  // no latest release
              0,     // no workflows
              []     // no active workflows
            )
            
            const result = LLMInfo.create()
            result.addDataFromDTO(repoDataCollectionDTO)
            result.addData('AUDIENCE', 'dev')
            result.addAction('Data collection', 'success')
            return result
          }
        },
        envValidator: {
          async execute() {
            const { LLMInfo } = await import('../types/LLMInfo.js')
            const { EnvironmentValidationDTO } = await import('../dto/EnvironmentValidationDTO.js')
            
            const validationResult = EnvironmentValidationDTO.success()
            const result = LLMInfo.create()
            result.addDataFromDTO(validationResult)
            result.addAction('Environment validation', 'success')
            return result
          }
        },
        projectDetector: {
          async execute() {
            const { LLMInfo } = await import('../types/LLMInfo.js')
            const { RepoDetectionResultDTO } = await import('../dto/RepoDetectionResultDTO.js')
            
            const detectionResult = RepoDetectionResultDTO.fromURL(
              'https://github.com/testuser/testrepo',
              'testuser',
              'testrepo'
            )
            
            const result = LLMInfo.create()
            result.addDataFromDTO(detectionResult)
            result.addAction('Repository detection', 'success')
            return result
          }
        }
      }
    }
    
    // Create GitHub API service with token from various sources
    const githubApi = new GitHubApiService({ 
      auth: getGitHubToken(token)
    })
    
    // Create base services
    const repoDetectionService = new RepoDetectionService(githubApi)
    const dataCollectionService = new DataCollectionService(githubApi)
    
    // Wrap in orchestration services
    return {
      dataCollector: new DataCollectionOrchestrationService(dataCollectionService),
      envValidator: new EnvironmentValidationService(),
      projectDetector: new RepoDetectionOrchestrationService(repoDetectionService)
    }
  },
};