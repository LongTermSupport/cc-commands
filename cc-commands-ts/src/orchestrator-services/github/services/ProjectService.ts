/**
 * @file GitHub Project Operations Service
 * 
 * High-level service for GitHub Projects v2 operations.
 * Coordinates GitHubGraphQLService and SimpleGit for project management.
 */

import { SimpleGit } from 'simple-git'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ProjectV2DTO } from '../dto/ProjectV2DTO.js'
import { GitHubGraphQLService } from './GitHubGraphQLService.js'

/**
 * GitHub Project Service for high-level project operations
 * 
 * This service provides project-level operations that coordinate
 * GraphQL API calls with git repository information.
 */
export class ProjectService {
  constructor(
    private readonly graphqlService: GitHubGraphQLService,
    private readonly gitService: SimpleGit
  ) {}

  /**
   * Detect GitHub project from git remote
   * 
   * @param remotePath - Optional path to git repository (defaults to current directory)
   * @returns Project DTO if found, null if no project detected
   * @throws {OrchestratorError} When git operations fail
   */
  async detectProjectFromGitRemote(remotePath?: string): Promise<null | ProjectV2DTO> {
    try {
      // Get remote URL from git
      const git = remotePath ? this.gitService.cwd(remotePath) : this.gitService
      const remotes = await git.getRemotes(true)
      
      // Find origin remote
      const origin = remotes.find(remote => remote.name === 'origin')
      if (!origin?.refs?.fetch) {
        return null // No origin remote found
      }
      
      // Parse GitHub owner from remote URL
      const owner = this.extractOwnerFromGitUrl(origin.refs.fetch)
      if (!owner) {
        return null // Not a GitHub repository
      }
      
      // Find projects for this owner
      const projects = await this.graphqlService.findProjectsByOwner(owner)
      
      // For now, return the first project found
      // Future enhancement: implement logic to match project to specific repository
      return projects.length > 0 ? projects[0] ?? null : null
      
    } catch (error) {
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Ensure you are in a git repository directory',
          'Verify the repository has a GitHub origin remote',
          'Check if the repository owner has GitHub Projects v2',
          'Verify GitHub token has access to the organization/user projects'
        ],
        { remotePath: remotePath || process.cwd() }
      )
    }
  }

  /**
   * Find recent projects for a GitHub owner
   * 
   * @param owner - GitHub user or organization login
   * @returns Array of recent project DTOs
   * @throws {OrchestratorError} When API request fails
   */
  async findRecentProjects(owner: string): Promise<ProjectV2DTO[]> {
    try {
      const projects = await this.graphqlService.findProjectsByOwner(owner)
      
      // Sort by updated date (most recent first)
      return projects.sort((a, b) => {
        const dateA = new Date(a.updatedAt)
        const dateB = new Date(b.updatedAt)
        return dateB.getTime() - dateA.getTime()
      })
      
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the owner/organization exists on GitHub',
          'Check if the owner has any GitHub Projects v2',
          'Ensure GitHub token has access to the organization/user projects',
          'Verify network connectivity to GitHub'
        ],
        { owner }
      )
    }
  }

  /**
   * Get project with all items loaded
   * 
   * @param projectNodeId - GitHub node ID for the project (starts with "PVT_")
   * @returns Complete project DTO with items
   * @throws {OrchestratorError} When API request fails
   */
  async getProjectWithItems(projectNodeId: string): Promise<ProjectV2DTO> {
    try {
      // Get project with items - the GraphQL service already loads items
      return await this.graphqlService.getProject(projectNodeId)
      
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the project ID format is correct (should start with PVT_)',
          'Check if the project exists and is accessible',
          'Ensure GitHub token has access to the project',
          'Verify network connectivity to GitHub'
        ],
        { projectNodeId }
      )
    }
  }

  /**
   * Extract repository names from project items
   * 
   * @param projectNodeId - GitHub node ID for the project
   * @returns Array of repository names in "owner/repo" format
   * @throws {OrchestratorError} When API request fails
   */
  async getRepositoriesFromProject(projectNodeId: string): Promise<string[]> {
    try {
      // Get project items
      const items = await this.graphqlService.getProjectItems(projectNodeId)
      
      // Extract unique repository names from items
      const repositories = new Set<string>()
      
      for (const item of items) {
        if (item.repository) {
          repositories.add(item.repository)
        }
      }
      
      return [...repositories].sort()
      
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        [
          'Verify the project ID format is correct (should start with PVT_)',
          'Check if the project exists and has items',
          'Ensure GitHub token has access to the project',
          'Verify the project contains issues or pull requests linked to repositories'
        ],
        { projectNodeId }
      )
    }
  }

  /**
   * Extract GitHub owner from git remote URL
   * 
   * @private
   * @param gitUrl - Git remote URL (HTTPS or SSH format)
   * @returns GitHub owner/organization name, or null if not a GitHub URL
   */
  private extractOwnerFromGitUrl(gitUrl: string): null | string {
    // Handle HTTPS URLs: https://github.com/owner/repo.git
    const httpsMatch = gitUrl.match(/https:\/\/github\.com\/([^/]+)\/[^/]+/)
    if (httpsMatch?.[1]) {
      return httpsMatch[1]
    }
    
    // Handle SSH URLs: git@github.com:owner/repo.git
    const sshMatch = gitUrl.match(/git@github\.com:([^/]+)\/[^/]+/)
    if (sshMatch?.[1]) {
      return sshMatch[1]
    }
    
    return null
  }
}