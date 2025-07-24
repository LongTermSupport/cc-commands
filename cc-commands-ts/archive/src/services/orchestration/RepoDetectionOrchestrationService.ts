/**
 * @file Repository detection orchestration service
 * 
 * Wraps the RepoDetectionService to return LLMInfo for orchestrator consumption.
 * Handles different input modes: auto-detection, URL, or manual owner/repo.
 */

import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService'
import type { IRepoDetectionService } from '../../interfaces/IRepoDetectionService'

import { CommandError } from '../../errors/CommandError'
import { ValidationErrorFactory } from '../../errors/ValidationErrorFactory'
import { LLMInfo } from '../../types/LLMInfo'

/**
 * Orchestration wrapper for repository detection
 */
export class RepoDetectionOrchestrationService implements IOrchestrationService {
  constructor(
    private repoDetector: IRepoDetectionService
  ) {}
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    try {
      const { owner, repo, url } = context.params
      
      let detectedRepo
      
      // Determine input mode and detect repository
      if (url) {
        // URL mode
        detectedRepo = await this.repoDetector.detectFromUrl(url as string)
      } else if (owner && repo) {
        // Manual mode - create DTO manually
        const { RepoDetectionResultDTO } = await import('../../dto/RepoDetectionResultDTO')
        detectedRepo = RepoDetectionResultDTO.fromManual(owner as string, repo as string)
      } else if (owner && !repo) {
        // Error: owner without repo
        throw ValidationErrorFactory.missingRequiredArgument('repo', 'specify the repository when using --owner')
      } else {
        // Auto mode - detect from current directory
        detectedRepo = await this.repoDetector.detectFromDirectory()
      }
      
      // Add detection results to LLMInfo using DTO
      result.addDataFromDTO(detectedRepo)
      
      // Add action
      result.addAction('Repository detection', 'success', 
        `Detected ${detectedRepo.owner}/${detectedRepo.name} via ${detectedRepo.inputMode} mode`)
      
      // Add instruction
      result.addInstruction('Use the detected repository information to fetch repository data')
      
    } catch (error) {
      // Convert error to CommandError if needed
      const commandError = error instanceof CommandError 
        ? error 
        : CommandError.fromError(error, {
            action: 'detecting repository',
            service: 'RepoDetectionOrchestrationService'
          })
      
      result.setError(commandError)
      result.addAction('Repository detection', 'failed', commandError.message)
      result.addInstruction('Provide guidance on correct command usage based on the error')
    }
    
    return result
  }
}