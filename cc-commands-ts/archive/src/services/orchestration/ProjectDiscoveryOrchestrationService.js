/**
 * @file Orchestration service for GitHub Projects v2 discovery
 */
import { CommandError } from '../../errors/CommandError';
import { LLMInfo } from '../../types/LLMInfo';
/**
 * Orchestration service for discovering GitHub Projects v2
 */
export class ProjectDiscoveryOrchestrationService {
    projectDataService;
    /**
     * Create a new project discovery orchestration service
     *
     * @param projectDataService - Service for fetching project data
     */
    constructor(projectDataService) {
        this.projectDataService = projectDataService;
    }
    /**
     * Execute project discovery
     *
     * @param context - Service context
     * @returns LLMInfo with project data
     */
    async execute(context) {
        const result = LLMInfo.create();
        const params = context.params;
        const { fetchItems, includeArchived = false, limit = 20, organization, projectId } = params;
        try {
            if (fetchItems && projectId) {
                // Fetch items from a specific project
                result.addAction('Fetch project items', 'success', `Fetching items from project ${projectId}`);
                const items = await this.projectDataService.fetchProjectItems(projectId, { limit });
                // Extract unique repositories
                const repositories = await this.projectDataService.extractRepositories(items);
                result.addData('PROJECT_ITEM_COUNT', String(items.length));
                // Convert repository objects to full names
                const repoFullNames = repositories.map(r => `${r.owner}/${r.name}`);
                result.addData('PROJECT_REPOSITORIES', JSON.stringify(repoFullNames));
                result.addData('PROJECT_REPOSITORY_COUNT', String(repositories.length));
                // Add repository list as readable output
                if (repositories.length > 0) {
                    result.addInstruction(`Found ${repositories.length} repositories in the project:`);
                    for (const repo of repositories) {
                        result.addInstruction(`- ${repo.owner}/${repo.name}`);
                    }
                }
            }
            else if (organization) {
                // Find projects for an organization
                result.addAction('Find organization projects', 'success', `Searching for projects in ${organization}`);
                const projects = await this.projectDataService.findOrganizationProjects(organization, { includeArchived, limit });
                result.addData('PROJECT_COUNT', String(projects.length));
                if (projects.length > 0) {
                    // Add the most recent project info
                    const mostRecent = projects[0];
                    if (mostRecent) {
                        result.addData('MOST_RECENT_PROJECT_ID', mostRecent.id);
                        result.addData('MOST_RECENT_PROJECT_NUMBER', String(mostRecent.number));
                        result.addData('MOST_RECENT_PROJECT_TITLE', mostRecent.title);
                        result.addData('MOST_RECENT_PROJECT_URL', mostRecent.url);
                    }
                    // Add all projects as a list
                    result.addInstruction(`Found ${projects.length} GitHub Projects for ${organization}:`);
                    for (const [index, project] of projects.entries()) {
                        const status = project.closed ? '(closed)' : '(open)';
                        const items = project.itemCount > 0 ? ` - ${project.itemCount} items` : '';
                        result.addInstruction(`${index + 1}. ${project.title} ${status}${items}`);
                        result.addData(`PROJECT_${index}_ID`, project.id);
                        result.addData(`PROJECT_${index}_NUMBER`, String(project.number));
                        result.addData(`PROJECT_${index}_TITLE`, project.title);
                        result.addData(`PROJECT_${index}_CLOSED`, String(project.closed));
                        result.addData(`PROJECT_${index}_ITEM_COUNT`, String(project.itemCount));
                    }
                }
                else {
                    result.addData('PROJECT_COUNT', '0');
                    result.addInstruction(`No GitHub Projects found for organization: ${organization}`);
                }
            }
            else {
                throw new Error('Either organization or projectId must be provided');
            }
        }
        catch (error) {
            result.setError(new CommandError(error, [
                'Ensure GitHub token has read:project scope',
                'Verify organization name is correct',
                'Check if the project exists and you have access'
            ], {
                ...(organization && { organization }),
                ...(projectId && { projectId }),
                ...(fetchItems !== undefined && { fetchItems: String(fetchItems) })
            }));
        }
        return result;
    }
}
