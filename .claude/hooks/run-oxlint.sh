#!/usr/bin/env bash
set -euo pipefail

# Claude passes a JSON payload on stdin. Extract the edited file path.
file_path="$(jq -r '.tool_input.file_path // ""')"

# Only lint JS/TS/TSX/JSX/Vue files
if [[ "$file_path" =~ \.(js|jsx|ts|tsx|vue)$ ]]; then
  # Use pnpm to run oxlint (lint:fast script)
  if command -v pnpm >/dev/null 2>&1 && [ -f "pnpm-lock.yaml" ]; then
    pnpm lint:fast
  else
    echo "Warning: pnpm not found or pnpm-lock.yaml missing"
    exit 0
  fi
fi
