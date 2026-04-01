#!/usr/bin/env bash
set -euo pipefail

JSON=false
while (( "$#" )); do
  case "$1" in
    --json|-Json)
      JSON=true; shift ;;
    *)
      shift ;;
  esac
done

if $JSON; then
  echo '{"FEATURE_SPEC":"","IMPL_PLAN":"","SPECS_DIR":"specs","BRANCH":""}'
else
  echo "Run domain_knowledge/scripts/create-new-feature.sh to create a feature spec first."
fi

exit 0
