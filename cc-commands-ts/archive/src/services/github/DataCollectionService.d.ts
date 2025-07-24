import type { DataCollectionOptionsDTO, IDataCollectionService } from '../../interfaces/IDataCollectionService';
import { RepoDataCollectionDTO } from '../../dto/RepoDataCollectionDTO';
import { IGitHubApiService } from '../../interfaces';
/**
 * Service for collecting data from GitHub repositories
 */
export declare class DataCollectionService implements IDataCollectionService {
    private githubApi;
    constructor(githubApi: IGitHubApiService);
    /**
     * Collect comprehensive data for a repository
     */
    collectData(owner: string, repo: string, options?: DataCollectionOptionsDTO): Promise<RepoDataCollectionDTO>;
}
