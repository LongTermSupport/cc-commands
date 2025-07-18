# Claude Commands (cc-commands)

A command management system for Claude Code that enables you to **create and update custom slash commands** directly from within Claude Code.

## The Power of Self-Managing Commands

The core feature of cc-commands is that it includes commands to manage commands themselves:

- **`/g:command:create`** - Create new commands without leaving Claude Code
- **`/g:command:update`** - Update existing commands using the latest best practices

This means you can build your command library iteratively while working, without ever leaving your Claude Code session!

## How Claude Code Commands Work

In Claude Code, slash commands use colon (`:`) separators, not slashes:

- ✅ Correct: `/g:command:create`
- ❌ Wrong: `/g/command/create`

The file system uses slashes (`.claude/commands/g/command/create.md`), but when invoking commands in Claude Code, always use colons.

## Installation

### Quick Install

From your project root (where `.claude` directory exists):

```bash
curl -fsSL https://raw.githubusercontent.com/LongTermSupport/cc-commands/main/setup.sh | bash
```

This installs the complete command system including:
- Command management tools (`/g:command:create`, `/g:command:update`, `/g:command:sync`)
- GitHub integration tools (`/g:gh:issue:plan`, `/g:gh:push`)
- Workflow planning tools (`/g:w:plan`)

### Manual Install

1. Clone this repository into your `.claude` directory:
   ```bash
   git clone git@github.com:LongTermSupport/cc-commands.git .claude/cc-commands
   ```

2. Create a symlink for the global commands:
   ```bash
   ln -s "$(pwd)/.claude/cc-commands/export/commands/g" .claude/commands/g
   ```

3. Add cc-commands to your `.claude/.gitignore`:
   ```bash
   echo "cc-commands/" >> .claude/.gitignore
   ```

## Creating Your First Command

Once installed, you can create commands in two ways:

### Interactive Mode
Type `/g:command:create` and answer the prompts:
```
You: /g:command:create
Claude: Please provide:
1. Command name (use : for namespacing, e.g., git:commit, db:migrate)
2. Primary purpose (one clear sentence)  
3. Makes changes? (yes/no)
```

### Full Argument Mode (Faster!)
Pass all requirements at once:
```
You: /g:command:create test:integration "Run integration tests with database setup. Should set up test database, run all integration tests, and clean up after. Needs mysql and phpunit."

Claude: [Creates the command immediately with all requirements]
```

The format is: `/g:command:create [name] "[full requirements description]"`

Your new command is instantly available and supports similar patterns!

## Updating Commands

Update existing commands with new features or improvements:

### Basic Update (Latest Standards)
```
/g:command:update test:integration
```

### Update with Specific Changes
```
/g:command:update test:integration "Add support for running specific test files as arguments. Also add a --coverage flag to generate code coverage reports."
```

The update process:
1. Reads the existing command
2. Extracts core functionality
3. Applies your requested changes
4. Regenerates using latest best practices
5. Preserves existing behavior while adding new features

## Command Namespaces

### Global Commands (`g` namespace)

Pre-installed commands available to all projects:

#### Command Management (`g:command:*`)
- `/g:command:create` - Create new commands with best practices and safety features
- `/g:command:update` - Update existing commands to latest standards while preserving functionality
- `/g:command:sync` - Synchronize cc-commands repository with intelligent commit generation

#### GitHub Integration (`g:gh:*`)
- `/g:gh:issue:plan` - Create comprehensive plans from GitHub issues
- `/g:gh:push` - Smart Git push with GitHub Actions monitoring and failure diagnosis

#### Workflow Tools (`g:w:*`)
- `/g:w:plan` - Generate comprehensive project plans with progress tracking
- `/g:w:execute` - Execute previously created plans with workflow-based approach and status verification

### Project Commands (custom namespaces)

Organize your commands with meaningful namespaces:
- `/db:migrate` - Database operations
- `/test:unit` - Run unit tests
- `/test:integration` - Run integration tests
- `/deploy:staging` - Deploy to staging
- `/git:release` - Create a release

## Command Features

All commands in the cc-commands repository include:

### Safety Features
- **Bash permission system** - Commands declare what bash commands they need with risk categorization
- **Fail-fast validation** - Comprehensive precondition checks with clear error messages
- **User confirmations** - For any destructive operations with detailed impact explanations
- **Non-interactive commands only** - Prevents hanging on user input with Task blocks for interaction
- **Error recovery guidance** - Specific instructions for common failure scenarios

### Best Practices
- **Progress tracking** - Clear status updates with structured output formats
- **Error handling** - Graceful failures with recovery instructions and troubleshooting steps
- **Documentation** - Each command is self-documenting with comprehensive `--help` support
- **Project integration** - Commands can reference and analyze your project's documentation
- **Flexible invocation** - Support both interactive and full argument modes for efficiency
- **GitHub integration** - Native support for GitHub CLI and Actions monitoring

### Advanced Capabilities
- **Full argument support** - Pass all requirements at invocation time for automation
- **Interactive fallback** - Prompts for missing information with intelligent defaults
- **Tool restrictions** - Commands only get access to tools they need for security
- **Workflow patterns** - Dry-run modes, progressive execution, real-time monitoring
- **Smart commit generation** - Automatic commit message creation based on actual changes
- **Repository synchronization** - Built-in sync capabilities for sharing commands across projects

## The --help Convention

All commands support the `--help` argument:

```bash
/g:command:create --help
/g:command:update --help
/g:gh:issue:plan --help
```

Help documentation includes:
- Description and purpose
- Usage patterns
- Available arguments
- Examples
- Preconditions
- Safety notes

## Example: Creating a Database Command

```
You: /g:command:create

Claude: Please provide:
1. Command name: db:reset
2. Primary purpose: Reset database to clean state with test data
3. Makes changes? yes

Claude: [Gathers more requirements about preconditions, safety checks, etc.]

Claude: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚠️  BASH COMMAND PERMISSIONS REQUIRED  ⚠️
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       
       Your command requires permission to execute:
       
       🟡 MEDIUM RISK (2 commands):
         • mysql - Database queries
         • php - Run migrations
       
       Do you approve these permissions? (yes/no)

You: yes

Claude: [Creates the command with all safety checks and best practices]
```

## What is Claude Code?

Claude Code is Anthropic's official CLI coding assistant. It enables:

- Interactive coding sessions with Claude
- File system access and modification
- Running commands and scripts
- Custom workflows via slash commands

Learn more:
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Slash Commands Guide](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Interactive Mode](https://docs.anthropic.com/en/docs/claude-code/interactive-mode)

## Tips for Effective Commands

1. **Start simple** - Create basic commands first, then enhance them
2. **Use namespaces** - Organize related commands (e.g., all test commands under `test:`)
3. **Document assumptions** - Be clear about what your command expects
4. **Test thoroughly** - Run your commands in different scenarios
5. **Share useful ones** - Submit PRs to add helpful commands to the global namespace

## Keeping Commands Updated

### Synchronizing with Latest Changes

The cc-commands repository is actively maintained. To get the latest updates:

```bash
/g:command:sync
```

This command:
1. Commits any local changes you've made
2. Pulls the latest updates from the repository
3. Pushes your changes to share with other projects
4. Handles merge conflicts gracefully

### Available Commands

To see all available commands:

```bash
find .claude/commands -name "*.md" | sed 's|.claude/commands/||' | sed 's|\.md$||' | sed 's|/|:|g'
```

## Troubleshooting

### Commands not working?

1. **Check syntax** - use colons: `/g:command:create` not `/g/command/create`
2. **Verify installation**:
   ```bash
   ls -la .claude/commands/g
   ```
3. **Check permissions** - ensure your `.claude/settings.local.json` allows required bash commands
4. **Restart Claude Code** - new commands need session restart for tab completion

### Common Issues

- **Permission denied**: Check bash permissions in `.claude/settings.local.json`
- **Command not found**: Verify symlink exists: `ls -la .claude/commands/g`
- **Git issues**: Ensure you have push access to the cc-commands repository
- **Sync failures**: Check network connection and GitHub authentication

### Getting Help

Every command supports detailed help:

```bash
/g:command:create --help
/g:command:sync --help
/g:gh:push --help
```

## Contributing

To contribute global commands:

1. Fork this repository
2. Use `/g:command:create` to create your command locally
3. Test it thoroughly
4. Copy it to the appropriate location in `export/commands/g/`
5. Submit a PR

## Repository

**GitHub**: https://github.com/LongTermSupport/cc-commands

## License

MIT License - Feel free to use, modify, and share!

## Support

- **Issues**: [GitHub Issues](https://github.com/LongTermSupport/cc-commands/issues)
- **Claude Code Docs**: [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)
- **Slash Commands Guide**: [Claude Code Slash Commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

## Contributing

To contribute global commands:

1. Fork this repository
2. Use `/g:command:create` to create your command locally
3. Test it thoroughly in different scenarios
4. Use `/g:command:sync` to commit and share your changes
5. Submit a PR with your new command

All contributions should follow the established patterns and include comprehensive help documentation.

---

*Building better Claude Code workflows, one command at a time.* 🚀