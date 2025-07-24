/**
 * @file GitHub Repository Data Transfer Object
 * 
 * Represents a GitHub repository with all relevant metadata and activity
 * statistics for LLM consumption. Handles transformation from GitHub API
 * responses to the standardized LLMInfo data format.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { GitHubCliRepositoryOutput, GitHubRepositoryResponse } from '../types/GitHubApiTypes.js'

/**
 * Data Transfer Object for GitHub repository information
 * 
 * This DTO encapsulates all relevant information about a GitHub repository,
 * including metadata, activity statistics, and configuration details for
 * comprehensive repository analysis and reporting.
 */
export class RepositoryDataDTO implements ILLMDataDTO {
  private static readonly Keys = {
    REPOSITORY_CREATED_AT: 'REPOSITORY_CREATED_AT',
    REPOSITORY_DEFAULT_BRANCH: 'REPOSITORY_DEFAULT_BRANCH',
    REPOSITORY_DESCRIPTION: 'REPOSITORY_DESCRIPTION',
    REPOSITORY_FORKS_COUNT: 'REPOSITORY_FORKS_COUNT',
    REPOSITORY_FULL_NAME: 'REPOSITORY_FULL_NAME',
    REPOSITORY_HAS_ISSUES: 'REPOSITORY_HAS_ISSUES',
    REPOSITORY_HAS_PROJECTS: 'REPOSITORY_HAS_PROJECTS',
    REPOSITORY_HAS_WIKI: 'REPOSITORY_HAS_WIKI',
    REPOSITORY_HOMEPAGE: 'REPOSITORY_HOMEPAGE',
    REPOSITORY_ID: 'REPOSITORY_ID',
    REPOSITORY_IS_ARCHIVED: 'REPOSITORY_IS_ARCHIVED',
    REPOSITORY_IS_FORK: 'REPOSITORY_IS_FORK',
    REPOSITORY_IS_PRIVATE: 'REPOSITORY_IS_PRIVATE',
    REPOSITORY_LANGUAGE: 'REPOSITORY_LANGUAGE',
    REPOSITORY_LANGUAGES: 'REPOSITORY_LANGUAGES',
    REPOSITORY_LICENSE: 'REPOSITORY_LICENSE',
    REPOSITORY_NAME: 'REPOSITORY_NAME',
    REPOSITORY_OPEN_ISSUES_COUNT: 'REPOSITORY_OPEN_ISSUES_COUNT',
    REPOSITORY_OWNER: 'REPOSITORY_OWNER',
    REPOSITORY_OWNER_TYPE: 'REPOSITORY_OWNER_TYPE',
    REPOSITORY_PUSHED_AT: 'REPOSITORY_PUSHED_AT',
    REPOSITORY_SIZE: 'REPOSITORY_SIZE',
    REPOSITORY_STARGAZERS_COUNT: 'REPOSITORY_STARGAZERS_COUNT',
    REPOSITORY_TOPICS: 'REPOSITORY_TOPICS',
    REPOSITORY_UPDATED_AT: 'REPOSITORY_UPDATED_AT',
    REPOSITORY_URL: 'REPOSITORY_URL',
    REPOSITORY_VISIBILITY: 'REPOSITORY_VISIBILITY',
    REPOSITORY_WATCHERS_COUNT: 'REPOSITORY_WATCHERS_COUNT'
  } as const

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly fullName: string,
    public readonly owner: string,
    public readonly ownerType: 'Organization' | 'User',
    public readonly description: null | string,
    public readonly url: string,
    public readonly homepage: null | string,
    public readonly language: null | string,
    public readonly languages: string[],
    public readonly topics: string[],
    public readonly license: null | string,
    public readonly visibility: 'private' | 'public',
    public readonly isPrivate: boolean,
    public readonly isFork: boolean,
    public readonly isArchived: boolean,
    public readonly hasIssues: boolean,
    public readonly hasProjects: boolean,
    public readonly hasWiki: boolean,
    public readonly defaultBranch: string,
    public readonly stargazersCount: number,
    public readonly watchersCount: number,
    public readonly forksCount: number,
    public readonly openIssuesCount: number,
    public readonly size: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly pushedAt: Date | null
  ) {}

  /**
   * Create RepositoryDataDTO from GitHub API response
   * 
   * @param apiResponse - Raw response from GitHub Repository API
   * @returns New RepositoryDataDTO instance
   */
  static fromGitHubApiResponse(apiResponse: GitHubRepositoryResponse): RepositoryDataDTO {
    this.validateApiResponse(apiResponse)
    
    return new RepositoryDataDTO(
      this.extractApiId(apiResponse),
      this.extractApiName(apiResponse),
      this.extractApiFullName(apiResponse),
      this.extractApiOwner(apiResponse),
      this.extractApiOwnerType(apiResponse),
      this.extractApiDescription(apiResponse),
      this.extractApiUrl(apiResponse),
      this.extractApiHomepage(apiResponse),
      this.extractApiLanguage(apiResponse),
      this.extractApiLanguages(apiResponse),
      this.extractApiTopics(apiResponse),
      this.extractApiLicense(apiResponse),
      this.extractApiVisibility(apiResponse),
      this.extractApiIsPrivate(apiResponse),
      this.extractApiIsFork(apiResponse),
      this.extractApiIsArchived(apiResponse),
      this.extractApiHasIssues(apiResponse),
      this.extractApiHasProjects(apiResponse),
      this.extractApiHasWiki(apiResponse),
      this.extractApiDefaultBranch(apiResponse),
      this.extractApiStargazersCount(apiResponse),
      this.extractApiWatchersCount(apiResponse),
      this.extractApiForksCount(apiResponse),
      this.extractApiOpenIssuesCount(apiResponse),
      this.extractApiSize(apiResponse),
      new Date(apiResponse.created_at),
      new Date(apiResponse.updated_at),
      apiResponse.pushed_at ? new Date(apiResponse.pushed_at) : null
    )
  }

  /**
   * Create RepositoryDataDTO from GitHub CLI output
   * 
   * @param cliOutput - Parsed output from GitHub CLI repository commands
   * @returns New RepositoryDataDTO instance
   */
  static fromGitHubCliOutput(cliOutput: GitHubCliRepositoryOutput): RepositoryDataDTO {
    this.validateCliOutput(cliOutput)
    
    return new RepositoryDataDTO(
      this.extractCliId(cliOutput),
      this.extractCliName(cliOutput),
      this.extractCliFullName(cliOutput),
      this.extractCliOwner(cliOutput),
      this.extractCliOwnerType(cliOutput),
      this.extractCliDescription(cliOutput),
      this.extractCliUrl(cliOutput),
      this.extractCliHomepage(cliOutput),
      this.extractCliLanguage(cliOutput),
      this.extractCliLanguages(cliOutput),
      this.extractCliTopics(cliOutput),
      this.extractCliLicense(cliOutput),
      this.extractCliVisibility(cliOutput),
      this.extractCliIsPrivate(cliOutput),
      this.extractCliIsFork(cliOutput),
      this.extractCliIsArchived(cliOutput),
      this.extractCliHasIssues(cliOutput),
      this.extractCliHasProjects(cliOutput),
      this.extractCliHasWiki(cliOutput),
      this.extractCliDefaultBranch(cliOutput),
      this.extractCliStargazersCount(cliOutput),
      this.extractCliWatchersCount(cliOutput),
      this.extractCliForksCount(cliOutput),
      this.extractCliOpenIssuesCount(cliOutput),
      this.extractCliSize(cliOutput),
      new Date(cliOutput.createdAt || Date.now()),
      new Date(cliOutput.updatedAt || Date.now()),
      cliOutput.pushedAt ? new Date(cliOutput.pushedAt) : null
    )
  }

  // Private helper methods for API response extraction
  
  private static extractApiDefaultBranch(apiResponse: GitHubRepositoryResponse): string {
    return String(apiResponse.default_branch || 'main')
  }

  private static extractApiDescription(apiResponse: GitHubRepositoryResponse): null | string {
    return apiResponse.description ? String(apiResponse.description) : null
  }

  private static extractApiForksCount(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.forks_count) || 0
  }

  private static extractApiFullName(apiResponse: GitHubRepositoryResponse): string {
    return String(apiResponse.full_name)
  }

  private static extractApiHasIssues(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.has_issues)
  }

  private static extractApiHasProjects(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.has_projects)
  }

  private static extractApiHasWiki(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.has_wiki)
  }

  private static extractApiHomepage(apiResponse: GitHubRepositoryResponse): null | string {
    return apiResponse.homepage ? String(apiResponse.homepage) : null
  }

  private static extractApiId(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.id)
  }

  private static extractApiIsArchived(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.archived)
  }

  private static extractApiIsFork(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.fork)
  }

  private static extractApiIsPrivate(apiResponse: GitHubRepositoryResponse): boolean {
    return Boolean(apiResponse.private)
  }

  private static extractApiLanguage(apiResponse: GitHubRepositoryResponse): null | string {
    return apiResponse.language ? String(apiResponse.language) : null
  }

  private static extractApiLanguages(apiResponse: GitHubRepositoryResponse): string[] {
    // Languages would typically come from a separate API call
    // For now, include the primary language if available
    return apiResponse.language ? [String(apiResponse.language)] : []
  }

  private static extractApiLicense(apiResponse: GitHubRepositoryResponse): null | string {
    return apiResponse.license?.name ? String(apiResponse.license.name) : null
  }

  private static extractApiName(apiResponse: GitHubRepositoryResponse): string {
    return String(apiResponse.name)
  }

  private static extractApiOpenIssuesCount(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.open_issues_count) || 0
  }

  private static extractApiOwner(apiResponse: GitHubRepositoryResponse): string {
    return String(apiResponse.owner?.login || 'unknown')
  }

  private static extractApiOwnerType(apiResponse: GitHubRepositoryResponse): 'Organization' | 'User' {
    return apiResponse.owner?.type === 'Organization' ? 'Organization' : 'User'
  }

  private static extractApiSize(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.size) || 0
  }

  private static extractApiStargazersCount(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.stargazers_count) || 0
  }

  private static extractApiTopics(apiResponse: GitHubRepositoryResponse): string[] {
    return Array.isArray(apiResponse.topics) ? apiResponse.topics.map(String) : []
  }

  private static extractApiUrl(apiResponse: GitHubRepositoryResponse): string {
    return String(apiResponse.html_url || apiResponse.url)
  }

  private static extractApiVisibility(apiResponse: GitHubRepositoryResponse): 'private' | 'public' {
    return apiResponse.private === true ? 'private' : 'public'
  }

  private static extractApiWatchersCount(apiResponse: GitHubRepositoryResponse): number {
    return Number(apiResponse.watchers_count) || 0
  }

  // Private helper methods for CLI output extraction

  private static extractCliDefaultBranch(cliOutput: GitHubCliRepositoryOutput): string {
    return String(cliOutput.defaultBranch || 'main')
  }

  private static extractCliDescription(cliOutput: GitHubCliRepositoryOutput): null | string {
    return cliOutput.description || null
  }

  private static extractCliForksCount(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.forksCount) || 0
  }

  private static extractCliFullName(cliOutput: GitHubCliRepositoryOutput): string {
    return String(cliOutput.nameWithOwner || `${cliOutput.owner || 'unknown'}/${cliOutput.name}`)
  }

  private static extractCliHasIssues(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.hasIssues)
  }

  private static extractCliHasProjects(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.hasProjects)
  }

  private static extractCliHasWiki(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.hasWiki)
  }

  private static extractCliHomepage(cliOutput: GitHubCliRepositoryOutput): null | string {
    return cliOutput.homepage || null
  }

  private static extractCliId(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.id) || 0
  }

  private static extractCliIsArchived(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.isArchived)
  }

  private static extractCliIsFork(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.isFork)
  }

  private static extractCliIsPrivate(cliOutput: GitHubCliRepositoryOutput): boolean {
    return Boolean(cliOutput.isPrivate)
  }

  private static extractCliLanguage(cliOutput: GitHubCliRepositoryOutput): null | string {
    return cliOutput.primaryLanguage || null
  }

  private static extractCliLanguages(cliOutput: GitHubCliRepositoryOutput): string[] {
    return Array.isArray(cliOutput.languages) ? cliOutput.languages : []
  }

  private static extractCliLicense(cliOutput: GitHubCliRepositoryOutput): null | string {
    return cliOutput.license || null
  }

  private static extractCliName(cliOutput: GitHubCliRepositoryOutput): string {
    return String(cliOutput.name)
  }

  private static extractCliOpenIssuesCount(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.openIssuesCount) || 0
  }

  private static extractCliOwner(cliOutput: GitHubCliRepositoryOutput): string {
    return String(cliOutput.owner || 'unknown')
  }

  private static extractCliOwnerType(cliOutput: GitHubCliRepositoryOutput): 'Organization' | 'User' {
    return cliOutput.ownerType === 'Organization' ? 'Organization' : 'User'
  }

  private static extractCliSize(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.size) || 0
  }

  private static extractCliStargazersCount(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.stargazersCount) || 0
  }

  private static extractCliTopics(cliOutput: GitHubCliRepositoryOutput): string[] {
    return Array.isArray(cliOutput.topics) ? cliOutput.topics : []
  }

  private static extractCliUrl(cliOutput: GitHubCliRepositoryOutput): string {
    return String(cliOutput.url || '')
  }

  private static extractCliVisibility(cliOutput: GitHubCliRepositoryOutput): 'private' | 'public' {
    return cliOutput.visibility === 'PRIVATE' ? 'private' : 'public'
  }

  private static extractCliWatchersCount(cliOutput: GitHubCliRepositoryOutput): number {
    return Number(cliOutput.watchersCount) || 0
  }

  private static validateApiResponse(apiResponse: GitHubRepositoryResponse): void {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Invalid GitHub Repository API response: response is null, undefined, or not an object')
    }

    if (!apiResponse.id || !apiResponse.name || !apiResponse.full_name || !apiResponse.owner) {
      const missingFields = []
      if (!apiResponse.id) missingFields.push('id')
      if (!apiResponse.name) missingFields.push('name')
      if (!apiResponse.full_name) missingFields.push('full_name')
      if (!apiResponse.owner) missingFields.push('owner')
      throw new Error(`Invalid GitHub Repository API response: missing required fields: ${missingFields.join(', ')}`)
    }
  }

  private static validateCliOutput(cliOutput: GitHubCliRepositoryOutput): void {
    if (!cliOutput || typeof cliOutput !== 'object') {
      throw new Error('Invalid GitHub CLI output: output is null, undefined, or not an object')
    }

    if (!cliOutput.name) {
      throw new Error('Invalid GitHub CLI output: missing required field: name')
    }
  }

  /**
   * Get age of repository in days
   * 
   * @returns Number of days since repository creation
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last push
   * 
   * @returns Number of days since last push, or null if never pushed
   */
  getDaysSinceLastPush(): null | number {
    if (!this.pushedAt) return null
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.pushedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   * 
   * @returns Number of days since last repository update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get a human-readable summary of the repository
   * 
   * @returns Brief repository description for logging/debugging
   */
  getSummary(): string {
    const visibility = this.isPrivate ? 'private' : 'public'
    const language = this.language ? ` (${this.language})` : ''
    return `${this.fullName}${language} - ${visibility}, ${this.stargazersCount} stars, ${this.forksCount} forks`
  }

  /**
   * Check if repository has significant community engagement
   * 
   * @returns True if repository has good community metrics
   */
  hasSignificantEngagement(): boolean {
    return this.stargazersCount >= 10 || this.forksCount >= 5 || this.watchersCount >= 5
  }

  /**
   * Check if repository appears to be actively maintained
   * 
   * @returns True if repository shows signs of active maintenance
   */
  isActivelyMaintained(): boolean {
    const daysSinceUpdate = this.getDaysSinceUpdate()
    const daysSinceLastPush = this.getDaysSinceLastPush()
    
    // Active if updated within 90 days or pushed within 30 days
    return daysSinceUpdate <= 90 || (daysSinceLastPush !== null && daysSinceLastPush <= 30)
  }

  /**
   * Convert repository data to LLMInfo-compatible key-value pairs
   * 
   * @returns Record of standardized data keys to string values
   */
  toLLMData(): Record<string, string> {
    return {
      [RepositoryDataDTO.Keys.REPOSITORY_CREATED_AT]: this.createdAt.toISOString(),
      [RepositoryDataDTO.Keys.REPOSITORY_DEFAULT_BRANCH]: this.defaultBranch,
      [RepositoryDataDTO.Keys.REPOSITORY_DESCRIPTION]: this.description || '',
      [RepositoryDataDTO.Keys.REPOSITORY_FORKS_COUNT]: String(this.forksCount),
      [RepositoryDataDTO.Keys.REPOSITORY_FULL_NAME]: this.fullName,
      [RepositoryDataDTO.Keys.REPOSITORY_HAS_ISSUES]: String(this.hasIssues),
      [RepositoryDataDTO.Keys.REPOSITORY_HAS_PROJECTS]: String(this.hasProjects),
      [RepositoryDataDTO.Keys.REPOSITORY_HAS_WIKI]: String(this.hasWiki),
      [RepositoryDataDTO.Keys.REPOSITORY_HOMEPAGE]: this.homepage || '',
      [RepositoryDataDTO.Keys.REPOSITORY_ID]: String(this.id),
      [RepositoryDataDTO.Keys.REPOSITORY_IS_ARCHIVED]: String(this.isArchived),
      [RepositoryDataDTO.Keys.REPOSITORY_IS_FORK]: String(this.isFork),
      [RepositoryDataDTO.Keys.REPOSITORY_IS_PRIVATE]: String(this.isPrivate),
      [RepositoryDataDTO.Keys.REPOSITORY_LANGUAGE]: this.language || '',
      [RepositoryDataDTO.Keys.REPOSITORY_LANGUAGES]: this.languages.join(', '),
      [RepositoryDataDTO.Keys.REPOSITORY_LICENSE]: this.license || '',
      [RepositoryDataDTO.Keys.REPOSITORY_NAME]: this.name,
      [RepositoryDataDTO.Keys.REPOSITORY_OPEN_ISSUES_COUNT]: String(this.openIssuesCount),
      [RepositoryDataDTO.Keys.REPOSITORY_OWNER]: this.owner,
      [RepositoryDataDTO.Keys.REPOSITORY_OWNER_TYPE]: this.ownerType,
      [RepositoryDataDTO.Keys.REPOSITORY_PUSHED_AT]: this.pushedAt ? this.pushedAt.toISOString() : '',
      [RepositoryDataDTO.Keys.REPOSITORY_SIZE]: String(this.size),
      [RepositoryDataDTO.Keys.REPOSITORY_STARGAZERS_COUNT]: String(this.stargazersCount),
      [RepositoryDataDTO.Keys.REPOSITORY_TOPICS]: this.topics.join(', '),
      [RepositoryDataDTO.Keys.REPOSITORY_UPDATED_AT]: this.updatedAt.toISOString(),
      [RepositoryDataDTO.Keys.REPOSITORY_URL]: this.url,
      [RepositoryDataDTO.Keys.REPOSITORY_VISIBILITY]: this.visibility,
      [RepositoryDataDTO.Keys.REPOSITORY_WATCHERS_COUNT]: String(this.watchersCount)
    }
  }
}