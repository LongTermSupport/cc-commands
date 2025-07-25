/**
 * @file GitHub Project Summary Command
 * 
 * OCLIF command for generating comprehensive GitHub project summaries.
 * Analyzes Projects v2 and provides activity insights across repositories.
 */

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../../../core/BaseCommand'
import { LLMInfo } from '../../../../core/LLMInfo'
import { createGitHubServices } from '../../../../orchestrator-services/github/utils/ServiceFactory'
import { summaryOrch, TSummaryOrchestratorServices } from '../../../../orchestrators/g/gh/project/summaryOrch'

/**
 * GitHub Project Summary Command
 * 
 * This command analyzes GitHub Projects v2 and generates comprehensive
 * activity summaries across multiple repositories. It supports automatic
 * project detection from git remotes or manual specification.
 * 
 * Usage examples:
 * - Auto-detect: g:gh:project:summary
 * - From URL: g:gh:project:summary "https://github.com/orgs/myorg/projects/1"
 * - Manual: g:gh:project:summary "myorg/project-name"
 */
export default class SummaryCmd extends BaseCommand {
  static override id = 'g:gh:project:summary'
  
  static override args = {
    arguments: Args.string({
      description: 'Project identifier (URL, org/project, or auto-detect)',
      name: 'arguments',
      required: false,
    }),
  }
static override description = 'Generate comprehensive GitHub project summary with activity analysis'
static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> "https://github.com/orgs/myorg/projects/1"',
    '<%= config.bin %> <%= command.id %> "myorg/project-name"',
    '<%= config.bin %> <%= command.id %> "myorg/project-name --since 30d"',
  ]
static override flags = {
    format: Flags.string({
      char: 'f',
      default: 'technical',
      description: 'Output format',
      options: ['technical', 'executive', 'detailed'],
    }),
    since: Flags.string({
      char: 's',
      default: '30d',
      description: 'Time window for activity analysis (e.g., 7d, 30d, 3m)',
    }),
  }
static override strict = false

  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(SummaryCmd)
    
    // Construct arguments string from parsed args and flags
    const commandArgs = this.constructCommandArgs(args.arguments, flags)
    
    // Create service dependencies
    const services = await createGitHubServices()
    
    // Execute orchestrator and return result
    return summaryOrch(commandArgs, services as TSummaryOrchestratorServices)
  }

  /**
   * Construct command arguments string from parsed args and flags
   */
  private constructCommandArgs(projectArg: string | undefined, flags: { format?: string; since?: string }): string {
    const parts: string[] = []
    
    // Add project argument if provided
    if (projectArg) {
      parts.push(projectArg)
    }
    
    // Add flags
    if (flags.since && flags.since !== '30d') {
      parts.push(`--since ${flags.since}`)
    }
    
    if (flags.format && flags.format !== 'technical') {
      parts.push(`--format ${flags.format}`)
    }
    
    return parts.join(' ')
  }
}