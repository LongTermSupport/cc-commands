/**
 * @file Base class for all cc-commands
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Commands are thin wrappers that call orchestrators
 * 2. Commands NEVER contain business logic
 * 3. Commands return LLMInfo exactly as orchestrators provide it
 * 4. All errors are handled via OrchestratorError
 * 
 * This base class enforces these principles through:
 * - Final run() method that cannot be overridden
 * - Mandatory execute() method returning LLMInfo
 * - Proper CLI integration (stdout output, exit codes)
 * 
 * @see LLMInfo for return type details
 * @see OrchestratorError for error handling
 */

import { Command } from '@oclif/core'

import { LLMInfo } from './LLMInfo.js'

/**
 * Base class for ALL cc-commands.
 * 
 * Commands should be thin wrappers that:
 * 1. Parse CLI arguments 
 * 2. Call the appropriate orchestrator
 * 3. Output the LLMInfo result
 * 
 * @example
 * ```typescript
 * export default class MyCommand extends BaseCommand {
 *   static description = 'Does something via orchestrator'
 *   
 *   async execute(): Promise<LLMInfo> {
 *     // Parse arguments from this.argv or this.parse()
 *     const args = this.argv.join(' ')
 *     
 *     // Call orchestrator (this is where the real work happens)  
 *     const result = await myOrchestrator(args, services)
 *     
 *     return result
 *   }
 * }
 * ```
 */
export abstract class BaseCommand extends Command {
  
  /**
   * The ONLY method subclasses must implement.
   * 
   * This method should:
   * 1. Parse CLI arguments
   * 2. Call the appropriate orchestrator  
   * 3. Return the LLMInfo result unchanged
   * 
   * This method should NOT:
   * - Contain business logic (that belongs in orchestrators/services)
   * - Generate formatted text (that's the LLM's job)
   * - Make decisions about data (orchestrators do that)
   * - Call this.log() directly (use LLMInfo)
   * 
   * @returns LLMInfo exactly as returned by the orchestrator
   */
  abstract execute(): Promise<LLMInfo>
  
  /**
   * Final run method - cannot be overridden by subclasses.
   * 
   * This method:
   * 1. Calls execute() 
   * 2. Outputs LLMInfo.toString() to stdout
   * 3. Exits with LLMInfo.getExitCode()
   * 
   * @final
   */
  async run(): Promise<void> {
    try {
      // Execute the command implementation
      const result = await this.execute()
      
      // Validate that execute() returned LLMInfo
      if (!(result instanceof LLMInfo)) {
        throw new TypeError('execute() must return an LLMInfo instance')
      }
      
      // Output exactly what LLMInfo provides
      process.stdout.write(result.toString())
      
      // Exit with the code LLMInfo determines using OCLIF method
      this.exit(result.getExitCode())
      
    } catch (error) {
      // OCLIF's this.exit() throws an error to stop execution - this is normal behavior
      // We should not catch and handle exit errors as failures
      if (error instanceof Error && error.message?.startsWith('EEXIT:')) {
        // Re-throw exit errors so they can properly terminate the process
        throw error
      }
      
      // If execute() throws a real error, create error LLMInfo  
      const errorInfo = LLMInfo.create()
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Add error information - LLMInfo will format appropriately
      errorInfo.addData('ERROR_TYPE', 'COMMAND_EXECUTION_ERROR')
      errorInfo.addData('ERROR_MESSAGE', errorMessage)
      errorInfo.addInstruction('Display error message and exit')
      
      if (error instanceof Error && error.stack) {
        errorInfo.addData('ERROR_STACK', error.stack)
      }
      
      // Output error and exit with code 1 using OCLIF method
      process.stdout.write(errorInfo.toString())
      this.exit(1)
    }
  }
}