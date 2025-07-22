import { simpleGit, SimpleGit } from 'simple-git'

/**
 * Parses git remote URLs to extract GitHub organization and repository information
 */
export class GitRemoteParser {
  private git: SimpleGit
  
  constructor(workingDirectory?: string) {
    this.git = simpleGit(workingDirectory)
  }
  
  /**
   * Get the GitHub organization from the current repository's remote
   */
  async getOrganizationFromRemote(remoteName: string = 'origin'): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true)
      const remote = remotes.find(r => r.name === remoteName)
      
      if (!remote?.refs?.fetch) {
        return null
      }
      
      const org = this.extractOrganizationFromUrl(remote.refs.fetch)
      return org
    } catch (error) {
      console.error('Error getting git remote:', error)
      return null
    }
  }
  
  /**
   * Extract organization name from a GitHub URL
   */
  extractOrganizationFromUrl(url: string): string | null {
    // Handle SSH format: git@github.com:org/repo.git
    const sshMatch = url.match(/git@github\.com:([^/]+)\//)
    if (sshMatch) {
      return sshMatch[1]
    }
    
    // Handle HTTPS format: https://github.com/org/repo.git
    const httpsMatch = url.match(/github\.com\/([^/]+)\//)
    if (httpsMatch) {
      return httpsMatch[1]
    }
    
    return null
  }
  
  /**
   * Parse a GitHub project URL to extract organization and project number
   */
  parseProjectUrl(url: string): { organization: string; projectNumber: number } | null {
    // Match URLs like: https://github.com/orgs/MyOrg/projects/5
    const match = url.match(/github\.com\/orgs\/([^/]+)\/projects\/(\d+)/)
    
    if (match) {
      return {
        organization: match[1],
        projectNumber: parseInt(match[2], 10)
      }
    }
    
    // Also support user projects: https://github.com/users/username/projects/1
    const userMatch = url.match(/github\.com\/users\/([^/]+)\/projects\/(\d+)/)
    if (userMatch) {
      return {
        organization: userMatch[1],
        projectNumber: parseInt(userMatch[2], 10)
      }
    }
    
    return null
  }
  
  /**
   * Check if we're in a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status()
      return true
    } catch {
      return false
    }
  }
}