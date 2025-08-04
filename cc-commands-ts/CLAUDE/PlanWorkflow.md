# Task Planning and Execution

## Two Modes

We are always in 1 of 2 Modes. 
You are in planning mode by default. Execution mode only when made absolutely explicit 

### Planning Mode

NO CODE CHANGES

We create/update a plan file which should be stored in CLAUDE/Plan/(task-name).md

When we are planning a task, we need to do the following:

* full research of all relevant files/database tables etc
* terse but detailed plan of required actions
* code snippets for particularly relevant items
* check project documentation in CLAUDE folder for anything relevant and ensure we are meeting project standards
* create a simple TODO list at the top of the file
* in planning mode, NO CODE CHANGES

## Execution Mode

Only triggered once given explicit instruction to execute/proceed/implement the plan

When we are executing a plan
* once plan is approved, we are in execution mode.
* Make sure you have read
  * the relevant @CLAUDE/plan/(task-name).md plan file
  * @CLAUDE/PlanWorkflow.md
* Work through the list in the Progress section, 
* update Progress as we go. 
* Make sure tools are being run and issues resolved as we go. 
* Once plan is complete, add ALL DONE

## Task Status Tracking

The following symbols MUST be used to indicate task status in the Progress section:
* `[ ]` - Task not started
* `[⏳]` - Task in progress (currently being worked on)
* `[✓]` - Task completed 100%

As you work through the plan:
1. Mark tasks as `[⏳]` when you begin working on them
2. Mark tasks as `[✓]` ONLY when they are fully completed, tested, and validated
3. Update the plan document after EACH task status change
4. NEVER leave a task as `[⏳]` at the end of an execution session

## Plan Maintenance

* The plan document MUST be kept up to date at all times during execution
* After completing each task, immediately update its status in the plan
* If new tasks are discovered during execution, add them to the Progress section
* If a task needs to be broken down further, update the plan to reflect this
* Add "ALL DONE!" below the ## Progress heading ONLY when all tasks are completed AND static analysis reports no issues
* ALWAYS - stick to editing/updating a single plan file. Do not make new plan files related to the same plan, eg blah-blah-"updated".md 
  * UNLESS - you have been specifically asked to make a new plan

## Notes

The progress section of the plan must be kept up to date as things are updated.

Once a plan is fully completed, we need to insert the words "ALL DONE!" right below the ## Progress heading

Always include a prompt to read this document at the top of the plan

Always include prompts to read other relevant docs in the plan

## Example

```

# New Feature X Plan

Ensure all the following have been read:
- @CLAUDE/PlanWorkflow.md
- @CLAUDE/Core/CodeStandards.md
- @CLAUDE/Core/TestingStandards.md
- @CLAUDE/Tools/PHPStan.md
- @CLAUDE/Tools/Commands.md

## Progress

[ ] implement x
[⏳] refactor y
[✓] create tests for z
 
## Summary

A few sentences describing the goal

## Details

### Details about X

We need to do X so that Y can Z.
Must ensure that X is ...

### Details about Y

Y needs to be refactored to account for Z
Use PHPStan types
Create interface to allow testing with mocks

```