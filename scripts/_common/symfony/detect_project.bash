#!/usr/bin/env bash
# Script: detect_project.bash
# Purpose: Detect Symfony project and version information
# Usage: detect_project.bash
# Output: SYMFONY_DETECTED=true/false, SYMFONY_VERSION=x.x, SYMFONY_MAJOR=x, SYMFONY_MINOR=x, SYMFONY_COMPONENTS=list

set -euo pipefail
IFS=$'\n\t'

# Get script directory and common path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common error handling
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

# Function to detect Symfony from composer.json
detect_symfony_composer() {
    local composer_file="composer.json"
    local symfony_version=""
    local symfony_components=()
    
    if [[ -f "$composer_file" ]]; then
        if command -v jq >/dev/null 2>&1; then
            # Use jq to detect Symfony framework or components
            
            # Check for symfony/framework-bundle (full framework)
            symfony_version=$(jq -r '.require["symfony/framework-bundle"] // .require["symfony/symfony"] // empty' "$composer_file" 2>/dev/null || echo "")
            
            # If no framework bundle, check for console component specifically
            if [[ -z "$symfony_version" ]]; then
                symfony_version=$(jq -r '.require["symfony/console"] // empty' "$composer_file" 2>/dev/null || echo "")
            fi
            
            # Get all Symfony components
            mapfile -t symfony_components < <(jq -r '.require | keys[] | select(startswith("symfony/"))' "$composer_file" 2>/dev/null || true)
        else
            # Fallback to grep/sed
            symfony_version=$(grep -o '"symfony/\(framework-bundle\|symfony\|console\)"[[:space:]]*:[[:space:]]*"[^"]*"' "$composer_file" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)".*/\1/' || echo "")
            
            # Get components with grep
            mapfile -t symfony_components < <(grep -o '"symfony/[^"]*"' "$composer_file" 2>/dev/null | sed 's/"//g' || true)
        fi
        
        # Clean up version string
        symfony_version=$(echo "$symfony_version" | sed 's/[\^~>=<]//g' | sed 's/\*//g' | sed 's/|.*//g' | awk '{print $1}')
    fi
    
    echo "$symfony_version"
    printf '%s\n' "${symfony_components[@]}"
}

# Function to detect Symfony from symfony.lock
detect_symfony_lock() {
    local lock_file="symfony.lock"
    local version=""
    
    if [[ -f "$lock_file" ]] && command -v jq >/dev/null 2>&1; then
        # Try to get Symfony version from lock file
        version=$(jq -r '.["symfony/framework-bundle"].version // .["symfony/console"].version // empty' "$lock_file" 2>/dev/null || echo "")
        
        # Clean up version
        version=$(echo "$version" | sed 's/^v//' | sed 's/\.[0-9]*$//')
    fi
    
    echo "$version"
}

# Function to detect Symfony from bin/console
detect_symfony_console() {
    local console_file="bin/console"
    local version=""
    
    if [[ -f "$console_file" && -x "$console_file" ]]; then
        # Try to get version from console command
        version=$(php "$console_file" --version 2>/dev/null | grep -o 'Symfony [0-9]\+\.[0-9]\+' | sed 's/Symfony //' || echo "")
    fi
    
    echo "$version"
}

# Function to extract major.minor from version string
extract_version_parts() {
    local version="$1"
    local major minor
    
    if [[ "$version" =~ ^([0-9]+)\.([0-9]+) ]]; then
        major="${BASH_REMATCH[1]}"
        minor="${BASH_REMATCH[2]}"
        
        echo "$major" "$minor"
    else
        echo "0" "0"
    fi
}

# Function to check if project structure looks like Symfony
check_symfony_structure() {
    local indicators=0
    
    # Check for common Symfony directories and files
    [[ -d "src" ]] && ((indicators++))
    [[ -d "config" ]] && ((indicators++))
    [[ -f "bin/console" ]] && ((indicators++))
    [[ -f "public/index.php" ]] && ((indicators++))
    [[ -d "var" ]] && ((indicators++))
    
    # Check for Symfony-specific files
    [[ -f "symfony.lock" ]] && ((indicators++))
    [[ -f "config/services.yaml" ]] && ((indicators++))
    [[ -f "config/routes.yaml" ]] && ((indicators++))
    
    # Return true if we have at least 3 indicators
    [[ $indicators -ge 3 ]]
}

# Main function
main() {
    echo "# Detecting Symfony project..."
    
    local symfony_version=""
    local symfony_components=()
    local is_symfony=false
    local major minor
    
    # Try different detection methods
    
    # Method 1: composer.json
    echo "# Checking composer.json..."
    {
        read -r composer_version
        while IFS= read -r component; do
            [[ -n "$component" ]] && symfony_components+=("$component")
        done
    } < <(detect_symfony_composer)
    
    # Method 2: symfony.lock
    echo "# Checking symfony.lock..."
    local lock_version
    lock_version=$(detect_symfony_lock)
    
    # Method 3: bin/console
    echo "# Checking bin/console..."
    local console_version
    console_version=$(detect_symfony_console)
    
    # Method 4: Structure check
    echo "# Checking project structure..."
    if check_symfony_structure; then
        echo "# Project structure matches Symfony patterns"
    else
        echo "# Project structure doesn't match Symfony patterns"
    fi
    
    # Determine final version
    if [[ -n "$composer_version" ]]; then
        symfony_version="$composer_version"
        is_symfony=true
        echo "# Using composer.json Symfony version: $symfony_version"
    elif [[ -n "$lock_version" ]]; then
        symfony_version="$lock_version"
        is_symfony=true
        echo "# Using symfony.lock version: $symfony_version"
    elif [[ -n "$console_version" ]]; then
        symfony_version="$console_version"
        is_symfony=true
        echo "# Using bin/console version: $symfony_version"
    elif [[ ${#symfony_components[@]} -gt 0 ]]; then
        symfony_version="6.4"  # Default for component-only projects
        is_symfony=true
        echo "# Symfony components detected, assuming version: $symfony_version"
    else
        echo "# No Symfony installation detected"
    fi
    
    # Extract version parts
    read -r major minor <<< "$(extract_version_parts "$symfony_version")"
    
    # Output structured data
    echo "SYMFONY_DETECTED=$is_symfony"
    echo "SYMFONY_VERSION=${symfony_version:-"not-detected"}"
    echo "SYMFONY_MAJOR=${major:-"0"}"
    echo "SYMFONY_MINOR=${minor:-"0"}"
    
    # Output components
    if [[ ${#symfony_components[@]} -gt 0 ]]; then
        echo "SYMFONY_COMPONENTS_COUNT=${#symfony_components[@]}"
        for i in "${!symfony_components[@]}"; do
            echo "SYMFONY_COMPONENT_$i=${symfony_components[$i]}"
        done
        
        # Join components with commas
        IFS=','
        echo "SYMFONY_COMPONENTS=${symfony_components[*]}"
        IFS=$'\n\t'
        
        # Check for specific important components
        for component in "${symfony_components[@]}"; do
            case "$component" in
                "symfony/console")
                    echo "SYMFONY_HAS_CONSOLE=true"
                    ;;
                "symfony/framework-bundle")
                    echo "SYMFONY_HAS_FRAMEWORK=true"
                    ;;
                "symfony/doctrine-bundle")
                    echo "SYMFONY_HAS_DOCTRINE=true"
                    ;;
                "symfony/twig-bundle")
                    echo "SYMFONY_HAS_TWIG=true"
                    ;;
                "symfony/security-bundle")
                    echo "SYMFONY_HAS_SECURITY=true"
                    ;;
            esac
        done
    else
        echo "SYMFONY_COMPONENTS_COUNT=0"
        echo "SYMFONY_COMPONENTS="
    fi
    
    # Check structure indicators
    echo "SYMFONY_HAS_STRUCTURE=$(check_symfony_structure && echo "true" || echo "false")"
    
    # Project type assessment
    if [[ "$is_symfony" == "true" ]]; then
        if [[ ${#symfony_components[@]} -eq 1 ]] && [[ "${symfony_components[0]}" == "symfony/console" ]]; then
            echo "SYMFONY_PROJECT_TYPE=console-only"
        elif [[ " ${symfony_components[*]} " =~ " symfony/framework-bundle " ]]; then
            echo "SYMFONY_PROJECT_TYPE=full-framework"
        else
            echo "SYMFONY_PROJECT_TYPE=components"
        fi
    else
        echo "SYMFONY_PROJECT_TYPE=none"
    fi
}

# Execute main function
main

echo "# Symfony project detection completed"
echo "Script success: ${0##*/}"
exit 0