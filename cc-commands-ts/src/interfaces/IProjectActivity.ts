/**
 * Activity data for a single repository
 */
export interface IRepositoryActivity {
  /**
   * Repository name (without owner)
   */
  name: string
  
  /**
   * Full repository name (owner/name)
   */
  fullName: string
  
  /**
   * Number of issues updated in the time period
   */
  issues: number
  
  /**
   * Number of pull requests updated in the time period
   */
  pullRequests: number
  
  /**
   * Number of commits in the time period
   */
  commits: number
  
  /**
   * Number of comments (issue + PR comments) in the time period
   */
  comments: number
  
  /**
   * Total activity score (sum of all metrics)
   */
  totalActivity: number
}

/**
 * Aggregated project activity data
 */
export interface IProjectActivity {
  /**
   * Activity data for each repository
   */
  repositories: IRepositoryActivity[]
  
  /**
   * Total activity across all repositories
   */
  totalActivity: number
  
  /**
   * Number of repositories with activity
   */
  activeRepos: number
  
  /**
   * Time period description (e.g., "last 24 hours")
   */
  timePeriod: string
  
  /**
   * Start of the time period
   */
  startDate: Date
  
  /**
   * End of the time period
   */
  endDate: Date
  
  /**
   * Top repositories by activity (full names)
   */
  topRepositories: string[]
  
  /**
   * Summary statistics
   */
  summary: {
    totalIssues: number
    totalPullRequests: number
    totalCommits: number
    totalComments: number
  }
}