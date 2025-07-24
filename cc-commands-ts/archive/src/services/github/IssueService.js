/**
 * @file Service for fetching issue data from GitHub
 */
/**
 * Service for fetching issue data
 */
export class IssueService {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    /**
     * Fetch issue activity summary
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param days - Number of days to look back
     * @returns Summary of issue activity
     */
    async fetchIssueActivity(owner, repo, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const issues = await this.fetchIssues(owner, repo, {
            limit: 100,
            since,
            state: 'all'
        });
        const open = issues.filter(issue => issue.state === 'open').length;
        const closed = issues.filter(issue => issue.state === 'closed').length;
        const newIssues = issues.filter(issue => issue.createdAt >= since).length;
        // Calculate average time to close
        const closedIssues = issues.filter(issue => issue.state === 'closed' && issue.closedAt);
        let avgTimeToClose;
        if (closedIssues.length > 0) {
            let totalTime = 0;
            for (const issue of closedIssues) {
                const timeToClose = issue.closedAt.getTime() - issue.createdAt.getTime();
                totalTime += timeToClose;
            }
            avgTimeToClose = Math.round(totalTime / closedIssues.length / (1000 * 60 * 60 * 24)); // Days
        }
        // Calculate top labels
        const labelCounts = new Map();
        for (const issue of issues) {
            for (const label of issue.labels) {
                labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
            }
        }
        const topLabels = [...labelCounts.entries()]
            .map(([label, count]) => ({ count, label }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            avgTimeToClose,
            closed,
            newIssues,
            open,
            topLabels,
            total: issues.length
        };
    }
    /**
     * Fetch issues for a repository
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param options - Query options
     * @param options.labels - Filter by labels
     * @param options.limit - Maximum number of issues to fetch
     * @param options.since - Only issues updated after this date
     * @param options.state - Filter by issue state
     * @returns Array of issue data
     */
    async fetchIssues(owner, repo, options = {}) {
        try {
            const { labels, limit = 30, since, state = 'all' } = options;
            // Build query parameters
            const params = {
                direction: 'desc',
                sort: 'updated',
                state
            };
            params['per_page'] = limit;
            if (since) {
                params.since = since.toISOString();
            }
            if (labels && labels.length > 0) {
                params.labels = labels.join(',');
            }
            const response = await this.githubApi.request('GET /repos/{owner}/{repo}/issues', {
                owner,
                repo,
                ...params
            });
            // Filter out pull requests (GitHub API returns both issues and PRs in issues endpoint)
            return response.data
                .filter((issue) => !issue.pull_request)
                .map((issue) => ({
                assignees: issue.assignees?.map(a => a.login) ?? [],
                author: issue.user?.login ?? 'unknown',
                closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
                comments: issue.comments || 0,
                createdAt: new Date(issue.created_at),
                isPullRequest: false,
                labels: issue.labels?.map(l => l.name) ?? [],
                number: issue.number,
                state: issue.state,
                title: issue.title,
                updatedAt: new Date(issue.updated_at)
            }));
        }
        catch (error) {
            throw new Error(`Failed to fetch issues: ${error}`);
        }
    }
}
