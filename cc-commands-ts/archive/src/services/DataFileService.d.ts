/**
 * @file Service for saving structured data to JSON files
 *
 * This service saves complete, unabridged data in JSON format optimized
 * for querying with jq. Files are saved in the var/ directory with
 * timestamped names for easy tracking.
 */
/**
 * Options for saving data files
 */
export interface DataFileOptions {
    /** Base filename without extension */
    filename: string;
    /** Whether to include timestamp in filename */
    includeTimestamp?: boolean;
    /** Subdirectory within var/ */
    subdirectory?: string;
}
/**
 * Service for saving data to JSON files
 */
export declare class DataFileService {
    private readonly varDir;
    /**
     * Create a new data file service
     *
     * @param baseDir - Base directory (usually process.cwd())
     */
    constructor(baseDir?: string);
    /**
     * Save data to a JSON file
     *
     * @param data - Data to save (will be JSON stringified)
     * @param options - File saving options
     * @returns Path to the saved file
     */
    saveDataFile(data: unknown, options: DataFileOptions): Promise<string>;
    /**
     * Save GitHub Project data in a jq-friendly format
     *
     * @param projectData - Project and repository data
     * @param organization - Organization name
     * @param projectNumber - Project number
     * @returns Path to the saved file
     */
    saveProjectData(projectData: ProjectDataStructure, organization: string, projectNumber?: number): Promise<string>;
}
/**
 * Structure for project data files (jq-optimized)
 */
export interface ProjectDataStructure {
    /** Aggregated statistics across all repositories */
    aggregated?: {
        /** Primary languages used */
        languages: Array<{
            count: number;
            language: string;
        }>;
        /** Most active repository by commits */
        mostActiveRepository?: string;
        /** Total repositories */
        repositoryCount: number;
        /** Common topics */
        topics: Array<{
            count: number;
            topic: string;
        }>;
        /** Total commits across all repos */
        totalCommits: number;
        /** Total issues across all repos */
        totalIssues: number;
        /** Total PRs across all repos */
        totalPullRequests: number;
    };
    /** Metadata about this data file */
    metadata: {
        /** What generated this data */
        generator: string;
        /** When this data was collected */
        timestamp: string;
        /** Version of the data format */
        version: string;
    };
    /** GitHub Project information (if applicable) */
    project?: {
        /** Whether project is closed */
        closed: boolean;
        /** Project description */
        description?: string;
        /** Project node ID */
        id: string;
        /** Number of items in project */
        itemCount: number;
        /** Project number */
        number: number;
        /** List of repository names in this project */
        repositories: string[];
        /** Project title */
        title: string;
        /** Project URL */
        url: string;
    };
    /** Repository data keyed by owner/name */
    repositories?: Array<{
        /** Activity metrics */
        activity: {
            /** Commit activity */
            commits: {
                authors: number;
                total: number;
            };
            /** Number of days analyzed */
            daysAnalyzed: number;
            /** Issue activity */
            issues: {
                avgTimeToCloseInDays?: number;
                closed: number;
                open: number;
                topLabels: Array<{
                    count: number;
                    label: string;
                }>;
                total: number;
            };
            /** Pull request activity */
            pullRequests: {
                avgTimeToMergeInDays?: number;
                closed: number;
                draft: number;
                merged: number;
                open: number;
                total: number;
            };
            /** Release information */
            releases: {
                latest?: {
                    date: string;
                    isPrerelease: boolean;
                    name: string;
                    version: string;
                };
                total: number;
            };
        };
        /** Detailed data arrays */
        contributors?: Array<{
            contributions: number;
            login: string;
        }>;
        /** Full repository name (owner/repo) */
        fullName: string;
        /** Repository identifier */
        id: string;
        issues?: Array<{
            assignees: string[];
            author: string;
            closedAt?: string;
            comments: number;
            createdAt: string;
            labels: string[];
            number: number;
            state: string;
            title: string;
            updatedAt: string;
        }>;
        /** Basic repository information */
        metadata: {
            createdAt: string;
            defaultBranch: string;
            description?: string;
            isArchived: boolean;
            isFork: boolean;
            license?: string;
            primaryLanguage?: string;
            topics: string[];
            updatedAt: string;
            visibility: string;
        };
        /** Repository name */
        name: string;
        /** Repository owner */
        owner: string;
        pullRequests?: Array<{
            author: string;
            comments: number;
            createdAt: string;
            draft: boolean;
            labels: string[];
            mergedAt?: string;
            number: number;
            reviewers: string[];
            state: string;
            title: string;
            updatedAt: string;
        }>;
        workflows?: Array<{
            id: number;
            name: string;
            path: string;
            state: string;
        }>;
    }>;
}
