---
description: Seed a local DuckDB database with data from Alex's game library (Google Sheets).
license: MIT
metadata:
  version: "1.0"
---

# Library Seed

This skill seeds a local DuckDB database (`agent_skills/library.duckdb`) with data from all sheets of Alex's game library spreadsheet. This allows for fast, local querying of the entire game library.

## Usage

1. **Seed the database**
   ```bash
   node agent_skills/library-seed/seed.mjs
   ```
   *Note: This automatically clears existing tables and re-seeds from Google Sheets.*

## Storage & Maintenance

DuckDB is an analytical database optimized for performance, but its file size on disk does not shrink automatically when data is deleted or structure is changed.

- **Storage Location**: `agent_skills/library.duckdb` (tracked in git).
- **Update Pattern**: This skill uses a **bulk load** strategy (dropping and recreating tables). This is the most storage-efficient pattern for DuckDB.
- **Maintenance**: If the database grows unexpectedly or after multiple re-seeds, use the `duckdb-maintenance` skill to compact it.

## Workflow

- **Metadata Discovery**: Uses Google Sheets API (if `GOOGLE_SHEETS_API_KEY` is set) or hardcoded fallback.
- **Import**: CSVs are downloaded and imported into DuckDB tables (e.g., `games`, `owned_games`).

## Constraints

- **Storage**: The DuckDB database is stored in `agent_skills/library.duckdb`.
- **Secrets**: Respects `.env` protection. Do NOT read `.env` directly. Use environment variables.
