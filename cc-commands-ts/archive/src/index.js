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
// Core architectural components
export { BaseCommand } from './commands/BaseCommand';
// Error handling
export { CommandError, GitHubErrorFactory, ValidationErrorFactory } from './errors';
export { LLMInfo } from './types/LLMInfo';
export { run } from '@oclif/core';
