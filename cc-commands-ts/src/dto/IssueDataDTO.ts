/**
 * @file DTO for issue data
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO.js'

/**
 * Data transfer object for issue activity
 */
export class IssueDataDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    AVG_TIME_TO_CLOSE_DAYS: 'AVG_TIME_TO_CLOSE_DAYS',
    ISSUE_ACTIVITY_PERIOD_DAYS: 'ISSUE_ACTIVITY_PERIOD_DAYS',
    ISSUE_CLOSED_COUNT: 'ISSUE_CLOSED_COUNT',
    ISSUE_NEW_COUNT: 'ISSUE_NEW_COUNT',
    ISSUE_OPEN_COUNT: 'ISSUE_OPEN_COUNT',
    ISSUE_TOP_LABELS: 'ISSUE_TOP_LABELS',
    ISSUE_TOTAL_COUNT: 'ISSUE_TOTAL_COUNT',
  } as const

  /**
   * Create a new issue data DTO
   */
  constructor(
    public readonly total: number,
    public readonly open: number,
    public readonly closed: number,
    public readonly newIssues: number,
    public readonly periodDays: number,
    public readonly topLabels: Array<{ count: number; label: string; }>,
    public readonly avgTimeToCloseDays?: number
  ) {}

  /**
   * Create a DTO indicating no issue data available
   */
  static noIssues(): Record<string, string> {
    return {
      [IssueDataDTO.Keys.ISSUE_CLOSED_COUNT]: '0',
      [IssueDataDTO.Keys.ISSUE_NEW_COUNT]: '0',
      [IssueDataDTO.Keys.ISSUE_OPEN_COUNT]: '0',
      [IssueDataDTO.Keys.ISSUE_TOP_LABELS]: 'None',
      [IssueDataDTO.Keys.ISSUE_TOTAL_COUNT]: '0',
    }
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    const data: Record<string, string> = {
      [IssueDataDTO.Keys.ISSUE_ACTIVITY_PERIOD_DAYS]: String(this.periodDays),
      [IssueDataDTO.Keys.ISSUE_CLOSED_COUNT]: String(this.closed),
      [IssueDataDTO.Keys.ISSUE_NEW_COUNT]: String(this.newIssues),
      [IssueDataDTO.Keys.ISSUE_OPEN_COUNT]: String(this.open),
      [IssueDataDTO.Keys.ISSUE_TOTAL_COUNT]: String(this.total),
    }

    if (this.avgTimeToCloseDays !== undefined) {
      data[IssueDataDTO.Keys.AVG_TIME_TO_CLOSE_DAYS] = String(this.avgTimeToCloseDays)
    }

    if (this.topLabels.length > 0) {
      const labelSummary = this.topLabels
        .map(({ count, label }) => `${label} (${count})`)
        .join(', ')
      data[IssueDataDTO.Keys.ISSUE_TOP_LABELS] = labelSummary
    } else {
      data[IssueDataDTO.Keys.ISSUE_TOP_LABELS] = 'None'
    }

    return data
  }
}