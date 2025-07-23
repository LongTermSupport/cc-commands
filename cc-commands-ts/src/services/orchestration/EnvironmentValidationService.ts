/**
 * @file Environment validation orchestration service
 * 
 * Validates that required tools and environment variables are present
 * before executing commands. Returns LLMInfo for orchestrator consumption.
 */

import { execSync } from 'node:child_process'

import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService.js'

import { EnvironmentValidationDTO } from '../../dto/EnvironmentValidationDTO.js'
import { CommandError } from '../../errors/CommandError.js'
import { LLMInfo } from '../../types/LLMInfo.js'

/**
 * Validates environment requirements for command execution
 */
export class EnvironmentValidationService implements IOrchestrationService {
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    try {
      const requiredTools = (context.params['requiredTools'] as string[]) || []
      const requiredEnvVars = (context.params['requiredEnvVars'] as string[]) || []
      
      // Check for required tools
      const missingTools: string[] = []
      for (const tool of requiredTools) {
        if (!this.isToolAvailable(tool)) {
          missingTools.push(tool)
        }
      }
      
      // Check for required environment variables
      const missingEnvVars: string[] = []
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          missingEnvVars.push(envVar)
        }
      }
      
      // Create validation result DTO
      const isValid = missingTools.length === 0 && missingEnvVars.length === 0
      const validationResult = isValid 
        ? EnvironmentValidationDTO.success()
        : EnvironmentValidationDTO.failure(missingTools, missingEnvVars)
      
      // Add DTO data to result
      result.addDataFromDTO(validationResult)
      
      // Add actions
      result.addAction('Environment validation', isValid ? 'success' : 'failed', 
        isValid ? 'All requirements met' : `Missing: ${[...missingTools, ...missingEnvVars].join(', ')}`)
      
      // Add instructions for LLM
      if (!isValid) {
        result.addInstruction('Inform the user about missing requirements')
        
        if (missingTools.length > 0) {
          result.addInstruction(`Provide installation instructions for: ${missingTools.join(', ')}`)
        }
        
        if (missingEnvVars.length > 0) {
          result.addInstruction(`Explain how to set environment variables: ${missingEnvVars.join(', ')}`)
          
          // Special handling for GITHUB_TOKEN
          if (missingEnvVars.includes('GITHUB_TOKEN')) {
            result.addInstruction('Suggest using "gh auth login" as an alternative to setting GITHUB_TOKEN')
          }
        }
        
        // Set error for proper handling
        result.setError(new CommandError(
          new Error('Environment validation failed'),
          [
            ...missingTools.map(tool => `Install ${tool}: Follow platform-specific installation guide`),
            ...missingEnvVars.map(envVar => {
              if (envVar === 'GITHUB_TOKEN') {
                return `Set ${envVar}: export ${envVar}=<value> OR use "gh auth login"`
              }

              return `Set ${envVar}: export ${envVar}=<value>`
            })
          ],
          {
            missingEnvVars,
            missingTools
          }
        ))
      }
      
    } catch (error) {
      result.setError(CommandError.fromError(error, {
        action: 'validating environment',
        service: 'EnvironmentValidationService'
      }))
    }
    
    return result
  }
  
  /**
   * Check if a command-line tool is available
   */
  private isToolAvailable(tool: string): boolean {
    try {
      execSync(`which ${tool}`, { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }
}