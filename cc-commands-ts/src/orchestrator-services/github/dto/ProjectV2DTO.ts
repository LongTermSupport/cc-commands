/**
 * @file GitHub Project v2 Data Transfer Object
 * 
 * STUB IMPLEMENTATION - Will be corrected when real GraphQL API calls reveal actual structure.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO'
import { ProjectV2GraphQLResponse } from '../types/GitHubGraphQLTypes.js'

/**
 * Data Transfer Object for GitHub Project v2 information (GraphQL-based)
 */
export class ProjectV2DTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_V2_CREATED_AT: 'PROJECT_V2_CREATED_AT',
    PROJECT_V2_DESCRIPTION: 'PROJECT_V2_DESCRIPTION',
    PROJECT_V2_ID: 'PROJECT_V2_ID',
    PROJECT_V2_ITEM_COUNT: 'PROJECT_V2_ITEM_COUNT',
    PROJECT_V2_OWNER: 'PROJECT_V2_OWNER',
    PROJECT_V2_OWNER_TYPE: 'PROJECT_V2_OWNER_TYPE',
    PROJECT_V2_README: 'PROJECT_V2_README',
    PROJECT_V2_SHORT_DESCRIPTION: 'PROJECT_V2_SHORT_DESCRIPTION',
    PROJECT_V2_STATE: 'PROJECT_V2_STATE',
    PROJECT_V2_TITLE: 'PROJECT_V2_TITLE',
    PROJECT_V2_UPDATED_AT: 'PROJECT_V2_UPDATED_AT',
    PROJECT_V2_URL: 'PROJECT_V2_URL',
    PROJECT_V2_VISIBILITY: 'PROJECT_V2_VISIBILITY'
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
    public readonly shortDescription: null | string = null,
    public readonly readme: null | string = null
  ) {}

  /**
   * STUB: Create ProjectV2DTO from GraphQL response
   * This implementation will be corrected when real API calls reveal actual structure
   */
  static fromGraphQLResponse(response: ProjectV2GraphQLResponse): ProjectV2DTO {
    const project = response.node
    
    return new ProjectV2DTO(
      project.id,
      project.title,
      project.url,
      project.shortDescription, // Real API uses shortDescription, not description
      project.owner.login,
      project.owner.__typename === 'Organization' ? 'ORGANIZATION' : 'USER',
      project.public ? 'PUBLIC' : 'PRIVATE',
      project.closed ? 'CLOSED' : 'OPEN',
      new Date(project.createdAt),
      new Date(project.updatedAt),
      project.items.totalCount,
      project.shortDescription, // Keep same value for both fields for now
      project.readme
    )
  }

  /**
   * Get age of project in days
   */
  getAgeInDays(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days since last update
   */
  getDaysSinceUpdate(): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get a human-readable summary of the project
   */
  getSummary(): string {
    return `${this.title} (${this.owner}/${this.id}) - ${this.itemCount} items`
  }

  /**
   * Check if project has any items
   */
  hasItems(): boolean {
    return this.itemCount > 0
  }

  /**
   * Convert project data to LLMInfo-compatible key-value pairs
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectV2DTO.Keys.PROJECT_V2_CREATED_AT]: this.createdAt.toISOString(),
      [ProjectV2DTO.Keys.PROJECT_V2_DESCRIPTION]: this.description || '',
      [ProjectV2DTO.Keys.PROJECT_V2_ID]: this.id,
      [ProjectV2DTO.Keys.PROJECT_V2_ITEM_COUNT]: String(this.itemCount),
      [ProjectV2DTO.Keys.PROJECT_V2_OWNER]: this.owner,
      [ProjectV2DTO.Keys.PROJECT_V2_OWNER_TYPE]: this.ownerType,
      [ProjectV2DTO.Keys.PROJECT_V2_README]: this.readme || '',
      [ProjectV2DTO.Keys.PROJECT_V2_SHORT_DESCRIPTION]: this.shortDescription || '',
      [ProjectV2DTO.Keys.PROJECT_V2_STATE]: this.state,
      [ProjectV2DTO.Keys.PROJECT_V2_TITLE]: this.title,
      [ProjectV2DTO.Keys.PROJECT_V2_UPDATED_AT]: this.updatedAt.toISOString(),
      [ProjectV2DTO.Keys.PROJECT_V2_URL]: this.url,
      [ProjectV2DTO.Keys.PROJECT_V2_VISIBILITY]: this.visibility
    }
  }
}