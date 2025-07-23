/**
 * @file Interface for project detection service
 * 
 * Defines the contract for detecting GitHub repository information
 * from various sources (URL, directory, manual).
 */

/**
 * Detected project information
 */
export interface DetectedProject {
  /** Repository name */
  name: string
  /** Repository owner */
  owner: string
}

/**
 * Service interface for detecting GitHub projects
 */
export interface IProjectDetectionService {
  /**
   * Detect project from current directory's git remote
   * 
   * @returns Detected project information
   * @throws Error if not in a git repository or no GitHub remote
   */
  detectFromDirectory(): Promise<DetectedProject>
  
  /**
   * Detect project from a GitHub URL
   * 
   * @param url - GitHub repository URL
   * @returns Detected project information
   * @throws Error if URL is invalid
   */
  detectFromUrl(url: string): Promise<DetectedProject>
}