#!/usr/bin/env bash
# Script: error_handlers.bash
# Purpose: Bridge script that sources the new include file for backward compatibility
# Usage: source error_handlers.bash
# Note: This file maintains backward compatibility while transitioning to inc/error_handler.bash

# Get the directory of this script
_ERROR_HANDLERS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the new include file from _inc directory
source "$_ERROR_HANDLERS_DIR/../../_inc/error_handler.inc.bash"

# The new include provides all the same functions:
# - error_exit
# - warn
# - info
# - success
# - debug
# - run_with_output
# - silent_run
# - require_command
# - require_directory
# - require_file
# - require_git_repo

# This script now just acts as a bridge for backward compatibility