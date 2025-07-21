#!/bin/bash

# Claude Commands Setup Script
# This script can be run with: curl -fsSL https://raw.githubusercontent.com/LongTermSupport/cc-commands/main/setup.sh | bash

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check if .claude directory exists in current directory
if [ ! -d ".claude" ]; then
    print_error ".claude directory not found in current directory."
    print_info "This script must be run from a directory containing a .claude folder."
    exit 1
fi

# Check if .git directory exists at the same level as .claude
if [ ! -d ".git" ]; then
    print_error "No .git directory found at the project root."
    print_info "This script requires a Git repository to be initialized in the same directory as .claude"
    print_info "Please run 'git init' or ensure you're in a Git repository root directory."
    exit 1
fi

# Establish absolute paths
PROJECT_PATH="$(pwd)"
CLAUDE_PATH="$PROJECT_PATH/.claude"

# Check if symlink already exists
SYMLINK_PATH="$CLAUDE_PATH/commands/g"
if [ -e "$SYMLINK_PATH" ] || [ -L "$SYMLINK_PATH" ]; then
    print_error "Symlink $SYMLINK_PATH already exists."
    print_info "Please remove it manually if you want to recreate it."
    exit 1
fi

# Clone or update the cc-commands repository
REPO_PATH="$CLAUDE_PATH/cc-commands"
REPO_URL="git@github.com:LongTermSupport/cc-commands.git"

if [ -d "$REPO_PATH" ]; then
    print_info "Repository already exists, updating..."
    if (cd "$REPO_PATH" && git pull --rebase); then
        print_success "Repository updated successfully"
    else
        print_error "Failed to update repository"
        exit 1
    fi
else
    print_info "Cloning cc-commands repository..."
    if git clone "$REPO_URL" "$REPO_PATH"; then
        print_success "Repository cloned successfully"
    else
        print_error "Failed to clone repository"
        exit 1
    fi
fi

# Create commands directory if it doesn't exist
if [ ! -d ".claude/commands" ]; then
    print_info "Creating .claude/commands directory..."
    mkdir -p .claude/commands
    print_success "Created .claude/commands directory"
fi

# Create or update .gitignore in .claude directory
GITIGNORE_PATH=".claude/.gitignore"
if [ ! -f "$GITIGNORE_PATH" ]; then
    print_info "Creating .claude/.gitignore..."
    echo "cc-commands/" > "$GITIGNORE_PATH"
    print_success "Created .claude/.gitignore"
else
    # Check if cc-commands/ is already in .gitignore
    if ! grep -q "^cc-commands/$" "$GITIGNORE_PATH"; then
        print_info "Adding cc-commands/ to .claude/.gitignore..."
        echo "cc-commands/" >> "$GITIGNORE_PATH"
        print_success "Updated .claude/.gitignore"
    else
        print_info ".claude/.gitignore already contains cc-commands/"
    fi
fi

# Create symlink
TARGET_PATH="$REPO_PATH/export/commands/g"

print_info "Creating symlink from $SYMLINK_PATH to $TARGET_PATH..."
if ln -s "$TARGET_PATH" "$SYMLINK_PATH"; then
    print_success "Symlink created successfully"
else
    print_error "Failed to create symlink"
    exit 1
fi

print_success "Setup completed successfully!"
print_info "You can now use the 'g' commands in Claude by typing /g"