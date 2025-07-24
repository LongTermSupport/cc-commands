import { simpleGit } from 'simple-git';
import { RepoDetectionResultDTO } from '../../dto/RepoDetectionResultDTO';
import { RepositoryDataDTO } from '../../dto/RepositoryDataDTO';
/**
 * Service for detecting GitHub repositories from various sources
 */
export class RepoDetectionService {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    /**
     * Detect repository from current directory using git remotes
     */
    async detectFromDirectory() {
        const git = simpleGit();
        try {
            // Check if we're in a git repository
            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                throw new Error('Not in a git repository');
            }
            // Get remotes
            const remotes = await git.getRemotes(true);
            // Look for origin or upstream
            const remote = remotes.find(r => r.name === 'origin') ||
                remotes.find(r => r.name === 'upstream') ||
                remotes[0];
            if (!remote || !remote.refs.fetch) {
                throw new Error('No git remote found');
            }
            // Parse GitHub URL
            const match = remote.refs.fetch.match(/github\.com[/:]([^/]+)\/([^/.]+)(\.git)?/);
            if (!match || !match[1] || !match[2]) {
                throw new Error(`Remote is not a valid GitHub repository URL: ${remote.refs.fetch}`);
            }
            return RepoDetectionResultDTO.fromAuto(match[1], match[2], remote.refs.fetch);
        }
        catch (error) {
            throw new Error(`Failed to detect repository from directory: ${error}`);
        }
    }
    /**
     * Detect repository from a GitHub URL
     */
    async detectFromUrl(url) {
        // Support various GitHub URL formats
        const patterns = [
            /github\.com[/:]([^/]+)\/([^/.]+)(\.git)?$/,
            /github\.com[/:]([^/]+)\/([^/]+)/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1] && match[2]) {
                return RepoDetectionResultDTO.fromURL(url, match[1], match[2].replace(/\.git$/, ''));
            }
        }
        throw new Error(`Invalid GitHub URL format: ${url}`);
    }
    /**
     * Detect and get full repository information
     */
    async detectRepository(owner, repo) {
        if (!this.githubApi) {
            throw new Error('GitHub API service not provided');
        }
        try {
            const repoData = await this.githubApi.getRepository(owner, repo);
            return RepositoryDataDTO.fromGitHubResponse(repoData);
        }
        catch (error) {
            throw new Error(`Failed to get repository information: ${error}`);
        }
    }
}
