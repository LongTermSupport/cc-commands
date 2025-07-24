/**
 * @file DTO for repository detection results
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Input mode for repository detection
 */
export type InputMode = 'auto' | 'manual' | 'url';
/**
 * Data transfer object for repository detection results
 *
 * Captures how a repository was detected and its basic information.
 */
export declare class RepoDetectionResultDTO implements ILLMDataDTO {
    readonly inputMode: InputMode;
    readonly owner: string;
    readonly name: string;
    readonly url?: string | undefined;
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new repository detection result
     *
     * @param inputMode - How the repository was detected
     * @param owner - Repository owner
     * @param name - Repository name
     * @param url - Optional repository URL
     */
    constructor(inputMode: InputMode, owner: string, name: string, url?: string | undefined);
    /**
     * Factory method for auto-detection
     */
    static fromAuto(owner: string, name: string, url: string): RepoDetectionResultDTO;
    /**
     * Factory method for manual input
     */
    static fromManual(owner: string, name: string): RepoDetectionResultDTO;
    /**
     * Factory method for URL-based detection
     */
    static fromURL(url: string, owner: string, name: string): RepoDetectionResultDTO;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
