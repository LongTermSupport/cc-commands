#!/usr/bin/env bash
# Script: detect_version.bash
# Purpose: Detect PHP version from composer.json and system, with available features
# Usage: detect_version.bash
# Output: PHP_VERSION=x.x.x, PHP_MAJOR=x, PHP_MINOR=x, PHP_FEATURES=list, PHP_SYSTEM=x.x.x

set -euo pipefail
IFS=$'\n\t'

# Get script directory and common path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/.."

# Load common error handling
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

# Function to detect PHP version from composer.json
detect_composer_php() {
    local composer_file="composer.json"
    local php_version=""
    
    if [[ -f "$composer_file" ]]; then
        # Extract PHP version requirement from composer.json
        if command -v jq >/dev/null 2>&1; then
            # Use jq if available
            php_version=$(jq -r '.require.php // .["require-dev"].php // empty' "$composer_file" 2>/dev/null || echo "")
        else
            # Fallback to grep/sed
            php_version=$(grep -o '"php"[[:space:]]*:[[:space:]]*"[^"]*"' "$composer_file" 2>/dev/null | sed 's/.*"\([^"]*\)".*/\1/' || echo "")
        fi
        
        # Clean up version string (remove constraints like ^, ~, >=)
        php_version=$(echo "$php_version" | sed 's/[\^~>=<]//g' | sed 's/\*//g' | sed 's/|.*//g' | awk '{print $1}')
    fi
    
    echo "$php_version"
}

# Function to get system PHP version
detect_system_php() {
    local system_version=""
    
    if command -v php >/dev/null 2>&1; then
        system_version=$(php -r "echo PHP_VERSION;" 2>/dev/null || echo "")
    fi
    
    echo "$system_version"
}

# Function to extract major.minor from version string
extract_version_parts() {
    local version="$1"
    local major minor patch
    
    if [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.?([0-9]+)?$ ]]; then
        major="${BASH_REMATCH[1]}"
        minor="${BASH_REMATCH[2]}"
        patch="${BASH_REMATCH[3]:-0}"
        
        echo "$major" "$minor" "$patch"
    else
        echo "0" "0" "0"
    fi
}

# Function to determine available PHP features based on version
get_php_features() {
    local version="$1"
    local features=()
    
    # Parse version
    read -r major minor patch <<< "$(extract_version_parts "$version")"
    
    # Base features (PHP 7.4+)
    if [[ $major -ge 7 ]] && [[ $minor -ge 4 ]]; then
        features+=("typed-properties" "arrow-functions" "null-coalescing-assignment")
    fi
    
    # PHP 8.0 features
    if [[ $major -ge 8 ]]; then
        features+=("union-types" "constructor-promotion" "named-arguments" "match-expression" "nullsafe-operator" "attributes")
    fi
    
    # PHP 8.1 features
    if [[ $major -ge 8 ]] && [[ $minor -ge 1 ]]; then
        features+=("enums" "readonly-properties" "intersection-types" "fibers" "never-return-type")
    fi
    
    # PHP 8.2 features
    if [[ $major -ge 8 ]] && [[ $minor -ge 2 ]]; then
        features+=("readonly-classes" "dnf-types" "constants-in-traits")
    fi
    
    # PHP 8.3 features
    if [[ $major -ge 8 ]] && [[ $minor -ge 3 ]]; then
        features+=("typed-class-constants" "override-attribute" "deep-cloning")
    fi
    
    # PHP 8.4 features (if available)
    if [[ $major -ge 8 ]] && [[ $minor -ge 4 ]]; then
        features+=("property-hooks" "asymmetric-visibility")
    fi
    
    # Join features with commas
    IFS=','
    echo "${features[*]}"
    IFS=$'\n\t'
}

# Main function
main() {
    echo "# Detecting PHP version and features..."
    
    local composer_php system_php final_version
    local major minor patch
    
    # Get versions
    composer_php=$(detect_composer_php)
    system_php=$(detect_system_php)
    
    echo "# Composer PHP requirement: ${composer_php:-"not specified"}"
    echo "# System PHP version: ${system_php:-"not available"}"
    
    # Determine which version to use
    if [[ -n "$composer_php" ]]; then
        final_version="$composer_php"
        echo "# Using composer.json PHP version: $final_version"
    elif [[ -n "$system_php" ]]; then
        final_version="$system_php"
        echo "# Using system PHP version: $final_version"
    else
        final_version="8.1.0"
        echo "# No PHP version detected, defaulting to: $final_version"
    fi
    
    # Extract version parts
    read -r major minor patch <<< "$(extract_version_parts "$final_version")"
    
    # Get available features
    local features
    features=$(get_php_features "$final_version")
    
    # Output structured data
    echo "PHP_VERSION=$final_version"
    echo "PHP_MAJOR=$major"
    echo "PHP_MINOR=$minor"
    echo "PHP_PATCH=$patch"
    echo "PHP_FEATURES=$features"
    echo "PHP_SYSTEM=${system_php:-"not-available"}"
    echo "PHP_COMPOSER=${composer_php:-"not-specified"}"
    
    # Output feature availability for easy checking
    if [[ -n "$features" ]]; then
        echo "PHP_SUPPORTS_MODERN_FEATURES=true"
        
        # Individual feature flags for easy checking
        IFS=',' read -ra feature_array <<< "$features"
        for feature in "${feature_array[@]}"; do
            echo "PHP_HAS_${feature^^}=true"
        done
        IFS=$'\n\t'
    else
        echo "PHP_SUPPORTS_MODERN_FEATURES=false"
    fi
}

# Execute main function
main

echo "# PHP version detection completed"
echo "Script success: ${0##*/}"
exit 0