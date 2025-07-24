/**
 * @file DTO for GitHub Project (kanban board) data
 */
/**
 * Data transfer object for GitHub Project data
 *
 * This represents a GitHub Project v2 (kanban board), not a repository.
 */
export class ProjectDataDTO {
    id;
    number;
    title;
    url;
    isPublic;
    isClosed;
    createdAt;
    updatedAt;
    itemCount;
    description;
    repositories;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        PROJECT_CLOSED: 'PROJECT_CLOSED',
        PROJECT_CREATED_AT: 'PROJECT_CREATED_AT',
        PROJECT_DESCRIPTION: 'PROJECT_DESCRIPTION',
        PROJECT_ID: 'PROJECT_ID',
        PROJECT_ITEM_COUNT: 'PROJECT_ITEM_COUNT',
        PROJECT_NUMBER: 'PROJECT_NUMBER',
        PROJECT_PUBLIC: 'PROJECT_PUBLIC',
        PROJECT_REPOSITORIES: 'PROJECT_REPOSITORIES',
        PROJECT_REPOSITORY_COUNT: 'PROJECT_REPOSITORY_COUNT',
        PROJECT_TITLE: 'PROJECT_TITLE',
        PROJECT_UPDATED_AT: 'PROJECT_UPDATED_AT',
        PROJECT_URL: 'PROJECT_URL',
    };
    /**
     * Create a new project data DTO
     */
    constructor(id, number, title, url, isPublic, isClosed, createdAt, updatedAt, itemCount, description, repositories = []) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.url = url;
        this.isPublic = isPublic;
        this.isClosed = isClosed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.itemCount = itemCount;
        this.description = description;
        this.repositories = repositories;
    }
    /**
     * Create a DTO indicating no project found
     */
    static noProject() {
        return {
            [ProjectDataDTO.Keys.PROJECT_ITEM_COUNT]: '0',
            [ProjectDataDTO.Keys.PROJECT_REPOSITORIES]: 'None',
            [ProjectDataDTO.Keys.PROJECT_REPOSITORY_COUNT]: '0',
            [ProjectDataDTO.Keys.PROJECT_TITLE]: 'No project found',
        };
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        const data = {
            [ProjectDataDTO.Keys.PROJECT_CLOSED]: String(this.isClosed),
            [ProjectDataDTO.Keys.PROJECT_CREATED_AT]: this.createdAt.toISOString(),
            [ProjectDataDTO.Keys.PROJECT_ID]: this.id,
            [ProjectDataDTO.Keys.PROJECT_ITEM_COUNT]: String(this.itemCount),
            [ProjectDataDTO.Keys.PROJECT_NUMBER]: String(this.number),
            [ProjectDataDTO.Keys.PROJECT_PUBLIC]: String(this.isPublic),
            [ProjectDataDTO.Keys.PROJECT_REPOSITORY_COUNT]: String(this.repositories.length),
            [ProjectDataDTO.Keys.PROJECT_TITLE]: this.title,
            [ProjectDataDTO.Keys.PROJECT_UPDATED_AT]: this.updatedAt.toISOString(),
            [ProjectDataDTO.Keys.PROJECT_URL]: this.url,
        };
        if (this.description) {
            data[ProjectDataDTO.Keys.PROJECT_DESCRIPTION] = this.description;
        }
        if (this.repositories.length > 0) {
            const repoList = this.repositories
                .map(r => `${r.owner}/${r.name}`)
                .join(', ');
            data[ProjectDataDTO.Keys.PROJECT_REPOSITORIES] = repoList;
        }
        else {
            data[ProjectDataDTO.Keys.PROJECT_REPOSITORIES] = 'None';
        }
        return data;
    }
}
