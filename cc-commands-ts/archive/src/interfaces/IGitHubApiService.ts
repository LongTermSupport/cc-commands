import { IGitHubProject } from './IGitHubProject'

/**
 * Repository information from GitHub API
 */
export interface IRepository {
  defaultBranch: string
  fullName: string
  name: string
  private: boolean
  updatedAt: string
}

/**
 * Issue or Pull Request from GitHub API
 */
export interface IIssue {
  createdAt: string
  isPullRequest: boolean
  number: number
  repository: {
    name: string
    owner: string
  }
  state: 'closed' | 'open'
  title: string
  updatedAt: string
}

/**
 * Commit from GitHub API
 */
export interface ICommit {
  authorDate: string
  message: string
  repository: {
    name: string
    owner: string
  }
  sha: string
}

/**
 * Comment from GitHub API
 */
export interface IComment {
  createdAt: string
  id: number
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
   * Get the authenticated user (if any)
   */
  getAuthenticatedUser(): Promise<null | string>
  
  /**
   * Get a specific project by organization and number
   */
  getProject(org: string, projectNumber: number): Promise<IGitHubProject>
  
  /**
   * Get all repositories in a project
   */
  getProjectRepositories(org: string, projectNumber: number): Promise<IRepository[]>
  
  /**
   * Get comments for a repository since a given date
   */
  getRepositoryComments(owner: string, repo: string, since: Date): Promise<IComment[]>
  
  /**
   * Get commits for a repository since a given date
   */
  getRepositoryCommits(owner: string, repo: string, since: Date): Promise<ICommit[]>
  
  /**
   * Get issues and PRs for a repository updated since a given date
   */
  getRepositoryIssues(owner: string, repo: string, since: Date): Promise<IIssue[]>
  
  /**
   * Check if the API is authenticated
   */
  isAuthenticated(): Promise<boolean>
  
  /**
   * Get a list of projects for an organization
   */
  listOrganizationProjects(org: string): Promise<IGitHubProject[]>
}