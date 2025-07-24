/**
 * @file DTO for issue data
 */
/**
 * Data transfer object for issue activity
 */
export class IssueDataDTO {
    total;
    open;
    closed;
    newIssues;
    periodDays;
    topLabels;
    avgTimeToCloseDays;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        AVG_TIME_TO_CLOSE_DAYS: 'AVG_TIME_TO_CLOSE_DAYS',
        ISSUE_ACTIVITY_PERIOD_DAYS: 'ISSUE_ACTIVITY_PERIOD_DAYS',
        ISSUE_CLOSED_COUNT: 'ISSUE_CLOSED_COUNT',
        ISSUE_NEW_COUNT: 'ISSUE_NEW_COUNT',
        ISSUE_OPEN_COUNT: 'ISSUE_OPEN_COUNT',
        ISSUE_TOP_LABELS: 'ISSUE_TOP_LABELS',
        ISSUE_TOTAL_COUNT: 'ISSUE_TOTAL_COUNT',
    };
    /**
     * Create a new issue data DTO
     */
    constructor(total, open, closed, newIssues, periodDays, topLabels, avgTimeToCloseDays) {
        this.total = total;
        this.open = open;
        this.closed = closed;
        this.newIssues = newIssues;
        this.periodDays = periodDays;
        this.topLabels = topLabels;
        this.avgTimeToCloseDays = avgTimeToCloseDays;
    }
    /**
     * Create a DTO indicating no issue data available
     */
    static noIssues() {
        return {
            [IssueDataDTO.Keys.ISSUE_CLOSED_COUNT]: '0',
            [IssueDataDTO.Keys.ISSUE_NEW_COUNT]: '0',
            [IssueDataDTO.Keys.ISSUE_OPEN_COUNT]: '0',
            [IssueDataDTO.Keys.ISSUE_TOP_LABELS]: 'None',
            [IssueDataDTO.Keys.ISSUE_TOTAL_COUNT]: '0',
        };
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        const data = {
            [IssueDataDTO.Keys.ISSUE_ACTIVITY_PERIOD_DAYS]: String(this.periodDays),
            [IssueDataDTO.Keys.ISSUE_CLOSED_COUNT]: String(this.closed),
            [IssueDataDTO.Keys.ISSUE_NEW_COUNT]: String(this.newIssues),
            [IssueDataDTO.Keys.ISSUE_OPEN_COUNT]: String(this.open),
            [IssueDataDTO.Keys.ISSUE_TOTAL_COUNT]: String(this.total),
        };
        if (this.avgTimeToCloseDays !== undefined) {
            data[IssueDataDTO.Keys.AVG_TIME_TO_CLOSE_DAYS] = String(this.avgTimeToCloseDays);
        }
        if (this.topLabels.length > 0) {
            const labelSummary = this.topLabels
                .map(({ count, label }) => `${label} (${count})`)
                .join(', ');
            data[IssueDataDTO.Keys.ISSUE_TOP_LABELS] = labelSummary;
        }
        else {
            data[IssueDataDTO.Keys.ISSUE_TOP_LABELS] = 'None';
        }
        return data;
    }
}
