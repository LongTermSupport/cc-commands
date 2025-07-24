/**
 * @file DTO for environment validation results
 */
/**
 * Data transfer object for environment validation results
 *
 * Captures the state of environment validation including missing
 * tools and environment variables.
 */
export class EnvironmentValidationDTO {
    isValid;
    missingTools;
    missingEnvVars;
    /**
     * DTO-specific data keys
     */
    static Keys = {
        ENV_VALID: 'ENV_VALID',
        MISSING_ENV_VARS: 'MISSING_ENV_VARS',
        MISSING_TOOLS: 'MISSING_TOOLS',
    };
    /**
     * Create a new environment validation result
     *
     * @param isValid - Whether the environment is valid
     * @param missingTools - List of missing required tools
     * @param missingEnvVars - List of missing environment variables
     */
    constructor(isValid, missingTools, missingEnvVars) {
        this.isValid = isValid;
        this.missingTools = missingTools;
        this.missingEnvVars = missingEnvVars;
    }
    /**
     * Factory method for validation with missing requirements
     */
    static failure(missingTools, missingEnvVars) {
        return new EnvironmentValidationDTO(false, missingTools, missingEnvVars);
    }
    /**
     * Factory method for successful validation
     */
    static success() {
        return new EnvironmentValidationDTO(true, [], []);
    }
    /**
     * Convert to LLMInfo data format
     */
    toLLMData() {
        return {
            [EnvironmentValidationDTO.Keys.ENV_VALID]: String(this.isValid),
            [EnvironmentValidationDTO.Keys.MISSING_ENV_VARS]: this.missingEnvVars.join(', ') || 'None',
            [EnvironmentValidationDTO.Keys.MISSING_TOOLS]: this.missingTools.join(', ') || 'None'
        };
    }
}
