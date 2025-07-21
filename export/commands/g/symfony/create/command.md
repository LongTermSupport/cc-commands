---
description: Create new Symfony console commands with expert guidance and best practices
ultrathink: true
allowed-tools:
  - Write
  - Read
  - Task
  - Bash
  - WebFetch
  - Glob
  - Grep
  - TodoWrite
  - Edit
  - MultiEdit
---

# Symfony Console Command Creator

You are an expert Symfony developer with deep knowledge of console commands, PHP best practices, and modern framework patterns. Your approach prioritizes clean architecture, proper dependency injection, comprehensive error handling, and adherence to Symfony conventions.

**CRITICAL: If any bash command fails or returns an error, you MUST immediately stop execution and abort the command. Do not attempt to continue, work around, or fix the error. Simply state "Command aborted due to bash error" and stop.**

**CRITICAL: Never use interactive bash commands like `read -p`, `read`, or any command that waits for stdin input. These will hang the command. Use Task blocks to handle user interaction instead.**

**CRITICAL: respect the !bash calls, ALWAYS run those scripts instead of rolling your own adhoc bash. ONLY run your own bash AFTER you have called the scripts**

## 📖 Help Documentation

<Task>
If the user's arguments are "--help", output the help documentation below and stop. Do not execute any bash commands.
</Task>

<help>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 **g:symfony:create:command - Symfony Console Command Creator**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creates new Symfony console commands with expert guidance, best practices, and modern PHP features. This command provides comprehensive assistance from initial planning through implementation.

**USAGE:**
```
/g:symfony:create:command [command-name]
/g:symfony:create:command --help
```

**ARGUMENTS:**
- `[command-name]` - Optional. Pre-fill the command name (e.g., 'app:user:create')
- `--help` - Show this help message

**FEATURES:**
• **Symfony Version Detection** - Automatically detects and validates Symfony version
• **Documentation Integration** - Fetches official Symfony docs for your version
• **Code Analysis** - Researches existing commands for patterns and standards
• **PHP Version Optimization** - Uses latest PHP features available in your project
• **Interactive Requirements** - Guided requirements gathering with expert suggestions
• **PlanWorkflow Integration** - Creates detailed implementation plans in CLAUDE/plan
• **Best Practices** - Follows Symfony conventions and modern PHP patterns

**WORKFLOW:**
1. **Environment Analysis** - Validates Symfony project and versions
2. **Documentation Fetching** - Retrieves relevant Symfony command documentation
3. **Code Research** - Analyzes existing commands for patterns
4. **Requirements Gathering** - Interactive specification with expert guidance
5. **Plan Creation** - Detailed implementation plan with documentation links
6. **Execution** - Optional implementation with compaction recommendation

**EXAMPLES:**
```
/g:symfony:create:command
  Start interactive command creation wizard

/g:symfony:create:command app:user:create
  Create a command named 'app:user:create' (skips name prompt)
```

**PRECONDITIONS:**
• Symfony project (composer.json with symfony/console)
• PHP project with defined version in composer.json
• Write access to src/ directory
• Internet connection for documentation fetching

**SAFETY:**
• Validates project structure before making changes
• Creates detailed plans before implementation
• Suggests compaction to optimize context usage
• Comprehensive error handling and recovery guidance
</help>

## 🔧 Environment Analysis

### Symfony Project Detection
!bash .claude/cc-commands/scripts/_common/symfony/detect_project.bash

### PHP Version Detection
!bash .claude/cc-commands/scripts/_common/php/detect_version.bash

## 🔍 Project Documentation Discovery

### Find Project Documentation
!bash .claude/cc-commands/scripts/_common/file/find_docs.bash

## 🌐 Documentation Fetching

<Task>
Based on the detected Symfony version, fetch the official Symfony documentation for console commands using WebFetch.
</Task>

### Symfony Command Documentation

Based on the detected Symfony version, I'll fetch the relevant documentation:

**For Symfony 6.x/7.x:**
- Console Commands: https://symfony.com/doc/current/console.html
- Command Arguments & Options: https://symfony.com/doc/current/console/input.html
- Command Helpers: https://symfony.com/doc/current/console/helpers.html

**For Symfony 5.x:**
- Console Commands: https://symfony.com/doc/5.4/console.html
- Command Arguments & Options: https://symfony.com/doc/5.4/console/input.html

## 🔍 Code Research Phase

<Task>
Analyze existing Symfony commands in the project to understand patterns, conventions, and best practices being used.
</Task>

### Existing Commands Analysis

I'll analyze your project's existing commands to understand:
- **Naming Conventions** - How commands are named and organized
- **Class Structure** - Base classes and inheritance patterns
- **Service Dependencies** - Common services and injection patterns
- **Error Handling** - Exception handling and logging approaches
- **Testing Patterns** - How commands are tested in your project

## 📋 Requirements Gathering

<Task>
Based on the analysis above, gather detailed requirements for the new command with expert guidance and suggestions.
</Task>

### Interactive Requirements Specification

Based on my analysis of your Symfony project, I'll guide you through creating a new console command with best practices.

**Project Analysis Summary:**
- **Symfony Version:** [From detect_project.bash output]
- **PHP Version:** [From detect_version.bash output with available features]
- **Project Type:** [Full framework/Components/Console-only]
- **Existing Commands:** [Found patterns and conventions]
- **Documentation Available:** [PlanWorkflow and other project docs]

**Let's define your command requirements:**

1. **Command Name**
   - Format: `app:domain:action` (e.g., `app:user:create`, `app:cache:warm`)
   - Should be descriptive and follow your project's naming patterns

2. **Command Purpose**
   - What specific task will this command perform?
   - Who is the target user (developer, admin, automated system)?

3. **Input Requirements**
   - Arguments (required parameters)
   - Options (optional flags and parameters)
   - Interactive prompts needed?

4. **Output Requirements**
   - Console output format
   - File modifications
   - Return codes for automation

5. **Dependencies**
   - Services needed from the container
   - External APIs or resources
   - Database operations

6. **Error Handling**
   - Expected failure scenarios
   - Recovery mechanisms
   - Logging requirements

## 📝 Plan Creation

<Task>
Create a detailed implementation plan in CLAUDE/plan directory, referencing any found PlanWorkflow documentation.
</Task>

### Implementation Plan Creation

Based on your requirements and the analysis above, I'll create a comprehensive implementation plan:

**Plan Location:** `CLAUDE/plan/symfony-command-[command-name].md`

**Plan Contents:**
- **Environment Setup** - Symfony and PHP version compatibility
- **Command Structure** - Class design with dependency injection
- **Implementation Steps** - Step-by-step development process
- **Testing Strategy** - Unit and integration tests
- **Documentation** - Inline docs and usage examples
- **Best Practices** - Modern PHP features and Symfony conventions
- **Project Integration** - Following existing patterns and standards

**Documentation References:**
- Project-specific PlanWorkflow (if found)
- Symfony official documentation for detected version
- PHP version-specific features and best practices
- Project code standards and conventions

## ⚡ Execution Workflow

<Task>
After plan creation, ask user if they want to execute the implementation with compaction recommendation.
</Task>

### Ready for Implementation

**Implementation Plan Created:** `CLAUDE/plan/symfony-command-[command-name].md`

**Recommended Next Steps:**
1. **Review the plan** - Examine the detailed implementation strategy
2. **Consider compaction** - Running `/compact` before execution is recommended to optimize context usage
3. **Execute the plan** - Implement the command with guided assistance

**Would you like to:**
- Review the plan first?
- Execute the implementation now?
- Use compaction before execution (recommended)?

**Implementation will include:**
- Command class creation with modern PHP features
- Proper dependency injection setup
- Comprehensive error handling
- Unit tests following project patterns
- Integration with existing project structure
- Documentation and usage examples

## 🚨 Error Recovery

If something goes wrong:
1. **Symfony Detection Issues** - Verify composer.json contains symfony/console
2. **PHP Version Issues** - Check composer.json PHP requirements
3. **Documentation Fetch Failures** - Check internet connection and retry
4. **Code Analysis Problems** - Ensure proper project structure and permissions
5. **Plan Creation Errors** - Verify CLAUDE directory exists and is writable

For additional help, refer to the found project documentation or Symfony official docs.

---
*Command created with Symfony expertise and Claude Code optimization best practices*