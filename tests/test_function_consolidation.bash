#!/usr/bin/env bash
# Test: test_function_consolidation.bash  
# Purpose: Validate that helper function consolidation works correctly
# Usage: Called by test runner - should exit 0 on success, non-zero on failure

# Don't use strict mode in tests to avoid early exits
set -eo pipefail
IFS=$'\n\t'

# Global variables for all tests
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../scripts/_common")"

echo "=== Function Consolidation Tests ==="

# Load includes directly
echo "Loading helpers.inc.bash..."
if ! source "$COMMON_DIR/_inc/helpers.inc.bash"; then
    echo "FAIL: Cannot load helpers.inc.bash"
    exit 1
fi
echo "PASS: Helpers loaded"

echo "Loading error_handler.inc.bash..."  
if ! source "$COMMON_DIR/_inc/error_handler.inc.bash"; then
    echo "FAIL: Cannot load error_handler.inc.bash"
    exit 1
fi
echo "PASS: Error handler loaded"

# Test functions exist
echo "Testing helper functions exist..."
missing_functions=()
for func in warn info success debug require_command create_temp_file capture_script_output; do
    if ! declare -F "$func" >/dev/null; then
        missing_functions+=("$func")
    fi
done

if [[ ${#missing_functions[@]} -gt 0 ]]; then
    echo "FAIL: Missing helper functions: ${missing_functions[*]}"
    exit 1
fi
echo "PASS: All helper functions found"

echo "Testing error functions exist..."
missing_functions=()
for func in error_exit run_with_output silent_run; do
    if ! declare -F "$func" >/dev/null; then
        missing_functions+=("$func")
    fi
done

if [[ ${#missing_functions[@]} -gt 0 ]]; then
    echo "FAIL: Missing error functions: ${missing_functions[*]}"
    exit 1
fi
echo "PASS: All error functions found"

# Test temp file system
echo "Testing temp file system..."
setup_temp_cleanup

temp_file=$(create_temp_file "test")
if [[ ! -f "$temp_file" ]]; then
    echo "FAIL: Temp file not created: $temp_file"
    exit 1
fi

if [[ "$temp_file" != *"/var/"* ]]; then
    echo "FAIL: Temp file not in var directory: $temp_file"
    exit 1
fi

echo "test content" > "$temp_file"
cleanup_temp_file "$temp_file"

if [[ -f "$temp_file" ]]; then
    echo "FAIL: Temp file not cleaned up: $temp_file"
    exit 1
fi
echo "PASS: Temp file system works"

# Test message functions
echo "Testing message functions..."
output=$(info "test message" 2>&1)
if [[ "$output" != *"test message"* ]]; then
    echo "FAIL: Message functions don't work. Output: $output"
    exit 1
fi
echo "PASS: Message functions work"

echo ""
echo "✅ All tests passed!"
exit 0