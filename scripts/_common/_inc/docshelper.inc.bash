#!/usr/bin/env bash
# Include: docshelper.inc.bash  
# Purpose: Documentation generation helper functions
# Usage: This file is meant to be SOURCED, not executed
# WARNING: Do not set shell options or IFS in include files!

# Include guard
if [[ "${DOCSHELPER_INC_INCLUDED:-}" == "true" ]]; then
    return 0
fi
DOCSHELPER_INC_INCLUDED=true

# ============================================================================
# FUNCTION PARSING AND DOCUMENTATION GENERATION
# ============================================================================

# Parse function definitions with context from bash files  
# Usage: parse_functions "/path/to/file.inc.bash"
# Output: Functions with surrounding context for LLM processing
parse_functions() {
    local file="$1"
    
    # Validate input
    if [[ ! -f "$file" ]]; then
        echo "ERROR: File not found: $file"
        return 1
    fi
    
    echo "=== FUNCTIONS IN $(basename "$file") ==="
    echo ""
    
    # Use grep to find function definitions with context
    # -B 10: 10 lines before (captures documentation comments)
    # -A 5: 5 lines after (captures function signature and some body)
    grep -B 10 -A 5 "^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*(" "$file" | \
    grep -E "(^#.*|^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(|^[[:space:]]*local|^[[:space:]]*echo|--)" || {
        echo "No functions found in $file"
        return 0
    }
    
    echo ""
    echo "=== END FUNCTIONS ==="
}

# Extract function context for LLM documentation generation
# Usage: extract_functions_for_docs "file_path"
# Output: Clean function context suitable for LLM processing
extract_functions_for_docs() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    echo "File: $file_name"
    echo "Purpose: $(head -n 10 "$file_path" | grep "^# Purpose:" | cut -d: -f2- | sed 's/^ *//')"
    echo ""
    
    parse_functions "$file_path"
}