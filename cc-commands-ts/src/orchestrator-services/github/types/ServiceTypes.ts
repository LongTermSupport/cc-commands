/**
 * @file GitHub Service Type Definitions
 * 
 * Type definitions for GitHub service dependency injection.
 * Provides strictly typed service collections for orchestrators.
 */

import { IActivityService } from '../interfaces/IActivityService.js'
import { IAuthService } from '../interfaces/IAuthService.js'
import { IComprehensiveDataCollectionService, IRateLimitService } from '../interfaces/IComprehensiveDataCollectionService.js'
import { IGitHubGraphQLService } from '../interfaces/IGitHubGraphQLService.js'
import { IGitHubRestApiService } from '../interfaces/IGitHubRestApiService.js'
import { IProjectService } from '../interfaces/IProjectService.js'
import { IRepositoryService } from '../interfaces/IRepositoryService.js'

/**
 * Complete GitHub service collection type
 * 
 * This type defines all GitHub-related services needed for comprehensive
 * GitHub project analysis. Each service is strictly typed to its specific
 * interface, ensuring proper dependency injection and testability.
 * 
 * Services are organized by layer:
 * - API Layer: restApiService, graphqlService
 * - Domain Layer: projectService, repositoryService, activityService
 * - Infrastructure Layer: authService
 */
export type TGitHubServices = {
  /** Cross-repository activity analysis service */
  activityService: IActivityService
  
  /** GitHub authentication management service */
  authService: IAuthService
  
  /** Comprehensive data collection service for complete GitHub project data */
  comprehensiveDataCollectionService: IComprehensiveDataCollectionService
  
  /** GitHub GraphQL service for Projects v2 data */
  graphqlService: IGitHubGraphQLService
  
  /** High-level project operations service */
  projectService: IProjectService
  
  /** GitHub API rate limit monitoring and management service */
  rateLimitService: IRateLimitService
  
  /** Repository data operations service */
  repositoryService: IRepositoryService
  
  /** GitHub REST API service for repository, issue, PR, and commit data */
  restApiService: IGitHubRestApiService
}

/**
 * Service collection for GitHub project summary operations
 * 
 * This is the main service type used by the project summary command
 * and orchestrator. It includes all services needed for comprehensive
 * GitHub project analysis and reporting.
 */
export type TProjectSummaryServices = TGitHubServices

/**
 * Service collection for GitHub project detection operations
 * 
 * Subset of services needed for project detection and validation.
 * Used by orchestrator services that focus on project discovery.
 */
export type TProjectDetectionServices = {
  /** GitHub authentication management service */
  authService: IAuthService
  
  /** GitHub GraphQL service for Projects v2 queries */
  graphqlService: IGitHubGraphQLService
  
  /** High-level project operations service */
  projectService: IProjectService
}

/**
 * Service collection for repository data collection operations
 * 
 * Subset of services needed for repository data analysis.
 * Used by orchestrator services that focus on repository metrics.
 */
export type TRepositoryDataServices = {
  /** GitHub authentication management service */
  authService: IAuthService
  
  /** Repository data operations service */
  repositoryService: IRepositoryService
  
  /** GitHub REST API service for repository data */
  restApiService: IGitHubRestApiService
}

/**
 * Service collection for activity analysis operations
 * 
 * Subset of services needed for cross-repository activity analysis.
 * Used by orchestrator services that focus on activity metrics and reporting.
 */
export type TActivityAnalysisServices = {
  /** Cross-repository activity analysis service */
  activityService: IActivityService
  
  /** GitHub authentication management service */
  authService: IAuthService
  
  /** Repository data operations service */
  repositoryService: IRepositoryService
}

/**
 * Factory function type for creating GitHub service instances
 * 
 * This type defines the signature for factory functions that create
 * and configure GitHub service instances with proper dependency injection.
 */
export type TGitHubServiceFactory = () => Promise<TGitHubServices>

/**
 * Service configuration options for GitHub services
 * 
 * Configuration parameters that can be passed to service factories
 * for customizing service behavior and authentication.
 */
export type TGitHubServiceConfig = {
  /** GitHub API base URL (for GitHub Enterprise) */
  apiUrl?: string
  
  /** Rate limiting configuration */
  rateLimit?: {
    /** Enable exponential backoff */
    enableBackoff: boolean
    
    /** Requests per hour limit */
    requestsPerHour: number
  }
  
  /** Timeout configuration in milliseconds */
  timeout?: {
    /** API request timeout */
    api: number
    
    /** Git operations timeout */
    git: number
  }
  
  /** Custom authentication token (overrides CLI token) */
  token?: string
}