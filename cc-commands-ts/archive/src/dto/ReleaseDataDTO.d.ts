/**
 * @file DTO for release data
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
import type { GitHubRelease } from '../types/GitHubTypes';
/**
 * Data transfer object for release information
 *
 * Contains information about the latest release of a repository.
 */
export declare class ReleaseDataDTO implements ILLMDataDTO {
    readonly version: string;
    readonly date: Date;
    readonly name: null | string;
    readonly isPrerelease: boolean;
    readonly downloadCount: number;
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new release data object
     */
    constructor(version: string, date: Date, name: null | string, isPrerelease: boolean, downloadCount: number);
    /**
     * Factory method to create from GitHub API response
     */
    static fromGitHubResponse(release: GitHubRelease & {
        assets?: Array<{
            download_count?: number;
        }>;
    }): ReleaseDataDTO;
    /**
     * Factory method for no releases case
     */
    static noReleases(): Record<string, string>;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
