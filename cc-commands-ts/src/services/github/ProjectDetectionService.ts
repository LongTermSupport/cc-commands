import { IGitHubApiService, IGitHubProject } from '../../interfaces/index.js'
import { GitRemoteParser } from '../../utils/GitRemoteParser.js'

/**
 * Service for detecting GitHub projects from various sources
 */
export class ProjectDetectionService {
  constructor(
    private githubApi: IGitHubApiService,
    private gitRemoteParser: GitRemoteParser
  ) {}
  
  /**
   * Detect a GitHub project from the current git repository
   */
  async detectFromGitRemote(): Promise<IGitHubProject> {
    // Check if we're in a git repository
    const isGitRepo = await this.gitRemoteParser.isGitRepository()
    if (!isGitRepo) {
      throw new Error('Not in a git repository. Please specify a project URL or organization/project-id manually.')
    }
    
    // Get organization from git remote
    const organization = await this.gitRemoteParser.getOrganizationFromRemote()
    if (!organization) {
      throw new Error('Could not determine GitHub organization from git remote. Please check your remote configuration.')
    }
    
    // List projects for the organization
    const projects = await this.githubApi.listOrganizationProjects(organization)
    
    if (projects.length === 0) {
      throw new Error(`No projects found for organization ${organization}`)
    }
    
    // Return the most recently updated project
    const mostRecent = projects
      .filter(p => !p.closed)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
    
    if (!mostRecent) {
      throw new Error(`No active projects found for organization ${organization}`)
    }
    
    console.log(`Auto-detected project: ${mostRecent.title} (${mostRecent.url})`)
    return mostRecent
  }
  
  /**
   * Parse a GitHub project URL and fetch the project
   */
  async parseProjectUrl(url: string): Promise<IGitHubProject> {
    const parsed = this.gitRemoteParser.parseProjectUrl(url)
    
    if (!parsed) {
      throw new Error(`Invalid GitHub project URL: ${url}. Expected format: https://github.com/orgs/ORG/projects/NUMBER`)
    }
    
    return this.validateProject(parsed.organization, parsed.projectNumber)
  }
  
  /**
   * Validate and fetch a project by organization and number
   */
  async validateProject(org: string, projectNumber: number): Promise<IGitHubProject> {
    try {
      const project = await this.githubApi.getProject(org, projectNumber)
      
      if (project.closed) {
        throw new Error(`Project ${projectNumber} in organization ${org} is closed`)
      }
      
      return project
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error(`Project ${projectNumber} not found in organization ${org}. Please check the project number.`)
      }
      throw error
    }
  }
  
  /**
   * Suggest available projects for an organization
   */
  async suggestProjects(org: string): Promise<string> {
    try {
      const projects = await this.githubApi.listOrganizationProjects(org)
      
      if (projects.length === 0) {
        return `No projects found for organization ${org}`
      }
      
      const activeProjects = projects.filter(p => !p.closed)
      
      let suggestion = `Available projects for ${org}:\n`
      for (const project of activeProjects.slice(0, 5)) {
        suggestion += `  - ${project.title} (#${project.number}) - ${project.url}\n`
      }
      
      if (activeProjects.length > 5) {
        suggestion += `  ... and ${activeProjects.length - 5} more\n`
      }
      
      return suggestion
    } catch {
      return `Could not list projects for organization ${org}`
    }
  }
}