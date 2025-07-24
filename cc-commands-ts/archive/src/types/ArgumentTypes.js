/**
 * Type guard for AutoDetectArgs
 */
export function isAutoDetectArgs(args) {
    return args.mode === 'auto';
}
/**
 * Type guard for UrlArgs
 */
export function isUrlArgs(args) {
    return args.mode === 'url' && 'url' in args;
}
/**
 * Type guard for ManualArgs
 */
export function isManualArgs(args) {
    return args.mode === 'manual' && 'organization' in args && 'projectId' in args;
}
