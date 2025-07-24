/**
 * @file Service for fetching pull request data from GitHub
 */
/**
 * Service for fetching pull request data
 */
export class PullRequestService {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    /**
     * Fetch recent pull request activity summary
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param days - Number of days to look back
     * @returns Summary of PR activity
     */
    async fetchPullRequestActivity(owner, repo, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const prs = await this.fetchPullRequests(owner, repo, {
            limit: 100,
            since,
            state: 'all'
        });
        const open = prs.filter(pr => pr.state === 'open').length;
        const merged = prs.filter(pr => pr.state === 'merged').length;
        const closed = prs.filter(pr => pr.state === 'closed' && !pr.mergedAt).length;
        const draft = prs.filter(pr => pr.draft).length;
        // Calculate average time to merge
        const mergedPRs = prs.filter(pr => pr.state === 'merged' && pr.mergedAt);
        let avgTimeToMerge;
        if (mergedPRs.length > 0) {
            let totalTime = 0;
            for (const pr of mergedPRs) {
                const timeToMerge = pr.mergedAt.getTime() - pr.createdAt.getTime();
                totalTime += timeToMerge;
            }
            avgTimeToMerge = Math.round(totalTime / mergedPRs.length / (1000 * 60 * 60 * 24)); // Days
        }
        return {
            avgTimeToMerge,
            closed,
            draft,
            merged,
            open,
            total: prs.length
        };
    }
    /**
     * Fetch pull requests for a repository
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param options - Query options
     * @param options.limit - Maximum number of PRs to fetch
     * @param options.since - Only PRs updated after this date
     * @param options.state - Filter by PR state
     * @returns Array of pull request data
     */
    async fetchPullRequests(owner, repo, options = {}) {
        try {
            const { limit = 30, since, state = 'all' } = options;
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
            const response = await this.githubApi.request('GET /repos/{owner}/{repo}/pulls', {
                owner,
                repo,
                ...params
            });
            return response.data.map((pr) => ({
                author: pr.user?.login ?? 'unknown',
                comments: pr.comments || 0,
                createdAt: new Date(pr.created_at),
                draft: pr.draft || false,
                labels: pr.labels?.map(l => l.name) ?? [],
                mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
                number: pr.number,
                reviewers: pr.requested_reviewers?.map(r => r.login) ?? [],
                state: pr.merged_at ? 'merged' : pr.state,
                title: pr.title,
                updatedAt: new Date(pr.updated_at)
            }));
        }
        catch (error) {
            throw new Error(`Failed to fetch pull requests: ${error}`);
        }
    }
}
