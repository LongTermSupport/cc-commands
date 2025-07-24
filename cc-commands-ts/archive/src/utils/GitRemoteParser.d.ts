/**
 * Parses git remote URLs to extract GitHub organization and repository information
 */
export declare class GitRemoteParser {
    private git;
    constructor(workingDirectory?: string);
    /**
     * Extract organization name from a GitHub URL
     */
    extractOrganizationFromUrl(url: string): null | string;
    /**
     * Get the GitHub organization from the current repository's remote
     */
    getOrganizationFromRemote(remoteName?: string): Promise<null | string>;
    /**
     * Check if we're in a git repository
     */
    isGitRepository(): Promise<boolean>;
    /**
     * Parse a GitHub project URL to extract organization and project number
     */
    parseProjectUrl(url: string): null | {
        organization: string;
        projectNumber: number;
    };
}
