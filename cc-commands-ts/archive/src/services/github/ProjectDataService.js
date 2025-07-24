/**
 * @file Service for fetching GitHub Project (kanban board) data
 *
 * This service works with GitHub Projects v2, which are the kanban board
 * project management features, NOT repositories.
 */
/**
 * Service for fetching GitHub Project data
 */
export class ProjectDataService {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    /**
     * Extract unique repositories from project items
     *
     * @param items - Array of project items
     * @returns Array of unique repository references
     */
    extractRepositories(items) {
        const repoMap = new Map();
        for (const item of items) {
            if (item.repository) {
                const key = `${item.repository.owner}/${item.repository.name}`;
                repoMap.set(key, item.repository);
            }
        }
        return [...repoMap.values()];
    }
    /**
     * Fetch items from a GitHub Project
     *
     * @param projectId - Project node ID
     * @param options - Query options
     * @param options.limit - Maximum number of items to fetch
     * @returns Array of project items
     */
    async fetchProjectItems(projectId, options = {}) {
        try {
            const { limit = 100 } = options;
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
      `;
            const response = await this.githubApi.graphql(query, { limit, projectId });
            const items = response.data?.node?.items?.nodes || [];
            return items.map((item) => {
                const content = item.content || {};
                const assignees = content.assignees?.nodes?.map(a => a.login) || [];
                // Find status field value
                let status;
                const fieldValues = item.fieldValues?.nodes || [];
                for (const fv of fieldValues) {
                    if (fv.field?.name === 'Status' && fv.name) {
                        status = fv.name;
                        break;
                    }
                }
                const result = {
                    assignees,
                    id: item.id,
                    status,
                    title: content.title || 'Untitled',
                    type: item.type
                };
                if (content.repository) {
                    result.repository = {
                        name: content.repository.name,
                        owner: content.repository.owner.login
                    };
                }
                if (content.url) {
                    result.url = content.url;
                }
                return result;
            });
        }
        catch (error) {
            throw new Error(`Failed to fetch project items: ${error}`);
        }
    }
    /**
     * Find GitHub Projects for an organization
     *
     * @param org - Organization name
     * @param options - Query options
     * @param options.includeArchived - Whether to include archived projects
     * @param options.limit - Maximum number of projects to fetch
     * @returns Array of project data
     */
    async findOrganizationProjects(org, options = {}) {
        try {
            const { includeArchived = false, limit = 20 } = options;
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
      `;
            const response = await this.githubApi.graphql(query, { limit, org });
            const projects = response.data?.organization?.projectsV2?.nodes || [];
            return projects
                .filter((p) => includeArchived || !p.closed)
                .map((project) => ({
                closed: project.closed,
                createdAt: new Date(project.createdAt),
                description: project.shortDescription,
                id: project.id,
                itemCount: project.items?.totalCount ?? 0,
                number: project.number,
                public: project.public,
                title: project.title,
                updatedAt: new Date(project.updatedAt),
                url: project.url
            }));
        }
        catch (error) {
            throw new Error(`Failed to fetch organization projects: ${error}`);
        }
    }
    /**
     * Get the most recently updated project for an organization
     *
     * @param org - Organization name
     * @returns Most recent project or null
     */
    async getMostRecentProject(org) {
        const projects = await this.findOrganizationProjects(org, {
            includeArchived: false,
            limit: 1
        });
        return projects[0] || null;
    }
}
