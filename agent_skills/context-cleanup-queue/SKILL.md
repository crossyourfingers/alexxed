# context-cleanup-queue - Documentation Violation Queue Skill

## Overview

Queries the local DuckDB monitoring database (`agent_skills/agents_monitoring.duckdb`) to display a ranked list of `AGENTS.md` and `SKILL.md` files that exceed the 100-line threshold. This allows users and agents to prioritize documentation compaction efforts based on the severity of violations.

## Usage

Run the queue script to view the current violation list:

```bash
node agent_skills/context-cleanup-queue/queue.mjs
```

## Columns

The queue displays:
- **File**: Relative path to the documentation file.
- **Type**: File type (`AGENTS.md` or `SKILL.md`).
- **Priority**: File priority (`HIGH`, `MEDIUM`, `LOW`).
- **Lines**: Total line count.
- **Score (Violation)**: Degree of violation (lines over 100).
- **Status**: Visual indicator (`✅ OK`, `❌ VIOLATING`, `⚠️ IGNORED` for low priority).

## Strategy

This skill follows a CQRS-inspired pattern where the scan skill handles the "write" side (updating the database) and this skill handles the "read" side (querying for insights).

## Related Skills

- `context-cleanup-scan`: Populate and update the monitoring database.
