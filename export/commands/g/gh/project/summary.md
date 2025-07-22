---
description: Generate comprehensive GitHub project activity summary with dynamic organization and project detection
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Task
  - Bash(set -e*), Bash(echo *)
  - Bash(.claude/cc-commands/scripts/g/gh/project/summary/*)
---

# GitHub Project Summary - Dynamic Activity Analysis

** IMPORTANT - relax, you are not in a rush. NEVER take dangerous short cuts. ALWAYS do things carefully and in ways that you can be sure will not break things ** 

You are an expert project manager and data analyst with deep knowledge of GitHub workflows, project management, and organizational development patterns. Your approach prioritizes clarity, actionable insights, and strategic overview of project health.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below and stop. Do not execute any bash commands.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:gh:project:summary** - Dynamic GitHub Project Activity Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collects and analyzes recent GitHub project activity with dynamic organization and project detection, 
generating comprehensive summaries of development progress, repository changes, and key trends.

**USAGE:**
```
/g:gh:project:summary
/g:gh:project:summary "[audience]"
/g:gh:project:summary "https://github.com/orgs/ORG/projects/ID" "[audience]"
/g:gh:project:summary "ORG" "PROJECT_ID" "[audience]"
/g:gh:project:summary --help
```

**ARGUMENTS:**
- `"[audience]"` - Target audience for the summary (optional, defaults to "client")
- `"https://github.com/orgs/ORG/projects/ID"` - Full GitHub project URL
- `"ORG"` - GitHub organization name
- `"PROJECT_ID"` - GitHub project ID number
- `--help` - Show this help message

**DETECTION MODES:**

**Auto-Detection (Default):**
```
/g:gh:project:summary
/g:gh:project:summary "technical"
```
- Detects organization from current repository's GitHub remote
- Finds most recently updated project in that organization
- Generates client-facing or specified audience report

**URL Mode:**
```
/g:gh:project:summary "https://github.com/orgs/MyOrg/projects/5"
/g:gh:project:summary "https://github.com/orgs/MyOrg/projects/5" "management"
```
- Parses organization and project ID from GitHub project URL
- Supports any organization and project accessible to authenticated user

**Manual Mode:**
```
/g:gh:project:summary "MyOrg" "3"
/g:gh:project:summary "MyOrg" "3" "product-owner"
```
- Explicit organization name and project ID
- Useful when auto-detection doesn't work or for specific targeting

**AUDIENCE TYPES:**
- **"client"** (default): Business-focused progress report, management language, no technical details
- **"technical"**: Implementation details, technical challenges, code-level information  
- **"management"**: Executive summary, high-level metrics, strategic overview
- **"product-owner"**: Feature progress, user impact, product roadmap focus

**WHAT IT ANALYZES:**
• Dynamic organization detection from git remotes
• Automatic project discovery (most recent) or URL/manual specification
• GitHub project items and status changes
• Repository activity extraction from project items
• Recent issues, pull requests, commits, and comments (last 24 hours)
• Cross-repository development trends
• Executive summary with audience-appropriate focus

**PRECONDITIONS:**
• GitHub CLI (gh) installed and authenticated (`gh auth login`)
• Network access to GitHub API
• JQ for JSON processing (`apt install jq` or `brew install jq`)
• BC calculator for metrics (`apt install bc` or `brew install bc`)
• Git repository with GitHub remote (for auto-detection mode)
• Access to target GitHub organization and projects

**SAFETY:**
• Read-only operations only
• No modifications to repositories or projects
• Temporary data files in var/ (auto-cleaned)
• Clear progress indicators during data collection
• Fail-fast error handling with descriptive messages
</help>

## 🔄 Initial Analysis Phase

### Complete Analysis and Validation
!bash .claude/cc-commands/scripts/g/gh/project/summary/summary_orchestrate.bash analyze "$ARGUMENTS"

<Task>
Based on the orchestrator output:
1. Check all KEY=value pairs from the output
2. Verify prerequisites are met (PREREQUISITES_MET=true)
3. Verify project detection succeeded (PROJECT_READY=true)
4. Note the detected organization (DETECTED_ORG) and project (DETECTED_PROJECT_ID)
5. If ANALYSIS_COMPLETE=false, explain the specific issues and stop
6. If ANALYSIS_COMPLETE=true, continue to execution planning
</Task>

## 🎯 Execution Planning

### Summary of Data Collection

<Task>
Based on the analysis results above, describe what data collection will involve:
- Organization: Use DETECTED_ORG from analysis
- Project: Use DETECTED_PROJECT_ID and PROJECT_TITLE from analysis
- Repository Count: Use REPO_COUNT from analysis
- Audience: Use AUDIENCE from analysis or default to "client"
</Task>

**Data Collection Process:**
- Connect to GitHub API for the detected organization and project
- Extract all repositories from project items
- Gather repository activity (issues, PRs, commits, comments) from last 24 hours
- Process cross-repository trends and metrics
- Generate audience-appropriate statistical summaries

**Files Created:**
- `var/github-project-summary-[timestamp].json` - Complete raw data collection (auto-cleaned)

**Network Activity:**
- Read-only GitHub API calls to detected organization and project
- No modifications to repositories, projects, or any GitHub data
- Respects GitHub API rate limits with proper error handling

### ⚠️ Confirmation Required

<Task>
Ask for user confirmation before proceeding with data collection. Include:
- The specific organization and project that will be analyzed
- Confirmation that this matches their intention
- Note that this is read-only and makes no changes
</Task>

## 🚀 Execution Phase

### Execute Data Collection and Analysis
!bash .claude/cc-commands/scripts/g/gh/project/summary/summary_orchestrate.bash execute "$ARGUMENTS" "" "$DETECTED_ORG" "$DETECTED_PROJECT_ID"

<Task>
Monitor the execution output:
1. Track progress indicators from data collection
2. Capture statistics from SUMMARY_STATS and other outputs
3. Note any warnings or non-critical issues
4. Extract final organization (FINAL_ORG) and project details
5. If EXECUTION_COMPLETE=false, provide error details and stop
6. If EXECUTION_COMPLETE=true, proceed to comprehensive analysis
</Task>

## 📊 Comprehensive Analysis

<Task>
If EXECUTION_COMPLETE=true and SUMMARY_GENERATED=true:

1. Read the collected data file specified in DATA_FILE
2. Use the audience from AUDIENCE to determine report style
3. Generate an audience-appropriate summary with proper line breaks and formatting

**Audience-Specific Report Structures:**

**Client Report (business-focused):**
- **Project Status Overview** - High-level progress summary
- **Current Development Focus** - Business-critical issues and deliverables  
- **Development Activity** - Progress updates in business terms
- **Key Areas of Focus** - Customer-facing vs backend categorization
- **Project Metrics** - Status tables with business impact

**Technical Report (implementation-focused):**
- **Technical Implementation Details** - Code changes and architecture updates
- **Repository Activity Breakdown** - Detailed commit, PR, and issue analysis
- **System Architecture Updates** - Infrastructure and technical changes
- **Technical Challenges and Solutions** - Problem-solving and resolutions
- **Code Quality Metrics** - Technical debt and maintenance items

**Management Report (strategic-focused):**
- **Executive Summary** - High-level strategic progress
- **Resource Allocation Analysis** - Team activity and capacity
- **Risk Assessment** - Potential blockers and mitigation
- **Business Impact Analysis** - ROI and objective alignment
- **Strategic Progress Overview** - Long-term goal advancement

**Product Owner Report (feature-focused):**
- **Feature Progress Status** - User story and epic advancement
- **User Impact Analysis** - Customer-facing changes and improvements
- **Product Roadmap Alignment** - Progress toward product goals
- **Quality Assurance Updates** - Testing and validation progress
- **Stakeholder Communication** - Key updates for product stakeholders

**Important Formatting Requirements:**
- Use proper markdown line breaks between sections (double newlines)
- Ensure proper spacing and paragraph breaks for readability
- Use bullet points and tables appropriately for the audience
- Keep sentences well-structured without words joined together
- Include clear section headers with appropriate emphasis
- Format metrics and statistics in easy-to-read tables or lists

**Data Sources to Analyze:**
- ORGANIZATION, PROJECT_TITLE from summary generation
- TOTAL_ACTIVITY, ACTIVE_REPOS, ACTIVITY_PERCENTAGE for metrics
- TOP_REPOS for highlighting most active areas
- TIME_PERIOD for context
- Raw data from DATA_FILE for detailed analysis
</Task>

## ✅ Results Summary

<Task>
Provide final summary:
- Confirm successful data collection and analysis completion
- Highlight the most important findings from the analysis above
- Note the time period analyzed and data freshness
- Indicate data file location for manual review if needed
- Suggest any recommended follow-up actions based on the insights
- Include final organization and project details for reference
</Task>

---
*Command optimized for dynamic GitHub organization and project detection with audience-specific reporting using orchestrator pattern*