/**
 * @file DTO for environment validation results
 */
import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO';
/**
 * Data transfer object for environment validation results
 *
 * Captures the state of environment validation including missing
 * tools and environment variables.
 */
export declare class EnvironmentValidationDTO implements ILLMDataDTO {
    readonly isValid: boolean;
    readonly missingTools: string[];
    readonly missingEnvVars: string[];
    /**
     * DTO-specific data keys
     */
    private static readonly Keys;
    /**
     * Create a new environment validation result
     *
     * @param isValid - Whether the environment is valid
     * @param missingTools - List of missing required tools
     * @param missingEnvVars - List of missing environment variables
     */
    constructor(isValid: boolean, missingTools: string[], missingEnvVars: string[]);
    /**
     * Factory method for validation with missing requirements
     */
    static failure(missingTools: string[], missingEnvVars: string[]): EnvironmentValidationDTO;
    /**
     * Factory method for successful validation
     */
    static success(): EnvironmentValidationDTO;
    /**
     * Convert to LLMInfo data format
     */
    toLLMData(): Record<string, string>;
}
