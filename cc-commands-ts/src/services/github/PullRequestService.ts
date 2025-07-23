/**
 * @file Service for fetching pull request data from GitHub
 */

import type { IGitHubApiService } from '../../interfaces/IGitHubApiService.js'

/**
 * Pull request data
 */
export interface PullRequestData {
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  author: string
  createdAt: Date
  updatedAt: Date
  mergedAt?: Date
  draft: boolean
  labels: string[]
  reviewers: string[]
  comments: number
}

/**
 * Service for fetching pull request data
 */
export class PullRequestService {
  constructor(
    private githubApi: IGitHubApiService
  ) {}

  /**
   * Fetch pull requests for a repository
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Query options
   * @returns Array of pull request data
   */
  async fetchPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all'
      limit?: number
      since?: Date
    } = {}
  ): Promise<PullRequestData[]> {
    try {
      const { state = 'all', limit = 30, since } = options

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

      const response = await (this.githubApi as unknown as {
        request(route: string, params: any): Promise<{ data: any[] }>
      }).request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        ...params
      })

      return response.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.merged_at ? 'merged' : pr.state,
        author: pr.user?.login || 'unknown',
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
        draft: pr.draft || false,
        labels: pr.labels?.map((l: any) => l.name) || [],
        reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
        comments: pr.comments || 0
      }))
    } catch (error) {
      throw new Error(`Failed to fetch pull requests: ${error}`)
    }
  }

  /**
   * Fetch recent pull request activity summary
   * 
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param days - Number of days to look back
   * @returns Summary of PR activity
   */
  async fetchPullRequestActivity(
    owner: string,
    repo: string,
    days: number = 7
  ): Promise<{
    total: number
    open: number
    merged: number
    closed: number
    draft: number
    avgTimeToMerge?: number
  }> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const prs = await this.fetchPullRequests(owner, repo, {
      state: 'all',
      limit: 100,
      since
    })

    const open = prs.filter(pr => pr.state === 'open').length
    const merged = prs.filter(pr => pr.state === 'merged').length
    const closed = prs.filter(pr => pr.state === 'closed' && !pr.mergedAt).length
    const draft = prs.filter(pr => pr.draft).length

    // Calculate average time to merge
    const mergedPRs = prs.filter(pr => pr.state === 'merged' && pr.mergedAt)
    let avgTimeToMerge: number | undefined
    
    if (mergedPRs.length > 0) {
      const totalTime = mergedPRs.reduce((sum, pr) => {
        const timeToMerge = pr.mergedAt!.getTime() - pr.createdAt.getTime()
        return sum + timeToMerge
      }, 0)
      avgTimeToMerge = Math.round(totalTime / mergedPRs.length / (1000 * 60 * 60 * 24)) // Days
    }

    return {
      total: prs.length,
      open,
      merged,
      closed,
      draft,
      avgTimeToMerge
    }
  }
}