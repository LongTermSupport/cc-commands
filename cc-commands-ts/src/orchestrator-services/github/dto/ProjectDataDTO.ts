/**
 * @file GitHub Project Data Transfer Object
 * 
 * Represents a GitHub Project v2 with all relevant metadata and structured
 * data for LLM consumption. Handles transformation from GitHub API responses
 * to the standardized LLMInfo data format.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { GitHubCliProjectOutput, GitHubProjectV2Response } from '../types/GitHubApiTypes.js'

/**
 * Data Transfer Object for GitHub Project v2 information
 * 
 * This DTO encapsulates all relevant information about a GitHub Project v2,
 * including metadata, repositories, and project items for comprehensive
 * project analysis and reporting.
 */
export class ProjectDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_CREATED_AT: 'PROJECT_CREATED_AT',
    PROJECT_DESCRIPTION: 'PROJECT_DESCRIPTION',
    PROJECT_ID: 'PROJECT_ID',
    PROJECT_ITEM_COUNT: 'PROJECT_ITEM_COUNT',
    PROJECT_OWNER: 'PROJECT_OWNER',
    PROJECT_OWNER_TYPE: 'PROJECT_OWNER_TYPE',
    PROJECT_README: 'PROJECT_README',
    PROJECT_REPOSITORIES: 'PROJECT_REPOSITORIES',
    PROJECT_REPOSITORY_COUNT: 'PROJECT_REPOSITORY_COUNT',
    PROJECT_SHORT_DESCRIPTION: 'PROJECT_SHORT_DESCRIPTION',
    PROJECT_STATE: 'PROJECT_STATE',
    PROJECT_TITLE: 'PROJECT_TITLE',
    PROJECT_UPDATED_AT: 'PROJECT_UPDATED_AT',
    PROJECT_URL: 'PROJECT_URL',
    PROJECT_VISIBILITY: 'PROJECT_VISIBILITY'
  } as const

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly url: string,
    public readonly description: null | string,
    public readonly owner: string,
    public readonly ownerType: 'ORGANIZATION' | 'USER',
    public readonly visibility: 'PRIVATE' | 'PUBLIC',
    public readonly state: 'CLOSED' | 'OPEN',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly itemCount: number,
    public readonly repositoryCount: number,
    public readonly repositories: string[],
    public readonly shortDescription: null | string = null,
    public readonly readme: null | string = null
  ) {}

  /**
   * Create ProjectDataDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI project commands
   * @returns New ProjectDataDTO instance
   */
  static fromGitHubCliOutput(cliOutput: GitHubCliProjectOutput): ProjectDataDTO {
    this.validateCliOutput(cliOutput)
    
    return new ProjectDataDTO(
      this.extractCliId(cliOutput),
      this.extractCliTitle(cliOutput),
      this.extractCliUrl(cliOutput),
      this.extractCliDescription(cliOutput),
      this.extractCliOwner(cliOutput),
      this.extractCliOwnerType(cliOutput),
      this.extractCliVisibility(cliOutput),
      this.extractCliState(cliOutput),
      this.extractCliCreatedAt(cliOutput),
      this.extractCliUpdatedAt(cliOutput),
      this.extractCliItemCount(cliOutput),
      this.extractCliRepositoryCount(cliOutput),
      this.extractCliRepositories(cliOutput),
      this.extractCliShortDescription(cliOutput),
      this.extractCliReadme(cliOutput)
    )
  }

  /**
   * Create ProjectDataDTO from GitHub Projects v2 API response
   * 
   * @param apiResponse - Raw response from GitHub Projects v2 API
   * @returns New ProjectDataDTO instance
   */
  static fromGitHubProjectV2Response(apiResponse: GitHubProjectV2Response): ProjectDataDTO {
    this.validateApiResponse(apiResponse)
    
    return new ProjectDataDTO(
      String(apiResponse.id),
      String(apiResponse.title),
      String(apiResponse.url),
      this.extractApiDescription(apiResponse),
      this.extractApiOwner(apiResponse),
      this.extractApiOwnerType(apiResponse),
      this.extractApiVisibility(apiResponse),
      this.extractApiState(apiResponse),
      new Date(apiResponse.createdAt),
      new Date(apiResponse.updatedAt),
      this.extractApiItemCount(apiResponse),
      this.extractApiRepositoryCount(apiResponse),
      this.extractApiRepositories(apiResponse),
      this.extractApiShortDescription(apiResponse),
      this.extractApiReadme(apiResponse)
    )
  }

  private static extractApiDescription(apiResponse: GitHubProjectV2Response): null | string {
    return apiResponse.description ? String(apiResponse.description) : null
  }

  private static extractApiItemCount(apiResponse: GitHubProjectV2Response): number {
    return apiResponse.items?.totalCount || 0
  }

  private static extractApiOwner(apiResponse: GitHubProjectV2Response): string {
    return String(apiResponse.owner?.login || 'unknown')
  }

  private static extractApiOwnerType(apiResponse: GitHubProjectV2Response): 'ORGANIZATION' | 'USER' {
    return apiResponse.owner?.type === 'Organization' ? 'ORGANIZATION' : 'USER'
  }

  private static extractApiReadme(apiResponse: GitHubProjectV2Response): null | string {
    return apiResponse.readme ? String(apiResponse.readme) : null
  }

  private static extractApiRepositories(apiResponse: GitHubProjectV2Response): string[] {
    return Array.isArray(apiResponse.repositories) 
      ? apiResponse.repositories.map((repo) => String(repo.nameWithOwner || repo.name || String(repo)))
      : []
  }

  // Private helper methods for CLI output extraction
  
  private static extractApiRepositoryCount(apiResponse: GitHubProjectV2Response): number {
    return apiResponse.repositories?.length || 0
  }

  private static extractApiShortDescription(apiResponse: GitHubProjectV2Response): null | string {
    return apiResponse.shortDescription ? String(apiResponse.shortDescription) : null
  }

  private static extractApiState(apiResponse: GitHubProjectV2Response): 'CLOSED' | 'OPEN' {
    return apiResponse.closed === true ? 'CLOSED' : 'OPEN'
  }

  private static extractApiVisibility(apiResponse: GitHubProjectV2Response): 'PRIVATE' | 'PUBLIC' {
    return apiResponse.public === true ? 'PUBLIC' : 'PRIVATE'
  }

  private static extractCliCreatedAt(cliOutput: GitHubCliProjectOutput): Date {
    return new Date(cliOutput.createdAt || Date.now())
  }

  private static extractCliDescription(cliOutput: GitHubCliProjectOutput): null | string {
    return cliOutput.body || cliOutput.description || null
  }

  private static extractCliId(cliOutput: GitHubCliProjectOutput): string {
    return String(cliOutput.id || cliOutput.number)
  }

  private static extractCliItemCount(cliOutput: GitHubCliProjectOutput): number {
    return cliOutput.items?.length || 0
  }

  private static extractCliOwner(cliOutput: GitHubCliProjectOutput): string {
    return String(typeof cliOutput.owner === 'string' ? cliOutput.owner : cliOutput.owner?.login || 'unknown')
  }

  private static extractCliOwnerType(cliOutput: GitHubCliProjectOutput): 'ORGANIZATION' | 'USER' {
    return typeof cliOutput.owner === 'object' && cliOutput.owner?.type === 'Organization' ? 'ORGANIZATION' : 'USER'
  }

  private static extractCliReadme(cliOutput: GitHubCliProjectOutput): null | string {
    return cliOutput.readme || null
  }

  private static extractCliRepositories(cliOutput: GitHubCliProjectOutput): string[] {
    return Array.isArray(cliOutput.repositories) ? cliOutput.repositories : []
  }

  private static extractCliRepositoryCount(cliOutput: GitHubCliProjectOutput): number {
    return cliOutput.repositories?.length || 0
  }

  private static extractCliShortDescription(cliOutput: GitHubCliProjectOutput): null | string {
    return cliOutput.shortDescription || null
  }

  private static extractCliState(cliOutput: GitHubCliProjectOutput): 'CLOSED' | 'OPEN' {
    return cliOutput.state === 'CLOSED' ? 'CLOSED' : 'OPEN'
  }

  private static extractCliTitle(cliOutput: GitHubCliProjectOutput): string {
    return String(cliOutput.title || cliOutput.name)
  }

  // Private helper methods for API response extraction
  
  private static extractCliUpdatedAt(cliOutput: GitHubCliProjectOutput): Date {
    return new Date(cliOutput.updatedAt || Date.now())
  }

  private static extractCliUrl(cliOutput: GitHubCliProjectOutput): string {
    return String(cliOutput.url || '')
  }

  private static extractCliVisibility(cliOutput: GitHubCliProjectOutput): 'PRIVATE' | 'PUBLIC' {
    return cliOutput.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'
  }

  private static validateApiResponse(apiResponse: GitHubProjectV2Response): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub Project v2 API response: response is null, undefined, or not an object')
    }

    if (!apiResponse.id || !apiResponse.title || !apiResponse.url || !apiResponse.owner || !apiResponse.createdAt || !apiResponse.updatedAt) {
      const missingFields = []
      if (!apiResponse.id) missingFields.push('id')
      if (!apiResponse.title) missingFields.push('title')
      if (!apiResponse.url) missingFields.push('url')
      if (!apiResponse.owner) missingFields.push('owner')
      if (!apiResponse.createdAt) missingFields.push('createdAt')
      if (!apiResponse.updatedAt) missingFields.push('updatedAt')
      throw new Error(`Invalid GitHub Project v2 API response: missing required fields: ${missingFields.join(', ')}`)
    }
  }

  private static validateCliOutput(cliOutput: GitHubCliProjectOutput): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI output: output is null, undefined, or not an object')
    }
  }

  /**
   * Get age of project in days
   * 
   * @returns Number of days since project creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   * 
   * @returns Number of days since last project update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get a human-readable summary of the project
   * 
   * @returns Brief project description for logging/debugging
   */
  getSummary(): string {
    return `${this.title} (${this.owner}/${this.id}) - ${this.itemCount} items, ${this.repositoryCount} repos`
  }

  /**
   * Check if project has any items
   * 
   * @returns True if project contains items (issues, PRs, etc.)
   */
  hasItems(): boolean {
    return this.itemCount > 0
  }

  /**
   * Check if project has any repositories
   * 
   * @returns True if project contains repositories
   */
  hasRepositories(): boolean {
    return this.repositoryCount > 0 && this.repositories.length > 0
  }

  /**
   * Convert project data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectDataDTO.Keys.PROJECT_CREATED_AT]: this.createdAt.toISOString(),
      [ProjectDataDTO.Keys.PROJECT_DESCRIPTION]: this.description || '',
      [ProjectDataDTO.Keys.PROJECT_ID]: this.id,
      [ProjectDataDTO.Keys.PROJECT_ITEM_COUNT]: String(this.itemCount),
      [ProjectDataDTO.Keys.PROJECT_OWNER]: this.owner,
      [ProjectDataDTO.Keys.PROJECT_OWNER_TYPE]: this.ownerType,
      [ProjectDataDTO.Keys.PROJECT_README]: this.readme || '',
      [ProjectDataDTO.Keys.PROJECT_REPOSITORIES]: this.repositories.join(', '),
      [ProjectDataDTO.Keys.PROJECT_REPOSITORY_COUNT]: String(this.repositoryCount),
      [ProjectDataDTO.Keys.PROJECT_SHORT_DESCRIPTION]: this.shortDescription || '',
      [ProjectDataDTO.Keys.PROJECT_STATE]: this.state,
      [ProjectDataDTO.Keys.PROJECT_TITLE]: this.title,
      [ProjectDataDTO.Keys.PROJECT_UPDATED_AT]: this.updatedAt.toISOString(),
      [ProjectDataDTO.Keys.PROJECT_URL]: this.url,
      [ProjectDataDTO.Keys.PROJECT_VISIBILITY]: this.visibility
    }
  }
}