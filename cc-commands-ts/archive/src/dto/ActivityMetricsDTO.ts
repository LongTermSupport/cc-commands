/**
 * @file DTO for repository activity metrics
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO'

/**
 * Contributor information
 */
export interface ContributorInfo {
  contributions: number
  login: string
}

/**
 * Data transfer object for repository activity metrics
 * 
 * Contains aggregated metrics about repository activity over a time period.
 */
export class ActivityMetricsDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    COMMIT_COUNT: 'COMMIT_COUNT',
    CONTRIBUTOR_COUNT: 'CONTRIBUTOR_COUNT',
    DAYS_ANALYZED: 'DAYS_ANALYZED',
    ISSUE_COUNT: 'ISSUE_COUNT',
    PR_COUNT: 'PR_COUNT',
    RELEASE_COUNT: 'RELEASE_COUNT',
    TOP_CONTRIBUTORS: 'TOP_CONTRIBUTORS',
  } as const

  /**
   * Create a new activity metrics object
   */
  constructor(
    public readonly commitCount: number,
    public readonly issueCount: number,
    public readonly prCount: number,
    public readonly releaseCount: number,
    public readonly contributorCount: number,
    public readonly daysAnalyzed: number,
    public readonly topContributors: ContributorInfo[]
  ) {}

  /**
   * Factory method for empty metrics
   */
  static empty(daysAnalyzed: number): ActivityMetricsDTO {
    return new ActivityMetricsDTO(0, 0, 0, 0, 0, daysAnalyzed, [])
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    return {
      [ActivityMetricsDTO.Keys.COMMIT_COUNT]: String(this.commitCount),
      [ActivityMetricsDTO.Keys.CONTRIBUTOR_COUNT]: String(this.contributorCount),
      [ActivityMetricsDTO.Keys.DAYS_ANALYZED]: String(this.daysAnalyzed),
      [ActivityMetricsDTO.Keys.ISSUE_COUNT]: String(this.issueCount),
      [ActivityMetricsDTO.Keys.PR_COUNT]: String(this.prCount),
      [ActivityMetricsDTO.Keys.RELEASE_COUNT]: String(this.releaseCount),
      [ActivityMetricsDTO.Keys.TOP_CONTRIBUTORS]: this.formatTopContributors()
    }
  }

  /**
   * Format top contributors for display
   */
  private formatTopContributors(): string {
    if (this.topContributors.length === 0) {
      return 'None'
    }
    
    return this.topContributors
      .slice(0, 5) // Limit to top 5
      .map(c => `${c.login} (${c.contributions})`)
      .join(', ')
  }
}