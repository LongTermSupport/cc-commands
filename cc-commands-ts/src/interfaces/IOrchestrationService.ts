/**
 * @file Standard interface for orchestration services
 * 
 * ARCHITECTURAL PRINCIPLE:
 * Orchestration services are the building blocks used by orchestrators.
 * They MUST return LLMInfo to maintain the paradigm that TypeScript
 * provides tools and data for the LLM, not intelligence or formatting.
 * 
 * These services can internally use any other services with any return
 * types, but their contract with orchestrators is always LLMInfo.
 */

import type { LLMInfo } from '../types/LLMInfo.js'

/**
 * Context passed to orchestration services
 */
export interface ServiceContext {
  /** Execution flags */
  flags?: {
    /** Additional service-specific flags */
    [key: string]: unknown
    /** Perform dry run without making changes */
    dryRun?: boolean
    /** Enable verbose output */
    verbose?: boolean
  }
  
  /** Input parameters - flexible typing for different services */
  params: Record<string, unknown>
  
  /** Shared data from previous service executions (KEY=value pairs) */
  sharedData?: Record<string, string>
}

/**
 * Standard interface for all orchestration services.
 * 
 * These services are used by orchestrators to perform specific operations
 * and return structured data via LLMInfo.
 * 
 * @example
 * ```typescript
 * export class EnvironmentValidationService implements IOrchestrationService {
 *   async execute(context: ServiceContext): Promise<LLMInfo> {
 *     const result = LLMInfo.create()
 *     
 *     // Validate environment
 *     const missingTools = await this.checkTools(context.params.requiredTools)
 *     
 *     // Add data for LLM
 *     result.addData('ENVIRONMENT_VALID', missingTools.length === 0 ? 'true' : 'false')
 *     result.addData('MISSING_TOOLS', missingTools.join(','))
 *     
 *     // Add instruction for LLM
 *     if (missingTools.length > 0) {
 *       result.addInstruction('Inform user about missing tools and how to install them')
 *     }
 *     
 *     return result
 *   }
 * }
 * ```
 */
export interface IOrchestrationService {
  /**
   * Execute the service operation
   * 
   * @param context - Contextual data needed for the operation
   * @returns LLMInfo with data, files, actions, and instructions for the LLM
   * @throws CommandError if operation fails (will be caught and added to LLMInfo)
   */
  execute(context: ServiceContext): Promise<LLMInfo>
}