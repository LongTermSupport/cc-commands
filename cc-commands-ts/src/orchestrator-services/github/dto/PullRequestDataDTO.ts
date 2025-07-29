/**
 * @file GitHub Pull Request Data Transfer Object
 * 
 * Represents individual GitHub pull requests with transformation from GitHub API
 * responses to standardized LLM data format. Handles PR metadata, review status,
 * merge information, and change statistics.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'

/**
 * Data Transfer Object for GitHub pull requests
 * 
 * This DTO encapsulates information about individual GitHub pull requests,
 * including their metadata, review status, merge information, and change
 * statistics. It provides transformation from various GitHub API formats
 * to standardized LLM data format.
 */
export class PullRequestDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PR_ADDITIONS: 'PR_ADDITIONS',
    PR_ASSIGNEES: 'PR_ASSIGNEES',
    PR_BASE_BRANCH: 'PR_BASE_BRANCH',
    PR_BODY: 'PR_BODY',
    PR_CHANGED_FILES: 'PR_CHANGED_FILES',
    PR_CLOSED_AT: 'PR_CLOSED_AT',
    PR_COMMENTS_COUNT: 'PR_COMMENTS_COUNT',
    PR_COMMITS_COUNT: 'PR_COMMITS_COUNT',
    PR_CREATED_AT: 'PR_CREATED_AT',
    PR_CREATOR: 'PR_CREATOR',
    PR_DELETIONS: 'PR_DELETIONS',
    PR_DRAFT: 'PR_DRAFT',
    PR_HEAD_BRANCH: 'PR_HEAD_BRANCH',
    PR_ID: 'PR_ID',
    PR_LABELS: 'PR_LABELS',
    PR_LOCKED: 'PR_LOCKED',
    PR_MERGEABLE: 'PR_MERGEABLE',
    PR_MERGED: 'PR_MERGED',
    PR_MERGED_AT: 'PR_MERGED_AT',
    PR_MERGED_BY: 'PR_MERGED_BY',
    PR_MILESTONE: 'PR_MILESTONE',
    PR_NUMBER: 'PR_NUMBER',
    PR_REPOSITORY: 'PR_REPOSITORY',
    PR_REQUESTED_REVIEWERS: 'PR_REQUESTED_REVIEWERS',
    PR_REVIEW_COMMENTS_COUNT: 'PR_REVIEW_COMMENTS_COUNT',
    PR_STATE: 'PR_STATE',
    PR_TITLE: 'PR_TITLE',
    PR_UPDATED_AT: 'PR_UPDATED_AT',
    PR_URL: 'PR_URL'
  } as const

  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly title: string,
    public readonly body: string,
    public readonly state: 'closed' | 'open',
    public readonly draft: boolean,
    public readonly locked: boolean,
    public readonly merged: boolean,
    public readonly mergeable: boolean | null,
    public readonly assignees: string[],
    public readonly requestedReviewers: string[],
    public readonly labels: string[],
    public readonly milestone: null | string,
    public readonly creator: string,
    public readonly mergedBy: null | string,
    public readonly repository: string,
    public readonly url: string,
    public readonly headBranch: string,
    public readonly baseBranch: string,
    public readonly commentsCount: number,
    public readonly reviewCommentsCount: number,
    public readonly commitsCount: number,
    public readonly additions: number,
    public readonly deletions: number,
    public readonly changedFiles: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly closedAt: Date | null,
    public readonly mergedAt: Date | null
  ) {}

  /**
   * Create PullRequestDataDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI PR commands
   * @returns New PullRequestDataDTO instance
   */
  static fromCliOutput(cliOutput: {
    additions?: number
    assignees?: string[]
    baseRefName?: string
    body?: string
    changedFiles?: number
    closedAt?: string
    comments?: number
    commits?: number
    createdAt?: string
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    isDraft?: boolean
    labels?: string[]
    locked?: boolean
    mergeable?: string
    merged?: boolean
    mergedAt?: string
    mergedBy?: { login?: string }
    milestone?: string
    number?: number
    repository?: string
    requestedReviewers?: string[]
    reviewComments?: number
    state?: string
    title?: string
    updatedAt?: string
    url?: string
    user?: { login?: string }
  }): PullRequestDataDTO {
    this.validateCliOutput(cliOutput)
    
    return this.createFromCliData(cliOutput)
  }

  /**
   * Create PullRequestDataDTO from GitHub REST API response
   * 
   * @param apiResponse - Raw response from GitHub REST API
   * @returns New PullRequestDataDTO instance
   */
  static fromGitHubApiResponse(apiResponse: {
    additions?: number
    assignees?: Array<{ login?: string }>
    base?: { ref?: string }
    body?: null | string
    changed_files?: number
    closed_at?: null | string
    comments?: number
    commits?: number
    created_at?: string
    deletions?: number
    draft?: boolean
    head?: { ref?: string }
    html_url?: string
    id?: number
    labels?: Array<{ name?: string }>
    locked?: boolean
    mergeable?: boolean | null
    merged?: boolean
    merged_at?: null | string
    merged_by?: null | { login?: string }
    milestone?: null | { title?: string }
    number?: number
    repository?: { full_name?: string }
    repository_url?: string
    requested_reviewers?: Array<{ login?: string }>
    review_comments?: number
    state?: string
    title?: string
    updated_at?: string
    user?: { login?: string }
  }): PullRequestDataDTO {
    this.validateApiResponse(apiResponse)
    
    return this.createFromApiResponse(apiResponse)
  }

  /**
   * Create PullRequestDataDTO from GitHub GraphQL API response
   * 
   * @param apiResponse - Raw response from GitHub GraphQL API
   * @param repository - Repository name (owner/repo format)
   * @returns New PullRequestDataDTO instance
   */
  static fromGraphQLResponse(apiResponse: {
    additions?: number
    assignees?: {
      nodes?: Array<{ login?: string }>
    }
    author?: { login?: string }
    baseRefName?: string
    body?: string
    changedFiles?: number
    closed?: boolean
    closedAt?: string
    comments?: { totalCount?: number }
    commits?: { totalCount?: number }
    createdAt?: string
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    labels?: {
      nodes?: Array<{ name?: string }>
    }
    locked?: boolean
    mergeable?: string
    merged?: boolean
    mergedAt?: string
    mergedBy?: { login?: string }
    milestone?: { title?: string }
    number?: number
    reviewRequests?: {
      nodes?: Array<{ requestedReviewer?: { login?: string } }>
    }
    reviews?: { totalCount?: number }
    state?: string
    title?: string
    updatedAt?: string
    url?: string
  }, repository: string): PullRequestDataDTO {
    this.validateGraphQLResponse(apiResponse)
    
    return this.createFromGraphQLResponse(apiResponse, repository)
  }

  /**
   * Create PullRequestDataDTO from REST API response data
   */
  private static createFromApiResponse(apiResponse: {
    additions?: number
    assignees?: Array<{ login?: string }>
    base?: { ref?: string }
    body?: null | string
    changed_files?: number
    closed_at?: null | string
    comments?: number
    commits?: number
    created_at?: string
    deletions?: number
    draft?: boolean
    head?: { ref?: string }
    html_url?: string
    id?: number
    labels?: Array<{ name?: string }>
    locked?: boolean
    mergeable?: boolean | null
    merged?: boolean
    merged_at?: null | string
    merged_by?: null | { login?: string }
    milestone?: null | { title?: string }
    number?: number
    repository?: { full_name?: string }
    repository_url?: string
    requested_reviewers?: Array<{ login?: string }>
    review_comments?: number
    state?: string
    title?: string
    updated_at?: string
    user?: { login?: string }
  }): PullRequestDataDTO {
    const basicData = this.extractApiBasicData(apiResponse)
    const relationships = this.extractApiRelationships(apiResponse)
    const dates = this.extractApiDates(apiResponse)
    
    return new PullRequestDataDTO(
      basicData.id,
      basicData.number,
      basicData.title,
      basicData.body,
      basicData.state,
      basicData.draft,
      basicData.locked,
      basicData.merged,
      basicData.mergeable,
      relationships.assignees,
      relationships.requestedReviewers,
      relationships.labels,
      relationships.milestone,
      relationships.creator,
      relationships.mergedBy,
      relationships.repository,
      basicData.url,
      basicData.headBranch,
      basicData.baseBranch,
      basicData.commentsCount,
      basicData.reviewCommentsCount,
      basicData.commitsCount,
      basicData.additions,
      basicData.deletions,
      basicData.changedFiles,
      dates.createdAt,
      dates.updatedAt,
      dates.closedAt,
      dates.mergedAt
    )
  }

  /**
   * Create PullRequestDataDTO from processed CLI data
   */
  private static createFromCliData(cliOutput: {
    additions?: number
    assignees?: string[]
    baseRefName?: string
    body?: string
    changedFiles?: number
    closedAt?: string
    comments?: number
    commits?: number
    createdAt?: string
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    isDraft?: boolean
    labels?: string[]
    locked?: boolean
    mergeable?: string
    merged?: boolean
    mergedAt?: string
    mergedBy?: { login?: string }
    milestone?: string
    number?: number
    repository?: string
    requestedReviewers?: string[]
    reviewComments?: number
    state?: string
    title?: string
    updatedAt?: string
    url?: string
    user?: { login?: string }
  }): PullRequestDataDTO {
    const basicData = this.extractCliBasicData(cliOutput)
    const relationships = this.extractCliRelationships(cliOutput)
    const dates = this.extractCliDates(cliOutput)
    
    return new PullRequestDataDTO(
      basicData.id,
      basicData.number,
      basicData.title,
      basicData.body,
      basicData.state,
      basicData.draft,
      basicData.locked,
      basicData.merged,
      basicData.mergeable,
      relationships.assignees,
      relationships.requestedReviewers,
      relationships.labels,
      relationships.milestone,
      relationships.creator,
      relationships.mergedBy,
      relationships.repository,
      basicData.url,
      basicData.headBranch,
      basicData.baseBranch,
      basicData.commentsCount,
      basicData.reviewCommentsCount,
      basicData.commitsCount,
      basicData.additions,
      basicData.deletions,
      basicData.changedFiles,
      dates.createdAt,
      dates.updatedAt,
      dates.closedAt,
      dates.mergedAt
    )
  }

  /**
   * Create PullRequestDataDTO from GraphQL response data
   */
  private static createFromGraphQLResponse(apiResponse: {
    additions?: number
    assignees?: {
      nodes?: Array<{ login?: string }>
    }
    author?: { login?: string }
    baseRefName?: string
    body?: string
    changedFiles?: number
    closed?: boolean
    closedAt?: string
    comments?: { totalCount?: number }
    commits?: { totalCount?: number }
    createdAt?: string
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    labels?: {
      nodes?: Array<{ name?: string }>
    }
    locked?: boolean
    mergeable?: string
    merged?: boolean
    mergedAt?: string
    mergedBy?: { login?: string }
    milestone?: { title?: string }
    number?: number
    reviewRequests?: {
      nodes?: Array<{ requestedReviewer?: { login?: string } }>
    }
    reviews?: { totalCount?: number }
    state?: string
    title?: string
    updatedAt?: string
    url?: string
  }, repository: string): PullRequestDataDTO {
    const basicData = this.extractGraphQLBasicData(apiResponse)
    const relationships = this.extractGraphQLRelationships(apiResponse, repository)
    const dates = this.extractGraphQLDates(apiResponse)
    
    return new PullRequestDataDTO(
      basicData.id,
      basicData.number,
      basicData.title,
      basicData.body,
      basicData.state,
      basicData.draft,
      basicData.locked,
      basicData.merged,
      basicData.mergeable,
      relationships.assignees,
      relationships.requestedReviewers,
      relationships.labels,
      relationships.milestone,
      relationships.creator,
      relationships.mergedBy,
      relationships.repository,
      basicData.url,
      basicData.headBranch,
      basicData.baseBranch,
      basicData.commentsCount,
      basicData.reviewCommentsCount,
      basicData.commitsCount,
      basicData.additions,
      basicData.deletions,
      basicData.changedFiles,
      dates.createdAt,
      dates.updatedAt,
      dates.closedAt,
      dates.mergedAt
    )
  }

  /**
   * Extract basic data from API response
   */
  private static extractApiBasicData(apiResponse: {
    additions?: number
    base?: { ref?: string }
    body?: null | string
    changed_files?: number
    comments?: number
    commits?: number
    deletions?: number
    draft?: boolean
    head?: { ref?: string }
    html_url?: string
    id?: number
    locked?: boolean
    mergeable?: boolean | null
    merged?: boolean
    number?: number
    review_comments?: number
    state?: string
    title?: string
  }): {
    additions: number
    baseBranch: string
    body: string
    changedFiles: number
    commentsCount: number
    commitsCount: number
    deletions: number
    draft: boolean
    headBranch: string
    id: string
    locked: boolean
    mergeable: boolean | null
    merged: boolean
    number: number
    reviewCommentsCount: number
    state: 'closed' | 'open'
    title: string
    url: string
  } {
    return {
      additions: apiResponse.additions || 0,
      baseBranch: apiResponse.base?.ref || 'main',
      body: apiResponse.body || '',
      changedFiles: apiResponse.changed_files || 0,
      commentsCount: apiResponse.comments || 0,
      commitsCount: apiResponse.commits || 0,
      deletions: apiResponse.deletions || 0,
      draft: Boolean(apiResponse.draft),
      headBranch: apiResponse.head?.ref || 'unknown',
      id: String(apiResponse.id || 0),
      locked: Boolean(apiResponse.locked),
      mergeable: apiResponse.mergeable || null,
      merged: Boolean(apiResponse.merged),
      number: apiResponse.number || 0,
      reviewCommentsCount: apiResponse.review_comments || 0,
      state: this.normalizeState(apiResponse.state),
      title: apiResponse.title || 'Untitled Pull Request',
      url: apiResponse.html_url || ''
    }
  }

  /**
   * Extract dates from API response
   */
  private static extractApiDates(apiResponse: {
    closed_at?: null | string
    created_at?: string
    merged_at?: null | string
    updated_at?: string
  }): {
    closedAt: Date | null
    createdAt: Date
    mergedAt: Date | null
    updatedAt: Date
  } {
    return {
      closedAt: apiResponse.closed_at ? new Date(apiResponse.closed_at) : null,
      createdAt: new Date(apiResponse.created_at || Date.now()),
      mergedAt: apiResponse.merged_at ? new Date(apiResponse.merged_at) : null,
      updatedAt: new Date(apiResponse.updated_at || Date.now())
    }
  }

  /**
   * Extract relationships from API response
   */
  private static extractApiRelationships(apiResponse: {
    assignees?: Array<{ login?: string }>
    labels?: Array<{ name?: string }>
    merged_by?: null | { login?: string }
    milestone?: null | { title?: string }
    repository?: { full_name?: string }
    repository_url?: string
    requested_reviewers?: Array<{ login?: string }>
    user?: { login?: string }
  }): {
    assignees: string[]
    creator: string
    labels: string[]
    mergedBy: null | string
    milestone: null | string
    repository: string
    requestedReviewers: string[]
  } {
    return {
      assignees: this.extractAssignees(apiResponse.assignees),
      creator: apiResponse.user?.login || 'unknown',
      labels: this.extractLabels(apiResponse.labels),
      mergedBy: apiResponse.merged_by?.login || null,
      milestone: apiResponse.milestone?.title || null,
      repository: this.extractRepository(apiResponse.repository?.full_name, apiResponse.repository_url),
      requestedReviewers: this.extractRequestedReviewers(apiResponse.requested_reviewers)
    }
  }

  /**
   * Extract assignees from REST API response
   */
  private static extractAssignees(assignees?: Array<{ login?: string }>): string[] {
    return assignees?.map(assignee => assignee.login || '').filter(Boolean) || []
  }

  /**
   * Extract basic data from CLI output
   */
  private static extractCliBasicData(cliOutput: {
    additions?: number
    baseRefName?: string
    body?: string
    changedFiles?: number
    comments?: number
    commits?: number
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    isDraft?: boolean
    locked?: boolean
    mergeable?: string
    merged?: boolean
    number?: number
    reviewComments?: number
    state?: string
    title?: string
    url?: string
  }): {
    additions: number
    baseBranch: string
    body: string
    changedFiles: number
    commentsCount: number
    commitsCount: number
    deletions: number
    draft: boolean
    headBranch: string
    id: string
    locked: boolean
    mergeable: boolean | null
    merged: boolean
    number: number
    reviewCommentsCount: number
    state: 'closed' | 'open'
    title: string
    url: string
  } {
    return {
      additions: cliOutput.additions || 0,
      baseBranch: cliOutput.baseRefName || 'main',
      body: cliOutput.body || '',
      changedFiles: cliOutput.changedFiles || 0,
      commentsCount: cliOutput.comments || 0,
      commitsCount: cliOutput.commits || 0,
      deletions: cliOutput.deletions || 0,
      draft: Boolean(cliOutput.draft || cliOutput.isDraft),
      headBranch: cliOutput.headRefName || 'unknown',
      id: cliOutput.id || '',
      locked: Boolean(cliOutput.locked),
      mergeable: this.normalizeMergeable(cliOutput.mergeable),
      merged: Boolean(cliOutput.merged),
      number: cliOutput.number || 0,
      reviewCommentsCount: cliOutput.reviewComments || 0,
      state: this.normalizeState(cliOutput.state),
      title: cliOutput.title || 'Untitled Pull Request',
      url: cliOutput.url || ''
    }
  }

  /**
   * Extract dates from CLI output
   */
  private static extractCliDates(cliOutput: {
    closedAt?: string
    createdAt?: string
    mergedAt?: string
    updatedAt?: string
  }): {
    closedAt: Date | null
    createdAt: Date
    mergedAt: Date | null
    updatedAt: Date
  } {
    return {
      closedAt: cliOutput.closedAt ? new Date(cliOutput.closedAt) : null,
      createdAt: new Date(cliOutput.createdAt || Date.now()),
      mergedAt: cliOutput.mergedAt ? new Date(cliOutput.mergedAt) : null,
      updatedAt: new Date(cliOutput.updatedAt || Date.now())
    }
  }

  /**
   * Extract relationships from CLI output
   */
  private static extractCliRelationships(cliOutput: {
    assignees?: string[]
    labels?: string[]
    mergedBy?: { login?: string }
    milestone?: string
    repository?: string
    requestedReviewers?: string[]
    user?: { login?: string }
  }): {
    assignees: string[]
    creator: string
    labels: string[]
    mergedBy: null | string
    milestone: null | string
    repository: string
    requestedReviewers: string[]
  } {
    return {
      assignees: cliOutput.assignees || [],
      creator: cliOutput.user?.login || 'unknown',
      labels: cliOutput.labels || [],
      mergedBy: cliOutput.mergedBy?.login || null,
      milestone: cliOutput.milestone || null,
      repository: cliOutput.repository || 'unknown/unknown',
      requestedReviewers: cliOutput.requestedReviewers || []
    }
  }

  /**
   * Extract assignees from GraphQL response
   */
  private static extractGraphQLAssignees(assignees?: {
    nodes?: Array<{ login?: string }>
  }): string[] {
    return assignees?.nodes?.map(assignee => assignee.login || '').filter(Boolean) || []
  }

  /**
   * Extract basic data from GraphQL response
   */
  private static extractGraphQLBasicData(apiResponse: {
    additions?: number
    baseRefName?: string
    body?: string
    changedFiles?: number
    closed?: boolean
    comments?: { totalCount?: number }
    commits?: { totalCount?: number }
    deletions?: number
    draft?: boolean
    headRefName?: string
    id?: string
    locked?: boolean
    mergeable?: string
    merged?: boolean
    number?: number
    reviews?: { totalCount?: number }
    state?: string
    title?: string
    url?: string
  }): {
    additions: number
    baseBranch: string
    body: string
    changedFiles: number
    commentsCount: number
    commitsCount: number
    deletions: number
    draft: boolean
    headBranch: string
    id: string
    locked: boolean
    mergeable: boolean | null
    merged: boolean
    number: number
    reviewCommentsCount: number
    state: 'closed' | 'open'
    title: string
    url: string
  } {
    return {
      additions: apiResponse.additions || 0,
      baseBranch: apiResponse.baseRefName || 'main',
      body: apiResponse.body || '',
      changedFiles: apiResponse.changedFiles || 0,
      commentsCount: apiResponse.comments?.totalCount || 0,
      commitsCount: apiResponse.commits?.totalCount || 0,
      deletions: apiResponse.deletions || 0,
      draft: Boolean(apiResponse.draft),
      headBranch: apiResponse.headRefName || 'unknown',
      id: apiResponse.id || '',
      locked: Boolean(apiResponse.locked),
      mergeable: this.normalizeGraphQLMergeable(apiResponse.mergeable),
      merged: Boolean(apiResponse.merged),
      number: apiResponse.number || 0,
      reviewCommentsCount: apiResponse.reviews?.totalCount || 0,
      state: this.normalizeGraphQLState(apiResponse.state, apiResponse.closed),
      title: apiResponse.title || 'Untitled Pull Request',
      url: apiResponse.url || ''
    }
  }

  /**
   * Extract dates from GraphQL response
   */
  private static extractGraphQLDates(apiResponse: {
    closedAt?: string
    createdAt?: string
    mergedAt?: string
    updatedAt?: string
  }): {
    closedAt: Date | null
    createdAt: Date
    mergedAt: Date | null
    updatedAt: Date
  } {
    return {
      closedAt: apiResponse.closedAt ? new Date(apiResponse.closedAt) : null,
      createdAt: new Date(apiResponse.createdAt || Date.now()),
      mergedAt: apiResponse.mergedAt ? new Date(apiResponse.mergedAt) : null,
      updatedAt: new Date(apiResponse.updatedAt || Date.now())
    }
  }

  /**
   * Extract labels from GraphQL response
   */
  private static extractGraphQLLabels(labels?: {
    nodes?: Array<{ name?: string }>
  }): string[] {
    return labels?.nodes?.map(label => label.name || '').filter(Boolean) || []
  }

  /**
   * Extract relationships from GraphQL response
   */
  private static extractGraphQLRelationships(apiResponse: {
    assignees?: {
      nodes?: Array<{ login?: string }>
    }
    author?: { login?: string }
    labels?: {
      nodes?: Array<{ name?: string }>
    }
    mergedBy?: { login?: string }
    milestone?: { title?: string }
    reviewRequests?: {
      nodes?: Array<{ requestedReviewer?: { login?: string } }>
    }
  }, repository: string): {
    assignees: string[]
    creator: string
    labels: string[]
    mergedBy: null | string
    milestone: null | string
    repository: string
    requestedReviewers: string[]
  } {
    return {
      assignees: this.extractGraphQLAssignees(apiResponse.assignees),
      creator: apiResponse.author?.login || 'unknown',
      labels: this.extractGraphQLLabels(apiResponse.labels),
      mergedBy: apiResponse.mergedBy?.login || null,
      milestone: apiResponse.milestone?.title || null,
      repository,
      requestedReviewers: this.extractGraphQLRequestedReviewers(apiResponse.reviewRequests)
    }
  }

  /**
   * Extract requested reviewers from GraphQL response
   */
  private static extractGraphQLRequestedReviewers(reviewRequests?: {
    nodes?: Array<{ requestedReviewer?: { login?: string } }>
  }): string[] {
    return reviewRequests?.nodes?.map(request => request.requestedReviewer?.login || '').filter(Boolean) || []
  }

  /**
   * Extract labels from REST API response
   */
  private static extractLabels(labels?: Array<{ name?: string }>): string[] {
    return labels?.map(label => label.name || '').filter(Boolean) || []
  }

  /**
   * Extract repository name from API response
   */
  private static extractRepository(fullName?: string, repositoryUrl?: string): string {
    if (fullName) return fullName
    
    if (repositoryUrl) {
      const match = repositoryUrl.match(/\/repos\/([^/]+\/[^/]+)/)
      if (match && match[1]) return match[1]
    }
    
    return 'unknown/unknown'
  }

  /**
   * Extract requested reviewers from REST API response
   */
  private static extractRequestedReviewers(reviewers?: Array<{ login?: string }>): string[] {
    return reviewers?.map(reviewer => reviewer.login || '').filter(Boolean) || []
  }

  /**
   * Normalize GraphQL mergeable state
   */
  private static normalizeGraphQLMergeable(mergeable?: string): boolean | null {
    if (mergeable === 'MERGEABLE') return true
    if (mergeable === 'CONFLICTING') return false
    return null // UNKNOWN state
  }

  /**
   * Normalize GraphQL state to standard format
   */
  private static normalizeGraphQLState(state?: string, closed?: boolean): 'closed' | 'open' {
    if (closed === true || state === 'CLOSED' || state === 'MERGED') return 'closed'
    return 'open'
  }

  /**
   * Normalize mergeable string to boolean
   */
  private static normalizeMergeable(mergeable?: string): boolean | null {
    if (mergeable === 'true') return true
    if (mergeable === 'false') return false
    return null
  }

  /**
   * Normalize state string to standard format
   */
  private static normalizeState(state?: string): 'closed' | 'open' {
    return state?.toLowerCase() === 'closed' ? 'closed' : 'open'
  }

  /**
   * Validate REST API response
   */
  private static validateApiResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub pull request API response: response is null, undefined, or not an object')
    }
  }

  /**
   * Validate CLI output
   */
  private static validateCliOutput(cliOutput: unknown): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI pull request output: output is null, undefined, or not an object')
    }
  }

  /**
   * Validate GraphQL API response
   */
  private static validateGraphQLResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub pull request GraphQL response: response is null, undefined, or not an object')
    }
  }

  /**
   * Get age of pull request in days
   * 
   * @returns Number of days since PR creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since closure (if closed)
   * 
   * @returns Number of days since closure, or null if not closed
   */
  getDaysSinceClosure(): null | number {
    if (!this.closedAt) return null
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.closedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since merge (if merged)
   * 
   * @returns Number of days since merge, or null if not merged
   */
  getDaysSinceMerge(): null | number {
    if (!this.mergedAt) return null
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.mergedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   * 
   * @returns Number of days since last PR update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate net line changes (additions - deletions)
   * 
   * @returns Net change in lines of code
   */
  getNetChanges(): number {
    return this.additions - this.deletions
  }

  /**
   * Get a human-readable summary of the pull request
   * 
   * @returns Brief PR description for logging/debugging
   */
  getSummary(): string {
    const typeStr = this.draft ? 'draft PR' : 'PR'
    const statusStr = this.merged ? ' (merged)' : this.state === 'closed' ? ' (closed)' : ' (open)'
    const labelStr = this.labels.length > 0 ? ` [${this.labels.join(', ')}]` : ''
    return `${typeStr} #${this.number}: ${this.title}${statusStr}${labelStr}`
  }

  /**
   * Check if this PR has a specific label
   * 
   * @param labelName - Label name to check for
   * @returns True if PR has the label
   */
  hasLabel(labelName: string): boolean {
    return this.labels.includes(labelName)
  }

  /**
   * Check if PR has recent activity (updated within specified days)
   * 
   * @param days - Number of days to consider as recent (default: 7)
   * @returns True if PR was updated within the specified time frame
   */
  hasRecentActivity(days: number = 7): boolean {
    return this.getDaysSinceUpdate() <= days
  }

  /**
   * Check if this PR is assigned to a specific user
   * 
   * @param username - Username to check for
   * @returns True if PR is assigned to the user
   */
  isAssignedTo(username: string): boolean {
    return this.assignees.includes(username)
  }

  /**
   * Check if this PR is closed
   * 
   * @returns True if PR is closed
   */
  isClosed(): boolean {
    return this.state === 'closed'
  }

  /**
   * Check if this PR is a draft
   * 
   * @returns True if PR is a draft
   */
  isDraft(): boolean {
    return this.draft
  }

  /**
   * Check if this PR is merged
   * 
   * @returns True if PR is merged
   */
  isMerged(): boolean {
    return this.merged
  }

  /**
   * Check if this PR is open
   * 
   * @returns True if PR is open
   */
  isOpen(): boolean {
    return this.state === 'open'
  }

  /**
   * Check if PR is ready for review (not draft and open)
   * 
   * @returns True if PR is ready for review
   */
  isReadyForReview(): boolean {
    return !this.draft && this.isOpen()
  }

  /**
   * Check if PR has a review request for a specific user
   * 
   * @param username - Username to check for
   * @returns True if user is requested as reviewer
   */
  isRequestedReviewer(username: string): boolean {
    return this.requestedReviewers.includes(username)
  }

  /**
   * Check if PR is stale (no activity for specified days)
   * 
   * @param days - Number of days to consider as stale (default: 30)
   * @returns True if PR hasn't been updated within the specified time frame
   */
  isStale(days: number = 30): boolean {
    return this.getDaysSinceUpdate() > days
  }

  /**
   * Convert pull request data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [PullRequestDataDTO.Keys.PR_ADDITIONS]: String(this.additions),
      [PullRequestDataDTO.Keys.PR_ASSIGNEES]: this.assignees.join(', '),
      [PullRequestDataDTO.Keys.PR_BASE_BRANCH]: this.baseBranch,
      [PullRequestDataDTO.Keys.PR_BODY]: this.body,
      [PullRequestDataDTO.Keys.PR_CHANGED_FILES]: String(this.changedFiles),
      [PullRequestDataDTO.Keys.PR_CLOSED_AT]: this.closedAt ? this.closedAt.toISOString() : '',
      [PullRequestDataDTO.Keys.PR_COMMENTS_COUNT]: String(this.commentsCount),
      [PullRequestDataDTO.Keys.PR_COMMITS_COUNT]: String(this.commitsCount),
      [PullRequestDataDTO.Keys.PR_CREATED_AT]: this.createdAt.toISOString(),
      [PullRequestDataDTO.Keys.PR_CREATOR]: this.creator,
      [PullRequestDataDTO.Keys.PR_DELETIONS]: String(this.deletions),
      [PullRequestDataDTO.Keys.PR_DRAFT]: String(this.draft),
      [PullRequestDataDTO.Keys.PR_HEAD_BRANCH]: this.headBranch,
      [PullRequestDataDTO.Keys.PR_ID]: this.id,
      [PullRequestDataDTO.Keys.PR_LABELS]: this.labels.join(', '),
      [PullRequestDataDTO.Keys.PR_LOCKED]: String(this.locked),
      [PullRequestDataDTO.Keys.PR_MERGEABLE]: this.mergeable === null ? '' : String(this.mergeable),
      [PullRequestDataDTO.Keys.PR_MERGED]: String(this.merged),
      [PullRequestDataDTO.Keys.PR_MERGED_AT]: this.mergedAt ? this.mergedAt.toISOString() : '',
      [PullRequestDataDTO.Keys.PR_MERGED_BY]: this.mergedBy || '',
      [PullRequestDataDTO.Keys.PR_MILESTONE]: this.milestone || '',
      [PullRequestDataDTO.Keys.PR_NUMBER]: String(this.number),
      [PullRequestDataDTO.Keys.PR_REPOSITORY]: this.repository,
      [PullRequestDataDTO.Keys.PR_REQUESTED_REVIEWERS]: this.requestedReviewers.join(', '),
      [PullRequestDataDTO.Keys.PR_REVIEW_COMMENTS_COUNT]: String(this.reviewCommentsCount),
      [PullRequestDataDTO.Keys.PR_STATE]: this.state,
      [PullRequestDataDTO.Keys.PR_TITLE]: this.title,
      [PullRequestDataDTO.Keys.PR_UPDATED_AT]: this.updatedAt.toISOString(),
      [PullRequestDataDTO.Keys.PR_URL]: this.url
    }
  }
}