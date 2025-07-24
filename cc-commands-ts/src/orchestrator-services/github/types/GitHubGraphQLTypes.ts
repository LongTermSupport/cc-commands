/**
 * @file GitHub GraphQL API Response Types
 * 
 * CORRECTED TYPES - Based on real GitHub Projects v2 GraphQL API responses.
 * Updated from actual API discovery on 2025-01-24.
 */

/**
 * GitHub Projects v2 GraphQL response (real structure)
 */
export interface ProjectV2GraphQLResponse {
  node: {
    __typename: 'ProjectV2'
    closed: boolean
    createdAt: string
    id: string
    items: {
      nodes: ProjectV2ItemGraphQLResponse[]
      totalCount: number
    }
    owner: {
      __typename: 'Organization' | 'User'
      login: string
    }
    public: boolean
    readme: null | string
    shortDescription: null | string
    title: string
    updatedAt: string
    url: string
  }
}

/**
 * GitHub Projects v2 Item GraphQL response (real structure)
 */
export interface ProjectV2ItemGraphQLResponse {
  __typename: 'ProjectV2Item'
  content: null | {
    __typename: 'Issue' | 'PullRequest'
    id: string
    repository: {
      nameWithOwner: string
    }
    title: string
    url: string
  }
  fieldValues: {
    nodes: ProjectV2FieldValueGraphQLResponse[]
    totalCount: number
  }
  id: string
  type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST'
}

/**
 * GitHub Projects v2 Field Value GraphQL response (real structure)
 * 
 * Field values can be various types - this is a union of all possible field value types
 */
export type ProjectV2FieldValueGraphQLResponse = 
  | ProjectV2ItemFieldDateValue
  | ProjectV2ItemFieldRepositoryValue
  | ProjectV2ItemFieldSingleSelectValue
  | ProjectV2ItemFieldTextValue
  | ProjectV2ItemFieldUserValue

/**
 * Text field value
 */
export interface ProjectV2ItemFieldTextValue {
  __typename: 'ProjectV2ItemFieldTextValue'
  field: {
    id: string
    name: string
  }
  text: string
}

/**
 * Single select field value
 */
export interface ProjectV2ItemFieldSingleSelectValue {
  __typename: 'ProjectV2ItemFieldSingleSelectValue'
  field: {
    id: string
    name: string
  }
  name: string
}

/**
 * Date field value
 */
export interface ProjectV2ItemFieldDateValue {
  __typename: 'ProjectV2ItemFieldDateValue'
  date: string
  field: {
    id: string
    name: string
  }
}

/**
 * Repository field value (built-in field)
 */
export interface ProjectV2ItemFieldRepositoryValue {
  __typename: 'ProjectV2ItemFieldRepositoryValue'
  // Repository field values don't seem to have exposed data in the API
}

/**
 * User field value (assignee, etc.)
 */
export interface ProjectV2ItemFieldUserValue {
  __typename: 'ProjectV2ItemFieldUserValue'
  // User field values structure is not yet discovered
}

/**
 * STUB: GitHub Projects v2 Field definition
 */
export interface ProjectV2FieldGraphQLResponse {
  __typename: 'ProjectV2Field' | 'ProjectV2IterationField' | 'ProjectV2SingleSelectField'
  dataType: 'DATE' | 'ITERATION' | 'SINGLE_SELECT' | 'TEXT'
  id: string
  name: string
  options?: Array<{
    id: string
    name: string
  }>
}

/**
 * STUB: GraphQL query variables for Projects v2
 */
export interface ProjectV2QueryVariables {
  after?: string
  first?: number
  projectId: string
}