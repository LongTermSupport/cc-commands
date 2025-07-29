/**
 * @file GitHub GraphQL API Service
 * 
 * Real GraphQL implementation for GitHub Projects v2 API.
 * Uses corrected types and queries discovered through TDD approach.
 */

import { graphql } from '@octokit/graphql'

import { OrchestratorError } from '../../../core/error/OrchestratorError.js'
import { ProjectV2DTO } from '../dto/ProjectV2DTO.js'
import { ProjectV2ItemDTO } from '../dto/ProjectV2ItemDTO.js'
import { ProjectV2FieldGraphQLResponse, ProjectV2GraphQLResponse, ProjectV2ItemGraphQLResponse } from '../types/GitHubGraphQLTypes.js'

/**
 * GitHub GraphQL API Service for Projects v2 operations
 * 
 * This service provides GraphQL-based access to GitHub Projects v2 API.
 * Uses real GraphQL queries based on API discovery through TDD process.
 */
export class GitHubGraphQLService {
  private readonly graphqlClient: typeof graphql

  constructor(token: string) {
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`
      }
    })
  }

  /**
   * Execute raw GraphQL query
   * Used for testing and custom queries not covered by specific methods
   * 
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @returns Raw GraphQL response
   */
  async executeQuery<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    try {
      return await this.graphqlClient(query, variables) as T
    } catch (error) {
      // Ensure we create a proper Error with a string message
      let errorToWrap: Error
      
      if (error instanceof Error) {
        // Handle GraphQL library errors that might have complex message objects
        const messageStr = typeof error.message === 'string' ? error.message : String(error.message || error)
        errorToWrap = new Error(messageStr)
      } else {
        errorToWrap = new Error(String(error))
      }
      
      throw new OrchestratorError(
        errorToWrap,
        ['Check GitHub API token permissions', 'Verify GraphQL query syntax', 'Check network connectivity'],
        { query: query.slice(0, 100), variables: JSON.stringify(variables) }
      )
    }
  }

  /**
   * Find projects by owner (user or organization)
   * 
   * @param owner - GitHub user or organization login
   * @returns Array of project DTOs
   * @throws {OrchestratorError} When API request fails
   */
  async findProjectsByOwner(owner: string): Promise<ProjectV2DTO[]> {
    // Try both user and organization queries since we don't know the owner type
    const queries = [
      {
        query: `
          query($login: String!) {
            user(login: $login) {
              projectsV2(first: 20) {
                totalCount
                nodes {
                  id
                  title
                  url
                  shortDescription
                  readme
                  public
                  closed
                  createdAt
                  updatedAt
                  owner {
                    __typename
                    ... on User { login }
                    ... on Organization { login }
                  }
                  items(first: 1) {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        type: 'User'
      },
      {
        query: `
          query($login: String!) {
            organization(login: $login) {
              projectsV2(first: 20) {
                totalCount
                nodes {
                  id
                  title
                  url
                  shortDescription
                  readme
                  public
                  closed
                  createdAt
                  updatedAt
                  owner {
                    __typename
                    ... on User { login }
                    ... on Organization { login }
                  }
                  items(first: 1) {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        type: 'Organization'
      }
    ]

    // Try user query first, then organization if it fails
    let lastError: Error | null = null
    
     
    for (const { query, type } of queries) {
      try {
        interface QueryResult {
          organization?: {
            projectsV2: {
              nodes: Array<{
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
              }>
            }
          }
          user?: {
            projectsV2: {
              nodes: Array<{
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
              }>
            }
          }
        }
        
        // eslint-disable-next-line no-await-in-loop -- Intentionally sequential: try user first, then organization
        const result = await this.executeQuery<QueryResult>(query, { login: owner })
        
        const ownerData = result[type.toLowerCase() as keyof QueryResult]
        if (ownerData?.projectsV2?.nodes) {
          return ownerData.projectsV2.nodes.map((projectNode) => {
            // Create a ProjectV2GraphQLResponse structure with required __typename
            const graphqlResponse: ProjectV2GraphQLResponse = {
              node: {
                ...projectNode,
                __typename: 'ProjectV2'
              }
            }
            return ProjectV2DTO.fromGraphQLResponse(graphqlResponse)
          })
        }
      } catch (error) {
        // Store error and continue to next query type if this one fails
        if (error instanceof Error) {
          lastError = error
        } else {
          // Handle non-Error objects (like GraphQL errors)
          const errorStr = typeof error === 'object' && error !== null 
            ? JSON.stringify(error) 
            : String(error)
          lastError = new Error(`GraphQL Error: ${errorStr}`)
        }
        continue
      }
    }

    // If both user and organization queries failed, throw error
    let errorMessage = `Failed to find projects for owner: ${owner}`
    if (lastError) {
      errorMessage = typeof lastError.message === 'string' ? lastError.message : String(lastError.message || lastError);
    }
    
    throw new OrchestratorError(
      new Error(errorMessage),
      ['Check if owner exists on GitHub', 'Verify owner has public projects', 'Check GitHub token permissions'],
      { owner }
    )
  }

  /**
   * Get project by node ID
   * 
   * @param projectNodeId - GitHub node ID for the project (starts with "PVT_")
   * @returns Project data as DTO
   * @throws {OrchestratorError} When API request fails
   */
  async getProject(projectNodeId: string): Promise<ProjectV2DTO> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            id
            title
            url
            shortDescription
            readme
            public
            closed
            createdAt
            updatedAt
            owner {
              __typename
              ... on User { login }
              ... on Organization { login }
            }
            items(first: 100) {
              totalCount
              nodes {
                id
                type
                content {
                  __typename
                  ... on Issue {
                    id
                    title
                    url
                    repository { nameWithOwner }
                  }
                  ... on PullRequest {
                    id
                    title
                    url
                    repository { nameWithOwner }
                  }
                }
                fieldValues(first: 20) {
                  totalCount
                  nodes {
                    __typename
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      date
                      field { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    
    try {
      const result = await this.executeQuery<ProjectV2GraphQLResponse>(query, { 
        projectId: projectNodeId 
      })
      
      if (!result.node) {
        throw new OrchestratorError(
          new Error(`Project not found or access denied: ${projectNodeId}`),
          ['Check if project ID is correct', 'Verify token has access to the project', 'Ensure project exists and is accessible'],
          { projectNodeId }
        )
      }
      
      return ProjectV2DTO.fromGraphQLResponse(result)
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check project ID format (should start with PVT_)', 'Verify GitHub token permissions', 'Check network connectivity'],
        { projectNodeId }
      )
    }
  }

  /**
   * Get project fields (custom field definitions)
   * 
   * @param projectNodeId - GitHub node ID for the project
   * @returns Array of field definitions
   * @throws {OrchestratorError} When API request fails
   */
  async getProjectFields(projectNodeId: string): Promise<ProjectV2FieldGraphQLResponse[]> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 50) {
              totalCount
              nodes {
                __typename
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      interface FieldsQueryResult {
        node: null | {
          fields: {
            nodes: ProjectV2FieldGraphQLResponse[]
          }
        }
      }
      
      const result = await this.executeQuery<FieldsQueryResult>(query, { 
        projectId: projectNodeId 
      })
      
      if (!result.node?.fields?.nodes) {
        throw new OrchestratorError(
          new Error(`Project not found or has no fields: ${projectNodeId}`),
          ['Check if project ID is correct', 'Verify token has access to the project', 'Ensure project exists'],
          { projectNodeId }
        )
      }

      return result.node.fields.nodes as ProjectV2FieldGraphQLResponse[]
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check project ID format (should start with PVT_)', 'Verify GitHub token permissions', 'Check network connectivity'],
        { projectNodeId }
      )
    }
  }

  /**
   * Get project items by project node ID
   * 
   * @param projectNodeId - GitHub node ID for the project
   * @returns Array of project item DTOs
   * @throws {OrchestratorError} When API request fails
   */
  async getProjectItems(projectNodeId: string): Promise<ProjectV2ItemDTO[]> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                type
                content {
                  __typename
                  ... on Issue {
                    id
                    title
                    url
                    repository { nameWithOwner }
                  }
                  ... on PullRequest {
                    id
                    title
                    url
                    repository { nameWithOwner }
                  }
                }
                fieldValues(first: 50) {
                  totalCount
                  nodes {
                    __typename
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      date
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldRepositoryValue {
                      field { id name }
                    }
                    ... on ProjectV2ItemFieldUserValue {
                      field { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      interface ItemsQueryResult {
        node: null | {
          items: {
            nodes: ProjectV2ItemGraphQLResponse[]
          }
        }
      }
      
      const result = await this.executeQuery<ItemsQueryResult>(query, { 
        projectId: projectNodeId 
      })
      
      if (!result.node?.items?.nodes) {
        throw new OrchestratorError(
          new Error(`Project not found or has no items: ${projectNodeId}`),
          ['Check if project ID is correct', 'Verify token has access to the project', 'Ensure project exists'],
          { projectNodeId }
        )
      }

      return result.node.items.nodes.map((itemNode) => ProjectV2ItemDTO.fromGraphQLResponse(itemNode))
    } catch (error) {
      if (error instanceof OrchestratorError) {
        throw error
      }
      
      throw new OrchestratorError(
        error instanceof Error ? error : new Error(String(error)),
        ['Check project ID format (should start with PVT_)', 'Verify GitHub token permissions', 'Check network connectivity'],
        { projectNodeId }
      )
    }
  }
}