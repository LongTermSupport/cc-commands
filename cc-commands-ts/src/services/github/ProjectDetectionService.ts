import { IGitHubApiService } from '../../interfaces/index.js'
import { GitRemoteParser } from '../../utils/GitRemoteParser.js'
import { simpleGit } from 'simple-git'

/**
 * Repository detection result
 */
export interface IRepositoryInfo {
  owner: string
  repo: string
}

/**
 * GitHub repository info with metadata
 */
export interface IGitHubRepositoryInfo {
  owner: string
  name: string
  fullName: string
  description: string | null
  type: string
  primaryLanguage: string
  topics: string[]
  license: string | null
  isFork: boolean
  isArchived: boolean
  visibility: string
  defaultBranch: string
  createdAt: string
  updatedAt: string
}

/**
 * Service for detecting GitHub repositories from various sources
 */
export class ProjectDetectionService {
  constructor(
    private githubApi?: IGitHubApiService
  ) {}
  
  /**
   * Detect repository from current directory using git remotes
   */
  async detectFromDirectory(): Promise<IRepositoryInfo> {
    const git = simpleGit()
    
    try {
      // Check if we're in a git repository
      const isRepo = await git.checkIsRepo()
      if (!isRepo) {
        throw new Error('Not in a git repository')
      }
      
      // Get remotes
      const remotes = await git.getRemotes(true)
      
      // Look for origin or upstream
      const remote = remotes.find(r => r.name === 'origin') || 
                    remotes.find(r => r.name === 'upstream') ||
                    remotes[0]
      
      if (!remote || !remote.refs.fetch) {
        throw new Error('No git remote found')
      }
      
      // Parse GitHub URL
      const match = remote.refs.fetch.match(/github\.com[/:]([^/]+)\/([^/.]+)(\.git)?/)
      if (!match) {
        throw new Error('Remote is not a GitHub repository')
      }
      
      return {
        owner: match[1],
        repo: match[2],
      }
    } catch (error) {
      throw new Error(`Failed to detect repository from directory: ${error}`)
    }
  }
  
  /**
   * Detect and get full repository information
   */
  async detectProject(owner: string, repo: string): Promise<IGitHubRepositoryInfo> {
    if (!this.githubApi) {
      throw new Error('GitHub API service not provided')
    }
    
    try {
      const repoData = await (this.githubApi as any).getRepository(owner, repo)
      
      return {
        owner: repoData.owner.login,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        type: this.detectRepositoryType(repoData),
        primaryLanguage: repoData.language || 'Unknown',
        topics: repoData.topics || [],
        license: repoData.license?.spdx_id || null,
        isFork: repoData.fork,
        isArchived: repoData.archived,
        visibility: repoData.private ? 'private' : 'public',
        defaultBranch: repoData.default_branch,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
      }
    } catch (error) {
      throw new Error(`Failed to get repository information: ${error}`)
    }
  }
  
  /**
   * Detect repository type based on its characteristics
   */
  private detectRepositoryType(repoData: any): string {
    // Check topics for type hints
    const topics = repoData.topics || []
    
    if (topics.includes('library') || topics.includes('package')) {
      return 'library'
    }
    if (topics.includes('application') || topics.includes('app')) {
      return 'application'
    }
    if (topics.includes('cli') || topics.includes('command-line')) {
      return 'cli-tool'
    }
    if (topics.includes('api') || topics.includes('rest-api')) {
      return 'api'
    }
    
    // Check by language and files
    if (repoData.language === 'JavaScript' || repoData.language === 'TypeScript') {
      if (repoData.name.includes('api') || repoData.name.includes('server')) {
        return 'api'
      }
      if (repoData.name.includes('cli')) {
        return 'cli-tool'
      }
      return 'application'
    }
    
    // Default based on description
    const desc = (repoData.description || '').toLowerCase()
    if (desc.includes('library') || desc.includes('package')) {
      return 'library'
    }
    if (desc.includes('api') || desc.includes('service')) {
      return 'api'
    }
    if (desc.includes('cli') || desc.includes('command')) {
      return 'cli-tool'
    }
    
    return 'application'
  }
}