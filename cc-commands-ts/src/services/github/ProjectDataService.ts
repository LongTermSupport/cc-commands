/**
 * @file Service for fetching GitHub Project (kanban board) data
 * 
 * This service works with GitHub Projects v2, which are the kanban board
 * project management features, NOT repositories.
 */

import type { IGitHubApiService } from '../../interfaces/IGitHubApiService.js'

/**
 * GitHub Project data
 */
export interface GitHubProjectData {
  id: string
  number: number
  title: string
  description?: string
  url: string
  public: boolean
  closed: boolean
  createdAt: Date
  updatedAt: Date
  itemCount: number
}

/**
 * Project item data
 */
export interface ProjectItemData {
  id: string
  type: 'ISSUE' | 'PULL_REQUEST' | 'DRAFT_ISSUE'
  title: string
  repository?: {
    owner: string
    name: string
  }
  url?: string
  status?: string
  assignees: string[]
}

/**
 * Service for fetching GitHub Project data
 */
export class ProjectDataService {
  constructor(
    private githubApi: IGitHubApiService
  ) {}

  /**
   * Find GitHub Projects for an organization
   * 
   * @param org - Organization name
   * @param options - Query options
   * @returns Array of project data
   */
  async findOrganizationProjects(
    org: string,
    options: {
      limit?: number
      includeArchived?: boolean
    } = {}
  ): Promise<GitHubProjectData[]> {
    try {
      const { limit = 20, includeArchived = false } = options

      // Use GraphQL to fetch projects v2
      const query = `
        query($org: String!, $limit: Int!) {
          organization(login: $org) {
            projectsV2(first: $limit, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                id
                number
                title
                shortDescription
                url
                public
                closed
                createdAt
                updatedAt
                items {
                  totalCount
                }
              }
            }
          }
        }
      `

      const response = await (this.githubApi as unknown as {
        graphql(query: string, variables: any): Promise<any>
      }).graphql(query, { org, limit })

      const projects = response.organization?.projectsV2?.nodes || []

      return projects
        .filter((p: any) => includeArchived || !p.closed)
        .map((project: any) => ({
          id: project.id,
          number: project.number,
          title: project.title,
          description: project.shortDescription,
          url: project.url,
          public: project.public,
          closed: project.closed,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          itemCount: project.items.totalCount
        }))
    } catch (error) {
      throw new Error(`Failed to fetch organization projects: ${error}`)
    }
  }

  /**
   * Get the most recently updated project for an organization
   * 
   * @param org - Organization name
   * @returns Most recent project or null
   */
  async getMostRecentProject(org: string): Promise<GitHubProjectData | null> {
    const projects = await this.findOrganizationProjects(org, {
      limit: 1,
      includeArchived: false
    })

    return projects[0] || null
  }

  /**
   * Fetch items from a GitHub Project
   * 
   * @param projectId - Project node ID
   * @param options - Query options
   * @returns Array of project items
   */
  async fetchProjectItems(
    projectId: string,
    options: {
      limit?: number
    } = {}
  ): Promise<ProjectItemData[]> {
    try {
      const { limit = 100 } = options

      const query = `
        query($projectId: ID!, $limit: Int!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: $limit) {
                nodes {
                  id
                  type
                  content {
                    ... on Issue {
                      title
                      url
                      repository {
                        owner {
                          login
                        }
                        name
                      }
                      assignees(first: 5) {
                        nodes {
                          login
                        }
                      }
                    }
                    ... on PullRequest {
                      title
                      url
                      repository {
                        owner {
                          login
                        }
                        name
                      }
                      assignees(first: 5) {
                        nodes {
                          login
                        }
                      }
                    }
                    ... on DraftIssue {
                      title
                      assignees(first: 5) {
                        nodes {
                          login
                        }
                      }
                    }
                  }
                  fieldValues(first: 10) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const response = await (this.githubApi as unknown as {
        graphql(query: string, variables: any): Promise<any>
      }).graphql(query, { projectId, limit })

      const items = response.node?.items?.nodes || []

      return items.map((item: any) => {
        const content = item.content || {}
        const assignees = content.assignees?.nodes?.map((a: any) => a.login) || []

        // Find status field value
        let status: string | undefined
        item.fieldValues?.nodes?.forEach((fv: any) => {
          if (fv.field?.name === 'Status' && fv.name) {
            status = fv.name
          }
        })

        const result: ProjectItemData = {
          id: item.id,
          type: item.type,
          title: content.title || 'Untitled',
          assignees,
          status
        }

        if (content.repository) {
          result.repository = {
            owner: content.repository.owner.login,
            name: content.repository.name
          }
        }

        if (content.url) {
          result.url = content.url
        }

        return result
      })
    } catch (error) {
      throw new Error(`Failed to fetch project items: ${error}`)
    }
  }

  /**
   * Extract unique repositories from project items
   * 
   * @param items - Array of project items
   * @returns Array of unique repository references
   */
  extractRepositories(items: ProjectItemData[]): Array<{ owner: string; name: string }> {
    const repoMap = new Map<string, { owner: string; name: string }>()

    items.forEach(item => {
      if (item.repository) {
        const key = `${item.repository.owner}/${item.repository.name}`
        repoMap.set(key, item.repository)
      }
    })

    return Array.from(repoMap.values())
  }
}