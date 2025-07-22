/**
 * @fileoverview Main entry point for cc-commands-ts
 * 
 * This file exports the core architectural components that all commands use.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Commands extend BaseCommand
 * 2. Commands return LLMInfo
 * 3. All errors are CommandError with recovery instructions
 * 4. Commands do deterministic work, LLM generates reports
 * 
 * @see BaseCommand - Base class all commands must extend
 * @see LLMInfo - The only allowed return type
 * @see CommandError - The only allowed error type
 */

export { run } from '@oclif/core'

// Core architectural components
export { BaseCommand } from './commands/BaseCommand.js'
export { LLMInfo } from './types/LLMInfo.js'
export type { Action, FileOperation } from './types/LLMInfo.js'

// Error handling
export { 
  CommandError,
  GitHubErrorFactory,
  ValidationErrorFactory 
} from './errors/index.js'

// Type exports for commands to use
export type { AudienceType } from './types/AudienceTypes.js'
export type { CommandArgs } from './types/ArgumentTypes.js'
