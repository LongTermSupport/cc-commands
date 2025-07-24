/**
 * @file Main entry point for cc-commands-ts
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
export { BaseCommand } from './commands/BaseCommand';
export { CommandError, GitHubErrorFactory, ValidationErrorFactory } from './errors';
export type { CommandArgs } from './types/ArgumentTypes';
export { LLMInfo } from './types/LLMInfo';
export type { Action, FileOperation } from './types/LLMInfo';
export { run } from '@oclif/core';
