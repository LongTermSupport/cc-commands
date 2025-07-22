import { IGitHubApiService } from '../../interfaces/index.js'

/**
 * Repository activity data
 */
export interface IRepositoryActivity {
  stars: number
  forks: number
  watchers: number
  openIssues: number
  recentCommits: number
  recentIssues: number
  recentPullRequests: number
  lastCommitDate: string
  lastReleaseDate: string | null
}

/**
 * Contributor data
 */
export interface IContributor {
  login: string
  contributions: number
}

/**
 * Release data
 */
export interface IRelease {
  tagName: string
  name: string | null
  isPrerelease: boolean
  publishedAt: string
}

/**
 * Workflow data
 */
export interface IWorkflow {
  id: number
  name: string
  state: string
  path: string
}

/**
 * Collected project data
 */
export interface IProjectData {
  activity: IRepositoryActivity
  contributors: IContributor[]
  releases: IRelease[]
  workflows: IWorkflow[]
}

/**
 * Data collection options
 */
export interface IDataCollectionOptions {
  includeActivity?: boolean
  includeContributors?: boolean
  includeReleases?: boolean
  includeWorkflows?: boolean
  includeIssues?: boolean
  includePullRequests?: boolean
}

/**
 * Service for collecting data from GitHub repositories
 */
export class DataCollectionService {
  constructor(
    private githubApi: IGitHubApiService
  ) {}
  
  /**
   * Collect comprehensive data for a repository
   */
  async collectData(
    owner: string,
    repo: string,
    options: IDataCollectionOptions = {}
  ): Promise<IProjectData> {
    // Default all options to true
    const opts = {
      includeActivity: true,
      includeContributors: true,
      includeReleases: true,
      includeWorkflows: true,
      includeIssues: true,
      includePullRequests: true,
      ...options
    }
    
    try {
      // Get basic repository data first
      const repoData = await (this.githubApi as any).getRepository(owner, repo)
      
      // Collect activity metrics
      const activity: IRepositoryActivity = {
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        watchers: repoData.watchers_count || 0,
        openIssues: repoData.open_issues_count || 0,
        recentCommits: 0,
        recentIssues: 0,
        recentPullRequests: 0,
        lastCommitDate: repoData.pushed_at || repoData.updated_at,
        lastReleaseDate: null,
      }
      
      // Calculate recent activity (last 7 days)
      if (opts.includeActivity) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        // Get recent issues and PRs
        if (opts.includeIssues || opts.includePullRequests) {
          const issues = await this.githubApi.getRepositoryIssues(owner, repo, sevenDaysAgo)
          activity.recentIssues = issues.filter(i => !i.isPullRequest).length
          activity.recentPullRequests = issues.filter(i => i.isPullRequest).length
        }
        
        // Get recent commits
        const commits = await this.githubApi.getRepositoryCommits(owner, repo, sevenDaysAgo)
        activity.recentCommits = commits.length
      }
      
      // Collect contributors
      let contributors: IContributor[] = []
      if (opts.includeContributors) {
        try {
          const { data } = await (this.githubApi as any).octokit.rest.repos.listContributors({
            owner,
            repo,
            per_page: 100,
          })
          contributors = data.map((c: any) => ({
            login: c.login,
            contributions: c.contributions,
          }))
        } catch (error) {
          console.error('Failed to fetch contributors:', error)
        }
      }
      
      // Collect releases
      let releases: IRelease[] = []
      if (opts.includeReleases) {
        try {
          const { data } = await (this.githubApi as any).octokit.rest.repos.listReleases({
            owner,
            repo,
            per_page: 10,
          })
          releases = data.map((r: any) => ({
            tagName: r.tag_name,
            name: r.name,
            isPrerelease: r.prerelease,
            publishedAt: r.published_at,
          }))
          
          if (releases.length > 0) {
            activity.lastReleaseDate = releases[0].publishedAt
          }
        } catch (error) {
          console.error('Failed to fetch releases:', error)
        }
      }
      
      // Collect workflows
      let workflows: IWorkflow[] = []
      if (opts.includeWorkflows) {
        try {
          const { data } = await (this.githubApi as any).octokit.rest.actions.listRepoWorkflows({
            owner,
            repo,
          })
          workflows = data.workflows.map((w: any) => ({
            id: w.id,
            name: w.name,
            state: w.state,
            path: w.path,
          }))
        } catch (error) {
          console.error('Failed to fetch workflows:', error)
        }
      }
      
      return {
        activity,
        contributors,
        releases,
        workflows,
      }
    } catch (error) {
      throw new Error(`Failed to collect repository data: ${error}`)
    }
  }
}