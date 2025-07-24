/**
 * @file DTO for pull request data
 */
/**
 * Data transfer object for pull request activity
 */
export class PullRequestDataDTO {
    total;
    open;
    merged;
    closed;
    draft;
    periodDays;
    avgTimeToMergeDays;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        AVG_TIME_TO_MERGE_DAYS: 'AVG_TIME_TO_MERGE_DAYS',
        PR_ACTIVITY_PERIOD_DAYS: 'PR_ACTIVITY_PERIOD_DAYS',
        PR_CLOSED_COUNT: 'PR_CLOSED_COUNT',
        PR_DRAFT_COUNT: 'PR_DRAFT_COUNT',
        PR_MERGED_COUNT: 'PR_MERGED_COUNT',
        PR_OPEN_COUNT: 'PR_OPEN_COUNT',
        PR_TOTAL_COUNT: 'PR_TOTAL_COUNT',
    };
    /**
     * Create a new pull request data DTO
     */
    constructor(total, open, merged, closed, draft, periodDays, avgTimeToMergeDays) {
        this.total = total;
        this.open = open;
        this.merged = merged;
        this.closed = closed;
        this.draft = draft;
        this.periodDays = periodDays;
        this.avgTimeToMergeDays = avgTimeToMergeDays;
    }
    /**
     * Create a DTO indicating no PR data available
     */
    static noPullRequests() {
        return {
            [PullRequestDataDTO.Keys.PR_CLOSED_COUNT]: '0',
            [PullRequestDataDTO.Keys.PR_DRAFT_COUNT]: '0',
            [PullRequestDataDTO.Keys.PR_MERGED_COUNT]: '0',
            [PullRequestDataDTO.Keys.PR_OPEN_COUNT]: '0',
            [PullRequestDataDTO.Keys.PR_TOTAL_COUNT]: '0',
        };
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        const data = {
            [PullRequestDataDTO.Keys.PR_ACTIVITY_PERIOD_DAYS]: String(this.periodDays),
            [PullRequestDataDTO.Keys.PR_CLOSED_COUNT]: String(this.closed),
            [PullRequestDataDTO.Keys.PR_DRAFT_COUNT]: String(this.draft),
            [PullRequestDataDTO.Keys.PR_MERGED_COUNT]: String(this.merged),
            [PullRequestDataDTO.Keys.PR_OPEN_COUNT]: String(this.open),
            [PullRequestDataDTO.Keys.PR_TOTAL_COUNT]: String(this.total),
        };
        if (this.avgTimeToMergeDays !== undefined) {
            data[PullRequestDataDTO.Keys.AVG_TIME_TO_MERGE_DAYS] = String(this.avgTimeToMergeDays);
        }
        return data;
    }
}
