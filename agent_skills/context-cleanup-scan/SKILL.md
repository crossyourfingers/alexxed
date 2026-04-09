# context-cleanup-scan - Documentation Monitoring Skill

## Overview

Traverses the entire repository to find all `AGENTS.md` and `SKILL.md` files, counts their lines, and stores the results in a local DuckDB database. This is used to track the "health" of documentation and identify files that need compaction (e.g., those exceeding ~100 lines).

## Usage

Run the scan script to update the monitoring database:

```bash
# Basic scan (refreshes all data, preserves manually set priorities)
node agent_skills/context-cleanup-scan/scan.mjs

# Set priority for specific files or patterns
node agent_skills/context-cleanup-scan/scan.mjs set <pattern> <high|medium|low>
```

Example:
```bash
node agent_skills/context-cleanup-scan/scan.mjs set openspec low
```

## Output

The results are stored in `agent_skills/agents_monitoring.duckdb` with the following schema:
- `path`: Relative path to the file (Primary Key)
- `file_type`: Type of file (`AGENTS.md` or `SKILL.md`)
- `line_count`: Total lines in the file
- `violation_score`: Number of lines exceeding the 100-line threshold
- `priority`: User-assigned priority (`high`, `medium`, `low`)
- `last_updated`: Timestamp of the last scan

## Storage & Maintenance

DuckDB is an analytical database optimized for performance, but its file size on disk may grow even when the actual amount of data is small.

- **Storage Location**: `agent_skills/agents_monitoring.duckdb` (tracked in git).
- **Update Pattern**: This skill uses an **incremental update** strategy (`INSERT ... ON CONFLICT DO UPDATE`). Because DuckDB uses block-based allocation, repeated incremental updates or structural changes (like `ALTER TABLE`) can cause the file size to increase even with only a few rows.
- **Maintenance**: To reclaim unused space and keep the repository lightweight, use the `duckdb-maintenance` skill to compact the database.

## Implementation Details

- **Language:** Node.js
- **Database:** DuckDB
- **Threshold:** 100 lines
- **Exclusions:** `node_modules`, `.git`, `dist`, `agent_workspace`

## Related Skills

- `context-cleanup-queue`: Query the violation queue and view metrics.
