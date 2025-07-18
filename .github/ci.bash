#!/usr/bin/env bash
# Script: ci.bash
# Purpose: CI checks for Claude Code commands
# Usage: ci.bash
# Output: CI validation results and errors

set -euo pipefail
IFS=$'\n\t'

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_COMMANDS=0
ERRORS=0
WARNINGS=0

# Error tracking
declare -a ERROR_MESSAGES=()
declare -a WARNING_MESSAGES=()

# Helper functions
error() {
    echo "ERROR: $1" >&2
    ERROR_MESSAGES+=("$1")
    ((ERRORS++))
}

warning() {
    echo "WARNING: $1" >&2
    WARNING_MESSAGES+=("$1")
    ((WARNINGS++))
}

success() {
    echo "✓ $1"
}

info() {
    echo "$1"
}

# Check 1: Verify help documentation pattern
check_help_documentation() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Check for <help> tags
    if ! grep -q "<help>" "$file"; then
        error "$filename: Missing <help> tag for help documentation"
        return 0
    fi
    
    if ! grep -q "</help>" "$file"; then
        error "$filename: Missing closing </help> tag"
        return 0
    fi
    
    # Check for correct help handling Task
    # Look for a Task that mentions checking for --help arguments
    if ! grep -A10 "<Task>" "$file" | grep -i -- "--help" | grep -qi "output.*help\|provide.*help"; then
        error "$filename: Missing or incorrect help handling Task. Should check for --help and output help documentation."
        return 0
    fi
    
    success "$filename: Help documentation structure is correct"
    return 0
}

# Check 2: Detect ad-hoc bash commands
check_adhoc_bash() {
    local file="$1"
    local filename=$(basename "$file")
    local has_issues=false
    local line_num=0
    
    while IFS= read -r line; do
        ((line_num++))
        
        # Skip if not a bash command line
        if [[ ! "$line" =~ ^! ]]; then
            continue
        fi
        
        # Remove the ! prefix for analysis
        local bash_content="${line#!}"
        
        # Check for loops
        if [[ "$bash_content" =~ (while|for|until)[[:space:]] ]]; then
            error "$filename:$line_num: Loops should be in a script, not inline"
            has_issues=true
        fi
        
        # Check for function definitions
        if [[ "$bash_content" =~ [[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(\)[[:space:]]*\{ ]]; then
            error "$filename:$line_num: Function definitions should be in a script"
            has_issues=true
        fi
        
        # Check for complex git operations (but allow calls to scripts)
        if [[ "$bash_content" =~ git[[:space:]]+(add|commit|push|fetch|pull|merge|rebase) ]] && 
           [[ ! "$bash_content" =~ ^[[:space:]]*bash[[:space:]] ]]; then
            warning "$filename:$line_num: Git operations should use scripts"
            has_issues=true
        fi
        
        # Check for complex gh operations with pipes
        if [[ "$bash_content" =~ gh[[:space:]]+(issue|pr|workflow|run) ]] && 
           [[ "$bash_content" =~ \| ]] &&
           [[ ! "$bash_content" =~ ^[[:space:]]*bash[[:space:]] ]]; then
            warning "$filename:$line_num: Complex gh operations should use scripts"
            has_issues=true
        fi
        
        # Check for jq usage (should be in scripts for complex parsing)
        if [[ "$bash_content" =~ jq[[:space:]] ]] && [[ "$bash_content" =~ \| ]]; then
            warning "$filename:$line_num: Complex jq parsing should be in a script"
            has_issues=true
        fi
        
    done < "$file"
    
    if [ "$has_issues" = false ]; then
        success "$filename: No problematic ad-hoc bash detected"
    fi
    
    return 0
}

# Check 3: Verify script references exist
check_script_references() {
    local file="$1"
    local filename=$(basename "$file")
    local has_issues=false
    
    # Find all bash script references
    if grep -q "^!.*bash .*\.claude/cc-commands/scripts/" "$file"; then
        while IFS=: read -r line_num line; do
            # Extract script path
            local script_path=$(echo "$line" | grep -o '\.claude/cc-commands/scripts/[^[:space:]"]*\.bash' || true)
            
            if [ -n "$script_path" ]; then
                # Check from repo root
                if [ ! -f "$script_path" ]; then
                    error "$filename:$line_num: Referenced script does not exist: $script_path"
                    has_issues=true
                fi
            fi
        done < <(grep -n "^!.*bash .*\.claude/cc-commands/scripts/" "$file")
    fi
    
    if [ "$has_issues" = false ]; then
        success "$filename: All referenced scripts exist"
    fi
    
    return 0
}

# Main CI check
main() {
    info "=== Claude Code Commands CI Check ==="
    info ""
    
    # Find all command files
    local commands_dir="export/commands"
    if [ ! -d "$commands_dir" ]; then
        error "Commands directory not found: $commands_dir"
        exit 1
    fi
    
    # Process each command file
    while IFS= read -r file; do
        ((TOTAL_COMMANDS++))
        echo "Checking: $file"
        
        # Run all checks
        check_help_documentation "$file"
        check_adhoc_bash "$file"  
        check_script_references "$file"
        
        echo ""
    done < <(find "$commands_dir" -name "*.md" -type f | sort)
    
    # Summary
    info "=== CI Check Summary ==="
    info "Total commands checked: $TOTAL_COMMANDS"
    info "Errors: $ERRORS"
    info "Warnings: $WARNINGS"
    
    if [ "$ERRORS" -gt 0 ]; then
        error "CI check failed with $ERRORS errors"
        info ""
        info "Error details:"
        printf '%s\n' "${ERROR_MESSAGES[@]}"
        exit 1
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        info ""
        info "Warning details:"
        printf '%s\n' "${WARNING_MESSAGES[@]}"
    fi
    
    success "All CI checks passed!"
    exit 0
}

# Run from the cc-commands directory
cd "$(dirname "$0")/.." || exit 1

# Execute main
main