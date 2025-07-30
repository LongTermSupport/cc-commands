#!/bin/bash

##
# QA Success Handler
# 
# Displays comprehensive test results, coverage analysis, and provides
# interactive git commit workflow when all quality checks pass.
# 
# Usage: npm run qa (calls this script automatically on success)
##

set -euo pipefail

# Colors for output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Result file paths
readonly TEST_RESULTS="var/test-results-coverage.json"
readonly COVERAGE_SUMMARY="var/coverage/coverage-summary.json"
readonly ESLINT_REPORT="var/eslint-report.json"
readonly TYPECHECK_REPORT="var/typecheck-report.txt"

##
# Display formatted header
##
print_header() {
    echo -e "\n${GREEN}${BOLD}✅ QA SUCCESS${NC}\n"
}

##
# Extract and display test statistics
##
show_test_stats() {
    if [[ -f "$TEST_RESULTS" ]]; then
        local passed_tests total_tests
        passed_tests=$(jq -r '.numPassedTests' "$TEST_RESULTS")
        total_tests=$(jq -r '.numTotalTests' "$TEST_RESULTS")
        echo -e "${GREEN}Tests: ${passed_tests}/${total_tests} passed${NC}"
    else
        echo -e "${YELLOW}Tests: Results file not found${NC}"
    fi
}

##
# Extract and display coverage statistics
##
show_coverage_stats() {
    if [[ -f "$COVERAGE_SUMMARY" ]]; then
        local stmt_pct
        stmt_pct=$(jq -r '.total.statements.pct' "$COVERAGE_SUMMARY")
        local color
        color=$(coverage_color "$stmt_pct")
        echo -e "Coverage: ${color}${stmt_pct}%${NC} statements"
    else
        echo -e "${YELLOW}Coverage: Summary file not found${NC}"
    fi
}

##
# Extract and display ESLint statistics
##
show_eslint_stats() {
    if [[ -f "$ESLINT_REPORT" ]]; then
        local total_issues
        total_issues=$(jq 'length' "$ESLINT_REPORT")
        
        if [[ "$total_issues" -eq 0 ]]; then
            echo -e "${GREEN}ESLint: Clean${NC}"
        else
            echo -e "${YELLOW}ESLint: ${total_issues} issues${NC}"
        fi
    else
        echo -e "${YELLOW}ESLint: Report file not found${NC}"
    fi
}

##
# Check TypeScript compilation status
##
show_typescript_stats() {
    if [[ -f "$TYPECHECK_REPORT" && -s "$TYPECHECK_REPORT" ]]; then
        local error_count
        error_count=$(wc -l < "$TYPECHECK_REPORT")
        echo -e "${YELLOW}TypeScript: ${error_count} errors${NC}"
    else
        echo -e "${GREEN}TypeScript: Clean${NC}"
    fi
}

##
# Determine color for coverage percentage
##
coverage_color() {
    local pct=$1
    if (( $(echo "$pct >= 80" | bc -l) )); then
        echo -n "$GREEN"
    elif (( $(echo "$pct >= 60" | bc -l) )); then
        echo -n "$YELLOW"
    else
        echo -n "\033[0;31m" # Red
    fi
}

##
# Show detailed report locations
##
show_report_locations() {
    echo -e "${CYAN}Reports: var/coverage/index.html (HTML coverage)${NC}"
}

##
# Show git commit instructions (non-interactive)
##
show_git_instructions() {
    # Check if there are any changes to commit
    if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
        echo -e "${GREEN}Commit and push (QA failing → passing transition)${NC}"
    else
        echo -e "${CYAN}No changes to commit${NC}"
    fi
}

##
# Main execution
##
main() {
    print_header
    show_test_stats
    show_coverage_stats  
    show_eslint_stats
    show_typescript_stats
    show_report_locations
    show_git_instructions
    echo
}

# Execute main function
main "$@"