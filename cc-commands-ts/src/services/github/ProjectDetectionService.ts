import { simpleGit } from 'simple-git'

import type { DetectedProject, IProjectDetectionService } from '../../interfaces/IProjectDetectionService.js'

import { IGitHubApiService } from '../../interfaces/index.js'
import { GitHubRepositoryResponse } from '../../types/GitHubTypes.js'

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
  createdAt: string
  defaultBranch: string
  description: null | string
  fullName: string
  isArchived: boolean
  isFork: boolean
  license: null | string
  name: string
  owner: string
  primaryLanguage: string
  topics: string[]
  type: string
  updatedAt: string
  visibility: string
}

/**
 * Service for detecting GitHub repositories from various sources
 */
export class ProjectDetectionService implements IProjectDetectionService {
  constructor(
    private githubApi?: IGitHubApiService
  ) {}
  
  /**
   * Detect repository from current directory using git remotes
   */
  async detectFromDirectory(): Promise<DetectedProject> {
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
      if (!match || !match[1] || !match[2]) {
        throw new Error(`Remote is not a valid GitHub repository URL: ${remote.refs.fetch}`)
      }
      
      return {
        name: match[2],
        owner: match[1],
      }
    } catch (error) {
      throw new Error(`Failed to detect repository from directory: ${error}`)
    }
  }
  
  /**
   * Detect repository from a GitHub URL
   */
  async detectFromUrl(url: string): Promise<DetectedProject> {
    // Support various GitHub URL formats
    const patterns = [
      /github\.com[/:]([^/]+)\/([^/.]+)(\.git)?$/,
      /github\.com[/:]([^/]+)\/([^/]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1] && match[2]) {
        return {
          name: match[2].replace(/\.git$/, ''),
          owner: match[1],
        }
      }
    }
    
    throw new Error(`Invalid GitHub URL format: ${url}`)
  }
  
  /**
   * Detect and get full repository information
   */
  async detectProject(owner: string, repo: string): Promise<IGitHubRepositoryInfo> {
    if (!this.githubApi) {
      throw new Error('GitHub API service not provided')
    }
    
    try {
      const repoData = await (this.githubApi as unknown as {
        getRepository(owner: string, repo: string): Promise<GitHubRepositoryResponse>
      }).getRepository(owner, repo)
      
      return {
        createdAt: repoData.created_at,
        defaultBranch: repoData.default_branch,
        description: repoData.description,
        fullName: repoData.full_name,
        isArchived: repoData.archived,
        isFork: repoData.fork,
        license: repoData['license'] && typeof repoData['license'] === 'object' && 'spdx_id' in repoData['license'] ? (repoData['license'] as {spdx_id: string})['spdx_id'] : null,
        name: repoData.name,
        owner: repoData.owner.login,
        primaryLanguage: repoData.language || 'Unknown',
        topics: repoData.topics || [],
        type: this.detectRepositoryType(repoData),
        updatedAt: repoData.updated_at,
        visibility: repoData.private ? 'private' : 'public',
      }
    } catch (error) {
      throw new Error(`Failed to get repository information: ${error}`)
    }
  }
  
  /**
   * Detect repository type based on its characteristics
   */
  private detectRepositoryType(repoData: GitHubRepositoryResponse): string {
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