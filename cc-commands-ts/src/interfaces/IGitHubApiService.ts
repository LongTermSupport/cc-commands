import { IGitHubProject } from './IGitHubProject.js'

/**
 * Repository information from GitHub API
 */
export interface IRepository {
  name: string
  fullName: string
  private: boolean
  updatedAt: string
  defaultBranch: string
}

/**
 * Issue or Pull Request from GitHub API
 */
export interface IIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  createdAt: string
  updatedAt: string
  isPullRequest: boolean
  repository: {
    name: string
    owner: string
  }
}

/**
 * Commit from GitHub API
 */
export interface ICommit {
  sha: string
  message: string
  authorDate: string
  repository: {
    name: string
    owner: string
  }
}

/**
 * Comment from GitHub API
 */
export interface IComment {
  id: number
  createdAt: string
  repository: {
    name: string
    owner: string
  }
}

/**
 * Interface for GitHub API operations
 */
export interface IGitHubApiService {
  /**
   * Get a list of projects for an organization
   */
  listOrganizationProjects(org: string): Promise<IGitHubProject[]>
  
  /**
   * Get a specific project by organization and number
   */
  getProject(org: string, projectNumber: number): Promise<IGitHubProject>
  
  /**
   * Get all repositories in a project
   */
  getProjectRepositories(org: string, projectNumber: number): Promise<IRepository[]>
  
  /**
   * Get issues and PRs for a repository updated since a given date
   */
  getRepositoryIssues(owner: string, repo: string, since: Date): Promise<IIssue[]>
  
  /**
   * Get commits for a repository since a given date
   */
  getRepositoryCommits(owner: string, repo: string, since: Date): Promise<ICommit[]>
  
  /**
   * Get comments for a repository since a given date
   */
  getRepositoryComments(owner: string, repo: string, since: Date): Promise<IComment[]>
  
  /**
   * Check if the API is authenticated
   */
  isAuthenticated(): Promise<boolean>
  
  /**
   * Get the authenticated user (if any)
   */
  getAuthenticatedUser(): Promise<string | null>
}