#!/usr/bin/env bash
set -euo pipefail

# Creates .bak files for safety, then deletes the backups when done.

shopt -s globstar || true


# Use ripgrep if available for speed; fall back to grep
if command -v rg >/dev/null 2>&1; then
else
fi

if [ -z "${FILES// /}" ]; then
  echo "No files found matching pattern."
  exit 0
fi

echo "Cleaning files:"
echo "$FILES" | sed 's/^/ - /'

for f in $FILES; do
  # skip binary files
  if file "$f" | grep -qE 'text|JSON|ASCII|UTF-8'; then
    cp "$f" "$f.bak"
    rm -f "$f.bak"
  else
    echo "Skipping binary/non-text file: $f"
  fi
done

echo "Removal pass complete. Run a verification scan (rg/grep) to confirm."
