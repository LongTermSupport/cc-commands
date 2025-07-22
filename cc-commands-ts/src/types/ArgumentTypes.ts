import { AudienceType } from './AudienceTypes.js'

/**
 * Arguments for auto-detection mode
 */
export type AutoDetectArgs = {
  mode: 'auto'
  audience?: AudienceType
}

/**
 * Arguments for URL-based mode
 */
export type UrlArgs = {
  mode: 'url'
  url: string
  audience?: AudienceType
}

/**
 * Arguments for manual specification mode
 */
export type ManualArgs = {
  mode: 'manual'
  organization: string
  projectId: number
  audience?: AudienceType
}

/**
 * Union type for all possible command argument combinations
 */
export type CommandArgs = AutoDetectArgs | UrlArgs | ManualArgs

/**
 * Type guard for AutoDetectArgs
 */
export function isAutoDetectArgs(args: CommandArgs): args is AutoDetectArgs {
  return args.mode === 'auto'
}

/**
 * Type guard for UrlArgs
 */
export function isUrlArgs(args: CommandArgs): args is UrlArgs {
  return args.mode === 'url' && 'url' in args
}

/**
 * Type guard for ManualArgs
 */
export function isManualArgs(args: CommandArgs): args is ManualArgs {
  return args.mode === 'manual' && 'organization' in args && 'projectId' in args
}