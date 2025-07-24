/**
 * @file Interface for repository detection service
 *
 * Defines the contract for detecting GitHub repository information
 * from various sources (URL, directory, manual).
 */
import type { RepoDetectionResultDTO } from '../dto/RepoDetectionResultDTO';
import type { RepositoryDataDTO } from '../dto/RepositoryDataDTO';
/**
 * Detected repository information
 */
export interface DetectedRepository {
    /** Repository name */
    name: string;
    /** Repository owner */
    owner: string;
}
/**
 * Service interface for detecting GitHub repositories
 */
export interface IRepoDetectionService {
    /**
     * Detect repository from current directory's git remote
     *
     * @returns Detected repository information as DTO
     * @throws Error if not in a git repository or no GitHub remote
     */
    detectFromDirectory(): Promise<RepoDetectionResultDTO>;
    /**
     * Detect repository from a GitHub URL
     *
     * @param url - GitHub repository URL
     * @returns Detected repository information as DTO
     * @throws Error if URL is invalid
     */
    detectFromUrl(url: string): Promise<RepoDetectionResultDTO>;
    /**
     * Get full repository information from GitHub API
     *
     * @param owner - Repository owner
     * @param repo - Repository name
     * @returns Full repository data as DTO
     * @throws Error if repository not found or API error
     */
    detectRepository(owner: string, repo: string): Promise<RepositoryDataDTO>;
}
