import type { IRepoDetectionService } from '../../interfaces/IRepoDetectionService';
import { RepoDetectionResultDTO } from '../../dto/RepoDetectionResultDTO';
import { RepositoryDataDTO } from '../../dto/RepositoryDataDTO';
import { IGitHubApiService } from '../../interfaces';
/**
 * Service for detecting GitHub repositories from various sources
 */
export declare class RepoDetectionService implements IRepoDetectionService {
    private githubApi?;
    constructor(githubApi?: IGitHubApiService);
    /**
     * Detect repository from current directory using git remotes
     */
    detectFromDirectory(): Promise<RepoDetectionResultDTO>;
    /**
     * Detect repository from a GitHub URL
     */
    detectFromUrl(url: string): Promise<RepoDetectionResultDTO>;
    /**
     * Detect and get full repository information
     */
    detectRepository(owner: string, repo: string): Promise<RepositoryDataDTO>;
}
