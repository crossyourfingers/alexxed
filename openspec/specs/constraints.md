# Engineering Constraints (do not violate)

## Commands
- Build: <your build command>
- Test: <your test command>
- Lint/format: <your format command>

## Boundaries
- Do not modify: <directories / projects / public APIs>
- Must keep: <backwards compatibility rules>

## Quality bar
- All changes must include tests unless explicitly exempted
- No TODOs without linked ticket
- No new warnings

# Sample Prompt
```
Read specs/feature-x.md and specs/constraints.md.
Propose a step-by-step plan that maps to each acceptance criterion.
Then implement only step 1.
Write/adjust tests for step 1.
Stop and summarize what changed and what to do next.
```