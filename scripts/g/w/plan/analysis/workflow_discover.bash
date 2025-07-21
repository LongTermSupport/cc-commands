#!/usr/bin/env bash
# Script: plan_workflow_discover.bash
# Purpose: Discover project planning workflow documentation
# Usage: plan_workflow_discover.bash
# Output: Workflow discovery results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../../_common"

# Load common scripts
source "$COMMON_DIR/_inc/error_handler.inc.bash"

main() {
    echo "✓ Discovering project planning workflow"
    echo "=== Workflow Documentation Check ==="
    
    # Check multiple possible locations for planning workflow
    WORKFLOW_FOUND=false
    WORKFLOW_PATH=""
    PROJECT_ROOT=$(pwd)
    
    if [ -f "CLAUDE/PlanWorkflow.md" ]; then
        echo "✓ Found project workflow at CLAUDE/PlanWorkflow.md"
        WORKFLOW_FOUND=true
        WORKFLOW_PATH="CLAUDE/PlanWorkflow.md"
    elif [ -f ".claude/PlanWorkflow.md" ]; then
        echo "✓ Found project workflow at .claude/PlanWorkflow.md"
        WORKFLOW_FOUND=true
        WORKFLOW_PATH=".claude/PlanWorkflow.md"
    elif [ -f "docs/planning-workflow.md" ]; then
        echo "✓ Found project workflow at docs/planning-workflow.md"
        WORKFLOW_FOUND=true
        WORKFLOW_PATH="docs/planning-workflow.md"
    elif [ -f "docs/workflow.md" ]; then
        echo "✓ Found project workflow at docs/workflow.md"
        WORKFLOW_FOUND=true
        WORKFLOW_PATH="docs/workflow.md"
    else
        echo "⚠ No project-specific workflow found - using default two-mode workflow"
        WORKFLOW_FOUND=false
        WORKFLOW_PATH=""
    fi
    
    # Export results
    echo "WORKFLOW_FOUND=$WORKFLOW_FOUND"
    echo "WORKFLOW_PATH=$WORKFLOW_PATH"
    echo "PROJECT_ROOT=$PROJECT_ROOT"
    
    if [ "$WORKFLOW_FOUND" = true ]; then
        echo "Will use project-specific workflow: $WORKFLOW_PATH"
    else
        echo "Will use default two-mode workflow (Planning -> Execution)"
    fi
    
    echo "✓ Workflow discovery complete"
}

main
