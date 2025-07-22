# Refactor Helpers and Standardize Temp File Management

**Critical Issues Identified:**
1. **Duplicate `capture_script_output` function** across orchestrator scripts
2. **Bloated `error_handler.inc.bash`** containing generic helpers
3. **Inconsistent temp file management** using `mktemp` instead of standardized approach
4. **Previous bulk updates introduced unintended changes** - need robust validation

## Progress

[ ] **Phase 1: Analysis and Validation**
  [ ] Audit all current helper function duplications
  [ ] Analyze error_handler.inc.bash bloat
  [ ] Identify all temp file usage patterns  
  [ ] Create validation framework for bulk updates
[ ] **Phase 2: Helper Function Consolidation**
  [ ] Move `capture_script_output` to helpers.inc.bash
  [ ] Refactor error_handler.inc.bash (keep only error handling)
  [ ] Move generic helpers to helpers.inc.bash
  [ ] Update all scripts to use consolidated functions
[ ] **Phase 3: Temp File Standardization**
  [ ] Create `create_temp_file` function using var/ directory
  [ ] Implement proper cleanup with exit traps
  [ ] Replace all `mktemp` usage with standardized approach
  [ ] Add temp file cleanup validation
[ ] **Phase 4: Robust Bulk Update System**
  [ ] Create validation-first bulk update approach
  [ ] Test changes on subset before full deployment
  [ ] Implement change verification system
  [ ] Document safe bulk update methodology

## Detailed Implementation Plan

### Phase 1: Analysis and Validation

#### 1.1 Function Duplication Audit

**Objective**: Find all duplicate function definitions across scripts

**Approach**:
```bash
# Create analysis script in var/
var/analyze_duplicates.bash:
- Search for function definitions across all .bash files
- Identify duplicate function names
- Report which functions appear in multiple files
- Generate consolidation recommendations
```

**Expected Findings**:
- `capture_script_output` duplicated in orchestrator scripts
- Debug/logging functions scattered across scripts
- Utility functions redefined in multiple places

#### 1.2 Error Handler Bloat Analysis

**Current Issues**:
- `error_handler.inc.bash` contains generic utilities beyond error handling
- Should focus only on: `error_exit`, `run_with_output`, `silent_run`, etc.
- Generic functions should move to `helpers.inc.bash`

**Analysis Script**:
```bash
var/analyze_error_handler.bash:
- Parse error_handler.inc.bash functions
- Categorize: error-specific vs generic utilities
- Generate migration plan
```

#### 1.3 Temp File Usage Audit

**Current Problems**:
- Scripts use `mktemp` directly → creates files outside var/
- No standardized cleanup approach
- Inconsistent temp file patterns

**Audit Script**:
```bash
var/audit_temp_files.bash:
- Find all mktemp usage across scripts
- Identify cleanup patterns (or lack thereof)
- Document current temp file locations
```

#### 1.4 Validation Framework

**Critical Requirement**: Before any bulk updates, establish validation

**Validation Components**:
```bash
var/validate_changes.bash:
- Compare function signatures before/after changes
- Verify no unintended script modifications
- Check that only targeted changes occurred
- Validate all scripts still source correctly
- Run shellcheck on all modified scripts
```

### Phase 2: Helper Function Consolidation

#### 2.1 Consolidate `capture_script_output`

**Current State**:
```bash
# Function appears in multiple orchestrator scripts
# Each with slight variations
```

**Target State**:
```bash
# In helpers.inc.bash:
capture_script_output() {
    local script_path="$1"
    shift
    local args=("$@")
    local temp_file
    temp_file=$(create_temp_file "script_output")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"  
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" "${args[@]}" > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs into SCRIPT_OUTPUTS
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                SCRIPT_OUTPUTS["$key"]="$value"
            fi
        done < "$temp_file"
        
        cleanup_temp_file "$temp_file"
        return 0
    else
        local exit_code=$?
        echo "ERROR: Script failed with exit code $exit_code"
        cat "$temp_file"
        cleanup_temp_file "$temp_file"
        return $exit_code
    fi
    
    echo ""
}
```

#### 2.2 Refactor error_handler.inc.bash

**Keep in error_handler.inc.bash** (error-specific only):
- `error_exit`
- `run_with_output` 
- `silent_run`
- Error formatting functions

**Move to helpers.inc.bash** (generic utilities):
- Debug functions
- Info/success/warning functions
- Any non-error utilities

#### 2.3 Update All Scripts

**Surgical Update Approach**:
1. **Test on 3 scripts first**
2. **Validate changes work correctly**  
3. **Apply to remaining scripts**
4. **Validate entire codebase**

### Phase 3: Temp File Standardization

#### 3.1 Create Standardized Temp File Functions

**Add to helpers.inc.bash**:
```bash
# Global temp file tracking
declare -a TEMP_FILES=()

# Create temp file in var/ directory  
create_temp_file() {
    local prefix="${1:-temp}"
    local temp_file="var/${prefix}_$$_$(date +%s%N)"
    
    # Ensure var directory exists
    [[ -d "var" ]] || {
        echo "ERROR: var/ directory not found - run from cc-commands root" >&2
        exit 1
    }
    
    touch "$temp_file"
    TEMP_FILES+=("$temp_file")
    echo "$temp_file"
}

# Clean up specific temp file
cleanup_temp_file() {
    local file="$1"
    [[ -f "$file" ]] && rm -f "$file"
    
    # Remove from tracking array
    local new_array=()
    for temp in "${TEMP_FILES[@]}"; do
        [[ "$temp" != "$file" ]] && new_array+=("$temp")
    done
    TEMP_FILES=("${new_array[@]}")
}

# Clean up all tracked temp files
cleanup_all_temp_files() {
    for temp_file in "${TEMP_FILES[@]}"; do
        [[ -f "$temp_file" ]] && rm -f "$temp_file"
    done
    TEMP_FILES=()
}

# Set up automatic cleanup on script exit
setup_temp_cleanup() {
    trap 'cleanup_all_temp_files' EXIT INT TERM
}
```

#### 3.2 Replace All mktemp Usage

**Pattern to Replace**:
```bash
# Old pattern:
local temp_file=$(mktemp)
trap 'rm -f "$temp_file"' EXIT

# New pattern:  
setup_temp_cleanup  # Once at script start
local temp_file=$(create_temp_file "operation_name")
```

**Update Script**:
```bash
var/replace_mktemp_usage.bash:
- Find all mktemp usage
- Replace with create_temp_file calls
- Add setup_temp_cleanup to script headers
- Remove manual trap cleanup (now automatic)
```

### Phase 4: Robust Bulk Update System

#### 4.1 Validation-First Approach

**Pre-Update Validation**:
```bash
var/pre_update_validate.bash:
- Snapshot current function signatures
- Test all scripts can source correctly
- Run shellcheck baseline
- Create rollback checkpoint
```

**Post-Update Validation**:  
```bash
var/post_update_validate.bash:
- Compare actual changes vs intended changes
- Verify function signatures match expectations
- Ensure no unintended modifications
- Run full shellcheck validation
- Test sample scripts execute correctly
```

#### 4.2 Incremental Update Strategy

**Approach**:
1. **Pilot Group** (3-5 scripts): Test changes on small subset
2. **Validation**: Ensure pilot group works perfectly
3. **Batch Updates**: Apply to groups of 10-15 scripts
4. **Continuous Validation**: After each batch
5. **Rollback Capability**: If any issues detected

#### 4.3 Change Verification System

**Verification Script**:
```bash
var/verify_changes.bash:
- Compare git diff with intended changes
- Flag any unexpected modifications
- Ensure only targeted lines were changed
- Validate no accidental deletions/additions
```

### Phase 5: Testing and Validation

#### 5.1 Function Testing

**Test Each Consolidated Function**:
- `capture_script_output` with various script outputs
- `create_temp_file` and cleanup functions
- All moved helper functions work identically

#### 5.2 Script Integration Testing  

**Test Sample Scripts**:
- One from each command type (create, sync, push, etc.)
- Verify sourcing works correctly
- Ensure temp file cleanup functions
- Check orchestrator patterns still work

#### 5.3 End-to-End Command Testing

**Test Full Commands**:
- `/g:command:create` - test script generation
- `/g:gh:push` - test git operations  
- `/g:w:execute` - test plan execution

## Success Criteria

### Code Quality Improvements
- [ ] **Zero function duplication** across codebase
- [ ] **Clean separation** of error vs generic helpers
- [ ] **Consistent temp file management** using var/ directory  
- [ ] **Automatic cleanup** for all temporary files

### Bulk Update Reliability
- [ ] **100% validation** - only intended changes applied
- [ ] **Rollback capability** if issues detected
- [ ] **Incremental deployment** to minimize risk
- [ ] **Change verification** system prevents accidents

### Maintainability 
- [ ] **Single source of truth** for common functions
- [ ] **Standardized patterns** across all scripts
- [ ] **Robust testing** framework for future changes
- [ ] **Documentation** of safe update procedures

## Risk Mitigation

### Previous Bulk Update Issues
- **Problem**: Unintended changes across many files
- **Solution**: Validation-first approach with change verification

### Function Consolidation Risks
- **Problem**: Breaking existing functionality
- **Solution**: Test on pilot group first, maintain identical signatures

### Temp File Migration Risks  
- **Problem**: Breaking existing temp file usage
- **Solution**: Incremental replacement with comprehensive testing

## Implementation Priority

1. **HIGH**: Validation framework (prevent future bulk update issues)
2. **HIGH**: Function consolidation analysis (understand current state)  
3. **MEDIUM**: Temp file standardization (improve reliability)
4. **MEDIUM**: Bulk update system improvements (long-term maintainability)

## Notes

- **All temp scripts in var/** will be properly ignored by git
- **Validation must pass 100%** before proceeding to next phase
- **Rollback plan required** for each phase
- **Documentation updates** as we proceed

This plan prioritizes **reliability over speed** - better to take time and get it right than break things with hasty bulk updates.