import { Octokit } from '@octokit/rest'
import { 
  IGitHubApiService, 
  IGitHubProject, 
  IRepository, 
  IIssue, 
  ICommit, 
  IComment 
} from '../../interfaces/index.js'

/**
 * Implementation of GitHub API service using Octokit
 */
export class GitHubApiService implements IGitHubApiService {
  private octokit: Octokit
  
  constructor(authToken?: string) {
    this.octokit = new Octokit({
      auth: authToken || process.env.GITHUB_TOKEN,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }
  
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.octokit.rest.users.getAuthenticated()
      return true
    } catch {
      return false
    }
  }
  
  async getAuthenticatedUser(): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated()
      return data.login
    } catch {
      return null
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
      
      const response: any = await this.octokit.graphql(query, { org })
      
      return response.organization.projectsV2.nodes.map((project: any) => ({
        id: parseInt(project.id.match(/\d+$/)[0], 10),
        title: project.title,
        url: project.url,
        organization: org,
        number: project.number,
        updatedAt: new Date(project.updatedAt),
        itemCount: project.items.totalCount,
        closed: project.closed,
        public: project.public,
      }))
    } catch (error) {
      console.error('Error listing organization projects:', error)
      throw new Error(`Failed to list projects for organization ${org}`)
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
      
      const response: any = await this.octokit.graphql(query, { org, number: projectNumber })
      const project = response.organization.projectV2
      
      if (!project) {
        throw new Error(`Project ${projectNumber} not found in organization ${org}`)
      }
      
      return {
        id: parseInt(project.id.match(/\d+$/)[0], 10),
        title: project.title,
        url: project.url,
        organization: org,
        number: project.number,
        updatedAt: new Date(project.updatedAt),
        itemCount: project.items.totalCount,
        description: project.shortDescription,
        closed: project.closed,
        public: project.public,
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
      
      const response: any = await this.octokit.graphql(query, { org, number: projectNumber })
      
      // Extract unique repositories
      const repoMap = new Map<string, IRepository>()
      
      for (const item of response.organization.projectV2.items.nodes) {
        if (item.content?.repository) {
          const repo = item.content.repository
          if (!repoMap.has(repo.nameWithOwner)) {
            repoMap.set(repo.nameWithOwner, {
              name: repo.name,
              fullName: repo.nameWithOwner,
              private: repo.isPrivate,
              updatedAt: repo.updatedAt,
              defaultBranch: repo.defaultBranchRef?.name || 'main',
            })
          }
        }
      }
      
      return Array.from(repoMap.values())
    } catch (error) {
      console.error('Error getting project repositories:', error)
      throw new Error(`Failed to get repositories for project ${projectNumber}`)
    }
  }
  
  async getRepositoryIssues(owner: string, repo: string, since: Date): Promise<IIssue[]> {
    try {
      const issues: IIssue[] = []
      
      // Get issues
      const { data: issuesData } = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        since: since.toISOString(),
        per_page: 100,
      })
      
      // Get pull requests
      const { data: prsData } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      })
      
      // Convert to our interface
      for (const issue of issuesData) {
        if (!issue.pull_request) {
          issues.push({
            number: issue.number,
            title: issue.title,
            state: issue.state as 'open' | 'closed',
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            isPullRequest: false,
            repository: { name: repo, owner },
          })
        }
      }
      
      // Filter PRs by date and add them
      for (const pr of prsData) {
        if (new Date(pr.updated_at) >= since) {
          issues.push({
            number: pr.number,
            title: pr.title,
            state: pr.state as 'open' | 'closed',
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            isPullRequest: true,
            repository: { name: repo, owner },
          })
        }
      }
      
      return issues
    } catch (error) {
      console.error(`Error getting issues for ${owner}/${repo}:`, error)
      return []
    }
  }
  
  async getRepositoryCommits(owner: string, repo: string, since: Date): Promise<ICommit[]> {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since: since.toISOString(),
        per_page: 100,
      })
      
      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        authorDate: commit.commit.author?.date || commit.commit.committer?.date || '',
        repository: { name: repo, owner },
      }))
    } catch (error) {
      console.error(`Error getting commits for ${owner}/${repo}:`, error)
      return []
    }
  }
  
  async getRepositoryComments(owner: string, repo: string, since: Date): Promise<IComment[]> {
    try {
      const comments: IComment[] = []
      
      // Get issue comments
      const { data: issueComments } = await this.octokit.rest.issues.listCommentsForRepo({
        owner,
        repo,
        since: since.toISOString(),
        per_page: 100,
      })
      
      for (const comment of issueComments) {
        comments.push({
          id: comment.id,
          createdAt: comment.created_at,
          repository: { name: repo, owner },
        })
      }
      
      // Get PR review comments
      const { data: prComments } = await this.octokit.rest.pulls.listReviewCommentsForRepo({
        owner,
        repo,
        since: since.toISOString(),
        per_page: 100,
      })
      
      for (const comment of prComments) {
        comments.push({
          id: comment.id,
          createdAt: comment.created_at,
          repository: { name: repo, owner },
        })
      }
      
      return comments
    } catch (error) {
      console.error(`Error getting comments for ${owner}/${repo}:`, error)
      return []
    }
  }
}