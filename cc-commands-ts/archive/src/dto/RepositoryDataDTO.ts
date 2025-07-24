/**
 * @file DTO for repository data
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO'
import type { GitHubRepositoryResponse } from '../types/GitHubTypes'

/**
 * Repository visibility type
 */
export type RepositoryVisibility = 'private' | 'public'

/**
 * Data transfer object for repository information
 * 
 * Contains basic repository metadata from GitHub API.
 */
export class RepositoryDataDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    CREATED_AT: 'CREATED_AT',
    DEFAULT_BRANCH: 'DEFAULT_BRANCH',
    DESCRIPTION: 'DESCRIPTION',
    IS_ARCHIVED: 'IS_ARCHIVED',
    IS_FORK: 'IS_FORK',
    LICENSE: 'LICENSE',
    PRIMARY_LANGUAGE: 'PRIMARY_LANGUAGE',
    REPOSITORY_NAME: 'REPOSITORY_NAME',
    REPOSITORY_OWNER: 'REPOSITORY_OWNER',
    TOPICS: 'TOPICS',
    UPDATED_AT: 'UPDATED_AT',
    VISIBILITY: 'VISIBILITY',
  } as const

  /**
   * Create a new repository data object
   */
  constructor(
    public readonly name: string,
    public readonly owner: string,
    public readonly description: null | string,
    public readonly primaryLanguage: null | string,
    public readonly visibility: RepositoryVisibility,
    public readonly defaultBranch: string,
    public readonly license: null | string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly isFork: boolean,
    public readonly isArchived: boolean,
    public readonly topics: string[]
  ) {}

  /**
   * Factory method to create from GitHub API response
   * 
   * @param response - Raw GitHub API response
   */
  static fromGitHubResponse(response: GitHubRepositoryResponse & { license?: null | { name?: string; spdx_id?: string } }): RepositoryDataDTO {
    return new RepositoryDataDTO(
      response.name,
      response.owner.login,
      response.description,
      response.language,
      response.private ? 'private' : 'public',
      response.default_branch,
      response.license?.name || response.license?.spdx_id || null,
      new Date(response.created_at),
      new Date(response.updated_at),
      response.fork,
      response.archived,
      response.topics || []
    )
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    return {
      [RepositoryDataDTO.Keys.CREATED_AT]: this.createdAt.toISOString(),
      [RepositoryDataDTO.Keys.DEFAULT_BRANCH]: this.defaultBranch,
      [RepositoryDataDTO.Keys.DESCRIPTION]: this.description || 'No description',
      [RepositoryDataDTO.Keys.IS_ARCHIVED]: String(this.isArchived),
      [RepositoryDataDTO.Keys.IS_FORK]: String(this.isFork),
      [RepositoryDataDTO.Keys.LICENSE]: this.license || 'No license',
      [RepositoryDataDTO.Keys.PRIMARY_LANGUAGE]: this.primaryLanguage || 'Not detected',
      [RepositoryDataDTO.Keys.REPOSITORY_NAME]: this.name,
      [RepositoryDataDTO.Keys.REPOSITORY_OWNER]: this.owner,
      [RepositoryDataDTO.Keys.TOPICS]: this.topics.join(', ') || 'None',
      [RepositoryDataDTO.Keys.UPDATED_AT]: this.updatedAt.toISOString(),
      [RepositoryDataDTO.Keys.VISIBILITY]: this.visibility
    }
  }
}