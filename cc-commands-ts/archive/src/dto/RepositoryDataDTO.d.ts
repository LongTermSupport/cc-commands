/**
 * @file DTO for repository data
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
import type { GitHubRepositoryResponse } from '../types/GitHubTypes';
/**
 * Repository visibility type
 */
export type RepositoryVisibility = 'private' | 'public';
/**
 * Data transfer object for repository information
 *
 * Contains basic repository metadata from GitHub API.
 */
export declare class RepositoryDataDTO implements ILLMDataDTO {
    readonly name: string;
    readonly owner: string;
    readonly description: null | string;
    readonly primaryLanguage: null | string;
    readonly visibility: RepositoryVisibility;
    readonly defaultBranch: string;
    readonly license: null | string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly isFork: boolean;
    readonly isArchived: boolean;
    readonly topics: string[];
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new repository data object
     */
    constructor(name: string, owner: string, description: null | string, primaryLanguage: null | string, visibility: RepositoryVisibility, defaultBranch: string, license: null | string, createdAt: Date, updatedAt: Date, isFork: boolean, isArchived: boolean, topics: string[]);
    /**
     * Factory method to create from GitHub API response
     *
     * @param response - Raw GitHub API response
     */
    static fromGitHubResponse(response: GitHubRepositoryResponse & {
        license?: null | {
            name?: string;
            spdx_id?: string;
        };
    }): RepositoryDataDTO;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
