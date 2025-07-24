/**
 * @file Service for saving structured data to JSON files
 *
 * This service saves complete, unabridged data in JSON format optimized
 * for querying with jq. Files are saved in the var/ directory with
 * timestamped names for easy tracking.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
/**
 * Service for saving data to JSON files
 */
export class DataFileService {
    varDir;
    /**
     * Create a new data file service
     *
     * @param baseDir - Base directory (usually process.cwd())
     */
    constructor(baseDir = process.cwd()) {
        this.varDir = join(baseDir, 'var');
    }
    /**
     * Save data to a JSON file
     *
     * @param data - Data to save (will be JSON stringified)
     * @param options - File saving options
     * @returns Path to the saved file
     */
    async saveDataFile(data, options) {
        // Ensure var directory exists
        const targetDir = options.subdirectory
            ? join(this.varDir, options.subdirectory)
            : this.varDir;
        if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
        }
        // Generate filename
        const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
        const filename = options.includeTimestamp === false
            ? `${options.filename}.json`
            : `${options.filename}-${timestamp}.json`;
        const filepath = join(targetDir, filename);
        // Write JSON with nice formatting for readability
        const jsonContent = JSON.stringify(data, null, 2);
        await writeFile(filepath, jsonContent, 'utf8');
        return filepath;
    }
    /**
     * Save GitHub Project data in a jq-friendly format
     *
     * @param projectData - Project and repository data
     * @param organization - Organization name
     * @param projectNumber - Project number
     * @returns Path to the saved file
     */
    async saveProjectData(projectData, organization, projectNumber) {
        const filename = projectNumber
            ? `github-project-${organization}-${projectNumber}`
            : `github-repo-${organization}-${projectData.repositories?.[0]?.name || 'unknown'}`;
        return this.saveDataFile(projectData, {
            filename,
            includeTimestamp: true,
            subdirectory: 'project-data'
        });
    }
}
