/**
 * @file GitHub Project v2 Item Data Transfer Object
 * 
 * STUB IMPLEMENTATION - Will be corrected when real GraphQL API calls reveal actual structure.
 */

import { ILLMDataDTO } from '../../../core/interfaces/ILLMDataDTO.js'
import { ProjectV2ItemGraphQLResponse } from '../types/GitHubGraphQLTypes.js'

/**
 * Data Transfer Object for GitHub Project v2 Item information (GraphQL-based)
 */
export class ProjectV2ItemDTO implements ILLMDataDTO {
  private static readonly Keys = {
    PROJECT_V2_ITEM_FIELD_VALUES: 'PROJECT_V2_ITEM_FIELD_VALUES',
    PROJECT_V2_ITEM_ID: 'PROJECT_V2_ITEM_ID',
    PROJECT_V2_ITEM_REPOSITORY: 'PROJECT_V2_ITEM_REPOSITORY',
    PROJECT_V2_ITEM_TITLE: 'PROJECT_V2_ITEM_TITLE',
    PROJECT_V2_ITEM_TYPE: 'PROJECT_V2_ITEM_TYPE',
    PROJECT_V2_ITEM_URL: 'PROJECT_V2_ITEM_URL'
  } as const

  constructor(
    public readonly id: string,
    public readonly type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST',
    public readonly title: null | string,
    public readonly url: null | string,
    public readonly repository: null | string,
    public readonly fieldValues: Record<string, string>
  ) {}

  /**
   * Create ProjectV2ItemDTO from real GraphQL response
   * Updated based on actual API structure discovery
   */
  static fromGraphQLResponse(response: ProjectV2ItemGraphQLResponse): ProjectV2ItemDTO {
    const title = response.content?.title || null
    const url = response.content?.url || null
    const repository = response.content?.repository.nameWithOwner || null
    
    // Process field values based on real API structure
    const fieldValues: Record<string, string> = {}
    for (const fieldValue of response.fieldValues.nodes) {
      // Handle different field value types
      switch (fieldValue.__typename) {
        case 'ProjectV2ItemFieldDateValue': {
          fieldValues[fieldValue.field.name] = fieldValue.date
          break
        }

        case 'ProjectV2ItemFieldRepositoryValue': {
          // Repository field values don't expose data in the API
          break
        }

        case 'ProjectV2ItemFieldSingleSelectValue': {
          fieldValues[fieldValue.field.name] = fieldValue.name
          break
        }

        case 'ProjectV2ItemFieldTextValue': {
          fieldValues[fieldValue.field.name] = fieldValue.text
          break
        }

        case 'ProjectV2ItemFieldUserValue': {
          // User field values structure not yet implemented
          break
        }
      }
    }
    
    return new ProjectV2ItemDTO(
      response.id,
      response.type,
      title,
      url,
      repository,
      fieldValues
    )
  }

  /**
   * Get all field names
   */
  getFieldNames(): string[] {
    return Object.keys(this.fieldValues)
  }

  /**
   * Get field value by name
   */
  getFieldValue(fieldName: string): null | string {
    return this.fieldValues[fieldName] || null
  }

  /**
   * Check if item has content (not a draft issue)
   */
  hasContent(): boolean {
    return this.title !== null && this.url !== null
  }

  /**
   * Convert item data to LLMInfo-compatible key-value pairs
   */
  toLLMData(): Record<string, string> {
    return {
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_FIELD_VALUES]: JSON.stringify(this.fieldValues),
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_ID]: this.id,
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_REPOSITORY]: this.repository || '',
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_TITLE]: this.title || '',
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_TYPE]: this.type,
      [ProjectV2ItemDTO.Keys.PROJECT_V2_ITEM_URL]: this.url || ''
    }
  }
}