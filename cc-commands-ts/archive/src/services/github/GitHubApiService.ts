import { Octokit } from '@octokit/rest'

import { 
  IComment, 
  ICommit, 
  IGitHubApiService, 
  IGitHubProject, 
  IIssue, 
  IRepository 
} from '../../interfaces'
import { 
  GitHubProjectListResponse, 
  GitHubProjectResponse,
  GitHubRepositoryResponse
} from '../../types/GitHubTypes'

/**
 * Implementation of GitHub API service using Octokit
 */
export class GitHubApiService implements IGitHubApiService {
  private octokit: Octokit
  
  constructor(options?: { auth?: string }) {
    this.octokit = new Octokit({
      auth: options?.auth || process.env['GITHUB_TOKEN'],
      // eslint-disable-next-line new-cap -- Intl.DateTimeFormat is a standard constructor
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }
  
  async getAuthenticatedUser(): Promise<null | string> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated()
      return data.login
    } catch {
      return null
    }
  }
  
  async getProject(org: string, projectNumber: number): Promise<IGitHubProject> {
    try {
      const query = `
        query($org: String!, $number: Int!) {
          organization(login: $org) {
            projectV2(number: $number) {
              id
              title
              url
              number
              updatedAt
              closed
              public
              shortDescription
              items {
                totalCount
              }
            }
          }
        }
      `
      
      const response = await this.octokit.graphql<GitHubProjectResponse>(query, { number: projectNumber, org })
      const project = response.organization.projectV2
      
      if (!project) {
        throw new Error(`Project ${projectNumber} not found in organization ${org}`)
      }
      
      return {
        closed: project.closed,
        description: project.shortDescription || undefined,
        id: Number.parseInt(project.id.match(/\d+$/)![0], 10),
        itemCount: project.items.totalCount,
        number: project.number,
        organization: org,
        public: project.public,
        title: project.title,
        updatedAt: new Date(project.updatedAt),
        url: project.url,
      }
    } catch (error) {
      console.error('Error getting project:', error)
      throw new Error(`Failed to get project ${projectNumber} for organization ${org}`)
    }
  }

  async getProjectRepositories(org: string, projectNumber: number): Promise<IRepository[]> {
    try {
      const query = `
        query($org: String!, $number: Int!) {
          organization(login: $org) {
            projectV2(number: $number) {
              items(first: 100) {
                nodes {
                  content {
                    ... on Issue {
                      repository {
                        name
                        nameWithOwner
                        isPrivate
                        updatedAt
                        defaultBranchRef {
                          name
                        }
                      }
                    }
                    ... on PullRequest {
                      repository {
                        name
                        nameWithOwner
                        isPrivate
                        updatedAt
                        defaultBranchRef {
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
      `
      
      const response = await this.octokit.graphql<GitHubProjectResponse>(query, { number: projectNumber, org })
      
      // Extract unique repositories
      const repoMap = new Map<string, IRepository>()
      
      for (const item of response.organization.projectV2.items.nodes) {
        if (item.content?.repository) {
          const repo = item.content.repository
          if (!repoMap.has(repo.nameWithOwner)) {
            repoMap.set(repo.nameWithOwner, {
              defaultBranch: repo.defaultBranchRef?.name || 'main',
              fullName: repo.nameWithOwner,
              name: repo.name,
              private: repo.isPrivate,
              updatedAt: repo.updatedAt,
            })
          }
        }
      }
      
      return [...repoMap.values()]
    } catch (error) {
      console.error('Error getting project repositories:', error)
      throw new Error(`Failed to get repositories for project ${projectNumber}`)
    }
  }
  
  /**
   * Get repository information
   */
  async getRepository(owner: string, name: string): Promise<GitHubRepositoryResponse> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo: name,
      })
      return data as GitHubRepositoryResponse
    } catch (error) {
      console.error(`Error getting repository ${owner}/${name}:`, error)
      throw new Error(`Failed to get repository ${owner}/${name}`)
    }
  }
  
  async getRepositoryComments(owner: string, repo: string, since: Date): Promise<IComment[]> {
    try {
      const comments: IComment[] = []
      
      // Get issue comments
      const { data: issueComments } = await this.octokit.rest.issues.listCommentsForRepo({
        owner,
        // eslint-disable-next-line camelcase -- GitHub API requires snake_case
        per_page: 100,
        repo,
        since: since.toISOString(),
      })
      
      for (const comment of issueComments) {
        comments.push({
          createdAt: comment.created_at,
          id: comment.id,
          repository: { name: repo, owner },
        })
      }
      
      // Get PR review comments
      const { data: prComments } = await this.octokit.rest.pulls.listReviewCommentsForRepo({
        owner,
        // eslint-disable-next-line camelcase -- GitHub API requires snake_case
        per_page: 100,
        repo,
        since: since.toISOString(),
      })
      
      for (const comment of prComments) {
        comments.push({
          createdAt: comment.created_at,
          id: comment.id,
          repository: { name: repo, owner },
        })
      }
      
      return comments
    } catch (error) {
      console.error(`Error getting comments for ${owner}/${repo}:`, error)
      return []
    }
  }
  
  async getRepositoryCommits(owner: string, repo: string, since: Date): Promise<ICommit[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        // eslint-disable-next-line camelcase -- GitHub API requires snake_case
        per_page: 100,
        repo,
        since: since.toISOString(),
      })
      
      return data.map(commit => ({
        authorDate: commit.commit.author?.date || commit.commit.committer?.date || '',
        message: commit.commit.message,
        repository: { name: repo, owner },
        sha: commit.sha,
      }))
    } catch (error) {
      console.error(`Error getting commits for ${owner}/${repo}:`, error)
      return []
    }
  }
  
  async getRepositoryIssues(owner: string, repo: string, since: Date): Promise<IIssue[]> {
    try {
      const issues: IIssue[] = []
      
      // Get issues
      const { data: issuesData } = await this.octokit.rest.issues.listForRepo({
        owner,
        // eslint-disable-next-line camelcase -- GitHub API requires snake_case
        per_page: 100,
        repo,
        since: since.toISOString(),
        state: 'all',
      })
      
      // Get pull requests
      const { data: prsData } = await this.octokit.rest.pulls.list({
        direction: 'desc',
        owner,
        // eslint-disable-next-line camelcase -- GitHub API requires snake_case
        per_page: 100,
        repo,
        sort: 'updated',
        state: 'all',
      })
      
      // Convert to our interface
      for (const issue of issuesData) {
        if (!issue.pull_request) {
          issues.push({
            createdAt: issue.created_at,
            isPullRequest: false,
            number: issue.number,
            repository: { name: repo, owner },
            state: issue.state as 'closed' | 'open',
            title: issue.title,
            updatedAt: issue.updated_at,
          })
        }
      }
      
      // Filter PRs by date and add them
      for (const pr of prsData) {
        if (new Date(pr.updated_at) >= since) {
          issues.push({
            createdAt: pr.created_at,
            isPullRequest: true,
            number: pr.number,
            repository: { name: repo, owner },
            state: pr.state as 'closed' | 'open',
            title: pr.title,
            updatedAt: pr.updated_at,
          })
        }
      }
      
      return issues
    } catch (error) {
      console.error(`Error getting issues for ${owner}/${repo}:`, error)
      return []
    }
  }
  
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.octokit.rest.users.getAuthenticated()
      return true
    } catch {
      return false
    }
  }
  
  async listOrganizationProjects(org: string): Promise<IGitHubProject[]> {
    try {
      // Use GraphQL API for Projects V2
      const query = `
        query($org: String!) {
          organization(login: $org) {
            projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                id
                title
                url
                number
                updatedAt
                closed
                public
                items {
                  totalCount
                }
              }
            }
          }
        }
      `
      
      const response = await this.octokit.graphql<GitHubProjectListResponse>(query, { org })
      
      return response.organization.projectsV2.nodes.map((project) => ({
        closed: project.closed,
        id: Number.parseInt(project.id.match(/\d+$/)![0], 10),
        itemCount: project.items.totalCount,
        number: project.number,
        organization: org,
        public: project.public,
        title: project.title,
        updatedAt: new Date(project.updatedAt),
        url: project.url,
      }))
    } catch (error) {
      console.error('Error listing organization projects:', error)
      throw new Error(`Failed to list projects for organization ${org}`)
    }
  }
}