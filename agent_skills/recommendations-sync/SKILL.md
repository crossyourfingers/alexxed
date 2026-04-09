# Skill: Recommendations Sync

Sync game recommendations from the local DuckDB database to SpacetimeDB.

## Purpose
This skill acts as the bridge between the local library (populated from Google Sheets) and the live SpacetimeDB backend. It pushes games from the `games` table in DuckDB to the `import_recommendations_batch` reducer.

## Usage
```powershell
node agent_skills/recommendations-sync/sync.mjs
```

## How it works
1. Reads the `games` table from `agent_skills/library.duckdb`.
2. Generates stable IDs using the same algorithm as the SpacetimeDB backend.
3. Groups games into batches of 50.
4. Uses the `spacetime` CLI to call the `import_recommendations_batch` reducer for each batch.

## Dependencies
- `duckdb` (Node.js package)
- `spacetime` (CLI)
- `library-seed` (to populate the DuckDB file)
