/**
 * @file DTO for pull request data
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Data transfer object for pull request activity
 */
export declare class PullRequestDataDTO implements ILLMDataDTO {
    readonly total: number;
    readonly open: number;
    readonly merged: number;
    readonly closed: number;
    readonly draft: number;
    readonly periodDays: number;
    readonly avgTimeToMergeDays?: number | undefined;
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new pull request data DTO
     */
    constructor(total: number, open: number, merged: number, closed: number, draft: number, periodDays: number, avgTimeToMergeDays?: number | undefined);
    /**
     * Create a DTO indicating no PR data available
     */
    static noPullRequests(): Record<string, string>;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
