/**
 * @file GitHub Project Summary Command
 * 
 * OCLIF command for generating comprehensive GitHub project summaries.
 * Analyzes Projects v2 and provides activity insights across repositories.
 */

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../core/BaseCommand.js'
import { LLMInfo } from '../core/LLMInfo.js'
import { ArgumentParser, IProjectDetectionArgs, ISummaryOrchestratorArgs } from '../orchestrator-services/github/types/ArgumentTypes.js'
import { createTypedGitHubServices } from '../orchestrator-services/github/utils/ServiceFactory.js'
import { summaryOrch } from '../orchestrators/g/gh/project/summaryOrch.js'

/**
 * GitHub Project Summary Command
 * 
 * This command analyzes GitHub Projects v2 and generates comprehensive
 * activity summaries across multiple repositories. It supports automatic
 * project detection from git remotes or manual specification.
 * 
 * Usage examples:
 * - Auto-detect: g-gh-project-summary
 * - From URL: g-gh-project-summary "https://github.com/orgs/myorg/projects/1"
 * - Manual: g-gh-project-summary "myorg/project-name"
 */
export default class SummaryCmd extends BaseCommand {
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
static override id = 'g-gh-project-summary'
static override strict = false

  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(SummaryCmd)
    
    // Parse CLI arguments to typed objects (CLI boundary)
    const projectArgs = this.parseProjectArguments(args.arguments)
    const timeWindowDays = ArgumentParser.parseTimeWindow(flags.since)
    
    // Create structured arguments for orchestrator
    const orchestratorArgs: ISummaryOrchestratorArgs = {
      format: flags.format as 'detailed' | 'executive' | 'technical',
      projectArgs,
      timeWindowDays
    }
    
    // Create typed service dependencies
    const services = await createTypedGitHubServices()
    
    // Execute orchestrator with typed arguments
    return summaryOrch(orchestratorArgs, services)
  }

  /**
   * Parse project arguments from CLI input (CLI boundary responsibility)
   */
  private parseProjectArguments(projectArg: string | undefined): IProjectDetectionArgs {
    // Use ArgumentParser utility to convert CLI string to typed object
    return ArgumentParser.parseProjectDetection(projectArg || '')
  }
}