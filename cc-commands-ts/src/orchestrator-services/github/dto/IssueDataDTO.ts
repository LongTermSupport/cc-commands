/**
 * @file GitHub Issue Data Transfer Object
 * 
 * Represents individual GitHub issues with transformation from GitHub API
 * responses to standardized LLM data format. Handles issue metadata,
 * relationships, and state information.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO'

/**
 * Data Transfer Object for GitHub issues
 * 
 * This DTO encapsulates information about individual GitHub issues,
 * including their metadata, assignees, labels, and state information.
 * It provides transformation from various GitHub API formats to
 * standardized LLM data format.
 */
export class IssueDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    ISSUE_ASSIGNEES: 'ISSUE_ASSIGNEES',
    ISSUE_BODY: 'ISSUE_BODY',
    ISSUE_CLOSED_AT: 'ISSUE_CLOSED_AT',
    ISSUE_COMMENTS_COUNT: 'ISSUE_COMMENTS_COUNT',
    ISSUE_CREATED_AT: 'ISSUE_CREATED_AT',
    ISSUE_CREATOR: 'ISSUE_CREATOR',
    ISSUE_ID: 'ISSUE_ID',
    ISSUE_LABELS: 'ISSUE_LABELS',
    ISSUE_LOCKED: 'ISSUE_LOCKED',
    ISSUE_MILESTONE: 'ISSUE_MILESTONE',
    ISSUE_NUMBER: 'ISSUE_NUMBER',
    ISSUE_REPOSITORY: 'ISSUE_REPOSITORY',
    ISSUE_STATE: 'ISSUE_STATE',
    ISSUE_TITLE: 'ISSUE_TITLE',
    ISSUE_UPDATED_AT: 'ISSUE_UPDATED_AT',
    ISSUE_URL: 'ISSUE_URL'
  } as const

  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly title: string,
    public readonly body: string,
    public readonly state: 'closed' | 'open',
    public readonly locked: boolean,
    public readonly assignees: string[],
    public readonly labels: string[],
    public readonly milestone: null | string,
    public readonly creator: string,
    public readonly repository: string,
    public readonly url: string,
    public readonly commentsCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly closedAt: Date | null
  ) {}

  /**
   * Create IssueDataDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI issue commands
   * @returns New IssueDataDTO instance
   */
  static fromCliOutput(cliOutput: {
    assignees?: string[]
    body?: string
    closedAt?: string
    comments?: number
    createdAt?: string
    id?: string
    labels?: string[]
    locked?: boolean
    milestone?: string
    number?: number
    repository?: string
    state?: string
    title?: string
    updatedAt?: string
    url?: string
    user?: { login?: string }
  }): IssueDataDTO {
    this.validateCliOutput(cliOutput)
    
    return new IssueDataDTO(
      cliOutput.id || '',
      cliOutput.number || 0,
      cliOutput.title || 'Untitled Issue',
      cliOutput.body || '',
      this.normalizeState(cliOutput.state),
      Boolean(cliOutput.locked),
      cliOutput.assignees || [],
      cliOutput.labels || [],
      cliOutput.milestone || null,
      cliOutput.user?.login || 'unknown',
      cliOutput.repository || 'unknown/unknown',
      cliOutput.url || '',
      cliOutput.comments || 0,
      new Date(cliOutput.createdAt || Date.now()),
      new Date(cliOutput.updatedAt || Date.now()),
      cliOutput.closedAt ? new Date(cliOutput.closedAt) : null
    )
  }

  /**
   * Create IssueDataDTO from GitHub REST API response
   * 
   * @param apiResponse - Raw response from GitHub REST API
   * @returns New IssueDataDTO instance
   */
  static fromGitHubApiResponse(apiResponse: {
    assignees?: Array<{ login?: string }>
    body?: null | string
    closed_at?: null | string
    comments?: number
    created_at?: string
    html_url?: string
    id?: number
    labels?: Array<{ name?: string }>
    locked?: boolean
    milestone?: null | { title?: string }
    number?: number
    repository?: { full_name?: string }
    repository_url?: string
    state?: string
    title?: string
    updated_at?: string
    user?: { login?: string }
  }): IssueDataDTO {
    this.validateApiResponse(apiResponse)
    
    const assignees = this.extractAssignees(apiResponse.assignees)
    const labels = this.extractLabels(apiResponse.labels)
    const repository = this.extractRepository(apiResponse.repository?.full_name, apiResponse.repository_url)
    
    return new IssueDataDTO(
      String(apiResponse.id || 0),
      apiResponse.number || 0,
      apiResponse.title || 'Untitled Issue',
      apiResponse.body || '',
      this.normalizeState(apiResponse.state),
      Boolean(apiResponse.locked),
      assignees,
      labels,
      apiResponse.milestone?.title || null,
      apiResponse.user?.login || 'unknown',
      repository,
      apiResponse.html_url || '',
      apiResponse.comments || 0,
      new Date(apiResponse.created_at || Date.now()),
      new Date(apiResponse.updated_at || Date.now()),
      apiResponse.closed_at ? new Date(apiResponse.closed_at) : null
    )
  }

  /**
   * Create IssueDataDTO from GitHub GraphQL API response
   * 
   * @param apiResponse - Raw response from GitHub GraphQL API
   * @param repository - Repository name (owner/repo format)
   * @returns New IssueDataDTO instance
   */
  static fromGraphQLResponse(apiResponse: {
    assignees?: {
      nodes?: Array<{ login?: string }>
    }
    author?: { login?: string }
    body?: string
    closed?: boolean
    closedAt?: string
    comments?: { totalCount?: number }
    createdAt?: string
    id?: string
    labels?: {
      nodes?: Array<{ name?: string }>
    }
    locked?: boolean
    milestone?: { title?: string }
    number?: number
    state?: string
    title?: string
    updatedAt?: string
    url?: string
  }, repository: string): IssueDataDTO {
    this.validateGraphQLResponse(apiResponse)
    
    const assignees = this.extractGraphQLAssignees(apiResponse.assignees)
    const labels = this.extractGraphQLLabels(apiResponse.labels)
    const state = this.normalizeGraphQLState(apiResponse.state, apiResponse.closed)
    
    return new IssueDataDTO(
      apiResponse.id || '',
      apiResponse.number || 0,
      apiResponse.title || 'Untitled Issue',
      apiResponse.body || '',
      state,
      Boolean(apiResponse.locked),
      assignees,
      labels,
      apiResponse.milestone?.title || null,
      apiResponse.author?.login || 'unknown',
      repository,
      apiResponse.url || '',
      apiResponse.comments?.totalCount || 0,
      new Date(apiResponse.createdAt || Date.now()),
      new Date(apiResponse.updatedAt || Date.now()),
      apiResponse.closedAt ? new Date(apiResponse.closedAt) : null
    )
  }

  /**
   * Extract assignees from REST API response
   */
  private static extractAssignees(assignees?: Array<{ login?: string }>): string[] {
    return assignees?.map(assignee => assignee.login || '').filter(Boolean) || []
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
   * Extract labels from GraphQL response
   */
  private static extractGraphQLLabels(labels?: {
    nodes?: Array<{ name?: string }>
  }): string[] {
    return labels?.nodes?.map(label => label.name || '').filter(Boolean) || []
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
   * Normalize GraphQL state to standard format
   */
  private static normalizeGraphQLState(state?: string, closed?: boolean): 'closed' | 'open' {
    if (closed === true || state === 'CLOSED') return 'closed'
    return 'open'
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
      throw new Error('Invalid GitHub issue API response: response is null, undefined, or not an object')
    }
  }

  /**
   * Validate CLI output
   */
  private static validateCliOutput(cliOutput: unknown): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI issue output: output is null, undefined, or not an object')
    }
  }

  /**
   * Validate GraphQL API response
   */
  private static validateGraphQLResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub issue GraphQL response: response is null, undefined, or not an object')
    }
  }

  /**
   * Get age of issue in days
   * 
   * @returns Number of days since issue creation
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
   * Get days since last update
   * 
   * @returns Number of days since last issue update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get a human-readable summary of the issue
   * 
   * @returns Brief issue description for logging/debugging
   */
  getSummary(): string {
    const labelStr = this.labels.length > 0 ? ` [${this.labels.join(', ')}]` : ''
    return `#${this.number}: ${this.title} (${this.state})${labelStr}`
  }

  /**
   * Check if this issue has a specific label
   * 
   * @param labelName - Label name to check for
   * @returns True if issue has the label
   */
  hasLabel(labelName: string): boolean {
    return this.labels.includes(labelName)
  }

  /**
   * Check if issue has recent activity (updated within specified days)
   * 
   * @param days - Number of days to consider as recent (default: 7)
   * @returns True if issue was updated within the specified time frame
   */
  hasRecentActivity(days: number = 7): boolean {
    return this.getDaysSinceUpdate() <= days
  }

  /**
   * Check if this issue is assigned to a specific user
   * 
   * @param username - Username to check for
   * @returns True if issue is assigned to the user
   */
  isAssignedTo(username: string): boolean {
    return this.assignees.includes(username)
  }

  /**
   * Check if this issue is closed
   * 
   * @returns True if issue is closed
   */
  isClosed(): boolean {
    return this.state === 'closed'
  }

  /**
   * Check if this issue is open
   * 
   * @returns True if issue is open
   */
  isOpen(): boolean {
    return this.state === 'open'
  }

  /**
   * Check if issue is stale (no activity for specified days)
   * 
   * @param days - Number of days to consider as stale (default: 30)
   * @returns True if issue hasn't been updated within the specified time frame
   */
  isStale(days: number = 30): boolean {
    return this.getDaysSinceUpdate() > days
  }

  /**
   * Convert issue data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [IssueDataDTO.Keys.ISSUE_ASSIGNEES]: this.assignees.join(', '),
      [IssueDataDTO.Keys.ISSUE_BODY]: this.body,
      [IssueDataDTO.Keys.ISSUE_CLOSED_AT]: this.closedAt ? this.closedAt.toISOString() : '',
      [IssueDataDTO.Keys.ISSUE_COMMENTS_COUNT]: String(this.commentsCount),
      [IssueDataDTO.Keys.ISSUE_CREATED_AT]: this.createdAt.toISOString(),
      [IssueDataDTO.Keys.ISSUE_CREATOR]: this.creator,
      [IssueDataDTO.Keys.ISSUE_ID]: this.id,
      [IssueDataDTO.Keys.ISSUE_LABELS]: this.labels.join(', '),
      [IssueDataDTO.Keys.ISSUE_LOCKED]: String(this.locked),
      [IssueDataDTO.Keys.ISSUE_MILESTONE]: this.milestone || '',
      [IssueDataDTO.Keys.ISSUE_NUMBER]: String(this.number),
      [IssueDataDTO.Keys.ISSUE_REPOSITORY]: this.repository,
      [IssueDataDTO.Keys.ISSUE_STATE]: this.state,
      [IssueDataDTO.Keys.ISSUE_TITLE]: this.title,
      [IssueDataDTO.Keys.ISSUE_UPDATED_AT]: this.updatedAt.toISOString(),
      [IssueDataDTO.Keys.ISSUE_URL]: this.url
    }
  }
}