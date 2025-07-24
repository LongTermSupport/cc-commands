/**
 * @file DTO for GitHub Project (kanban board) data
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Data transfer object for GitHub Project data
 *
 * This represents a GitHub Project v2 (kanban board), not a repository.
 */
export declare class ProjectDataDTO implements ILLMDataDTO {
    readonly id: string;
    readonly number: number;
    readonly title: string;
    readonly url: string;
    readonly isPublic: boolean;
    readonly isClosed: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly itemCount: number;
    readonly description?: string | undefined;
    readonly repositories: Array<{
        name: string;
        owner: string;
    }>;
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new project data DTO
     */
    constructor(id: string, number: number, title: string, url: string, isPublic: boolean, isClosed: boolean, createdAt: Date, updatedAt: Date, itemCount: number, description?: string | undefined, repositories?: Array<{
        name: string;
        owner: string;
    }>);
    /**
     * Create a DTO indicating no project found
     */
    static noProject(): Record<string, string>;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
