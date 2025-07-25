/**
 * @file GitHub REST API Service Interface
 * 
 * Interface contract for GitHub REST API operations.
 * Provides repository, issue, PR, and commit data access.
 */

import { CommitDataDTO } from '../dto/CommitDataDTO'
import { IssueDataDTO } from '../dto/IssueDataDTO'
import { PullRequestDataDTO } from '../dto/PullRequestDataDTO'
import { RepositoryDataDTO } from '../dto/RepositoryDataDTO'

/**
 * Interface for GitHub REST API service operations
 * 
 * This interface defines the contract for accessing GitHub data via REST API.
 * Implementations should handle authentication, rate limiting, and error handling.
 */
export interface IGitHubRestApiService {
  /**
   * Check if repository is accessible with current authentication
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns True if repository is accessible, false otherwise
   */
  checkRepositoryAccess(owner: string, repo: string): Promise<boolean>

  /**
   * Get authenticated user information
   * 
   * @returns Username of authenticated user
   * @throws {OrchestratorError} When authentication fails or API is unavailable
   */
  getAuthenticatedUser(): Promise<string>

  /**
   * Get repository data
   * 
   * @param owner - Repository owner (user or organization)
   * @param repo - Repository name
   * @returns Repository data DTO
   * @throws {OrchestratorError} When repository is not accessible or API fails
   */
  getRepository(owner: string, repo: string): Promise<RepositoryDataDTO>

  /**
   * Search for commits in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for commit search
   * @returns Array of commit data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchCommits(owner: string, repo: string, since: Date): Promise<CommitDataDTO[]>

  /**
   * Search for issues in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name  
   * @param since - Start date for issue search
   * @returns Array of issue data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchIssues(owner: string, repo: string, since: Date): Promise<IssueDataDTO[]>

  /**
   * Search for pull requests in a repository within a time range
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param since - Start date for PR search
   * @returns Array of pull request data DTOs
   * @throws {OrchestratorError} When search fails or repository is not accessible
   */
  searchPullRequests(owner: string, repo: string, since: Date): Promise<PullRequestDataDTO[]>
}