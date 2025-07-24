/**
 * @file Service for fetching pull request data from GitHub
 */
import type { IGitHubApiService } from '../../interfaces/IGitHubApiService';
/**
 * Pull request data
 */
export interface PullRequestData {
    author: string;
    comments: number;
    createdAt: Date;
    draft: boolean;
    labels: string[];
    mergedAt?: Date;
    number: number;
    reviewers: string[];
    state: 'closed' | 'merged' | 'open';
    title: string;
    updatedAt: Date;
}
/**
 * Service for fetching pull request data
 */
export declare class PullRequestService {
    private githubApi;
    constructor(githubApi: IGitHubApiService);
    /**
     * Fetch recent pull request activity summary
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param days - Number of days to look back
     * @returns Summary of PR activity
     */
    fetchPullRequestActivity(owner: string, repo: string, days?: number): Promise<{
        avgTimeToMerge?: number;
        closed: number;
        draft: number;
        merged: number;
        open: number;
        total: number;
    }>;
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
    fetchPullRequests(owner: string, repo: string, options?: {
        limit?: number;
        since?: Date;
        state?: 'all' | 'closed' | 'open';
    }): Promise<PullRequestData[]>;
}
