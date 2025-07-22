#!/usr/bin/env bash
# Script: run.bash
# Purpose: Test runner for cc-commands - finds and runs all test files
# Usage: bash tests/run.bash [--verbose] [test-pattern]

set -euo pipefail
IFS=$'\n\t'

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERBOSE=false
TEST_PATTERN="test_*.bash"
TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--verbose] [test-pattern]"
            echo "  --verbose, -v    Show detailed output from tests"
            echo "  test-pattern     Pattern to match test files (default: test_*.bash)"
            echo "  --help, -h       Show this help"
            exit 0
            ;;
        *)
            TEST_PATTERN="$1"
            shift
            ;;
    esac
done

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🧪 CC-Commands Test Runner"
echo "=========================="

# Ensure we're in the right directory
if [[ ! -d "$TESTS_DIR/../scripts" ]]; then
    error "Not in cc-commands root directory"
    exit 1
fi

# Find tests
test_files=($(find "$TESTS_DIR" -name "$TEST_PATTERN" -type f | sort))

if [[ ${#test_files[@]} -eq 0 ]]; then
    error "No test files found matching pattern: $TEST_PATTERN"
    exit 1
fi

info "Found ${#test_files[@]} test file(s) matching pattern: $TEST_PATTERN"
echo ""

# Run tests
passed=0
failed=0
failed_tests=()

for test_file in "${test_files[@]}"; do
    test_name=$(basename "$test_file" .bash)
    info "Running $test_name..."
    
    if [[ "$VERBOSE" == "true" ]]; then
        # Verbose mode - show all output
        if bash "$test_file"; then
            success "$test_name passed"
            passed=$((passed + 1))
        else
            error "$test_name failed"
            failed=$((failed + 1))
            failed_tests+=("$test_name")
        fi
    else
        # Non-verbose mode - capture output
        if output=$(bash "$test_file" 2>&1); then
            # Show PASS lines
            echo "$output" | grep "^PASS:" || true
            success "$test_name passed"
            passed=$((passed + 1))
        else
            echo "$output" | grep "^FAIL:" || true
            error "$test_name failed"
            failed=$((failed + 1))
            failed_tests+=("$test_name")
            echo "--- Full output ---"
            echo "$output"
            echo "--- End output ---"
        fi
    fi
    echo ""
done

# Summary
echo "==================="
echo "🏁 Test Summary"
echo "==================="
echo "Tests run: $((passed + failed))"
echo "Passed: $passed"
echo "Failed: $failed"

if [[ $failed -gt 0 ]]; then
    echo ""
    error "Failed tests:"
    for test in "${failed_tests[@]}"; do
        echo "  - $test"
    done
    echo ""
    error "Test suite failed!"
    exit 1
else
    echo ""
    success "All tests passed! 🎉"
    exit 0
fi