# Script Infrastructure Migration Guide

This guide helps identify and convert Claude Code commands to use the optimized bash script infrastructure.

## Identifying Conversion Candidates

### High Priority Indicators

Commands with these characteristics should be converted first:

1. **Heavy Bash Usage** (>30% of file)
   - Multiple bash blocks doing related operations
   - Complex conditional logic in bash
   - Loops and workflow monitoring

2. **Repeated Patterns**
   - Environment validation checks
   - Git operations (status, commit, push)
   - File discovery and processing
   - GitHub API interactions

3. **Performance Issues**
   - Multiple subprocess calls
   - Redundant operations
   - Excessive output

### Quick Assessment

```bash
# Count bash blocks in a command
grep -c "^!" command.md

# Check file size
wc -l command.md

# Rough bash percentage
echo "scale=2; $(grep -c "^!" command.md) / $(wc -l < command.md) * 100" | bc
```

## Migration Process

### Step 1: Analyze Current Command

Create an analysis document:

```markdown
# Command Analysis: [command-name]

## Bash Operations
1. Environment checks: [list specific checks]
2. Git operations: [list operations]
3. File operations: [list operations]
4. API calls: [list calls]

## Repeated Patterns
- [Pattern 1]: Found in X locations
- [Pattern 2]: Found in Y locations

## Data Flow
Input -> [Process 1] -> [Process 2] -> Output

## Complexity Points
- [Complex logic 1]
- [Complex logic 2]
```

### Step 2: Design Script Architecture

Map operations to scripts:

```
Environment Validation -> push_env_check.bash
Repository Analysis -> git_state_analysis.bash (common)
Commit Generation -> git_smart_commit.bash (common)
Main Logic -> push_execute.bash
Monitoring -> gh_workflow_ops.bash (common)
```

### Step 3: Create/Identify Common Scripts

Check existing common scripts:
```bash
ls -la .claude/cc-commands/scripts/_common/*/
```

Create new ones if needed following the template:
```bash
#!/usr/bin/env bash
# Script: category_operation.bash
# Purpose: [Purpose]
# Usage: [Usage]
# Output: [Output format]
```

### Step 4: Implement Command Script

Create the main command script:
```bash
.claude/cc-commands/scripts/[namespace]/[command]/[command]_[action].bash
```

### Step 5: Update Command File

Convert the command to use scripts:

**Before:**
```markdown
!echo "Checking environment"; \
test -d .git && echo "Git: OK" || exit 1; \
which gh && echo "GH: OK" || exit 1; \
# ... more bash
```

**After:**
```markdown
!bash .claude/cc-commands/scripts/g/mycommand/mycommand_check.bash
```

### Step 6: Test and Validate

1. Test scripts independently
2. Test full command flow
3. Compare output with original
4. Verify error handling
5. Check performance improvement

## Common Conversion Patterns

### Environment Validation

**Before:**
```bash
!test -d .git || { echo "Not a git repo"; exit 1; }
!which gh || { echo "gh not found"; exit 1; }
!gh auth status || { echo "Not authenticated"; exit 1; }
```

**After:**
```bash
!bash .claude/cc-commands/scripts/_common/env/env_validate.bash all
```

### Repository State Analysis

**Before:**
```bash
!BRANCH=$(git branch --show-current)
!CHANGES=$(git status --porcelain | wc -l)
!if [ $CHANGES -gt 0 ]; then
  echo "Has changes"
fi
```

**After:**
```bash
!bash .claude/cc-commands/scripts/_common/git/git_state_analysis.bash detailed
```

### Smart Operations

**Before:**
```bash
!echo "Enter commit message:"
# Complex message generation logic
!git add -A
!git commit -m "$MESSAGE"
```

**After:**
```bash
!bash .claude/cc-commands/scripts/_common/git/git_smart_commit.bash commit --smart
```

## Migration Checklist

- [ ] Analyze current command structure
- [ ] Identify common patterns
- [ ] Design script architecture
- [ ] Check for existing common scripts
- [ ] Create new common scripts if needed
- [ ] Implement command-specific scripts
- [ ] Update command file to use scripts
- [ ] Test each script independently
- [ ] Test full command flow
- [ ] Verify error handling
- [ ] Document any new patterns
- [ ] Update relevant documentation
- [ ] Add to CI/CD checks

## Benefits Tracking

Track improvements after migration:

### Metrics to Measure

1. **Line Count Reduction**
   ```bash
   # Before
   wc -l command-old.md
   
   # After  
   wc -l command-new.md
   ```

2. **Subprocess Reduction**
   ```bash
   # Count bash calls
   grep -c "^!" command.md
   ```

3. **Execution Time**
   ```bash
   time claude-code /command
   ```

4. **Output Volume**
   ```bash
   claude-code /command 2>&1 | wc -l
   ```

### Expected Improvements

- 40-60% reduction in command file size
- 70-80% reduction in subprocess calls
- 30-50% faster execution
- 60-80% less output noise
- Better error messages
- Improved maintainability

## Gradual Migration Strategy

1. **Phase 1**: Convert high-value commands
   - Most frequently used
   - Most complex
   - Performance bottlenecks

2. **Phase 2**: Extract common patterns
   - Create reusable scripts
   - Update documentation
   - Train on new patterns

3. **Phase 3**: Convert remaining commands
   - Apply learned patterns
   - Optimize further
   - Complete migration

## Troubleshooting

### Common Issues

1. **Script not found**
   - Check path from command directory
   - Verify script exists and has correct name

2. **Permission denied**
   - Scripts don't need +x permissions
   - Called via `bash script.bash`

3. **Variable not set**
   - Check script output format
   - Ensure proper eval usage
   - Verify KEY=value format

4. **Unexpected output**
   - Check noise suppression
   - Verify output modes
   - Test script independently

## Resources

- [Script Standards](CLAUDE.md)
- [Common Scripts](../scripts/_common/CLAUDE.md)
- [Lessons Learned](LESSONS-LEARNED.md)
- [Example Conversion](EXAMPLE-CONVERSION.md)