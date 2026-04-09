---
description: Query the local DuckDB game library database.
license: MIT
metadata:
  version: "1.0"
---

# Library Query

This skill allows searching and querying the local DuckDB database (`agent_workspace/library.duckdb`) populated by the `library-seed` skill.

## Usage

1. **List all tables**
   ```bash
   node agent_skills/library-query/query.mjs --list
   ```

2. **Search for a game** (across both `games` and `owned_games` tables)
   ```bash
   node agent_skills/library-query/query.mjs --search "starve"
   ```

3. **Custom SQL query**
   ```bash
   node agent_skills/library-query/query.mjs --sql "SELECT Title, Genre FROM owned_games WHERE Genre = 'RPG' LIMIT 5"
   ```

## Database Schema

- **Table: `games`**
  - Columns: `Name`, `Developer`, `Genre`, `Platforms`, etc.
- **Table: `owned_games`**
  - Columns: `Title`, `Source`, `AppID/ProductID`, `Playtime Hours`, `Developer`, `Genre`, `Platforms`, etc.

## Conventions

- Use `--search` for broad title searches as it handles column differences (`Name` vs `Title`) and joins results from multiple tables.
- Use `--sql` for complex analysis.
