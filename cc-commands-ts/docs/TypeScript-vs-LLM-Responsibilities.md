# TypeScript vs LLM Responsibilities: Absolute Architecture Guide

## 🎯 FUNDAMENTAL PRINCIPLE

**TypeScript collects FACTS. LLM provides INTELLIGENCE.**

TypeScript orchestrators and services are sophisticated calculators that produce raw, objective, mathematical facts. The LLM is the analyst that interprets those facts into meaningful insights, recommendations, and narratives.

---

## ✅ CORRECT: TypeScript Responsibilities

### **Raw Data Collection**
```typescript
TOTAL_REPOSITORIES=3
REPO_1_NAME=frontend-app
REPO_1_CREATED_DATE=2024-07-01T00:00:00Z
REPO_1_LAST_PUSH_DATE=2025-01-29T10:15:00Z
TOTAL_ISSUES=89
OPEN_ISSUES=12
CLOSED_ISSUES=77
```

### **Mathematical Calculations**
```typescript
// Time calculations
DAYS_SINCE_CREATED=227
DAYS_SINCE_LAST_UPDATE=0
AVERAGE_ISSUE_RESOLUTION_DAYS=12.5
MEDIAN_PR_MERGE_TIME_HOURS=24

// Ratios and percentages
ISSUE_OPEN_CLOSE_RATIO=0.15              // open_issues / closed_issues
ISSUE_CLOSE_RATE_30D=1.20                // closed_last_30d / opened_last_30d
PR_MERGE_SUCCESS_RATE=0.91               // merged_prs / total_closed_prs
CONTRIBUTOR_CONCENTRATION=0.65           // top_contributor_commits / total_commits

// Velocity metrics
COMMITS_PER_DAY_30D=2.9                  // commits_last_30d / 30
ISSUES_PER_DAY_30D=0.5                   // issues_opened_last_30d / 30
AVERAGE_COMMITS_PER_PR=2.3               // total_commits / total_prs

// Growth calculations
COMMIT_GROWTH_RATE_30D=-0.05             // (recent_30d - previous_30d) / previous_30d
CONTRIBUTOR_GROWTH_RATE_30D=0.10         // (new_contributors - old_contributors) / old_contributors

// Statistical measures
COMMIT_DISTRIBUTION_GINI=0.3             // Gini coefficient of commit distribution
ACTIVITY_CONSISTENCY_SCORE=0.8          // 1 - coefficient_of_variation(daily_commits)
```

### **Factual Aggregations**
```typescript
// Top N lists (sorted by objective criteria)
TOP_10_CONTRIBUTORS_30D=john.doe:25,jane.smith:18,bob.wilson:12
TOP_10_RECENTLY_UPDATED_ISSUES=Issue #45: Fix login bug|2025-01-29T13:00:00Z,Issue #44: Add dark mode|2025-01-28T16:30:00Z

// Count-based rankings
MOST_ACTIVE_HOUR=14                      // hour with most commits (0-23)
MOST_ACTIVE_WEEKDAY=2                    // Tuesday (0=Sunday, 6=Saturday)
LARGEST_REPOSITORY_BY_COMMITS=frontend-app
REPOSITORY_WITH_MOST_ISSUES=backend-api
```

### **Pattern Detection Through Mathematics**
```typescript
// Frequency distributions
WEEKEND_COMMIT_PERCENTAGE=0.15           // weekend_commits / total_commits
BUSINESS_HOURS_ACTIVITY_RATIO=0.82       // (9am-5pm commits) / total_commits

// Correlation coefficients
COMMIT_ISSUE_CORRELATION=0.73            // statistical correlation between commits and issues
PR_SIZE_MERGE_TIME_CORRELATION=-0.45     // negative correlation = smaller PRs merge faster

// Consistency measures
DAILY_ACTIVITY_VARIANCE=2.3              // variance in daily commit counts
CONTRIBUTOR_ACTIVITY_BALANCE=0.4         // how evenly distributed contributor activity is
```

---

## ❌ FORBIDDEN: TypeScript Responsibilities

### **Interpretive Analysis**
```typescript
// ❌ NEVER DO THIS
HEALTH_SCORE=85                          // What defines "healthy"?
ACTIVITY_LEVEL="high"                    // What constitutes "high"?
PROJECT_STATUS="excellent"               // Based on what criteria?
TEAM_PRODUCTIVITY="above_average"        // Compared to what?
DEVELOPMENT_VELOCITY="fast"              // Fast according to whom?
RISK_LEVEL="low"                         // Risk of what?
CODE_QUALITY="good"                      // Good by what standard?
```

### **Synthetic Scoring**
```typescript
// ❌ NEVER DO THIS
OVERALL_SCORE=78.5                       // Weighted combination of what?
REPOSITORY_RANK=3                        // Ranked by what criteria?
PERFORMANCE_GRADE="B+"                   // Graded against what scale?
MATURITY_LEVEL=4                         // What defines maturity levels?
ENGAGEMENT_SCORE=67                      // How is engagement measured?
```

### **Recommendations & Insights**
```typescript
// ❌ NEVER DO THIS
RECOMMENDED_ACTION="increase_testing"    // Based on what analysis?
SUGGESTED_FOCUS="improve_documentation"  // How was this determined?
NEXT_STEPS="hire_more_developers"        // What justifies this?
PRIORITY_AREAS="bug_fixes,performance"   // Prioritized how?
IMPROVEMENT_OPPORTUNITIES="code_review"  // Identified through what process?
```

### **Contextual Judgments**
```typescript
// ❌ NEVER DO THIS
TIMELINE_ASSESSMENT="behind_schedule"    // Compared to what schedule?
RESOURCE_UTILIZATION="inefficient"       // Inefficient how?
TEAM_COLLABORATION="needs_improvement"   // Based on what indicators?
PROJECT_TRAJECTORY="positive"            // Positive toward what goal?
COMPETITIVE_POSITION="strong"            // Strong against whom?
```

---

## 🎯 LLM Responsibilities

### **What the LLM SHOULD Do**

**Analysis & Interpretation:**
- "With a 1.20 close rate, this project is resolving issues faster than they're being created"
- "The -0.05 commit growth rate indicates declining development activity"
- "A 0.65 contributor concentration suggests heavy reliance on a few key developers"

**Contextual Understanding:**
- "For a 6-month-old project, 245 commits shows active development"
- "The 36-hour average PR merge time is reasonable for a small team"
- "Weekend activity at only 15% suggests good work-life balance"

**Strategic Insights:**
- "The declining commit rate combined with growing issue count may indicate technical debt accumulation"
- "High contributor concentration creates risk if key developers leave"
- "Strong PR merge success rate suggests good code review practices"

**Recommendations:**
- "Consider recruiting additional contributors to reduce dependency on top performers"
- "The positive issue resolution trend suggests the team can handle increased feature velocity"
- "Low weekend activity indicates sustainable development pace"

**Audience Adaptation:**
- Technical audience: Focus on ratios, growth rates, statistical measures
- Executive audience: Emphasize business impact and risk factors
- Product audience: Highlight feature velocity and user-facing metrics

---

## 🏗️ Implementation Guidelines

### **TypeScript Service Pattern**
```typescript
class RepositoryFactCollector {
  async collectRepositoryFacts(owner: string, repo: string): Promise<Record<string, string>> {
    const data: Record<string, string> = {}
    
    // ✅ CORRECT: Collect raw facts
    data.REPOSITORY_NAME = repo
    data.REPOSITORY_CREATED_DATE = createdDate.toISOString()
    data.DAYS_SINCE_CREATED = String(daysBetween(createdDate, now))
    
    // ✅ CORRECT: Mathematical calculations
    data.COMMIT_COUNT_30D = String(commits.length)
    data.COMMITS_PER_DAY_30D = String(commits.length / 30)
    data.AVERAGE_COMMIT_SIZE_LINES = String(totalLines / commits.length)
    
    // ❌ FORBIDDEN: Interpretation
    // data.COMMIT_FREQUENCY_LEVEL = commits.length > 100 ? 'high' : 'low'
    // data.REPOSITORY_HEALTH = 'good'
    // data.ACTIVITY_TREND = 'increasing'
    
    return data
  }
}
```

### **LLM Instruction Pattern**
```typescript
// ✅ CORRECT: Guide LLM analysis
result.addInstruction('Analyze the commit frequency patterns to assess development velocity')
result.addInstruction('Compare issue resolution rates across repositories to identify bottlenecks')
result.addInstruction('Evaluate contributor distribution to assess project sustainability')
result.addInstruction('Identify trends in the data that indicate project health trajectory')

// ❌ FORBIDDEN: Pre-analyze for LLM
// result.addInstruction('Report that the project is healthy')
// result.addInstruction('Recommend hiring more developers')
// result.addInstruction('Conclude that velocity is good')
```

### **DTO Structure Pattern**
```typescript
class ProjectFactsDTO implements ILLMDataDTO {
  constructor(
    // ✅ CORRECT: Raw facts and mathematical calculations
    public readonly totalRepositories: number,
    public readonly daysSinceCreated: number,
    public readonly commitGrowthRate30D: number,
    public readonly issueCloseRate30D: number,
    public readonly contributorConcentration: number,
    
    // ❌ FORBIDDEN: Interpretive fields
    // public readonly healthScore: number,
    // public readonly activityLevel: 'high' | 'medium' | 'low',
    // public readonly overallRating: string,
    // public readonly riskAssessment: string
  ) {}
  
  toLLMData(): Record<string, string> {
    return {
      TOTAL_REPOSITORIES: String(this.totalRepositories),
      DAYS_SINCE_CREATED: String(this.daysSinceCreated),
      COMMIT_GROWTH_RATE_30D: String(this.commitGrowthRate30D),
      ISSUE_CLOSE_RATE_30D: String(this.issueCloseRate30D),
      CONTRIBUTOR_CONCENTRATION: String(this.contributorConcentration)
      
      // ❌ FORBIDDEN
      // HEALTH_SCORE: String(this.healthScore),
      // ACTIVITY_LEVEL: this.activityLevel,
      // OVERALL_RATING: this.overallRating
    }
  }
}
```

---

## 🚨 Quality Assurance Checklist

### **Code Review Questions**
1. **Does this method return a fact or an opinion?**
   - Fact: ✅ Allow
   - Opinion: ❌ Move to LLM

2. **Can this be calculated with math?**
   - Yes: ✅ Allow in TypeScript
   - No: ❌ Move to LLM

3. **Would different analysts interpret this differently?**
   - Yes: ❌ Move to LLM
   - No: ✅ Allow in TypeScript

4. **Does this involve domain expertise or business judgment?**
   - Yes: ❌ Move to LLM
   - No: ✅ Allow in TypeScript

5. **Is this a classification or categorization?**
   - Yes: ❌ Move to LLM (unless purely mathematical)
   - No: ✅ Allow in TypeScript

### **Red Flag Indicators**
- Variables named with subjective adjectives: `good`, `bad`, `high`, `low`, `healthy`, `poor`
- Methods containing: `analyze`, `assess`, `evaluate`, `determine`, `classify`, `rate`, `score`
- Return types that are enums of quality levels: `'excellent' | 'good' | 'poor'`
- Comments that explain "what this means" rather than "how this is calculated"
- Constants that define thresholds for "good vs bad": `const HIGH_ACTIVITY_THRESHOLD = 50`

### **Green Flag Indicators**
- Variables named with measurable nouns: `count`, `ratio`, `rate`, `average`, `total`, `days`
- Methods containing: `calculate`, `count`, `measure`, `sum`, `find`, `sort`, `aggregate`
- Return types that are numbers, strings, dates, or arrays of facts
- Comments that explain mathematical formulas or data sources
- Constants that define measurement units: `const DAYS_IN_ANALYSIS_PERIOD = 30`

---

## 🎯 Success Metrics

### **TypeScript Quality**
- **Zero interpretive code**: No methods that classify, rate, or assess
- **Pure mathematical calculations**: All operations use standard math/statistics
- **Objective facts only**: All data points are verifiable and measurable
- **No subjective thresholds**: No hardcoded "good vs bad" boundaries

### **LLM Integration Quality**
- **Rich factual data**: Comprehensive mathematical insights for LLM analysis
- **Clear instructions**: LLM knows exactly what analysis to perform
- **Flexible interpretation**: Same facts can be analyzed for different audiences
- **Maintainable separation**: Changes to analysis logic only require LLM prompt updates

**Result: TypeScript becomes a sophisticated data calculator. LLM becomes the intelligent analyst. Both excel at their core competencies.**