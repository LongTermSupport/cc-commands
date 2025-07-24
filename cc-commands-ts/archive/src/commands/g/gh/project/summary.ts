/**
 * @file oclif command wrapper for g:gh:project:summary
 * 
 * This is a thin wrapper that handles CLI parsing and delegates
 * all orchestration logic to the pure executeProjectSummary function.
 */

import { Args, Flags } from '@oclif/core'

import type { LLMInfo } from '../../../../types/LLMInfo'

import { BaseCommand } from '../../../BaseCommand'
import { ServiceFactory } from '../../../../factories/ServiceFactory'
import { executeProjectSummary } from '../../../../orchestrators/g/gh/project/executeProjectSummary'

/**
 * Collect comprehensive data about a GitHub project
 */
export default class Summary extends BaseCommand {
  static override args = {
    urlOrMode: Args.string({
      description: 'GitHub URL for org detection OR mode (detect/collect)',
      required: false,
    }),
    projectId: Args.string({
      description: 'GitHub Project ID (for collect mode)',
      required: false,
    }),
  }
static override description = 'Analyze GitHub Projects v2 with multi-repository data collection'
static override examples = [
    // Step 1: Detect projects for an organization
    '<%= config.bin %> <%= command.id %> --org facebook',
    '<%= config.bin %> <%= command.id %> https://github.com/facebook/react  # auto-detect org from URL',
    '<%= config.bin %> <%= command.id %>  # auto-detect org from current git repo',
    '',
    // Step 2: Collect data from all repos in a project
    '<%= config.bin %> <%= command.id %> collect PVT_kwDOAJy2Ks4Aa1b2',
    '<%= config.bin %> <%= command.id %> collect PVT_kwDOAJy2Ks4Aa1b2 --days 90 --audience technical',
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
    org: Flags.string({
      description: 'GitHub organization name',
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
    
    // Parse the first argument - could be URL or mode
    let mode: 'collect' | 'detect' | undefined
    let url: string | undefined
    
    if (args.urlOrMode) {
      if (args.urlOrMode === 'detect' || args.urlOrMode === 'collect') {
        mode = args.urlOrMode
      } else {
        url = args.urlOrMode
      }
    }
    
    // Build orchestrator args with proper structure
    const orchArgs = {
      mode,
      projectId: args.projectId,
      url
    }
    
    // Delegate to pure orchestration function
    return executeProjectSummary(services, orchArgs, flags)
  }
}