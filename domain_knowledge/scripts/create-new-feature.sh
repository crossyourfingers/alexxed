#!/usr/bin/env bash
set -euo pipefail

usage() { echo "Usage: $0 --number N --short-name NAME [--json] \"Feature description\""; exit 1; }

JSON_FLAG=""
NUMBER=""
SHORT_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json|-Json)
      JSON_FLAG="true"; shift ;;
    --number|-Number)
      NUMBER="$2"; shift 2 ;;
    --short-name|-ShortName)
      SHORT_NAME="$2"; shift 2 ;;
    --)
      shift; break ;;
    -* )
      echo "Unknown option: $1" >&2; usage ;;
    *)
      DESCRIPTION="$*"
      break ;;
  esac
done

if [[ -z "$NUMBER" || -z "$SHORT_NAME" ]]; then
  echo "Missing --number or --short-name" >&2; usage
fi

if [[ -z "${DESCRIPTION-}" ]]; then
  DESCRIPTION="(No description provided)"
fi

FEATURE_DIR="specs/${NUMBER}-${SHORT_NAME}"
mkdir -p "$FEATURE_DIR/checklists"

SPEC_FILE="$FEATURE_DIR/spec.md"
CHECKLIST_FILE="$FEATURE_DIR/checklists/requirements.md"

TEMPLATE_PATH="domain_knowledge/templates/spec-template.md"
if [[ -f "$TEMPLATE_PATH" ]]; then
  sed "s/{{FEATURE_NAME}}/${NUMBER}-${SHORT_NAME}/g; s/{{FEATURE_TITLE}}/${SHORT_NAME}/g; s/{{FEATURE_DESC}}/${DESCRIPTION}/g" "$TEMPLATE_PATH" > "$SPEC_FILE"
else
  cat > "$SPEC_FILE" <<EOF
# ${SHORT_NAME}

## Summary
${DESCRIPTION}

## Goals

## Actors

## User Scenarios

## Functional Requirements

## Success Criteria

## Assumptions

## Acceptance Tests
EOF
fi

cat > "$CHECKLIST_FILE" <<'EOF'
# Specification Quality Checklist

- [ ] No implementation details
- [ ] Focused on user value and business needs
- [ ] All mandatory sections completed
- [ ] Requirements are testable and unambiguous
EOF

# Emit JSON similar to the old system output
BRANCH_NAME="${NUMBER}-${SHORT_NAME}"
if command -v jq >/dev/null 2>&1; then
  jq -n --arg branch "$BRANCH_NAME" --arg spec "$SPEC_FILE" '{BRANCH_NAME:$branch,SPEC_FILE:$spec}'
else
  echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\"}"
fi

exit 0
