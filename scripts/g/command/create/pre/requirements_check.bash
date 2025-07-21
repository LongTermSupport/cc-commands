#!/usr/bin/env bash
# Script: create.sh
# Purpose: Create new Claude Code commands with best practices
# Usage: create.sh [command-name] [requirements]
# Output: Command creation workflow with structured data

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source error handler include
source "$COMMON_DIR/_inc/error_handler.inc.bash"

# Common scripts directory
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Check for help
if [ "$HELP_REQUESTED" = "true" ]; then
    echo "HELP_REQUESTED=true"
    exit 0
fi

# Main execution
main() {
    info "Command Creation Wizard - System Check"
    
    # Step 1: Check system requirements
    debug "Checking system requirements..."
    
    # Check commands directory
    if [ -d ".claude/commands" ]; then
        echo "COMMANDS_DIR=exists"
    else
        echo "COMMANDS_DIR=missing"
        info "Commands directory will be created"
    fi
    
    # Check for optional tools
    check_tools
    
    # Step 2: Parse arguments
    parse_arguments
    
    # Step 3: Validate command path
    validate_command_path
    
    # Step 4: Scan project documentation
    scan_project_docs
    
    success "Initial validation complete"
}

# Check for optional tools
check_tools() {
    # Check jq
    if command -v jq >/dev/null 2>&1; then
        echo "JQ_AVAILABLE=true"
    else
        echo "JQ_AVAILABLE=false"
        debug "jq not available - some features may be limited"
    fi
    
    # Check gh
    if command -v gh >/dev/null 2>&1; then
        echo "GH_AVAILABLE=true"
        
        # Check gh auth
        if gh auth status >/dev/null 2>&1; then
            echo "GH_AUTHENTICATED=true"
        else
            echo "GH_AUTHENTICATED=false"
            debug "GitHub CLI not authenticated"
        fi
    else
        echo "GH_AVAILABLE=false"
        echo "GH_AUTHENTICATED=false"
        debug "GitHub CLI not available"
    fi
}

# Parse command arguments
parse_arguments() {
    info "Parsing command arguments..."
    
    # Get first argument as command name
    local command_name=""
    local requirements=""
    
    if [ ${#ARGS[@]} -gt 0 ]; then
        command_name="${ARGS[0]}"
        
        # Get remaining args as requirements
        if [ ${#ARGS[@]} -gt 1 ]; then
            requirements="${ARGS[@]:1}"
        fi
    fi
    
    # Determine mode
    if [ -n "$command_name" ]; then
        if [ -n "$requirements" ]; then
            echo "MODE=FULL"
        else
            echo "MODE=PARTIAL"
        fi
    else
        echo "MODE=INTERACTIVE"
    fi
    
    echo "COMMAND_NAME=$command_name"
    echo "REQUIREMENTS=$requirements"
}

# Validate command path
validate_command_path() {
    local command_name="${ARGS[0]:-}"
    
    if [ -z "$command_name" ]; then
        echo "COMMAND_PATH="
        echo "PATH_STATUS=pending"
        return 0
    fi
    
    info "Validating command path for: $command_name"
    
    # Determine path based on namespace
    local command_path
    if [[ "$command_name" == *:* ]]; then
        # Namespaced command - replace : with /
        local folder_path="${command_name//:://}.md"
        command_path=".claude/commands/${folder_path}"
    else
        # Simple command
        command_path=".claude/commands/${command_name}.md"
    fi
    
    echo "COMMAND_PATH=$command_path"
    
    # Check if already exists
    if [ -f "$command_path" ]; then
        echo "PATH_STATUS=exists"
        warn "Command already exists at: $command_path"
        error_exit "Cannot overwrite existing command: $command_name"
    else
        echo "PATH_STATUS=available"
        debug "Command path available: $command_path"
    fi
}

# Scan project documentation
scan_project_docs() {
    info "Scanning project documentation structure..."
    
    # Check for key documentation
    if [ -d "CLAUDE" ]; then
        echo "CLAUDE_DIR=true"
        
        # Check for specific docs
        [ -f "CLAUDE/PlanWorkflow.md" ] && echo "WORKFLOW_DOC=true" || echo "WORKFLOW_DOC=false"
        [ -f "CLAUDE/Core/CodeStandards.md" ] && echo "CODE_STANDARDS=true" || echo "CODE_STANDARDS=false"
        [ -f "CLAUDE/Tools/Commands.md" ] && echo "COMMANDS_DOC=true" || echo "COMMANDS_DOC=false"
    else
        echo "CLAUDE_DIR=false"
        echo "WORKFLOW_DOC=false"
        echo "CODE_STANDARDS=false"
        echo "COMMANDS_DOC=false"
    fi
    
    # Check for other project indicators
    [ -f "README.md" ] && echo "README=true" || echo "README=false"
    [ -d "docs" ] && echo "DOCS_DIR=true" || echo "DOCS_DIR=false"
    [ -f ".env.example" ] && echo "ENV_EXAMPLE=true" || echo "ENV_EXAMPLE=false"
    [ -f "package.json" ] && echo "PACKAGE_JSON=true" || echo "PACKAGE_JSON=false"
    [ -f "composer.json" ] && echo "COMPOSER_JSON=true" || echo "COMPOSER_JSON=false"
    
    debug "Documentation scan complete"
}

# Run main function
main

