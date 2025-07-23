/**
 * @file Test double for ProjectDetectionOrchestrationService
 * 
 * Implements IOrchestrationService for testing without real git/GitHub detection.
 */

import type { IOrchestrationService, ServiceContext } from '../../src/interfaces/IOrchestrationService.js'

import { CommandError } from '../../src/errors/CommandError.js'
import { LLMInfo } from '../../src/types/LLMInfo.js'

interface DetectionConfig {
  error?: string
  inputMode: 'auto' | 'manual' | 'url'
  owner: string
  repo: string
}

/**
 * Test implementation of project detector
 */
export class TestProjectDetector implements IOrchestrationService {
  private config: DetectionConfig = {
    inputMode: 'auto',
    owner: 'testowner',
    repo: 'testrepo'
  }
  
  async execute(context: ServiceContext): Promise<LLMInfo> {
    const result = LLMInfo.create()
    
    if (this.config.error) {
      result.setError(new CommandError(
        new Error(this.config.error),
        ['Check the repository URL or git remote', 'Ensure you have access to the repository'],
        { context: 'project detection' }
      ))
      result.addAction('Project detection', 'failed', this.config.error)
      return result
    }
    
    // Determine input mode based on context
    let {inputMode} = this.config
    if (context.params['url']) {
      inputMode = 'url'
    } else if (context.params['owner'] && context.params['repo']) {
      inputMode = 'manual'
    }
    
    result.addData('INPUT_MODE', inputMode)
    result.addData('REPO_OWNER', this.config.owner)
    result.addData('REPO_NAME', this.config.repo)
    result.addData('REPO_URL', `https://github.com/${this.config.owner}/${this.config.repo}`)
    result.addAction('Project detection', 'success', `Detected ${this.config.owner}/${this.config.repo}`)
    
    return result
  }
  
  /**
   * Reset to default state
   */
  reset(): void {
    this.config = {
      inputMode: 'auto',
      owner: 'testowner',
      repo: 'testrepo'
    }
  }
  
  /**
   * Configure the detection result
   */
  setDetectionResult(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}