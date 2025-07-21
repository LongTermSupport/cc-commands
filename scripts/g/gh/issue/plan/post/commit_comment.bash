#!/usr/bin/env bash
# Script: plan_commit_comment.bash
# Purpose: Commit plan file to git and post GitHub comment
# Usage: plan_commit_comment.bash "issue_number" "issue_title" "plan_file_path" "task_count"
# Output: Commit and comment results in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$SCRIPT_DIR/../../../_common"

# Load common scripts
source "$COMMON_DIR/../_inc/error_handler.inc.bash"

main() {
    local issue_num="$1"
    local issue_title="$2"
    local plan_file="$3"
    local task_count="$4"
    
    echo "✓ Executing Git Commit and GitHub Comment"
    echo "=== Executing Git Commit and GitHub Comment ==="
    
    echo "[1/2] Committing plan to git..."
    
    # Add plan file to git
    if git add "$plan_file"; then
        echo "✓ Plan file staged"
        echo "GIT_STAGED=true"
    else
        echo "✗ Failed to stage plan file"
        echo "GIT_STAGED=false"
        error_exit "Failed to stage plan file"
    fi
    
    # Commit with descriptive message
    local commit_msg="Add plan for issue #${issue_num}: ${issue_title}"
    if git commit -m "$commit_msg"; then
        echo "✓ Commit created"
        echo "GIT_COMMITTED=true"
        git log --oneline -1
    else
        echo "✗ Failed to create commit"
        echo "GIT_COMMITTED=false"
        error_exit "Failed to create commit"
    fi
    
    echo ""
    echo "[2/2] Posting comment to GitHub issue..."
    
    # Create GitHub comment
    local comment="📋 **Plan Created**\n\nI've analyzed this issue and created a comprehensive plan following the project's workflow standards.\n\n**Plan Summary:**\n- Total tasks: ${task_count}\n- Plan file: \`${plan_file}\`\n\n**Next Steps:**\n1. Review the plan for completeness\n2. Execute tasks following the progress tracking\n3. Update task status as work progresses\n\nPlan committed to repository: \`${plan_file}\`\n\n*Plan generated without time estimates per project standards*"
    
    if gh issue comment "$issue_num" --body "$comment"; then
        echo "✓ Comment posted successfully"
        echo "COMMENT_POSTED=true"
    else
        echo "✗ Failed to post comment"
        echo "COMMENT_POSTED=false"
        error_exit "Failed to post comment"
    fi
    
    echo ""
    echo "COMMIT_COMMENT_SUCCESS=true"
    echo "✓ Git commit and GitHub comment complete"
}

# Check if required arguments provided
if [ $# -lt 4 ]; then
    error_exit "Issue number, title, plan file path, and task count required as arguments"
fi

main "$1" "$2" "$3" "$4"
echo "Script success: ${0##*/}"