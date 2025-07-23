/**
 * @file DTO for environment validation results
 */

import type { ILLMDataDTO } from '../interfaces/ILLMDataDTO.js'

/**
 * Data transfer object for environment validation results
 * 
 * Captures the state of environment validation including missing
 * tools and environment variables.
 */
export class EnvironmentValidationDTO implements ILLMDataDTO {
  /**
   * DTO-specific data keys
   */
  private static readonly Keys = {
    ENV_VALID: 'ENV_VALID',
    MISSING_ENV_VARS: 'MISSING_ENV_VARS',
    MISSING_TOOLS: 'MISSING_TOOLS',
  } as const

  /**
   * Create a new environment validation result
   * 
   * @param isValid - Whether the environment is valid
   * @param missingTools - List of missing required tools
   * @param missingEnvVars - List of missing environment variables
   */
  constructor(
    public readonly isValid: boolean,
    public readonly missingTools: string[],
    public readonly missingEnvVars: string[]
  ) {}

  /**
   * Factory method for validation with missing requirements
   */
  static failure(missingTools: string[], missingEnvVars: string[]): EnvironmentValidationDTO {
    return new EnvironmentValidationDTO(false, missingTools, missingEnvVars)
  }

  /**
   * Factory method for successful validation
   */
  static success(): EnvironmentValidationDTO {
    return new EnvironmentValidationDTO(true, [], [])
  }

  /**
   * Convert to LLMInfo data format
   */
  toLLMData(): Record<string, string> {
    return {
      [EnvironmentValidationDTO.Keys.ENV_VALID]: String(this.isValid),
      [EnvironmentValidationDTO.Keys.MISSING_ENV_VARS]: this.missingEnvVars.join(', ') || 'None',
      [EnvironmentValidationDTO.Keys.MISSING_TOOLS]: this.missingTools.join(', ') || 'None'
    }
  }
}