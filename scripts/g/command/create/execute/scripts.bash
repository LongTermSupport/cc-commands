#!/usr/bin/env bash
# Script: create_scripts.bash
# Purpose: Create script structure for commands following orchestrator pattern
# Usage: create_scripts.bash <command_name> <scripts_config>
# Output: Script creation status

set -euo pipefail
IFS=$'\n\t'

# Get script directory
# Get script directory and resolve COMMON_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(realpath "$SCRIPT_DIR/../../../../_common")" || {
    echo "ERROR: Cannot resolve COMMON_DIR from $SCRIPT_DIR" >&2
    exit 1
}

# Source helpers and error handler via safe_source pattern
# shellcheck disable=SC1091  # helpers.inc.bash path is validated above
source "$COMMON_DIR/_inc/helpers.inc.bash"
safe_source "error_handler.inc.bash"  # safe_source handles path validation

# Arguments
COMMAND_NAME="${1:-}"
SCRIPTS_CONFIG="${2:-}"

main() {
    if [ -z "$COMMAND_NAME" ] || [ -z "$SCRIPTS_CONFIG" ]; then
        error_exit "Usage: create_scripts.bash <command_name> <scripts_config>"
    fi
    
    echo "✓ Creating script structure for: $COMMAND_NAME"
    
    # Determine base script directory
    local namespace=""
    local command=""
    
    if [[ "$COMMAND_NAME" == *:* ]]; then
        namespace="${COMMAND_NAME%:*}"
        command="${COMMAND_NAME##*:}"
        SCRIPTS_BASE=".claude/cc-commands/scripts/${namespace//://}/${command}"
    else
        SCRIPTS_BASE=".claude/cc-commands/scripts/$COMMAND_NAME"
    fi
    
    echo "SCRIPTS_BASE=$SCRIPTS_BASE"
    
    # Create directory structure
    mkdir -p "$SCRIPTS_BASE"/{pre,analysis,execute,post}
    echo "✓ Created directory structure"
    
    # Create orchestrator script
    local orchestrator_path="$SCRIPTS_BASE/${command}_orchestrate.bash"
    
    cat > "$orchestrator_path" << 'EOF'
#!/usr/bin/env bash
# Script: ${command}_orchestrate.bash
# Purpose: Main orchestrator for ${COMMAND_NAME} command
# Usage: ${command}_orchestrate.bash [mode] [arguments]
# Output: Structured output with KEY=value pairs

set -euo pipefail
IFS=$'\n\t'

# Script paths

# Store outputs from sub-scripts
declare -A SCRIPT_OUTPUTS

# Function to capture and parse script outputs
capture_script_output() {
    local script_path="$1"
    shift
    local args="$@"
    local temp_file=$(mktemp)
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "→ Running: ${script_path##*/}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if bash "$script_path" $args > "$temp_file" 2>&1; then
        cat "$temp_file"
        
        # Extract KEY=value pairs
        while IFS= read -r line; do
            if [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                SCRIPT_OUTPUTS["$key"]="$value"
            fi
        done < "$temp_file"
    else
        local exit_code=$?
        echo "ERROR: Script failed with exit code $exit_code"
        cat "$temp_file"
        rm -f "$temp_file"
        return $exit_code
    fi
    
    rm -f "$temp_file"
    echo ""
    return 0
}

main() {
    local mode="${1:-analyze}"
    shift || true
    local arguments="$@"
    
    echo "=== ${COMMAND_NAME} ORCHESTRATOR ==="
    echo "MODE=$mode"
    echo ""
    
    case "$mode" in
        analyze)
            # Add your analysis phase scripts here
            echo "=== ANALYSIS COMPLETE ==="
            ;;
            
        execute)
            # Add your execution phase scripts here
            echo "=== EXECUTION COMPLETE ==="
            ;;
            
        *)
            error_exit "Unknown mode: $mode. Valid modes: analyze, execute"
            ;;
    esac
}

main "$@"
echo "Script success: ${0##*/}"
EOF
    
    # Substitute variables in the template
    sed -i "s/\${command}/$command/g" "$orchestrator_path"
    sed -i "s/\${COMMAND_NAME}/$COMMAND_NAME/g" "$orchestrator_path"
    
    chmod +x "$orchestrator_path"
    echo "✓ Created orchestrator: $orchestrator_path"
    echo "ORCHESTRATOR_CREATED=true"
    
    # Create a sample pre-check script
    local precheck_path="$SCRIPTS_BASE/pre/env_validate.bash"
    
    cat > "$precheck_path" << 'EOF'
#!/usr/bin/env bash
# Script: env_validate.bash
# Purpose: Validate environment for ${COMMAND_NAME}
# Usage: env_validate.bash
# Output: Environment status in KEY=value format

set -euo pipefail
IFS=$'\n\t'

# Get script directory

main() {
    echo "✓ Validating environment"
    
    # Add your validation checks here
    echo "ENVIRONMENT_VALID=true"
}

main
echo "Script success: ${0##*/}"
EOF
    
    sed -i "s/\${COMMAND_NAME}/$COMMAND_NAME/g" "$precheck_path"
    chmod +x "$precheck_path"
    echo "✓ Created sample pre-check script"
    
    echo "SCRIPTS_CREATED=true"
}

main
