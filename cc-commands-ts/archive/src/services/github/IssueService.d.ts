/**
 * @file Service for fetching issue data from GitHub
 */
import type { IGitHubApiService } from '../../interfaces/IGitHubApiService';
/**
 * Issue data
 */
export interface IssueData {
    assignees: string[];
    author: string;
    closedAt?: Date;
    comments: number;
    createdAt: Date;
    isPullRequest: boolean;
    labels: string[];
    number: number;
    state: 'closed' | 'open';
    title: string;
    updatedAt: Date;
}
/**
 * Service for fetching issue data
 */
export declare class IssueService {
    private githubApi;
    constructor(githubApi: IGitHubApiService);
    /**
     * Fetch issue activity summary
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param days - Number of days to look back
     * @returns Summary of issue activity
     */
    fetchIssueActivity(owner: string, repo: string, days?: number): Promise<{
        avgTimeToClose?: number;
        closed: number;
        newIssues: number;
        open: number;
        topLabels: Array<{
            count: number;
            label: string;
        }>;
        total: number;
    }>;
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
    fetchIssues(owner: string, repo: string, options?: {
        labels?: string[];
        limit?: number;
        since?: Date;
        state?: 'all' | 'closed' | 'open';
    }): Promise<IssueData[]>;
}
