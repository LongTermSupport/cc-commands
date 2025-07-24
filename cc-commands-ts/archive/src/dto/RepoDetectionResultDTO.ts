/**
 * @file DTO for repository detection results
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO'

/**
 * Input mode for repository detection
 */
export type InputMode = 'auto' | 'manual' | 'url'

/**
 * Data transfer object for repository detection results
 * 
 * Captures how a repository was detected and its basic information.
 */
export class RepoDetectionResultDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    INPUT_MODE: 'INPUT_MODE',
    REPO_NAME: 'REPO_NAME',
    REPO_OWNER: 'REPO_OWNER',
    REPO_URL: 'REPO_URL',
  } as const

  /**
   * Create a new repository detection result
   * 
   * @param inputMode - How the repository was detected
   * @param owner - Repository owner
   * @param name - Repository name
   * @param url - Optional repository URL
   */
  constructor(
    public readonly inputMode: InputMode,
    public readonly owner: string,
    public readonly name: string,
    public readonly url?: string
  ) {}

  /**
   * Factory method for auto-detection
   */
  static fromAuto(owner: string, name: string, url: string): RepoDetectionResultDTO {
    return new RepoDetectionResultDTO('auto', owner, name, url)
  }

  /**
   * Factory method for manual input
   */
  static fromManual(owner: string, name: string): RepoDetectionResultDTO {
    return new RepoDetectionResultDTO('manual', owner, name)
  }

  /**
   * Factory method for URL-based detection
   */
  static fromURL(url: string, owner: string, name: string): RepoDetectionResultDTO {
    return new RepoDetectionResultDTO('url', owner, name, url)
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    const data: Record<string, string> = {
      [RepoDetectionResultDTO.Keys.INPUT_MODE]: this.inputMode,
      [RepoDetectionResultDTO.Keys.REPO_NAME]: this.name,
      [RepoDetectionResultDTO.Keys.REPO_OWNER]: this.owner,
    }
    
    if (this.url) {
      data[RepoDetectionResultDTO.Keys.REPO_URL] = this.url
    }
    
    return data
  }
}