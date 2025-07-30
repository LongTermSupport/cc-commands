#!/bin/bash

##
# QA Failure Handler
# 
# Displays diagnostic information when QA fails, including details about
# which specific checks failed and where to find more information.
# 
# Usage: Called automatically when npm run qa fails
##

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
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
    echo -e "\n${RED}${BOLD}❌ QA FAILED${NC}\n"
}

##
# Extract and display test statistics
##
show_test_stats() {
    if [[ -f "$TEST_RESULTS" ]]; then
        local passed_tests failed_tests todo_tests actual_tests success
        passed_tests=$(jq -r '.numPassedTests' "$TEST_RESULTS")
        failed_tests=$(jq -r '.numFailedTests' "$TEST_RESULTS")
        todo_tests=$(jq -r '.numTodoTests' "$TEST_RESULTS")
        success=$(jq -r '.success' "$TEST_RESULTS")
        actual_tests=$((passed_tests + failed_tests))
        
        if [[ "$success" == "true" && "$failed_tests" -eq 0 ]]; then
            echo -e "${YELLOW}Tests: ${passed_tests}/${actual_tests} passed (but QA failed elsewhere)${NC}"
            if [[ "$todo_tests" -gt 0 ]]; then
                echo -e "${CYAN}Todo: ${todo_tests} tests marked as todo${NC}"
            fi
        else
            echo -e "${RED}Tests: ${passed_tests}/${actual_tests} passed, ${failed_tests} failed${NC}"
        fi
    else
        echo -e "${RED}Tests: Results file not found${NC}"
    fi
}

##
# Extract and display coverage statistics
##
show_coverage_stats() {
    if [[ -f "$COVERAGE_SUMMARY" ]]; then
        local stmt_pct
        stmt_pct=$(jq -r '.total.statements.pct' "$COVERAGE_SUMMARY")
        echo -e "Coverage: ${YELLOW}${stmt_pct}%${NC} statements"
    else
        echo -e "${RED}Coverage: Summary file not found${NC}"
    fi
}

##
# Extract and display ESLint statistics
##
show_eslint_stats() {
    if [[ -f "$ESLINT_REPORT" ]]; then
        local total_issues
        total_issues=$(jq 'map(.errorCount + .warningCount) | add' "$ESLINT_REPORT")
        
        if [[ "$total_issues" -eq 0 ]]; then
            echo -e "${YELLOW}ESLint: Clean (but QA failed elsewhere)${NC}"
        else
            echo -e "${RED}ESLint: ${total_issues} issues${NC}"
        fi
    else
        echo -e "${RED}ESLint: Report file not found${NC}"
    fi
}

##
# Check TypeScript compilation status
##
show_typescript_stats() {
    if [[ -f "$TYPECHECK_REPORT" && -s "$TYPECHECK_REPORT" ]]; then
        local error_count
        error_count=$(wc -l < "$TYPECHECK_REPORT")
        echo -e "${RED}TypeScript: ${error_count} errors${NC}"
    else
        echo -e "${YELLOW}TypeScript: Clean (but QA failed elsewhere)${NC}"
    fi
}

##
# Show diagnostic report locations
##
show_diagnostic_locations() {
    echo -e "${CYAN}Diagnostics:${NC}"
    echo -e "${CYAN}  - ESLint: var/eslint-report.json${NC}"
    echo -e "${CYAN}  - TypeScript: var/typecheck-report.txt${NC}"
    echo -e "${CYAN}  - Tests: var/test-results-coverage.json${NC}"
    echo -e "${CYAN}  - Coverage: var/coverage/index.html${NC}"
}

##
# Show recovery instructions
##
show_recovery_instructions() {
    echo -e "${CYAN}Recovery:${NC}"
    echo -e "${CYAN}  - Fix failing tests: npm test${NC}"
    echo -e "${CYAN}  - Fix ESLint issues: npm run lint${NC}"
    echo -e "${CYAN}  - Fix TypeScript: npm run typecheck${NC}"
    echo -e "${CYAN}  - Re-run QA: npm run qa${NC}"
}

##
# Main execution
##
main() {
    local output
    output=$(
        print_header
        show_test_stats
        show_coverage_stats  
        show_eslint_stats
        show_typescript_stats
        show_diagnostic_locations
        show_recovery_instructions
        echo
    )
    
    # Output to both stdout and file
    echo "$output"
    echo "$output" > var/qa-result.txt
}

# Execute main function
main "$@"