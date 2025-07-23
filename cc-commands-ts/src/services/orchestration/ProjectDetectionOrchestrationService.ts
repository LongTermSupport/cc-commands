/**
 * @file Project detection orchestration service
 * 
 * Wraps the ProjectDetectionService to return LLMInfo for orchestrator consumption.
 * Handles different input modes: auto-detection, URL, or manual owner/repo.
 */

import type { IOrchestrationService, ServiceContext } from '../../interfaces/IOrchestrationService.js'
import type { IProjectDetectionService } from '../../interfaces/IProjectDetectionService.js'

import { CommandError } from '../../errors/CommandError.js'
import { ValidationErrorFactory } from '../../errors/ValidationErrorFactory.js'
import { LLMInfo } from '../../types/LLMInfo.js'

/**
 * Orchestration wrapper for project detection
 */
export class ProjectDetectionOrchestrationService implements IOrchestrationService {
  constructor(
    private projectDetector: IProjectDetectionService
  ) {}
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    try {
      const { owner, repo, url } = context.params
      
      let detectedProject
      let inputMode: string
      
      // Determine input mode and detect project
      if (url) {
        // URL mode
        inputMode = 'url'
        detectedProject = await this.projectDetector.detectFromUrl(url as string)
      } else if (owner && repo) {
        // Manual mode
        inputMode = 'manual'
        detectedProject = {
          name: repo as string,
          owner: owner as string
        }
      } else if (owner && !repo) {
        // Error: owner without repo
        throw ValidationErrorFactory.missingRequiredArgument('repo', 'specify the repository when using --owner')
      } else {
        // Auto mode - detect from current directory
        inputMode = 'auto'
        detectedProject = await this.projectDetector.detectFromDirectory()
      }
      
      // Add detection results to LLMInfo
      result.addData('INPUT_MODE', inputMode)
      result.addData('REPO_OWNER', detectedProject.owner)
      result.addData('REPO_NAME', detectedProject.name)
      result.addData('REPO_URL', `https://github.com/${detectedProject.owner}/${detectedProject.name}`)
      
      // Add action
      result.addAction('Project detection', 'success', 
        `Detected ${detectedProject.owner}/${detectedProject.name} via ${inputMode} mode`)
      
      // Add instruction
      result.addInstruction('Use the detected repository information to fetch project data')
      
    } catch (error) {
      // Convert error to CommandError if needed
      const commandError = error instanceof CommandError 
        ? error 
        : CommandError.fromError(error, {
            action: 'detecting project',
            service: 'ProjectDetectionOrchestrationService'
          })
      
      result.setError(commandError)
      result.addAction('Project detection', 'failed', commandError.message)
      result.addInstruction('Provide guidance on correct command usage based on the error')
    }
    
    return result
  }
}