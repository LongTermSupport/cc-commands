#!/usr/bin/env bash
# Script: ci.bash
# Purpose: CI checks for Claude Code commands
# Usage: ci.bash [-v|--verbose]
# Output: CI validation results and errors

set -euo pipefail
IFS=$'\n\t'

# Enable debug backtrace on error
set -E
trap 'debug_backtrace' ERR

# Parse command line arguments
VERBOSE=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-v|--verbose]"
            exit 1
            ;;
    esac
done

# Debug backtrace function
debug_backtrace() {
    local error_code=$?
    echo "================== DEBUG BACKTRACE ==================" >&2
    echo "Error occurred with exit code: $error_code" >&2
    echo "Call stack:" >&2
    local frame=0
    while caller $frame; do
        frame=$((frame + 1))
    done | while read line func file; do
        echo "  at $func ($file:$line)" >&2
    done
    echo "====================================================" >&2
    exit $error_code
}

# Debug output function
debug() {
    if [ "$VERBOSE" = true ]; then
        echo "DEBUG: $*" >&2
    fi
}

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
    ERRORS=$((ERRORS + 1))
}

warning() {
    echo "WARNING: $1" >&2
    WARNING_MESSAGES+=("$1")
    WARNINGS=$((WARNINGS + 1))
}

success() {
    echo "✓ $1"
}

info() {
    echo "$1"
}

# Normalize paths that start with .claude/cc-commands/ to be relative to CI root
normalize_path() {
    local path="$1"
    # If path starts with .claude/cc-commands/, remove that prefix
    if [[ "$path" =~ ^\.claude/cc-commands/ ]]; then
        echo "${path#.claude/cc-commands/}"
    else
        echo "$path"
    fi
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
    
    # Debug: Show file size
    local file_lines=$(wc -l < "$file")
    debug "check_adhoc_bash processing $filename with $file_lines lines"
    
    while IFS= read -r line; do
        line_num=$((line_num + 1))
        
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
    local in_template=false
    local line_num=0
    
    # Process file line by line to skip template sections
    while IFS= read -r line; do
        line_num=$((line_num + 1))
        
        # Check for template tags
        if [[ "$line" == "<template>"* ]]; then
            in_template=true
            continue
        elif [[ "$line" == "</template>"* ]]; then
            in_template=false
            continue
        fi
        
        # Skip lines inside template blocks
        if [ "$in_template" = true ]; then
            continue
        fi
        
        # Check for bash script references
        if [[ "$line" =~ ^!.*bash.*\.claude/cc-commands/scripts/ ]]; then
            local script_path=$(echo "$line" | grep -o '\.claude/cc-commands/scripts/[^[:space:]"]*\.bash' || true)
            
            if [ -n "$script_path" ]; then
                # Normalize the path to be relative to cc-commands root
                local relative_path=$(normalize_path "$script_path")
                
                # Check if file exists relative to current directory
                if [ ! -f "$relative_path" ]; then
                    error "$filename:$line_num: Referenced script does not exist: $script_path"
                    has_issues=true
                else
                    debug "Script exists: $relative_path"
                fi
            fi
        fi
    done < "$file"
    
    if [ "$has_issues" = false ]; then
        success "$filename: All referenced scripts exist"
    fi
    
    return 0
}

# Check 4: Verify include file conventions
check_include_files() {
    local has_issues=false
    
    info "Checking include file conventions..."
    
    # Check _inc directory (now inside _common)
    if [ -d "scripts/_common/_inc" ]; then
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
            
        done < <(find scripts/_common/_inc -name "*.bash" -type f 2>/dev/null)
    fi
    
    # Check for .bash files in _inc that don't have .inc.bash suffix
    if [ -d "scripts/_inc" ]; then
        while IFS= read -r file; do
            if [[ ! "$file" =~ \.inc\.bash$ ]]; then
                error "$file: All files in _inc/ must use .inc.bash suffix"
                has_issues=true
            fi
        done < <(find scripts/_common/_inc -name "*.bash" -type f 2>/dev/null)
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

# Check 7: Find orphaned scripts
check_orphaned_scripts() {
    local has_issues=false
    
    info "Checking for orphaned scripts..."
    
    # Build list of all bash scripts referenced in commands
    local referenced_scripts=()
    while IFS= read -r file; do
        # Extract all script paths from command files
        while IFS= read -r script_path; do
            # Remove .claude/cc-commands/ prefix to get relative path
            local relative_path="${script_path#.claude/cc-commands/}"
            referenced_scripts+=("$relative_path")
            debug "Found reference to script: $relative_path"
        done < <(grep -o '\.claude/cc-commands/scripts/[^[:space:]"]*\.bash' "$file" 2>/dev/null || true)
    done < <(find export/commands -name "*.md" -type f 2>/dev/null)
    
    # Build list of all scripts called by other scripts
    while IFS= read -r script; do
        # Look for bash calls to other scripts
        while IFS= read -r called_script; do
            # Handle both absolute and relative paths
            if [[ "$called_script" =~ ^\$.*/(scripts/.*)$ ]]; then
                referenced_scripts+=("${BASH_REMATCH[1]}")
                debug "Script $script calls: ${BASH_REMATCH[1]}"
            elif [[ "$called_script" =~ (scripts/[^[:space:]\"]+\.bash) ]]; then
                referenced_scripts+=("${BASH_REMATCH[1]}")
                debug "Script $script calls: ${BASH_REMATCH[1]}"
            fi
        done < <(grep -E 'bash\s+[^|]+\.bash' "$script" 2>/dev/null | grep -o '[^[:space:]]*\.bash' || true)
    done < <(find scripts -name "*.bash" -type f 2>/dev/null | grep -v "/_inc/")
    
    # Special handling for orchestrator subdirectory scripts
    # These are called by orchestrators using capture_script_output
    while IFS= read -r orchestrator; do
        local orch_dir=$(dirname "$orchestrator")
        # Look for capture_script_output calls
        while IFS= read -r line; do
            if [[ "$line" =~ capture_script_output[[:space:]]+\"?\$[^/]+/([^\"[:space:]]+)\"? ]]; then
                local sub_path="${BASH_REMATCH[1]}"
                # Check if it's a COMMON_DIR reference
                if [[ "$line" =~ \$COMMON_DIR ]]; then
                    # For COMMON_DIR, the path is relative to scripts/_common/
                    local full_path="scripts/_common/${sub_path}"
                else
                    # For COMMAND_DIR, construct full path relative to orchestrator
                    local full_path="${orch_dir#./}/${sub_path}"
                fi
                referenced_scripts+=("$full_path")
                debug "Orchestrator $orchestrator calls: $full_path"
            fi
        done < <(grep "capture_script_output" "$orchestrator" 2>/dev/null || true)
    done < <(find scripts -name "*_orchestrate.bash" -type f 2>/dev/null)
    
    # Convert to unique set
    local unique_refs=()
    if [ ${#referenced_scripts[@]} -gt 0 ]; then
        while IFS= read -r ref; do
            unique_refs+=("$ref")
        done < <(printf '%s\n' "${referenced_scripts[@]}" | sort -u)
    fi
    
    debug "Total unique script references: ${#unique_refs[@]}"
    
    # Check each script to see if it's referenced
    while IFS= read -r script; do
        local is_referenced=false
        local script_name=$(basename "$script")
        
        # Skip include files
        if [[ "$script" =~ /_inc/ ]]; then
            continue
        fi
        
        # Check if this script is in our referenced list
        for ref in "${unique_refs[@]}"; do
            if [[ "$script" == "$ref" ]] || [[ "$script" == *"/$ref" ]]; then
                is_referenced=true
                break
            fi
        done
        
        if [ "$is_referenced" = false ]; then
            warning "$script: Orphaned script - not referenced by any command or other script"
            has_issues=true
        fi
    done < <(find scripts -name "*.bash" -type f 2>/dev/null | grep -v "/_inc/")
    
    if [ "$has_issues" = false ]; then
        success "No orphaned scripts found"
    fi
    
    return 0
}

# Check 8: Find orphaned includes
check_orphaned_includes() {
    local has_issues=false
    
    info "Checking for orphaned include files..."
    
    # Build list of all sourced includes
    local sourced_includes=()
    while IFS= read -r script; do
        # Look for source statements
        while IFS= read -r line; do
            # Extract the include file path from the line
            local inc_file=""
            if [[ "$line" =~ \.inc\.bash ]]; then
                # Extract filename after last /
                inc_file=$(echo "$line" | grep -o '[^/]*\.inc\.bash' | head -1)
                if [ -n "$inc_file" ]; then
                    sourced_includes+=("$inc_file")
                    debug "Found source of include: $inc_file"
                fi
            fi
        done < <(grep -E '(source|\.).*\.inc\.bash' "$script" 2>/dev/null || true)
    done < <(find scripts -name "*.bash" -type f 2>/dev/null)
    
    # Convert to unique set
    local unique_sources=()
    if [ ${#sourced_includes[@]} -gt 0 ]; then
        while IFS= read -r src; do
            unique_sources+=("$src")
        done < <(printf '%s\n' "${sourced_includes[@]}" | sort -u)
    fi
    
    debug "Total unique include sources: ${#unique_sources[@]}"
    
    # Check each include file to see if it's sourced
    if [ -d "scripts/_inc" ]; then
        while IFS= read -r include; do
            local is_sourced=false
            local include_name=$(basename "$include")
            
            # Check if this include is in our sourced list
            for src in "${unique_sources[@]}"; do
                if [[ "$include_name" == "$src" ]]; then
                    is_sourced=true
                    break
                fi
            done
            
            if [ "$is_sourced" = false ]; then
                warning "$include: Orphaned include - not sourced by any script"
                has_issues=true
            fi
        done < <(find scripts/_inc -name "*.inc.bash" -type f 2>/dev/null)
    fi
    
    if [ "$has_issues" = false ]; then
        success "No orphaned includes found"
    fi
    
    return 0
}

# Check 9: Enforce orchestrator pattern
check_orchestrator_pattern() {
    local has_issues=false
    
    info "Checking for orchestrator pattern compliance..."
    
    # Check each command file
    while IFS= read -r file; do
        local filename=$(basename "$file")
        local command_name="${filename%.md}"
        
        # Skip commands that are known to be simple (no orchestration needed)
        if [[ "$command_name" =~ ^(help|version|status)$ ]]; then
            debug "Skipping simple command: $command_name"
            continue
        fi
        
        # Count bash calls in the command
        local bash_calls=$(grep -c "^!bash" "$file" || true)
        debug "Command $command_name has $bash_calls bash calls"
        
        # If more than 3 bash calls, check for orchestrator pattern
        if [ "$bash_calls" -gt 3 ]; then
            # Look for orchestrator script reference
            if ! grep -q "_orchestrate\.bash" "$file"; then
                warning "$filename: Command has $bash_calls bash calls but no orchestrator pattern. Consider refactoring to reduce calls."
                has_issues=true
                
                # Check if it's calling multiple scripts that could be orchestrated
                local script_calls=$(grep "^!bash.*\.bash" "$file" | grep -v "_orchestrate\.bash" | wc -l)
                if [ "$script_calls" -gt 2 ]; then
                    warning "$filename: Multiple script calls ($script_calls) detected. Strong candidate for orchestrator pattern."
                fi
            fi
        fi
        
        # Check for sequential related operations that should be orchestrated
        if grep -A5 "^!bash.*git.*\.bash" "$file" | grep -q "^!bash.*git.*\.bash"; then
            warning "$filename: Multiple sequential git operations detected. Consider using orchestrator pattern."
            has_issues=true
        fi
        
        # Check for analysis followed by execution pattern
        if grep -A10 "analysis.*\.bash" "$file" | grep -q "execute.*\.bash"; then
            if ! grep -q "_orchestrate\.bash" "$file"; then
                warning "$filename: Analysis->Execute pattern detected without orchestrator. Consider refactoring."
                has_issues=true
            fi
        fi
    done < <(find export/commands -name "*.md" -type f 2>/dev/null)
    
    if [ "$has_issues" = false ]; then
        success "All commands follow orchestrator pattern appropriately"
    fi
    
    return 0
}

# Check 10: Enforce orchestrator directory structure
check_orchestrator_structure() {
    local has_issues=false
    
    info "Checking orchestrator directory structure..."
    
    # Find all orchestrator scripts
    while IFS= read -r orchestrator; do
        local orch_dir=$(dirname "$orchestrator")
        local orch_name=$(basename "$orchestrator")
        local command_name="${orch_name%_orchestrate.bash}"
        local parent_dir=$(basename "$(dirname "$orch_dir")")
        
        debug "Checking orchestrator: $orchestrator"
        debug "Directory: $orch_dir"
        debug "Command name: $command_name"
        debug "Parent dir: $parent_dir"
        
        # Extract the expected command directory name
        local expected_dir=$(basename "$orch_dir")
        
        # Check if directory name matches command name
        if [[ "$expected_dir" != "$command_name" ]]; then
            error "$orchestrator: Directory name '$expected_dir' must match command name '$command_name'"
            has_issues=true
        fi
        
        # Check that orchestrator is in a subdirectory (not at command level)
        # It should be like scripts/g/command/sync/sync_orchestrate.bash
        # Not scripts/g/command/sync_orchestrate.bash
        if [[ ! "$orch_dir" =~ /${command_name}$ ]]; then
            error "$orchestrator: Orchestrator must be in subdirectory matching command name"
            has_issues=true
        fi
        
        # Check for required subdirectories
        local required_dirs=("pre" "analysis" "execute" "post")
        for subdir in "${required_dirs[@]}"; do
            if [ ! -d "$orch_dir/$subdir" ]; then
                warning "$orchestrator: Missing recommended subdirectory: $subdir/"
            fi
        done
        
        # Check that scripts in subdirectories follow naming convention
        for subdir in "${required_dirs[@]}"; do
            if [ -d "$orch_dir/$subdir" ]; then
                while IFS= read -r script; do
                    local script_name=$(basename "$script")
                    # Scripts in subdirectories should not have command prefix
                    if [[ "$script_name" =~ ^${command_name}_ ]]; then
                        warning "$script: Scripts in subdirectories should not have command prefix. Use descriptive names like 'env_validate.bash' instead of '${command_name}_env_validate.bash'"
                    fi
                done < <(find "$orch_dir/$subdir" -name "*.bash" -type f 2>/dev/null)
            fi
        done
        
    done < <(find scripts -name "*_orchestrate.bash" -type f 2>/dev/null)
    
    if [ "$has_issues" = false ]; then
        success "All orchestrators follow correct directory structure"
    fi
    
    return 0
}

# Check 11: Run ShellCheck on all scripts
check_shellcheck() {
    local has_issues=false
    
    info "Running ShellCheck on all scripts..."
    
    # Check if shellcheck is available
    if ! command -v shellcheck &> /dev/null; then
        info "ShellCheck not found. Attempting to download..."
        
        # Try to download shellcheck binary
        local shellcheck_version="v0.9.0"
        local shellcheck_dir="/tmp/shellcheck-$$"
        local shellcheck_binary="$shellcheck_dir/shellcheck"
        
        mkdir -p "$shellcheck_dir"
        
        # Detect architecture
        local arch=$(uname -m)
        local os=$(uname -s | tr '[:upper:]' '[:lower:]')
        local platform=""
        
        case "$os" in
            linux)
                case "$arch" in
                    x86_64) platform="linux.x86_64" ;;
                    aarch64) platform="linux.aarch64" ;;
                    *) 
                        warning "Unsupported architecture: $arch. Skipping shellcheck."
                        return 0
                        ;;
                esac
                ;;
            darwin)
                platform="darwin.x86_64"
                ;;
            *)
                warning "Unsupported OS: $os. Skipping shellcheck."
                return 0
                ;;
        esac
        
        local download_url="https://github.com/koalaman/shellcheck/releases/download/${shellcheck_version}/shellcheck-${shellcheck_version}.${platform}.tar.xz"
        
        info "Downloading ShellCheck from: $download_url"
        if wget -q -O "$shellcheck_dir/shellcheck.tar.xz" "$download_url" 2>/dev/null || \
           curl -sL -o "$shellcheck_dir/shellcheck.tar.xz" "$download_url" 2>/dev/null; then
            
            tar -xf "$shellcheck_dir/shellcheck.tar.xz" -C "$shellcheck_dir" --strip-components=1
            if [ -x "$shellcheck_dir/shellcheck" ]; then
                info "ShellCheck downloaded successfully"
                # Use the downloaded binary
                alias shellcheck="$shellcheck_dir/shellcheck"
                # For subshells
                export SHELLCHECK_BIN="$shellcheck_dir/shellcheck"
            else
                warning "Failed to extract ShellCheck. Skipping validation."
                rm -rf "$shellcheck_dir"
                return 0
            fi
        else
            warning "Failed to download ShellCheck. Skipping validation."
            rm -rf "$shellcheck_dir"
            return 0
        fi
        
        # Clean up on exit
        trap "rm -rf $shellcheck_dir" EXIT
    fi
    
    local failed=0
    local total=0
    
    # Run shellcheck on all bash scripts
    while IFS= read -r script; do
        total=$((total + 1))
        debug "ShellCheck: $script"
        
        # Run shellcheck with appropriate options
        local shellcheck_cmd="shellcheck"
        if [ -n "${SHELLCHECK_BIN:-}" ]; then
            shellcheck_cmd="$SHELLCHECK_BIN"
        fi
        
        # Run shellcheck and capture output
        local shellcheck_output
        shellcheck_output=$($shellcheck_cmd -x "$script" 2>&1 || true)
        
        # Filter out SC1091 (not following non-constant source)
        local filtered_output
        filtered_output=$(echo "$shellcheck_output" | grep -v "SC1091" | grep -v "^In.*line.*:$" | grep -v "^source.*$" | grep -v "^For more information:$" | grep -v "^$" || true)
        
        # Check if there are any remaining issues
        if [ -n "$filtered_output" ]; then
            error "$script: ShellCheck found issues"
            echo "$filtered_output" >&2
            failed=$((failed + 1))
            has_issues=true
        fi
    done < <(find scripts -name "*.bash" -type f 2>/dev/null | sort)
    
    if [ "$has_issues" = false ]; then
        success "ShellCheck passed for all $total scripts"
    else
        error "ShellCheck failed for $failed out of $total scripts"
    fi
    
    return 0
}

# Check 12: Extended script standards
check_script_standards_extended() {
    local has_issues=false
    
    info "Checking extended script standards..."
    
    # Check all bash scripts
    while IFS= read -r script; do
        local filename=$(basename "$script")
        
        # Skip shebang check for include files
        if [[ ! "$filename" =~ \.inc\.bash$ ]]; then
            # Check shebang is exactly #!/usr/bin/env bash
            local first_line=$(head -n1 "$script")
            if [[ "$first_line" != "#!/usr/bin/env bash" ]]; then
                error "$script: Incorrect shebang: '$first_line' (must be exactly '#!/usr/bin/env bash')"
                has_issues=true
            fi
        fi
        
        # Check file naming convention (lowercase with underscores)
        if ! [[ "$filename" =~ ^[a-z]+(_[a-z]+)*\.(bash|inc\.bash)$ ]]; then
            error "$script: Incorrect naming convention: $filename (use lowercase_with_underscores.bash)"
            has_issues=true
        fi
        
        # Check for success message at end (except for includes)
        if [[ ! "$script" =~ /_inc/ ]]; then
            if ! grep -q 'echo "Script success: ${0##\*/}"' "$script"; then
                warning "$script: Missing success message at end of script"
            fi
        fi
        
    done < <(find scripts -name "*.bash" -type f 2>/dev/null)
    
    if [ "$has_issues" = false ]; then
        success "All scripts follow extended standards"
    fi
    
    return 0
}

# Check 13: Required documentation
check_required_documentation() {
    local has_issues=false
    
    info "Checking required documentation..."
    
    # List of required documentation files
    local required_docs=(
        "scripts/CLAUDE.md"
        "scripts/_common/CLAUDE.md"
        "scripts/_common/_inc/CLAUDE.md"
        "CLAUDE.md"
        "CLAUDE/CommandStructure.md"
        "README.md"
    )
    
    for doc in "${required_docs[@]}"; do
        if [ ! -f "$doc" ]; then
            error "Missing required documentation: $doc"
            has_issues=true
        else
            success "Found required documentation: $doc"
        fi
    done
    
    # Check that CLAUDE docs are not empty
    for doc in "${required_docs[@]}"; do
        if [ -f "$doc" ] && [ ! -s "$doc" ]; then
            error "$doc exists but is empty"
            has_issues=true
        fi
    done
    
    if [ "$has_issues" = false ]; then
        success "All required documentation is present"
    fi
    
    return 0
}

# Check 14: Command file structure validation
check_command_structure_extended() {
    local has_issues=false
    
    info "Checking extended command structure..."
    
    # Check all command files
    while IFS= read -r file; do
        local filename=$(basename "$file")
        
        # Check for YAML frontmatter
        if ! head -n1 "$file" | grep -q "^---$"; then
            warning "$filename: Missing YAML frontmatter"
        fi
        
        # Check for .sh references (should be .bash)
        if grep -q "!bash.*\.sh" "$file"; then
            error "$filename: References .sh files instead of .bash"
            has_issues=true
        fi
        
        # Check for proper script path references
        if grep -q "!bash [^.]" "$file" | grep -v "!bash \." | grep -v "!bash echo"; then
            warning "$filename: Bash commands should reference script files with proper paths"
        fi
        
    done < <(find export/commands -name "*.md" -type f 2>/dev/null)
    
    if [ "$has_issues" = false ]; then
        success "All commands follow extended structure requirements"
    fi
    
    return 0
}

# Main CI check
main() {
    info "=== Claude Code Commands CI Check ==="
    info ""
    
    # Run tests first
    info "Running test suite..."
    if [ -f "tests/run.bash" ]; then
        if bash tests/run.bash; then
            success "All tests passed"
        else
            error "Test suite failed"
            exit 1
        fi
        echo ""
    else
        info "No test suite found - skipping tests"
    fi
    
    # Find all command files
    local commands_dir="export/commands"
    if [ ! -d "$commands_dir" ]; then
        error "Commands directory not found: $commands_dir"
        exit 1
    fi
    
    # Debug: Show number of command files found
    local num_files=$(find "$commands_dir" -name "*.md" -type f | wc -l)
    debug "Found $num_files command files to check"
    
    # Process each command file
    while IFS= read -r file; do
        TOTAL_COMMANDS=$((TOTAL_COMMANDS + 1))
        echo "Checking: $file"
        
        # Debug: Show which check we're running
        debug "Running check_help_documentation..."
        check_help_documentation "$file"
        
        debug "Running check_adhoc_bash..."
        check_adhoc_bash "$file"  
        
        debug "Running check_script_references..."
        check_script_references "$file"
        
        echo ""
    done < <(find "$commands_dir" -name "*.md" -type f | sort)
    
    # Run script convention checks
    echo ""
    check_include_files
    check_script_conventions
    check_command_execution_patterns
    check_orchestrator_pattern
    check_orchestrator_structure
    check_orphaned_scripts
    check_orphaned_includes
    echo ""
    
    # Run additional comprehensive checks
    check_shellcheck
    check_script_standards_extended
    check_required_documentation
    check_command_structure_extended
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
        if [ ${#ERROR_MESSAGES[@]} -gt 0 ]; then
            printf '%s\n' "${ERROR_MESSAGES[@]}"
        fi
        
        # LLM instructions for fixing errors
        info ""
        info "=== INSTRUCTIONS FOR FIXING ERRORS ==="
        info "1. For 'Referenced script does not exist' errors:"
        info "   - Check if the path starts with .claude/cc-commands/ (remove this prefix)"
        info "   - Verify the script actually exists in the scripts/ directory"
        info "   - If it's a template placeholder (contains [namespace]), it should be inside <template> tags"
        info ""
        info "2. For 'Missing <help> tag' errors:"
        info "   - Add <help> and </help> tags around the help documentation"
        info "   - Ensure there's a Task block that checks for --help and outputs the help"
        info ""
        info "3. For other errors, read the specific error message and fix accordingly"
        info "=================================================================="
        
        exit 1
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        info ""
        info "Warning details:"
        if [ ${#WARNING_MESSAGES[@]} -gt 0 ]; then
            printf '%s\n' "${WARNING_MESSAGES[@]}"
        fi
        
        # LLM instructions for fixing warnings
        info ""
        info "=== INSTRUCTIONS FOR FIXING WARNINGS ==="
        info "1. For 'Orphaned script' warnings:"
        info "   - First verify the script is truly orphaned by checking:"
        info "     a) Is it called by an orchestrator using capture_script_output?"
        info "     b) Is it referenced by any command or other script?"
        info "     c) Is it a common utility that should be kept?"
        info "   - If truly orphaned, remove it with: rm <script-path>"
        info "   - If not orphaned, the CI detection may need improvement"
        info ""
        info "2. For 'Command has X bash calls but no orchestrator' warnings:"
        info "   - This command needs migration to the orchestrator pattern"
        info "   - Create an orchestrator in scripts/g/[namespace]/[command]/[command]_orchestrate.bash"
        info "   - See CommandStructure.md for the pattern"
        info ""
        info "3. For 'Scripts in subdirectories should not have command prefix' warnings:"
        info "   - Rename the script to remove the command prefix"
        info "   - E.g., 'push_execute_git.bash' → 'execute_git.bash'"
        info "   - Update the orchestrator to use the new name"
        info ""
        info "4. For 'Missing recommended subdirectory' warnings:"
        info "   - This is just a recommendation, not required"
        info "   - Create the directory if you plan to add scripts there"
        info ""
        info "5. For 'Script should set error handling options' warnings:"
        info "   - Add 'set -euo pipefail' after the shebang line"
        info "   - Unless the script sources an include file that shouldn't set options"
        info "=================================================================="
    fi
    
    success "All CI checks passed!"
    exit 0
}

# Run from the cc-commands directory
cd "$(dirname "$0")/.." || exit 1

# Execute main
main