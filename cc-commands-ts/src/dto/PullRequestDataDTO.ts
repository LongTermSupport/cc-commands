/**
 * @file DTO for pull request data
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO.js'

/**
 * Data transfer object for pull request activity
 */
export class PullRequestDataDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    AVG_TIME_TO_MERGE_DAYS: 'AVG_TIME_TO_MERGE_DAYS',
    PR_ACTIVITY_PERIOD_DAYS: 'PR_ACTIVITY_PERIOD_DAYS',
    PR_CLOSED_COUNT: 'PR_CLOSED_COUNT',
    PR_DRAFT_COUNT: 'PR_DRAFT_COUNT',
    PR_MERGED_COUNT: 'PR_MERGED_COUNT',
    PR_OPEN_COUNT: 'PR_OPEN_COUNT',
    PR_TOTAL_COUNT: 'PR_TOTAL_COUNT',
  } as const

  /**
   * Create a new pull request data DTO
   */
  constructor(
    public readonly total: number,
    public readonly open: number,
    public readonly merged: number,
    public readonly closed: number,
    public readonly draft: number,
    public readonly periodDays: number,
    public readonly avgTimeToMergeDays?: number
  ) {}

  /**
   * Create a DTO indicating no PR data available
   */
  static noPullRequests(): Record<string, string> {
    return {
      [PullRequestDataDTO.Keys.PR_CLOSED_COUNT]: '0',
      [PullRequestDataDTO.Keys.PR_DRAFT_COUNT]: '0',
      [PullRequestDataDTO.Keys.PR_MERGED_COUNT]: '0',
      [PullRequestDataDTO.Keys.PR_OPEN_COUNT]: '0',
      [PullRequestDataDTO.Keys.PR_TOTAL_COUNT]: '0',
    }
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    const data: Record<string, string> = {
      [PullRequestDataDTO.Keys.PR_ACTIVITY_PERIOD_DAYS]: String(this.periodDays),
      [PullRequestDataDTO.Keys.PR_CLOSED_COUNT]: String(this.closed),
      [PullRequestDataDTO.Keys.PR_DRAFT_COUNT]: String(this.draft),
      [PullRequestDataDTO.Keys.PR_MERGED_COUNT]: String(this.merged),
      [PullRequestDataDTO.Keys.PR_OPEN_COUNT]: String(this.open),
      [PullRequestDataDTO.Keys.PR_TOTAL_COUNT]: String(this.total),
    }

    if (this.avgTimeToMergeDays !== undefined) {
      data[PullRequestDataDTO.Keys.AVG_TIME_TO_MERGE_DAYS] = String(this.avgTimeToMergeDays)
    }

    return data
  }
}