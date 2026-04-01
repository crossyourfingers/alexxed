#!/usr/bin/env bash
set -euo pipefail

JSON=false
PATHS_ONLY=false
REQUIRE_TASKS=false
INCLUDE_TASKS=false

while (( "$#" )); do
  case "$1" in
    --json|-Json)
      JSON=true; shift ;;
    --paths-only|-PathsOnly)
      PATHS_ONLY=true; shift ;;
    --require-tasks)
      REQUIRE_TASKS=true; shift ;;
    --include-tasks)
      INCLUDE_TASKS=true; shift ;;
    *)
      shift ;;
  esac
done

if $JSON; then
  # Minimal JSON stub to satisfy agent parsing. Adjust as needed.
  echo '{"FEATURE_DIR":"","FEATURE_SPEC":"","IMPL_PLAN":"","TASKS":[],"AVAILABLE_DOCS":[]}'
else
  cat <<EOF
Use domain_knowledge/scripts/create-new-feature.sh to scaffold a new feature,
or run domain_knowledge/scripts/check-prerequisites.sh --json for machine consumption.
EOF
fi

exit 0
