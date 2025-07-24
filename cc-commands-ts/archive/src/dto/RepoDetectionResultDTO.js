/**
 * @file DTO for repository detection results
 */
/**
 * Data transfer object for repository detection results
 *
 * Captures how a repository was detected and its basic information.
 */
export class RepoDetectionResultDTO {
    inputMode;
    owner;
    name;
    url;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        INPUT_MODE: 'INPUT_MODE',
        REPO_NAME: 'REPO_NAME',
        REPO_OWNER: 'REPO_OWNER',
        REPO_URL: 'REPO_URL',
    };
    /**
     * Create a new repository detection result
     *
     * @param inputMode - How the repository was detected
     * @param owner - Repository owner
     * @param name - Repository name
     * @param url - Optional repository URL
     */
    constructor(inputMode, owner, name, url) {
        this.inputMode = inputMode;
        this.owner = owner;
        this.name = name;
        this.url = url;
    }
    /**
     * Factory method for auto-detection
     */
    static fromAuto(owner, name, url) {
        return new RepoDetectionResultDTO('auto', owner, name, url);
    }
    /**
     * Factory method for manual input
     */
    static fromManual(owner, name) {
        return new RepoDetectionResultDTO('manual', owner, name);
    }
    /**
     * Factory method for URL-based detection
     */
    static fromURL(url, owner, name) {
        return new RepoDetectionResultDTO('url', owner, name, url);
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        const data = {
            [RepoDetectionResultDTO.Keys.INPUT_MODE]: this.inputMode,
            [RepoDetectionResultDTO.Keys.REPO_NAME]: this.name,
            [RepoDetectionResultDTO.Keys.REPO_OWNER]: this.owner,
        };
        if (this.url) {
            data[RepoDetectionResultDTO.Keys.REPO_URL] = this.url;
        }
        return data;
    }
}
