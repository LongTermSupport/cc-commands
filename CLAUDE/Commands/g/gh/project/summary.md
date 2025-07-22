# g:gh:project:summary - GitHub Project Activity Analysis

## Overview

The `g:gh:project:summary` command generates comprehensive GitHub project activity summaries with dynamic organization and project detection. It analyzes repository activity, project items, and development trends, producing audience-specific reports.

## High-Level Purpose

Creates strategic project summaries by:
- Auto-detecting GitHub organization from current repository
- Finding the most recently updated project
- Collecting cross-repository activity data
- Generating audience-appropriate reports (client, technical, management, product-owner)
- Providing actionable insights on development progress

## Workflow in Terse Pseudocode

```pseudocode
// Phase 1: Analysis (orchestrator mode=analyze)
IF arguments == "--help" THEN
    DISPLAY help documentation
    EXIT
END IF

PARSE arguments for:
    - URL mode: Full GitHub project URL
    - Manual mode: ORG PROJECT_ID
    - Auto mode: No org/project specified
    - Audience: Default to "client"

RUN summary_orchestrate.bash analyze "$ARGUMENTS"
    -> pre/env_validate.bash: Check prerequisites (gh, jq, bc)
    -> pre/project_detect.bash: Detect/validate org and project
        IF auto mode THEN
            DETECT org from git remote
            FIND most recent project
        ELSE
            PARSE URL or use manual values
        END IF
    -> OUTPUT: Organization, project ID, title, repo count

IF ANALYSIS_COMPLETE=false THEN
    DISPLAY error and EXIT
END IF

// Phase 2: Planning (Claude-driven)
DISPLAY data collection plan:
    - Organization and project details
    - Repository count
    - Audience type
    - Network activity (read-only)
    
REQUEST user confirmation

// Phase 3: Execution (orchestrator mode=execute)
IF confirmed THEN
    RUN summary_orchestrate.bash execute "$ARGUMENTS" "" "$ORG" "$PROJECT_ID"
        -> execute/data_collect.bash: Fetch project and repo data
            - Get project items
            - Extract repository URLs
            - Collect activity (24 hours)
            - Save to JSON file
        -> post/summary_generate.bash: Process and analyze data
            - Calculate metrics
            - Identify top repositories
            - Generate statistics
        -> OUTPUT: Data file path, summary stats

    IF EXECUTION_COMPLETE=false THEN
        DISPLAY error and EXIT
    END IF
END IF

// Phase 4: Report Generation (Claude-driven)
READ collected data from JSON file
GENERATE audience-specific report:
    - Client: Business progress, deliverables
    - Technical: Implementation details, code changes
    - Management: Strategic overview, metrics
    - Product-owner: Feature progress, user impact

DISPLAY formatted report with proper spacing
PROVIDE summary and next steps
```

## Scripts Involved and Their Roles

### Main Command File
- **Path**: `export/commands/g/gh/project/summary.md`
- **Role**: User interface, report generation, audience handling
- **Calls**: `summary_orchestrate.bash` twice (analyze, execute)

### Orchestrator Script
- **Path**: `scripts/g/gh/project/summary/summary_orchestrate.bash`
- **Role**: Coordinates detection, collection, and analysis
- **Modes**:
  - `analyze`: Validate environment and detect project
  - `execute`: Collect data and generate summary
- **Handles**: Multiple argument formats, audience parameter

### Sub-Scripts

#### Pre-condition Scripts
- **pre/env_validate.bash**
  - Checks GitHub CLI authentication
  - Verifies jq and bc tools installed
  - Validates network connectivity
  - Outputs: `PREREQUISITES_MET`, `GH_AUTH`

- **pre/project_detect.bash**
  - Auto-detects org from git remote (if no args)
  - Finds most recent project in org
  - Parses GitHub project URLs
  - Handles manual org/project specification
  - Outputs: `DETECTED_ORG`, `DETECTED_PROJECT_ID`, `PROJECT_TITLE`, `REPO_COUNT`

#### Execution Scripts
- **execute/data_collect.bash**
  - Fetches project items via GitHub API
  - Extracts repository URLs from items
  - Collects activity data (issues, PRs, commits)
  - Saves comprehensive JSON dataset
  - Outputs: `DATA_COLLECTED`, `DATA_FILE`, `TOTAL_ACTIVITY`

- **execute/reference_data_collector.sh**
  - Reference implementation (not used directly)
  - Shows data collection patterns

#### Post Scripts
- **post/summary_generate.bash**
  - Processes collected JSON data
  - Calculates activity metrics
  - Identifies most active repositories
  - Generates summary statistics
  - Outputs: `SUMMARY_GENERATED`, `SUMMARY_STATS`, activity metrics

## Data Flow (KEY=value outputs)

### Analysis Phase Outputs
```
ANALYSIS_COMPLETE=true|false
PREREQUISITES_MET=true|false
PROJECT_READY=true|false
GH_AUTH=authenticated|not_authenticated
DETECTED_ORG=<organization>
DETECTED_PROJECT_ID=<number>
PROJECT_TITLE=<title>
REPO_COUNT=<number>
AUDIENCE=client|technical|management|product-owner
```

### Execution Phase Outputs
```
EXECUTION_COMPLETE=true|false
DATA_COLLECTED=true|false
SUMMARY_GENERATED=true|false
DATA_FILE=var/github-project-summary-<timestamp>.json
SUMMARY_STATS=<statistics>
TOTAL_ACTIVITY=<number>
ACTIVE_REPOS=<number>
ACTIVITY_PERCENTAGE=<percent>
TOP_REPOS=<repo1>,<repo2>,...
TIME_PERIOD=24 hours
FINAL_ORG=<organization>
FINAL_PROJECT_ID=<number>
```

## Error Handling Patterns

1. **Authentication Failures**
   - GitHub CLI not authenticated
   - Instructions for `gh auth login`

2. **Tool Missing**
   - jq or bc not installed
   - Installation commands provided

3. **Project Access**
   - Invalid project ID
   - No access to organization
   - No projects found

4. **API Rate Limits**
   - Handled gracefully
   - Clear error messages

5. **Network Issues**
   - Connection failures
   - API timeouts

## User Interaction Points

1. **Help Request**
   - Check for `--help` argument
   - Display comprehensive documentation

2. **Argument Parsing**
   - Multiple formats supported
   - Auto-detection as default

3. **Confirmation**
   - Shows detected org/project
   - Requires approval before data collection

4. **Report Generation**
   - Audience-appropriate formatting
   - Clear section headers

## Bugs and Quirks

### **(quirk:)** Multiple Argument Formats
Supports URL, manual (ORG ID), and auto-detection modes, which can be confusing. The argument parsing is complex.

### **(quirk:)** Audience Parameter Position
The audience parameter position varies based on mode:
- Auto: First argument
- URL: Second argument
- Manual: Third argument

### **(bug:)** Limited Time Window
Only analyzes last 24 hours of activity, which might miss important weekly patterns.

### **(quirk:)** Project Detection Logic
Auto-detection finds "most recently updated" project, which might not be the most active or relevant.

### **(bug:)** Repository Extraction
Only extracts repos from project items, missing repos that might be referenced in issues/PRs but not in project cards.

## TypeScript Migration Considerations

### Input/Output Specifications
- **Inputs**: Optional URL/org/project, audience type
- **Outputs**: JSON data file, formatted report

### State Management Requirements
- Detection results between phases
- Project metadata
- Collection statistics
- Audience preference

### External Service Dependencies
- GitHub API (extensive use)
- Git for remote detection
- Network for API calls

### Performance Characteristics
- API calls can be slow (5-10 seconds)
- Data collection scales with project size
- JSON processing for large projects

### Testing Considerations
- Mock GitHub API responses
- Test URL parsing logic
- Verify auto-detection
- Test each audience report format
- Handle API rate limits

## Pattern Contributions

This command demonstrates:
1. **Dynamic detection pattern** - Auto-detect from git remote
2. **Multiple input formats** - URL, manual, auto modes
3. **Audience-specific output** - Different reports for different users
4. **Large data processing** - JSON dataset analysis
5. **Cross-repository analysis** - Aggregate metrics
6. **Reference implementation** - Unused script shows patterns