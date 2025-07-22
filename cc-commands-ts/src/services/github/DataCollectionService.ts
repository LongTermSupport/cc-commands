import ora from 'ora'
import { 
  IGitHubApiService, 
  IGitHubProject, 
  IProjectActivity, 
  IRepositoryActivity 
} from '../../interfaces/index.js'
import { DateUtils } from '../../utils/DateUtils.js'

/**
 * Service for collecting activity data from GitHub projects
 */
export class DataCollectionService {
  constructor(
    private githubApi: IGitHubApiService,
    private dateUtils: typeof DateUtils = DateUtils
  ) {}
  
  /**
   * Collect activity data for a project
   */
  async collectProjectActivity(
    project: IGitHubProject,
    timePeriodHours: number = 24
  ): Promise<IProjectActivity> {
    const spinner = ora('Collecting project activity data...').start()
    
    try {
      // Calculate time period
      const startDate = this.dateUtils.getDateHoursAgo(timePeriodHours)
      const endDate = new Date()
      const timePeriod = this.dateUtils.getTimePeriodDescription(timePeriodHours)
      
      // Get repositories in the project
      spinner.text = 'Fetching project repositories...'
      const repositories = await this.githubApi.getProjectRepositories(
        project.organization,
        project.number
      )
      
      if (repositories.length === 0) {
        spinner.warn('No repositories found in project')
        return this.createEmptyActivity(timePeriod, startDate, endDate)
      }
      
      // Collect activity for each repository
      const repositoryActivities: IRepositoryActivity[] = []
      
      for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i]
        spinner.text = `Analyzing ${repo.fullName} (${i + 1}/${repositories.length})...`
        
        const [owner, name] = repo.fullName.split('/')
        const activity = await this.collectRepositoryActivity(
          owner,
          name,
          repo.fullName,
          startDate
        )
        
        if (activity.totalActivity > 0) {
          repositoryActivities.push(activity)
        }
      }
      
      // Sort by activity and calculate totals
      repositoryActivities.sort((a, b) => b.totalActivity - a.totalActivity)
      
      const totalActivity = repositoryActivities.reduce(
        (sum, repo) => sum + repo.totalActivity,
        0
      )
      
      const summary = {
        totalIssues: repositoryActivities.reduce((sum, repo) => sum + repo.issues, 0),
        totalPullRequests: repositoryActivities.reduce((sum, repo) => sum + repo.pullRequests, 0),
        totalCommits: repositoryActivities.reduce((sum, repo) => sum + repo.commits, 0),
        totalComments: repositoryActivities.reduce((sum, repo) => sum + repo.comments, 0),
      }
      
      const topRepositories = repositoryActivities
        .slice(0, 5)
        .map(repo => repo.fullName)
      
      spinner.succeed(`Collected activity data for ${repositoryActivities.length} repositories`)
      
      return {
        repositories: repositoryActivities,
        totalActivity,
        activeRepos: repositoryActivities.length,
        timePeriod,
        startDate,
        endDate,
        topRepositories,
        summary,
      }
    } catch (error) {
      spinner.fail('Failed to collect project activity')
      throw error
    }
  }
  
  /**
   * Collect activity data for a single repository
   */
  private async collectRepositoryActivity(
    owner: string,
    repo: string,
    fullName: string,
    since: Date
  ): Promise<IRepositoryActivity> {
    try {
      // Collect all activity data in parallel
      const [issues, commits, comments] = await Promise.all([
        this.githubApi.getRepositoryIssues(owner, repo, since),
        this.githubApi.getRepositoryCommits(owner, repo, since),
        this.githubApi.getRepositoryComments(owner, repo, since),
      ])
      
      // Separate issues and PRs
      const issueCount = issues.filter(i => !i.isPullRequest).length
      const prCount = issues.filter(i => i.isPullRequest).length
      
      const totalActivity = issueCount + prCount + commits.length + comments.length
      
      return {
        name: repo,
        fullName,
        issues: issueCount,
        pullRequests: prCount,
        commits: commits.length,
        comments: comments.length,
        totalActivity,
      }
    } catch (error) {
      console.error(`Error collecting activity for ${fullName}:`, error)
      // Return empty activity on error
      return {
        name: repo,
        fullName,
        issues: 0,
        pullRequests: 0,
        commits: 0,
        comments: 0,
        totalActivity: 0,
      }
    }
  }
  
  /**
   * Create an empty activity object
   */
  private createEmptyActivity(
    timePeriod: string,
    startDate: Date,
    endDate: Date
  ): IProjectActivity {
    return {
      repositories: [],
      totalActivity: 0,
      activeRepos: 0,
      timePeriod,
      startDate,
      endDate,
      topRepositories: [],
      summary: {
        totalIssues: 0,
        totalPullRequests: 0,
        totalCommits: 0,
        totalComments: 0,
      },
    }
  }
}