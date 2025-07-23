import type { DataCollectionOptionsDTO, IDataCollectionService } from '../../interfaces/IDataCollectionService.js'
import type { 
  ContributorDTO,
  ProjectDataDTO,
  ProjectInfoDTO,
  ReleaseDTO,
  RepositoryActivityDTO,
  WorkflowDTO
} from '../../types/ProjectDataDTO.js'

import { IGitHubApiService } from '../../interfaces/index.js'
import {
  GitHubContributor,
  GitHubRelease,
  GitHubRepositoryResponse,
  GitHubWorkflowsResponse
} from '../../types/GitHubTypes.js'

/**
 * Service for collecting data from GitHub repositories
 */
export class DataCollectionService implements IDataCollectionService {
  constructor(
    private githubApi: IGitHubApiService
  ) {}
  
  /**
   * Collect comprehensive data for a repository
   */
  async collectData(
    owner: string,
    repo: string,
    options: DataCollectionOptionsDTO = {}
  ): Promise<ProjectDataDTO> {
    // Default all options to true
    const opts = {
      includeActivity: true,
      includeContributors: true,
      includeIssues: true,
      includePullRequests: true,
      includeReleases: true,
      includeWorkflows: true,
      ...options
    }
    
    try {
      // Get basic repository data first
      const repoData = await (this.githubApi as unknown as {
        getRepository(owner: string, repo: string): Promise<GitHubRepositoryResponse>
      }).getRepository(owner, repo)
      
      // Collect activity metrics
      const activity: RepositoryActivityDTO = {
        // Summary counts (will be updated later)
        commitCount: 0,
        contributorCount: 0,
        forks: repoData.forks_count || 0,
        issueCount: 0,
        lastCommitDate: repoData.pushed_at || repoData.updated_at,
        lastReleaseDate: null,
        openIssues: repoData.open_issues_count || 0,
        prCount: 0,
        recentCommits: 0,
        recentIssues: 0,
        recentPullRequests: 0,
        releaseCount: 0,
        stars: repoData.stargazers_count || 0,
        watchers: repoData.watchers_count || 0
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
      let contributors: ContributorDTO[] = []
      if (opts.includeContributors) {
        try {
          const { data } = await (this.githubApi as unknown as {
            octokit: { rest: { repos: { listContributors: (params: {owner: string, per_page: number; repo: string,}) => Promise<{data: GitHubContributor[]}> } } }
          }).octokit.rest.repos.listContributors({
            owner,
            // eslint-disable-next-line camelcase -- GitHub API requires snake_case
            per_page: 100,
            repo,
          })
          contributors = data.map((c) => ({
            contributions: c.contributions,
            login: c.login,
          }))
        } catch (error) {
          console.error('Failed to fetch contributors:', error)
        }
      }
      
      // Collect releases
      let releases: ReleaseDTO[] = []
      if (opts.includeReleases) {
        try {
          const { data } = await (this.githubApi as unknown as {
            octokit: { rest: { repos: { listReleases: (params: {owner: string, per_page: number; repo: string,}) => Promise<{data: GitHubRelease[]}> } } }
          }).octokit.rest.repos.listReleases({
            owner,
            // eslint-disable-next-line camelcase -- GitHub API requires snake_case
            per_page: 10,
            repo,
          })
          releases = data.map((r) => ({
            isPrerelease: r.prerelease,
            name: r.name,
            publishedAt: r.published_at || '',
            tagName: r.tag_name,
          }))
          
          if (releases.length > 0) {
            activity.lastReleaseDate = releases[0]?.publishedAt ?? null
          }
        } catch (error) {
          console.error('Failed to fetch releases:', error)
        }
      }
      
      // Collect workflows
      let workflows: WorkflowDTO[] = []
      if (opts.includeWorkflows) {
        try {
          const { data } = await (this.githubApi as unknown as {
        octokit: { rest: { actions: { listRepoWorkflows: (params: {owner: string, repo: string}) => Promise<{data: GitHubWorkflowsResponse}> } } }
      }).octokit.rest.actions.listRepoWorkflows({
            owner,
            repo,
          })
          workflows = data.workflows.map((w) => ({
            id: w.id,
            name: w.name,
            path: w.path,
            state: w.state,
          }))
        } catch (error) {
          console.error('Failed to fetch workflows:', error)
        }
      }
      
      // Create project info from repository data
      const project: ProjectInfoDTO = {
        createdAt: repoData.created_at,
        defaultBranch: repoData.default_branch,
        description: repoData.description,
        fullName: repoData.full_name,
        isArchived: repoData.archived,
        isFork: repoData.fork,
        license: repoData['license'] && typeof repoData['license'] === 'object' && 'spdx_id' in repoData['license'] 
          ? (repoData['license'] as {spdx_id: string})['spdx_id'] 
          : null,
        name: repoData.name,
        owner: repoData.owner.login,
        primaryLanguage: repoData.language || 'Unknown',
        topics: repoData.topics || [],
        updatedAt: repoData.updated_at,
        visibility: repoData.private ? 'private' : 'public',
      }
      
      // Update summary counts
      activity.contributorCount = contributors.length
      activity.releaseCount = releases.length
      // Note: commitCount, issueCount, prCount would require additional API calls
      // For now, using the recent counts as approximations
      activity.commitCount = activity.recentCommits
      activity.issueCount = activity.recentIssues  
      activity.prCount = activity.recentPullRequests
      
      return {
        activity,
        contributors,
        project,
        releases,
        workflows,
      }
    } catch (error) {
      throw new Error(`Failed to collect repository data: ${error}`)
    }
  }
}