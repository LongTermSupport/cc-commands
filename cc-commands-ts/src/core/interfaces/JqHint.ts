/**
 * @file jq query hint interface
 * 
 * Defines the structure for jq query hints that help users efficiently query JSON result files.
 * Hints include scope information that determines how they are transformed during hierarchical merging.
 * 
 * Scope types:
 * - 'single_item': Query applies to individual items (gets transformed during merge)
 * - 'all_items': Query applies to arrays of items
 * - 'parent_level': Query applies at parent/project level (unchanged during merge)
 */

// Scope determines how hints are transformed during merging
export type JqHintScope = 'all_items' | 'parent_level' | 'single_item'

export interface JqHint {
  readonly description: string  // Human-readable description
  readonly query: string        // jq query string
  readonly scope: JqHintScope   // How to transform during merge
}