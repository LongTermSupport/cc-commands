/**
 * @file DTO for repository activity metrics
 */
/**
 * Data transfer object for repository activity metrics
 *
 * Contains aggregated metrics about repository activity over a time period.
 */
export class ActivityMetricsDTO {
    commitCount;
    issueCount;
    prCount;
    releaseCount;
    contributorCount;
    daysAnalyzed;
    topContributors;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        COMMIT_COUNT: 'COMMIT_COUNT',
        CONTRIBUTOR_COUNT: 'CONTRIBUTOR_COUNT',
        DAYS_ANALYZED: 'DAYS_ANALYZED',
        ISSUE_COUNT: 'ISSUE_COUNT',
        PR_COUNT: 'PR_COUNT',
        RELEASE_COUNT: 'RELEASE_COUNT',
        TOP_CONTRIBUTORS: 'TOP_CONTRIBUTORS',
    };
    /**
     * Create a new activity metrics object
     */
    constructor(commitCount, issueCount, prCount, releaseCount, contributorCount, daysAnalyzed, topContributors) {
        this.commitCount = commitCount;
        this.issueCount = issueCount;
        this.prCount = prCount;
        this.releaseCount = releaseCount;
        this.contributorCount = contributorCount;
        this.daysAnalyzed = daysAnalyzed;
        this.topContributors = topContributors;
    }
    /**
     * Factory method for empty metrics
     */
    static empty(daysAnalyzed) {
        return new ActivityMetricsDTO(0, 0, 0, 0, 0, daysAnalyzed, []);
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        return {
            [ActivityMetricsDTO.Keys.COMMIT_COUNT]: String(this.commitCount),
            [ActivityMetricsDTO.Keys.CONTRIBUTOR_COUNT]: String(this.contributorCount),
            [ActivityMetricsDTO.Keys.DAYS_ANALYZED]: String(this.daysAnalyzed),
            [ActivityMetricsDTO.Keys.ISSUE_COUNT]: String(this.issueCount),
            [ActivityMetricsDTO.Keys.PR_COUNT]: String(this.prCount),
            [ActivityMetricsDTO.Keys.RELEASE_COUNT]: String(this.releaseCount),
            [ActivityMetricsDTO.Keys.TOP_CONTRIBUTORS]: this.formatTopContributors()
        };
    }
    /**
     * Format top contributors for display
     */
    formatTopContributors() {
        if (this.topContributors.length === 0) {
            return 'None';
        }
        return this.topContributors
            .slice(0, 5) // Limit to top 5
            .map(c => `${c.login} (${c.contributions})`)
            .join(', ');
    }
}
