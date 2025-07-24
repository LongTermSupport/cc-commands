/**
 * Arguments for auto-detection mode
 */
export type AutoDetectArgs = {
    audience?: string;
    mode: 'auto';
};
/**
 * Arguments for URL-based mode
 */
export type UrlArgs = {
    audience?: string;
    mode: 'url';
    url: string;
};
/**
 * Arguments for manual specification mode
 */
export type ManualArgs = {
    audience?: string;
    mode: 'manual';
    organization: string;
    projectId: number;
};
/**
 * Union type for all possible command argument combinations
 */
export type CommandArgs = AutoDetectArgs | ManualArgs | UrlArgs;
/**
 * Type guard for AutoDetectArgs
 */
export declare function isAutoDetectArgs(args: CommandArgs): args is AutoDetectArgs;
/**
 * Type guard for UrlArgs
 */
export declare function isUrlArgs(args: CommandArgs): args is UrlArgs;
/**
 * Type guard for ManualArgs
 */
export declare function isManualArgs(args: CommandArgs): args is ManualArgs;
