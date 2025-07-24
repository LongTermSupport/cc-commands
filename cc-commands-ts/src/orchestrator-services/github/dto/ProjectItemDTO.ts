/**
 * @file GitHub Project Item Data Transfer Object
 * 
 * Represents individual items within GitHub Projects v2, including issues,
 * pull requests, and draft items. Handles transformation from GitHub Projects
 * GraphQL API responses to standardized LLM data format.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'

/**
 * Data Transfer Object for GitHub Project items
 * 
 * This DTO encapsulates information about individual items within a GitHub
 * Projects v2 board, including their content, status, field values, and
 * relationships to repositories and other project items.
 */
export class ProjectItemDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_ITEM_ARCHIVED: 'PROJECT_ITEM_ARCHIVED',
    PROJECT_ITEM_ASSIGNEES: 'PROJECT_ITEM_ASSIGNEES',
    PROJECT_ITEM_CONTENT_ID: 'PROJECT_ITEM_CONTENT_ID',
    PROJECT_ITEM_CONTENT_REPOSITORY: 'PROJECT_ITEM_CONTENT_REPOSITORY',
    PROJECT_ITEM_CONTENT_STATE: 'PROJECT_ITEM_CONTENT_STATE',
    PROJECT_ITEM_CONTENT_TITLE: 'PROJECT_ITEM_CONTENT_TITLE',
    PROJECT_ITEM_CONTENT_TYPE: 'PROJECT_ITEM_CONTENT_TYPE',
    PROJECT_ITEM_CONTENT_URL: 'PROJECT_ITEM_CONTENT_URL',
    PROJECT_ITEM_CREATED_AT: 'PROJECT_ITEM_CREATED_AT',
    PROJECT_ITEM_CREATOR: 'PROJECT_ITEM_CREATOR',
    PROJECT_ITEM_FIELD_VALUES: 'PROJECT_ITEM_FIELD_VALUES',
    PROJECT_ITEM_ID: 'PROJECT_ITEM_ID',
    PROJECT_ITEM_LABELS: 'PROJECT_ITEM_LABELS',
    PROJECT_ITEM_MILESTONE: 'PROJECT_ITEM_MILESTONE',
    PROJECT_ITEM_NUMBER: 'PROJECT_ITEM_NUMBER',
    PROJECT_ITEM_PROJECT_ID: 'PROJECT_ITEM_PROJECT_ID',
    PROJECT_ITEM_REPOSITORY_NAME: 'PROJECT_ITEM_REPOSITORY_NAME',
    PROJECT_ITEM_STATUS: 'PROJECT_ITEM_STATUS',
    PROJECT_ITEM_TYPE: 'PROJECT_ITEM_TYPE',
    PROJECT_ITEM_UPDATED_AT: 'PROJECT_ITEM_UPDATED_AT'
  } as const

  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST',
    public readonly contentId: null | string,
    public readonly contentType: 'DraftIssue' | 'Issue' | 'PullRequest' | null,
    public readonly contentTitle: string,
    public readonly contentUrl: null | string,
    public readonly contentState: null | string,
    public readonly repositoryName: null | string,
    public readonly contentRepository: null | string,
    public readonly number: null | number,
    public readonly status: null | string,
    public readonly labels: string[],
    public readonly assignees: string[],
    public readonly milestone: null | string,
    public readonly creator: null | string,
    public readonly fieldValues: Record<string, string>,
    public readonly isArchived: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Create a draft issue ProjectItemDTO
   * 
   * @param id - Item ID
   * @param projectId - Project ID
   * @param title - Draft issue title
   * @param fieldValues - Custom field values
   * @returns New ProjectItemDTO for draft issue
   */
  static createDraftIssue(
    id: string,
    projectId: string,
    title: string,
    fieldValues: Record<string, string> = {}
  ): ProjectItemDTO {
    return new ProjectItemDTO(
      id,
      projectId,
      'DRAFT_ISSUE',
      null, // Draft issues don't have content IDs
      'DraftIssue',
      title,
      null, // No URL for drafts
      null, // No state for drafts
      null, // No repository for drafts
      null, // No repository for drafts
      null, // No number for drafts
      fieldValues['Status'] || null,
      [], // No labels for drafts
      [], // No assignees for drafts
      null, // No milestone for drafts
      null, // No creator info available
      fieldValues,
      false, // Drafts are not archived by default
      new Date(),
      new Date()
    )
  }

  /**
   * Create ProjectItemDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI project commands
   * @param projectId - ID of the parent project
   * @returns New ProjectItemDTO instance
   */
  static fromCliOutput(cliOutput: {
    archived?: boolean
    content?: {
      assignees?: string[]
      author?: string
      id?: string
      labels?: string[]
      milestone?: string
      number?: number
      repositoryName?: string
      state?: string
      title?: string
      url?: string
    }
    createdAt?: string
    fields?: Record<string, string>
    id?: string
    type?: string
    updatedAt?: string
  }, projectId: string): ProjectItemDTO {
    this.validateCliOutput(cliOutput)
    
    const content = cliOutput.content || {}
    
    return new ProjectItemDTO(
      cliOutput.id || '',
      projectId,
      this.extractItemType(cliOutput.type, null),
      content.id || null,
      null, // CLI doesn't provide typename
      content.title || 'Untitled',
      content.url || null,
      content.state || null,
      content.repositoryName || null,
      content.repositoryName || null,
      content.number || null,
      cliOutput.fields?.['Status'] || null,
      content.labels || [],
      content.assignees || [],
      content.milestone || null,
      content.author || null,
      cliOutput.fields || {},
      Boolean(cliOutput.archived),
      new Date(cliOutput.createdAt || Date.now()),
      new Date(cliOutput.updatedAt || Date.now())
    )
  }

  /**
   * Create ProjectItemDTO from GitHub Projects GraphQL API response
   * 
   * @param apiResponse - Raw response from GitHub Projects GraphQL API
   * @param projectId - ID of the parent project
   * @returns New ProjectItemDTO instance
   */
  static fromGraphQLResponse(apiResponse: {
    content?: {
      __typename?: string
      assignees?: {
        nodes?: Array<{ login?: string }>
      }
      author?: {
        login?: string
      }
      id?: string
      labels?: {
        nodes?: Array<{ name?: string }>
      }
      milestone?: {
        title?: string
      }
      number?: number
      repository?: {
        name?: string
        nameWithOwner?: string
      }
      state?: string
      title?: string
      url?: string
    }
    createdAt?: string
    fieldValues?: {
      nodes?: Array<{
        field?: { name?: string }
        value?: unknown
      }>
    }
    id: string
    isArchived?: boolean
    type?: string
    updatedAt?: string
  }, projectId: string): ProjectItemDTO {
    this.validateGraphQLResponse(apiResponse)
    
    const {content} = apiResponse
    const fieldValues = this.extractFieldValues(apiResponse.fieldValues)
    const labels = this.extractLabels(content?.labels)
    const assignees = this.extractAssignees(content?.assignees)
    
    return this.createProjectItemFromGraphQL(
      apiResponse,
      projectId,
      content,
      fieldValues,
      labels,
      assignees
    )
  }

  /**
   * Create ProjectItemDTO instance from GraphQL data
   */
  private static createProjectItemFromGraphQL(
    apiResponse: { createdAt?: string; id: string; isArchived?: boolean; type?: string; updatedAt?: string },
    projectId: string,
    content: undefined | { __typename?: string; author?: { login?: string }; id?: string; milestone?: { title?: string }; number?: number; repository?: { name?: string; nameWithOwner?: string }; state?: string; title?: string; url?: string; },
    fieldValues: Record<string, string>,
    labels: string[],
    assignees: string[]
  ): ProjectItemDTO {
    const params = this.extractGraphQLConstructorParams(apiResponse, projectId, content, fieldValues)
    
    return new ProjectItemDTO(
      params.id,
      params.projectId,
      params.type,
      params.contentId,
      params.contentType,
      params.contentTitle,
      params.contentUrl,
      params.contentState,
      params.repositoryName,
      params.contentRepository,
      params.number,
      params.status,
      labels,
      assignees,
      params.milestone,
      params.creator,
      fieldValues,
      params.isArchived,
      params.createdAt,
      params.updatedAt
    )
  }

  /**
   * Extract assignees from GraphQL assignees structure
   */
  private static extractAssignees(assignees?: {
    nodes?: Array<{ login?: string }>
  }): string[] {
    return assignees?.nodes?.map(assignee => assignee.login || '').filter(Boolean) || []
  }

  /**
   * Extract content type from GraphQL typename
   */
  private static extractContentType(
    typename?: null | string
  ): 'DraftIssue' | 'Issue' | 'PullRequest' | null {
    if (typename === 'DraftIssue') return 'DraftIssue'
    if (typename === 'Issue') return 'Issue'
    if (typename === 'PullRequest') return 'PullRequest'
    return null
  }

  /**
   * Extract field values from GraphQL fieldValues structure
   */
  private static extractFieldValues(fieldValues?: {
    nodes?: Array<{
      field?: { name?: string }
      value?: unknown
    }>
  }): Record<string, string> {
    const result: Record<string, string> = {}
    
    if (fieldValues?.nodes) {
      for (const fieldValue of fieldValues.nodes) {
        if (fieldValue.field?.name && fieldValue.value !== undefined) {
          result[fieldValue.field.name] = String(fieldValue.value)
        }
      }
    }
    
    return result
  }

  /**
   * Extract constructor parameters from GraphQL response
   */
  // eslint-disable-next-line complexity
  private static extractGraphQLConstructorParams(
    apiResponse: { createdAt?: string; id: string; isArchived?: boolean; type?: string; updatedAt?: string },
    projectId: string,
    content: undefined | { __typename?: string; author?: { login?: string }; id?: string; milestone?: { title?: string }; number?: number; repository?: { name?: string; nameWithOwner?: string }; state?: string; title?: string; url?: string; },
    fieldValues: Record<string, string>
  ) {
    return {
      contentId: content?.id || null,
      contentRepository: content?.repository?.nameWithOwner || null,
      contentState: content?.state || null,
      contentTitle: content?.title || 'Untitled',
      contentType: this.extractContentType(content?.__typename),
      contentUrl: content?.url || null,
      createdAt: new Date(apiResponse.createdAt || Date.now()),
      creator: content?.author?.login || null,
      id: apiResponse.id,
      isArchived: Boolean(apiResponse.isArchived),
      milestone: content?.milestone?.title || null,
      number: content?.number || null,
      projectId,
      repositoryName: content?.repository?.name || null,
      status: fieldValues['Status'] || null,
      type: this.extractItemType(apiResponse.type, content?.__typename),
      updatedAt: new Date(apiResponse.updatedAt || Date.now())
    }
  }

  /**
   * Extract item type from API response
   */
  private static extractItemType(
    type?: string,
    typename?: null | string
  ): 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST' {
    if (type === 'DRAFT_ISSUE' || typename === 'DraftIssue') {
      return 'DRAFT_ISSUE'
    }

    if (type === 'PULL_REQUEST' || typename === 'PullRequest') {
      return 'PULL_REQUEST'
    }

    return 'ISSUE' // Default to issue
  }

  /**
   * Extract labels from GraphQL labels structure
   */
  private static extractLabels(labels?: {
    nodes?: Array<{ name?: string }>
  }): string[] {
    return labels?.nodes?.map(label => label.name || '').filter(Boolean) || []
  }

  /**
   * Validate CLI output
   */
  private static validateCliOutput(cliOutput: unknown): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI project item output: output is null, undefined, or not an object')
    }

    const output = cliOutput as Record<string, unknown>
    if (!output['id']) {
      throw new Error('Invalid GitHub CLI project item output: missing required field: id')
    }
  }

  /**
   * Validate GraphQL API response
   */
  private static validateGraphQLResponse(apiResponse: unknown): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub Project Item GraphQL response: response is null, undefined, or not an object')
    }

    const response = apiResponse as Record<string, unknown>
    if (!response['id']) {
      throw new Error('Invalid GitHub Project Item GraphQL response: missing required field: id')
    }
  }

  /**
   * Get age of project item in days
   * 
   * @returns Number of days since item creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   * 
   * @returns Number of days since last item update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get a human-readable summary of the project item
   * 
   * @returns Brief item description for logging/debugging
   */
  getSummary(): string {
    const typeStr = this.type.toLowerCase().replace('_', ' ')
    const statusStr = this.status ? ` (${this.status})` : ''
    const repoStr = this.repositoryName ? ` [${this.repositoryName}]` : ''
    return `${typeStr}: ${this.contentTitle}${statusStr}${repoStr}`
  }

  /**
   * Get the display name for this item type
   * 
   * @returns Human-readable type name
   */
  getTypeDisplayName(): string {
    switch (this.type) {
      case 'DRAFT_ISSUE': {
        return 'Draft Issue'
      }

      case 'ISSUE': {
        return 'Issue'
      }

      case 'PULL_REQUEST': {
        return 'Pull Request'
      }

      default: {
        return 'Unknown'
      }
    }
  }

  /**
   * Check if this item has content (not a draft)
   * 
   * @returns True if item has associated GitHub content
   */
  hasContent(): boolean {
    return this.contentId !== null && this.contentUrl !== null
  }

  /**
   * Check if this item has a specific label
   * 
   * @param labelName - Label name to check for
   * @returns True if item has the label
   */
  hasLabel(labelName: string): boolean {
    return this.labels.includes(labelName)
  }

  /**
   * Check if this item is in a specific status
   * 
   * @param status - Status to check for
   * @returns True if item has the specified status
   */
  hasStatus(status: string): boolean {
    return this.status === status
  }

  /**
   * Check if this item is assigned to a specific user
   * 
   * @param username - Username to check for
   * @returns True if item is assigned to the user
   */
  isAssignedTo(username: string): boolean {
    return this.assignees.includes(username)
  }

  /**
   * Check if this item represents a draft issue
   * 
   * @returns True if item is a draft issue
   */
  isDraft(): boolean {
    return this.type === 'DRAFT_ISSUE'
  }

  /**
   * Check if this item represents an issue
   * 
   * @returns True if item is an issue (not PR or draft)
   */
  isIssue(): boolean {
    return this.type === 'ISSUE'
  }

  /**
   * Check if this item represents a pull request
   * 
   * @returns True if item is a pull request
   */
  isPullRequest(): boolean {
    return this.type === 'PULL_REQUEST'
  }

  /**
   * Convert project item data to LLM-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectItemDTO.Keys.PROJECT_ITEM_ARCHIVED]: String(this.isArchived),
      [ProjectItemDTO.Keys.PROJECT_ITEM_ASSIGNEES]: this.assignees.join(', '),
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_ID]: this.contentId || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_REPOSITORY]: this.contentRepository || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_STATE]: this.contentState || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_TITLE]: this.contentTitle,
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_TYPE]: this.contentType || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_CONTENT_URL]: this.contentUrl || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_CREATED_AT]: this.createdAt.toISOString(),
      [ProjectItemDTO.Keys.PROJECT_ITEM_CREATOR]: this.creator || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_FIELD_VALUES]: JSON.stringify(this.fieldValues),
      [ProjectItemDTO.Keys.PROJECT_ITEM_ID]: this.id,
      [ProjectItemDTO.Keys.PROJECT_ITEM_LABELS]: this.labels.join(', '),
      [ProjectItemDTO.Keys.PROJECT_ITEM_MILESTONE]: this.milestone || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_NUMBER]: this.number ? String(this.number) : '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_PROJECT_ID]: this.projectId,
      [ProjectItemDTO.Keys.PROJECT_ITEM_REPOSITORY_NAME]: this.repositoryName || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_STATUS]: this.status || '',
      [ProjectItemDTO.Keys.PROJECT_ITEM_TYPE]: this.type,
      [ProjectItemDTO.Keys.PROJECT_ITEM_UPDATED_AT]: this.updatedAt.toISOString()
    }
  }
}