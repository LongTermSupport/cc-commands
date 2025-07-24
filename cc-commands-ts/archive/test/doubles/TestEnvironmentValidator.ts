/**
 * @file Test double for EnvironmentValidationService
 * 
 * Implements IOrchestrationService for testing without real environment checks.
 */

import type { IOrchestrationService, ServiceContext } from '../../src/interfaces/IOrchestrationService'

import { CommandError } from '../../src/errors/CommandError'
import { LLMInfo } from '../../src/types/LLMInfo'

/**
 * Test implementation of environment validator
 */
export class TestEnvironmentValidator implements IOrchestrationService {
  private missingEnvVars: string[] = []
  private missingTools: string[] = []
  private shouldFail = false
  
  async execute(_context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    if (this.shouldFail) {
      result.addData('ENV_VALID', 'false')
      result.addData('MISSING_TOOLS', this.missingTools.join(','))
      result.addData('MISSING_ENV_VARS', this.missingEnvVars.join(','))
      result.addAction('Environment validation', 'failed', 
        `Missing: ${[...this.missingTools, ...this.missingEnvVars].join(', ')}`)
      
      result.setError(new CommandError(
        new Error('Environment validation failed'),
        [
          ...this.missingTools.map(tool => `Install ${tool}`),
          ...this.missingEnvVars.map(envVar => `Set ${envVar}`)
        ],
        {
          missingEnvVars: this.missingEnvVars,
          missingTools: this.missingTools
        }
      ))
    } else {
      result.addData('ENV_VALID', 'true')
      result.addAction('Environment validation', 'success', 'All requirements met')
    }
    
    return result
  }
  
  /**
   * Reset to passing state
   */
  reset(): void {
    this.shouldFail = false
    this.missingTools = []
    this.missingEnvVars = []
  }
  
  /**
   * Configure the validator to fail
   */
  setFailure(tools: string[] = [], envVars: string[] = []): void {
    this.shouldFail = true
    this.missingTools = tools
    this.missingEnvVars = envVars
  }
}