/**
 * @file DTO for release data
 */
/**
 * Data transfer object for release information
 *
 * Contains information about the latest release of a repository.
 */
export class ReleaseDataDTO {
    version;
    date;
    name;
    isPrerelease;
    downloadCount;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        LATEST_RELEASE_DATE: 'LATEST_RELEASE_DATE',
        LATEST_RELEASE_IS_PRERELEASE: 'LATEST_RELEASE_IS_PRERELEASE',
        LATEST_RELEASE_NAME: 'LATEST_RELEASE_NAME',
        LATEST_RELEASE_VERSION: 'LATEST_RELEASE_VERSION',
        RELEASE_DOWNLOAD_COUNT: 'RELEASE_DOWNLOAD_COUNT',
    };
    /**
     * Create a new release data object
     */
    constructor(version, date, name, isPrerelease, downloadCount) {
        this.version = version;
        this.date = date;
        this.name = name;
        this.isPrerelease = isPrerelease;
        this.downloadCount = downloadCount;
    }
    /**
     * Factory method to create from GitHub API response
     */
    static fromGitHubResponse(release) {
        // Calculate total download count from assets
        const downloadCount = release.assets?.reduce((sum, asset) => sum + (asset.download_count || 0), 0) || 0;
        return new ReleaseDataDTO(release.tag_name, new Date(release.published_at || release.created_at), release.name, release.prerelease, downloadCount);
    }
    /**
     * Factory method for no releases case
     */
    static noReleases() {
        return {
            [ReleaseDataDTO.Keys.LATEST_RELEASE_DATE]: 'No releases',
            [ReleaseDataDTO.Keys.LATEST_RELEASE_IS_PRERELEASE]: 'false',
            [ReleaseDataDTO.Keys.LATEST_RELEASE_NAME]: 'No releases',
            [ReleaseDataDTO.Keys.LATEST_RELEASE_VERSION]: 'No releases',
            [ReleaseDataDTO.Keys.RELEASE_DOWNLOAD_COUNT]: '0',
        };
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        return {
            [ReleaseDataDTO.Keys.LATEST_RELEASE_DATE]: this.date.toISOString(),
            [ReleaseDataDTO.Keys.LATEST_RELEASE_IS_PRERELEASE]: String(this.isPrerelease),
            [ReleaseDataDTO.Keys.LATEST_RELEASE_NAME]: this.name || this.version,
            [ReleaseDataDTO.Keys.LATEST_RELEASE_VERSION]: this.version,
            [ReleaseDataDTO.Keys.RELEASE_DOWNLOAD_COUNT]: String(this.downloadCount),
        };
    }
}
