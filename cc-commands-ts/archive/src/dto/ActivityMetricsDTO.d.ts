/**
 * @file DTO for repository activity metrics
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Contributor information
 */
export interface ContributorInfo {
    contributions: number;
    login: string;
}
/**
 * Data transfer object for repository activity metrics
 *
 * Contains aggregated metrics about repository activity over a time period.
 */
export declare class ActivityMetricsDTO implements ILLMDataDTO {
    readonly commitCount: number;
    readonly issueCount: number;
    readonly prCount: number;
    readonly releaseCount: number;
    readonly contributorCount: number;
    readonly daysAnalyzed: number;
    readonly topContributors: ContributorInfo[];
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new activity metrics object
     */
    constructor(commitCount: number, issueCount: number, prCount: number, releaseCount: number, contributorCount: number, daysAnalyzed: number, topContributors: ContributorInfo[]);
    /**
     * Factory method for empty metrics
     */
    static empty(daysAnalyzed: number): ActivityMetricsDTO;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
    /**
     * Format top contributors for display
     */
    private formatTopContributors;
}
