/**
 * @file GitHub GraphQL API Service Interface
 * 
 * Interface contract for GitHub GraphQL API operations.
 * Provides Projects v2 data access via GraphQL.
 */

// @ts-expect-error - Used in JSDoc comments
import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ProjectV2DTO } from '../dto/ProjectV2DTO.js'
import { ProjectV2ItemDTO } from '../dto/ProjectV2ItemDTO.js'

/**
 * Interface for GitHub GraphQL API service operations
 * 
 * This interface defines the contract for accessing GitHub Projects v2 data
 * via GraphQL API. Implementations should handle authentication, rate limiting,
 * and complex nested GraphQL response structures.
 */
export interface IGitHubGraphQLService {
  /**
   * Find projects by owner (user or organization)
   * 
   * @param owner - GitHub username or organization name
   * @returns Array of project DTOs sorted by most recently updated
   * @throws {OrchestratorError} When owner is not found or API fails
   */
  findProjectsByOwner(owner: string): Promise<ProjectV2DTO[]>

  /**
   * Get project data by node ID
   * 
   * @param projectNodeId - GitHub Project v2 node ID (e.g., "PVT_kwHOABDmBM4AHJKL")
   * @returns Project v2 data DTO
   * @throws {OrchestratorError} When project is not accessible or API fails
   */
  getProject(projectNodeId: string): Promise<ProjectV2DTO>

  /**
   * Get project field definitions for a project
   * 
   * @param projectNodeId - GitHub Project v2 node ID
   * @returns Array of field definitions with types and options
   * @throws {OrchestratorError} When project is not accessible or API fails
   */
  getProjectFields(projectNodeId: string): Promise<Array<{
    dataType: 'DATE' | 'ITERATION' | 'NUMBER' | 'SINGLE_SELECT' | 'TEXT'
    id: string
    name: string
    options?: Array<{ id: string; name: string; }>
  }>>

  /**
   * Get all items (issues, PRs) in a project
   * 
   * @param projectNodeId - GitHub Project v2 node ID
   * @returns Array of project item DTOs
   * @throws {OrchestratorError} When project is not accessible or API fails
   */
  getProjectItems(projectNodeId: string): Promise<ProjectV2ItemDTO[]>
}