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

# Check 4: Verify include file conventions
check_include_files() {
    local has_issues=false
    
    info "Checking include file conventions..."
    
    # Check _inc directory
    if [ -d "scripts/_inc" ]; then
        while IFS= read -r file; do
            local filename=$(basename "$file")
            
            # Check naming convention
            if [[ ! "$filename" =~ \.inc\.bash$ ]]; then
                error "$file: Include files must use .inc.bash suffix"
                has_issues=true
            fi
            
            # Check for prohibited patterns
            if grep -q "^set -[euo]" "$file"; then
                error "$file: Include files must NOT set shell options (set -e, etc)"
                has_issues=true
            fi
            
            if grep -q "^IFS=" "$file"; then
                error "$file: Include files must NOT modify IFS"
                has_issues=true
            fi
            
            # Check for include guard
            if ! grep -q "_INCLUDED=" "$file"; then
                warning "$file: Include file should have an include guard"
                has_issues=true
            fi
            
            # Check header comment
            if ! head -n 5 "$file" | grep -q "# Include:"; then
                warning "$file: Include file should start with '# Include:' header"
                has_issues=true
            fi
            
            if ! head -n 10 "$file" | grep -q "This file is meant to be SOURCED"; then
                warning "$file: Include file should state it's meant to be sourced"
                has_issues=true
            fi
            
        done < <(find scripts/_inc -name "*.bash" -type f 2>/dev/null)
    fi
    
    # Check for .bash files in _inc that don't have .inc.bash suffix
    if [ -d "scripts/_inc" ]; then
        while IFS= read -r file; do
            if [[ ! "$file" =~ \.inc\.bash$ ]]; then
                error "$file: All files in _inc/ must use .inc.bash suffix"
                has_issues=true
            fi
        done < <(find scripts/_inc -name "*.bash" -type f 2>/dev/null)
    fi
    
    if [ "$has_issues" = false ]; then
        success "Include file conventions are followed"
    fi
    
    return 0
}

# Check 5: Verify scripts follow sourcing conventions
check_script_conventions() {
    local has_issues=false
    
    info "Checking script conventions..."
    
    # Check all bash scripts (excluding _inc directory)
    while IFS= read -r file; do
        local filename=$(basename "$file")
        local dirname=$(dirname "$file")
        
        # Skip include files
        if [[ "$dirname" =~ /_inc$ ]]; then
            continue
        fi
        
        # Regular scripts should have proper headers
        if ! head -n 10 "$file" | grep -q "^#!/usr/bin/env bash"; then
            error "$file: Script should start with #!/usr/bin/env bash"
            has_issues=true
        fi
        
        if ! head -n 10 "$file" | grep -q "^set -euo pipefail"; then
            warning "$file: Script should set error handling options (set -euo pipefail)"
            has_issues=true
        fi
        
        # Check for sourcing include files with correct suffix
        if grep -q "source.*/_inc/.*\.bash" "$file" && ! grep -q "source.*/_inc/.*\.inc\.bash" "$file"; then
            error "$file: Should source .inc.bash files, not .bash files from _inc"
            has_issues=true
        fi
        
        # CRITICAL: Check _inc files are only sourced, never executed
        if grep -E "(bash|sh|^!bash|^!sh).*/_inc/" "$file"; then
            error "$file: NEVER execute _inc files! They must only be sourced"
            has_issues=true
        fi
        
        # CRITICAL: Check _common files are only executed, never sourced
        if grep -E "^\s*(source|\.).*/_common/" "$file"; then
            error "$file: NEVER source _common files! They must only be executed with bash"
            has_issues=true
        fi
        
    done < <(find scripts -name "*.bash" -type f | grep -v "/_inc/")
    
    if [ "$has_issues" = false ]; then
        success "Script conventions are followed"
    fi
    
    return 0
}

# Check 6: Verify command files follow execution patterns
check_command_execution_patterns() {
    local has_issues=false
    
    info "Checking command execution patterns..."
    
    # Check all command files
    while IFS= read -r file; do
        local filename=$(basename "$file")
        
        # Check that _inc files are never executed in commands
        if grep -E "^!.*bash.*/_inc/" "$file"; then
            error "$file: Commands must NEVER execute _inc files! Use 'source' in scripts instead"
            has_issues=true
        fi
        
        # Check that _common files are never sourced in commands
        # This shouldn't happen in command files, but let's check anyway
        if grep -E "^!.*source.*/_common/" "$file"; then
            error "$file: Commands must NEVER source _common files! Use 'bash' to execute"
            has_issues=true
        fi
        
    done < <(find export/commands -name "*.md" -type f 2>/dev/null)
    
    if [ "$has_issues" = false ]; then
        success "Command execution patterns are correct"
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
    
    # Run script convention checks
    echo ""
    check_include_files
    check_script_conventions
    check_command_execution_patterns
    echo ""
    
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