/**
 * @file Service for fetching issue data from GitHub
 */

import type { IGitHubApiService } from '../../interfaces/IGitHubApiService.js'

/**
 * Issue data
 */
export interface IssueData {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  labels: string[]
  assignees: string[]
  comments: number
  isPullRequest: boolean
}

/**
 * Service for fetching issue data
 */
export class IssueService {
  constructor(
    private githubApi: IGitHubApiService
  ) {}

  /**
   * Fetch issues for a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Query options
   * @returns Array of issue data
   */
  async fetchIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all'
      limit?: number
      since?: Date
      labels?: string[]
    } = {}
  ): Promise<IssueData[]> {
    try {
      const { state = 'all', limit = 30, since, labels } = options

      // Build query parameters
      const params: Record<string, any> = {
        state,
        per_page: limit,
        sort: 'updated',
        direction: 'desc'
      }

      if (since) {
        params.since = since.toISOString()
      }

      if (labels && labels.length > 0) {
        params.labels = labels.join(',')
      }

      const response = await (this.githubApi as unknown as {
        request(route: string, params: any): Promise<{ data: any[] }>
      }).request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        ...params
      })

      // Filter out pull requests (GitHub API returns both issues and PRs in issues endpoint)
      return response.data
        .filter(issue => !issue.pull_request)
        .map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          author: issue.user?.login || 'unknown',
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
          labels: issue.labels?.map((l: any) => l.name) || [],
          assignees: issue.assignees?.map((a: any) => a.login) || [],
          comments: issue.comments || 0,
          isPullRequest: false
        }))
    } catch (error) {
      throw new Error(`Failed to fetch issues: ${error}`)
    }
  }

  /**
   * Fetch issue activity summary
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param days - Number of days to look back
   * @returns Summary of issue activity
   */
  async fetchIssueActivity(
    owner: string,
    repo: string,
    days: number = 7
  ): Promise<{
    total: number
    open: number
    closed: number
    newIssues: number
    avgTimeToClose?: number
    topLabels: Array<{ label: string; count: number }>
  }> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const issues = await this.fetchIssues(owner, repo, {
      state: 'all',
      limit: 100,
      since
    })

    const open = issues.filter(issue => issue.state === 'open').length
    const closed = issues.filter(issue => issue.state === 'closed').length
    const newIssues = issues.filter(issue => issue.createdAt >= since).length

    // Calculate average time to close
    const closedIssues = issues.filter(issue => issue.state === 'closed' && issue.closedAt)
    let avgTimeToClose: number | undefined
    
    if (closedIssues.length > 0) {
      const totalTime = closedIssues.reduce((sum, issue) => {
        const timeToClose = issue.closedAt!.getTime() - issue.createdAt.getTime()
        return sum + timeToClose
      }, 0)
      avgTimeToClose = Math.round(totalTime / closedIssues.length / (1000 * 60 * 60 * 24)) // Days
    }

    // Calculate top labels
    const labelCounts = new Map<string, number>()
    issues.forEach(issue => {
      issue.labels.forEach(label => {
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
      })
    })

    const topLabels = Array.from(labelCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: issues.length,
      open,
      closed,
      newIssues,
      avgTimeToClose,
      topLabels
    }
  }
}