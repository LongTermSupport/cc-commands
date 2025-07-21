#!/usr/bin/env bash
# Script: find_docs.bash
# Purpose: Search for documentation files across common project locations
# Usage: find_docs.bash
# Output: DOCS_FOUND=count, DOC_FILE_n=path, DOC_PREVIEW_n=first_5_lines

set -euo pipefail
IFS=$'\n\t'

# Get script directory and common path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common error handling
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Documentation search paths and patterns
declare -a SEARCH_PATTERNS=(
    "CLAUDE/*.md"
    "CLAUDE/**/*.md"
    "CLAUDE.md"
    "README.md"
    "docs/*.md"
    "docs/**/*.md"
)

# Function to safely get first 5 lines of a file
get_file_preview() {
    local file_path="$1"
    local preview=""
    
    if [[ -r "$file_path" ]]; then
        # Use head to get first 5 lines, handle empty files gracefully
        preview=$(head -n 5 "$file_path" 2>/dev/null || echo "")
        
        # If preview is empty, indicate it
        if [[ -z "$preview" ]]; then
            preview="[Empty file or no readable content]"
        fi
    else
        preview="[File not readable]"
    fi
    
    echo "$preview"
}

# Function to search for files with a pattern, excluding cc-commands
search_files() {
    local pattern="$1"
    local files=()
    
    # Use find to search for markdown files, excluding cc-commands directories
    while IFS= read -r -d '' file; do
        files+=("$file")
    done < <(find . -path "./$pattern" -type f \
        -not -path "./.claude/cc-commands/*" \
        -not -path "./cc-commands/*" \
        -print0 2>/dev/null || true)
    
    # Return the array
    printf '%s\n' "${files[@]}"
}

# Main function
main() {
    echo "# Searching for documentation files (excluding cc-commands)..."
    
    local doc_count=0
    local all_docs=()
    
    # Search each pattern
    for pattern in "${SEARCH_PATTERNS[@]}"; do
        echo "# Searching pattern: $pattern"
        
        # Get files matching this pattern
        while IFS= read -r file; do
            if [[ -n "$file" && -f "$file" ]]; then
                all_docs+=("$file")
            fi
        done < <(search_files "$pattern")
    done
    
    # Remove duplicates and sort
    if [[ ${#all_docs[@]} -gt 0 ]]; then
        # Sort and remove duplicates
        IFS=$'\n' sorted_docs=($(sort -u <<<"${all_docs[*]}"))
        unset IFS
        
        # Output structured data
        echo "DOCS_FOUND=${#sorted_docs[@]}"
        
        for i in "${!sorted_docs[@]}"; do
            local file="${sorted_docs[$i]}"
            local preview
            
            echo "DOC_FILE_$i=$file"
            
            # Get and output preview with proper escaping
            preview=$(get_file_preview "$file")
            
            # Output preview as heredoc to handle multiline content
            echo "DOC_PREVIEW_$i<<EOF"
            echo "$preview"
            echo "EOF"
        done
    else
        echo "DOCS_FOUND=0"
        echo "# No documentation files found"
    fi
}

# Execute main function
main

echo "# Documentation search completed"
echo "Script success: ${0##*/}"
