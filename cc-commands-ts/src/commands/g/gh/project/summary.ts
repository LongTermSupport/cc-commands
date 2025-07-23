/**
 * @file oclif command wrapper for g:gh:project:summary
 * 
 * This is a thin wrapper that handles CLI parsing and delegates
 * all orchestration logic to the pure executeProjectSummary function.
 */

import { Args, Flags } from '@oclif/core'

import type { LLMInfo } from '../../../../types/LLMInfo.js'

import { BaseCommand } from '../../../../commands/BaseCommand.js'
import { ServiceFactory } from '../../../../factories/ServiceFactory.js'
import { executeProjectSummary } from '../../../../orchestrators/g/gh/project/executeProjectSummary.js'

/**
 * Collect comprehensive data about a GitHub project
 */
export default class Summary extends BaseCommand {
  static override args = {
    url: Args.string({
      description: 'GitHub repository URL (e.g., https://github.com/owner/repo)',
      required: false,
    }),
  }
static override description = 'Collect comprehensive data about a GitHub project for LLM processing'
static override examples = [
    '<%= config.bin %> <%= command.id %> https://github.com/facebook/react',
    '<%= config.bin %> <%= command.id %> --owner facebook --repo react',
    '<%= config.bin %> <%= command.id %> # auto-detect from current directory',
  ]
static override flags = {
    audience: Flags.string({
      char: 'a',
      default: 'dev',
      description: 'Target audience for the report (arbitrary string)',
    }),
    days: Flags.integer({
      char: 'd',
      default: 30,
      description: 'Number of days of activity to analyze',
    }),
    owner: Flags.string({
      char: 'o',
      description: 'Repository owner (use with --repo)',
    }),
    repo: Flags.string({
      char: 'r',
      description: 'Repository name (use with --owner)',
    }),
    token: Flags.string({
      char: 't',
      description: 'GitHub personal access token (or use GITHUB_TOKEN env var)',
    }),
  }

  /**
   * Execute the command by delegating to the pure orchestration function
   */
  async execute(): Promise<LLMInfo> {
    const { args, flags } = await this.parse(Summary)
    
    // Create services using factory
    const services = ServiceFactory.createProjectSummaryServices(flags.token)
    
    // Delegate to pure orchestration function
    return executeProjectSummary(services, args, flags)
  }
}