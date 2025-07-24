/**
 * Activity data for a single repository
 */
export interface IRepositoryActivity {
    /**
     * Number of comments (issue + PR comments) in the time period
     */
    comments: number;
    /**
     * Number of commits in the time period
     */
    commits: number;
    /**
     * Full repository name (owner/name)
     */
    fullName: string;
    /**
     * Number of issues updated in the time period
     */
    issues: number;
    /**
     * Repository name (without owner)
     */
    name: string;
    /**
     * Number of pull requests updated in the time period
     */
    pullRequests: number;
    /**
     * Total activity score (sum of all metrics)
     */
    totalActivity: number;
}
/**
 * Aggregated project activity data
 */
export interface IProjectActivity {
    /**
     * Number of repositories with activity
     */
    activeRepos: number;
    /**
     * End of the time period
     */
    endDate: Date;
    /**
     * Activity data for each repository
     */
    repositories: IRepositoryActivity[];
    /**
     * Start of the time period
     */
    startDate: Date;
    /**
     * Summary statistics
     */
    summary: {
        totalComments: number;
        totalCommits: number;
        totalIssues: number;
        totalPullRequests: number;
    };
    /**
     * Time period description (e.g., "last 24 hours")
     */
    timePeriod: string;
    /**
     * Top repositories by activity (full names)
     */
    topRepositories: string[];
    /**
     * Total activity across all repositories
     */
    totalActivity: number;
}
