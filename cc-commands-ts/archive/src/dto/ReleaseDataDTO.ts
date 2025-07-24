/**
 * @file DTO for release data
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO'
import type { GitHubRelease } from '../types/GitHubTypes'

/**
 * Data transfer object for release information
 * 
 * Contains information about the latest release of a repository.
 */
export class ReleaseDataDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    LATEST_RELEASE_DATE: 'LATEST_RELEASE_DATE',
    LATEST_RELEASE_IS_PRERELEASE: 'LATEST_RELEASE_IS_PRERELEASE',
    LATEST_RELEASE_NAME: 'LATEST_RELEASE_NAME',
    LATEST_RELEASE_VERSION: 'LATEST_RELEASE_VERSION',
    RELEASE_DOWNLOAD_COUNT: 'RELEASE_DOWNLOAD_COUNT',
  } as const

  /**
   * Create a new release data object
   */
  constructor(
    public readonly version: string,
    public readonly date: Date,
    public readonly name: null | string,
    public readonly isPrerelease: boolean,
    public readonly downloadCount: number
  ) {}

  /**
   * Factory method to create from GitHub API response
   */
  static fromGitHubResponse(release: GitHubRelease & { assets?: Array<{ download_count?: number }> }): ReleaseDataDTO {
    // Calculate total download count from assets
    const downloadCount = release.assets?.reduce(
      (sum: number, asset) => sum + (asset.download_count || 0),
      0
    ) || 0

    return new ReleaseDataDTO(
      release.tag_name,
      new Date(release.published_at || release.created_at),
      release.name,
      release.prerelease,
      downloadCount
    )
  }

  /**
   * Factory method for no releases case
   */
  static noReleases(): Record<string, string> {
    return {
      [ReleaseDataDTO.Keys.LATEST_RELEASE_DATE]: 'No releases',
      [ReleaseDataDTO.Keys.LATEST_RELEASE_IS_PRERELEASE]: 'false',
      [ReleaseDataDTO.Keys.LATEST_RELEASE_NAME]: 'No releases',
      [ReleaseDataDTO.Keys.LATEST_RELEASE_VERSION]: 'No releases',
      [ReleaseDataDTO.Keys.RELEASE_DOWNLOAD_COUNT]: '0',
    }
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    return {
      [ReleaseDataDTO.Keys.LATEST_RELEASE_DATE]: this.date.toISOString(),
      [ReleaseDataDTO.Keys.LATEST_RELEASE_IS_PRERELEASE]: String(this.isPrerelease),
      [ReleaseDataDTO.Keys.LATEST_RELEASE_NAME]: this.name || this.version,
      [ReleaseDataDTO.Keys.LATEST_RELEASE_VERSION]: this.version,
      [ReleaseDataDTO.Keys.RELEASE_DOWNLOAD_COUNT]: String(this.downloadCount),
    }
  }
}