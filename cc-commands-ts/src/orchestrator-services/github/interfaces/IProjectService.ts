/**
 * @file Project Service Interface
 * 
 * Interface contract for high-level GitHub Projects v2 operations.
 * Combines GraphQL service with git remote detection capabilities.
 */

import { ProjectV2DTO } from '../dto/ProjectV2DTO.js'

/**
 * Interface for high-level GitHub Projects v2 operations
 * 
 * This interface defines the contract for project-level operations that
 * combine multiple data sources (GraphQL API, git remotes) to provide
 * comprehensive project management capabilities.
 */
export interface IProjectService {
  /**
   * Detect project from git remote URL
   * 
   * Analyzes git remote configuration to automatically detect associated
   * GitHub Projects v2. Useful for context-aware project discovery.
   * 
   * @param remotePath - Optional git repository path (defaults to current directory)
   * @returns Project DTO if found, null if no project is associated
   * @throws {OrchestratorError} When git operations fail or API is unavailable
   */
  detectProjectFromGitRemote(remotePath?: string): Promise<null | ProjectV2DTO>

  /**
   * Find recent projects for an owner
   * 
   * Retrieves all projects for a given owner, sorted by most recent activity.
   * Useful for project discovery and selection interfaces.
   * 
   * @param owner - GitHub username or organization name
   * @returns Array of project DTOs sorted by update date (newest first)
   * @throws {OrchestratorError} When owner is not found or API fails
   */
  findRecentProjects(owner: string): Promise<ProjectV2DTO[]>

  /**
   * Get complete project data including all items
   * 
   * Retrieves full project information including all project items
   * (issues, PRs) with their field values. This is a comprehensive
   * data collection operation.
   * 
   * @param projectNodeId - GitHub Project v2 node ID
   * @returns Complete project DTO with populated items
   * @throws {OrchestratorError} When project is not accessible or API fails
   */
  getProjectWithItems(projectNodeId: string): Promise<ProjectV2DTO>

  /**
   * Extract repository names from project items
   * 
   * Analyzes all project items to identify the repositories involved
   * in the project. Useful for cross-repository analysis and reporting.
   * 
   * @param projectNodeId - GitHub Project v2 node ID
   * @returns Array of repository names in "owner/repo" format
   * @throws {OrchestratorError} When project is not accessible or API fails
   */
  getRepositoriesFromProject(projectNodeId: string): Promise<string[]>
}