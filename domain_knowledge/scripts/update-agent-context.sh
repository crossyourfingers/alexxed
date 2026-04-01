#!/usr/bin/env bash
set -euo pipefail

# Minimal stub: detect agent name args and emit a simple JSON success
AGENT_NAME=""
if [[ $# -gt 0 ]]; then
  AGENT_NAME="$1"
fi

echo "{\"updated\":true,\"agent\":\"${AGENT_NAME}\"}"

exit 0
