/**
 * @file Repository Service Interface
 * 
 * Interface contract for repository data operations.
 * Provides repository information and activity metrics calculation.
 */

import { ActivityMetricsDTO } from '../dto/ActivityMetricsDTO.js'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO.js'

/**
 * Interface for repository data operations
 * 
 * This interface defines the contract for repository-level operations
 * including basic repository information and activity metrics calculation.
 * Implementations coordinate REST API calls to provide comprehensive data.
 */
export interface IRepositoryService {
  /**
   * Calculate repository activity metrics
   * 
   * Analyzes repository activity over a specified time period by collecting
   * and aggregating data from issues, pull requests, and commits.
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for activity analysis
   * @returns Activity metrics DTO with aggregated statistics
   * @throws {OrchestratorError} When repository is not accessible or analysis fails
   */
  getRepositoryActivity(owner: string, repo: string, since: Date): Promise<ActivityMetricsDTO>

  /**
   * Get repository data
   * 
   * Retrieves basic repository information including metadata,
   * statistics, and configuration details.
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns Repository data DTO
   * @throws {OrchestratorError} When repository is not accessible or API fails
   */
  getRepositoryData(owner: string, repo: string): Promise<RepositoryDataDTO>

  /**
   * Validate repository access
   * 
   * Checks if the repository exists and is accessible with current
   * authentication. Returns boolean result without throwing errors.
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns True if repository is accessible, false otherwise
   */
  validateRepositoryAccess(owner: string, repo: string): Promise<boolean>
}