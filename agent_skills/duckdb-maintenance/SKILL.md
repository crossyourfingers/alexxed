# DuckDB Maintenance Skill

Maintain and optimize local DuckDB database files to ensure the repository remains lightweight and the databases perform efficiently.

## Core Principle

DuckDB databases are optimized for analytical performance, but their file-on-disk representation does not shrink automatically when data is deleted or structure is changed. This skill provides a safe method to "compact" databases by recreating them from scratch, re-claiming unused block space.

## Usage

### 1. Compact All Standard Databases
The script is pre-configured with the standard database paths used in this project (`agent_skills/agents_monitoring.duckdb` and `agent_skills/library.duckdb`).
```powershell
node agent_skills/duckdb-maintenance/compact.mjs
```

### 2. Compact a Specific Database
You can provide a path to a specific database to compact it.
```powershell
node agent_skills/duckdb-maintenance/compact.mjs path/to/your.duckdb
```

## How It Works

The maintenance script performs the following steps:
1. **Initial Audit:** Measures the current file size on disk.
2. **Recreation (Safe Copy):** Connects to the original database, attaches a temporary file, and uses the `COPY FROM DATABASE` command. This command copies only the active data and structure into a fresh, optimally-packed file.
3. **Validation:** Closes all connections to ensure data is flushed and file handles are released.
4. **Swap:** Deletes the original bloated file and renames the compacted temporary file to take its place.
5. **Report:** Displays the final size reduction metrics.

## When to Use

- **After Major Migrations:** Use this after structural changes to `agents_monitoring.duckdb` (e.g., adding or removing columns).
- **After Large Deletions:** If many rows are removed from a table, use this to reclaim space.
- **Before Committing:** To keep the repository small, run compaction before staging and committing DuckDB files.
