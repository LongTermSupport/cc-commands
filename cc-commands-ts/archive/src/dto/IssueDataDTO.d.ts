/**
 * @file DTO for issue data
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Data transfer object for issue activity
 */
export declare class IssueDataDTO implements ILLMDataDTO {
    readonly total: number;
    readonly open: number;
    readonly closed: number;
    readonly newIssues: number;
    readonly periodDays: number;
    readonly topLabels: Array<{
        count: number;
        label: string;
    }>;
    readonly avgTimeToCloseDays?: number | undefined;
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new issue data DTO
     */
    constructor(total: number, open: number, closed: number, newIssues: number, periodDays: number, topLabels: Array<{
        count: number;
        label: string;
    }>, avgTimeToCloseDays?: number | undefined);
    /**
     * Create a DTO indicating no issue data available
     */
    static noIssues(): Record<string, string>;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
