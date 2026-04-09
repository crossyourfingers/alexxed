# Alexxed - Agent Guidelines

## Mission

> Build a real-time streaming community platform for Alex and his audience.

Full principles: [Project Constitution](domain_knowledge/constitution.md)

---

## CRITICAL: Secrets Protection (NON-NEGOTIABLE)

**This is the most important rule in this repository.**

### For Git/Source Control

- **NEVER commit secrets** to version control (API keys, tokens, passwords, client secrets)
- All secrets must reside in `.gitignore`-listed files only
- Review all commits for accidental secret inclusion
- **NEVER use `git add .`** — always stage specific files or use interactive staging (`git add -p`) to prevent accidental inclusion of sensitive or unrelated files

### For AI/LLM Agents

- **NEVER read `.env` files** — not even to "check" or "verify" values
- **NEVER read any file matching `.env*` patterns** (`.env`, `.env.local`, `.env.production`, etc.)
- If you need to reference secret structure, use `.env.example` or `.public.secrets` files ONLY
- If you need actual secret values, **ask the user** — do not attempt to read them

Agents MUST check the repository-root file `.agent-permissions.json` for explicit runtime permissions before performing repository-modifying actions (for example, committing or pushing). That file may include `allow_assistant_commit_push` and a `disallowed_actions` list (for example `"read_env_files"`). The file is a convenience, human-editable flag tracked in source control and is not a substitute for repository access controls — treat it as authoritative for agent behaviour in this repo, but not cryptographically binding.

Agent runtime behaviour: if `.agent-permissions.json` exists at the repository root and contains `"allow_assistant_commit_push": true`, agents MAY proceed to stage, commit, and push non-sensitive repository changes without asking for explicit approval each time. Agents MUST still respect any `disallowed_actions` present in that file (for example `"read_env_files"`) and MUST NOT read any `.env*` file. When acting under this permission, agents should include a concise commit message and a short explanation in their response describing what was changed and why.

### Agent Workspace (ad-hoc files)

- Agents MUST create ad-hoc or one-off files only inside `agent_workspace/` at the repository root.
- Machine-readable policy: `.agent-permissions.json` contains an `agent_allowed_paths` array that agents MUST consult before creating any ad-hoc files.
- Agents MUST NOT create ad-hoc files outside `agent_workspace/`. Source code, framework files, and long-lived artifacts belong in their respective folders and must follow normal PR/review processes.
- Do NOT store secrets or `.env*` files in `agent_workspace/`. The `disallowed_actions` array in `.agent-permissions.json` remains authoritative.

### Allowed Files for Agents

| File               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `.env.example`     | Template showing required variables (no real values) |
| `*.public.secrets` | Explicitly marked safe for agent consumption         |

### Violations

Any agent that reads `.env` files is violating Alex's explicit security policy. This applies to all tools, all contexts, no exceptions.

---

## Agent Framework

**The agent framework is the authoritative source of truth for agent behavior, coding guidelines, and project knowledge.**

### Framework Files (Authoritative)

Agents MUST consult these files to understand project context, constraints, and guidelines:

| File/Folder            | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| Any `AGENTS.md`        | Coding rules, guidelines, and agent instructions (all locations) |
| `README.md` (root)     | Human-preferred project overview and documentation       |
| `.agent-permissions.json` | Machine-readable agent runtime permissions            |
| `agent_skills/`        | Shared agent skills and instruction modules           |
| `domain_knowledge/`    | Proposals, specs, business rules, glossary, and project memory |

These files are:
- **Version-controlled** — committed to the repository
- **Stable** — intended to persist and evolve with the project
- **Authoritative** — agents should treat them as the source of truth

### Agent Workspace (Non-Authoritative)

Files in `agent_workspace/` are:
- **Ephemeral** — humans may delete them at any time
- **Reference-only** — agents can read them if they exist, but must not depend on them
- **No guarantees** — absence of these files should not break agent workflows

Agents should treat `agent_workspace/` as a scratch space, not a reliable knowledge base.

---

## Agent Skills

Agent Skills are specialized, reusable cognitive modules that extend an agent's capabilities by providing specific instructions, scripts, or project-specific playbooks.

### Skill Types

- **Active Skills**: These include executable scripts or CLIs (e.g., `library-seed`, `library-query`). They are used for deterministic tasks, automation, or data processing. Scripts are **colocated** within the skill's directory under `agent_skills/`.
- **Markdown-only Skills**: These serve as authoritative "playbooks" or style guides, ensuring consistency and adherence to project conventions without requiring a script.

### Usage Convention

1. **Discovery**: Agents should check the `agent_skills/` directory for any module that matches the current task domain.
2. **Read First**: Always read the `SKILL.md` within a skill's directory before executing any associated scripts. It contains the "rules of engagement" and usage instructions.
3. **Colocation**: If a skill requires a script to be useful, it must be colocated in the same folder as its `SKILL.md`.

---

## User Identity & Workflow Preference

| User  | Preferred Mode | Notes                                                                             |
| ----- | -------------- | --------------------------------------------------------------------------------- |
| Alex  | Flexible       | Owner/IP holder. May use spec-driven (Spec Kit) OR vibe coding at his discretion. |
| Marty | Spec-driven    | Prefers formal specs, plans, and tasks via Spec Kit.                              |

**Workflow Policy:** Alex owns this project. He can vibe code whenever he wants—no justification needed. Agents should ask preference if unclear, but never block Alex from rapid iteration.

---

## Project Structure

| Directory           | Purpose                    | AGENTS.md                                              |
| ------------------- | -------------------------- | ------------------------------------------------------ |
| `/src`              | React frontend             | [src/AGENTS.md](src/AGENTS.md)                         |
| `/agent_skills`     | Shared agent skills        | [agent_skills/](agent_skills/)                         |
| `/spacetimedb`      | SpacetimeDB backend module | [spacetimedb/AGENTS.md](spacetimedb/AGENTS.md)         |
| `/domain_knowledge` | Proposals, specs, memory   | [domain_knowledge/index.md](domain_knowledge/index.md) |

---

## Upcoming Features

### Game Voting Feature (Next Priority)

**Attribution:** CyberBaroness, 2026-03-17, Dragon Age: Origins stream

Community members vote on which games Alex should play next. Key aspects:

- Game list sourced from Google Sheets (Alex's owned games)
- Metadata enriched via external APIs (Steam, IGDB)
- Desktop: grid/list UI with upvote/downvote
- Mobile: swipe right/left (dating app style)
- Only logged-in users can vote
- Votes stored in SpacetimeDB, tied to user identity

See full proposal: [Game Voting Feature](domain_knowledge/game-voting-feature.md)

### UI Verification (Playwright MCP)

When available, agents should use the **Playwright MCP server** for visual and interaction testing. This allows for real-time browser interaction to verify:
- Desktop vs. Mobile layout logic (viewport switching)
- Complex animations and state transitions (e.g., voting cards)
- End-to-end user flows (login, sync, voting)

**Best Practices:**
1. **Prefer `playwright_screenshot`** to visually verify UI state.
2. **Use `playwright_click` and `playwright_type`** for interaction testing.
3. **Run local dev server (`npm run dev`)** before attempting UI verification.
4. **Clean up** any browser sessions or temporary artifacts after verification.

---

## Mandatory Self-Testing & Verification

AI Agents and developers MUST verify changes locally before committing.

### 1. SpacetimeDB CLI (Backend Logic)
Test business logic directly to bypass UI complexity and ensure deterministic behavior.

- **Check State:** `spacetime sql alexxed-u3k4f "SELECT * FROM ..."`
- **Call Reducers:** `spacetime call alexxed-u3k4f <reducer> [args...]`
- **Validate Data:** `spacetime call alexxed-u3k4f validate_library_data`
- **Logs:** `spacetime logs alexxed-u3k4f`

### 2. Playwright (Frontend & UI)
Verify layout, interaction, and mobile/desktop responsiveness.

- **Automated Tests:** `npx playwright test` (ensure `npm run dev` is active)
- **Visual Sanity Check:** Use `playwright_screenshot` to confirm UI state.

### 3. Build Check
Ensure the project compiles and bundles correctly.

- **Build:** `npm run build`

---

## API Configuration (Secrets)

To use high-quality game metadata (IGDB/Twitch), you must configure your API secrets in the `secret_config` table.

### 1. Obtain IGDB Credentials
- Create a Twitch Developer account.
- Register an application in the [Twitch Dev Console](https://dev.twitch.tv/console).
- Obtain your **Client ID** and **Client Secret**.

### 2. Set Secrets via SpacetimeDB CLI
Run the following commands from your terminal (replacing the values with your actual credentials):

```powershell
spacetime call alexxed-u3k4f set_secret "IGDB_CLIENT_ID" "your_client_id_here"
spacetime call alexxed-u3k4f set_secret "IGDB_CLIENT_SECRET" "your_client_secret_here"
```

*Note: These secrets are stored in a private table (`secret_config`) only accessible to the admin (streamer profile).*

### 3. Verify Enrichment
Once secrets are set, use the **"Enrich (IGDB)"** button in the app's Library or Game List pages to fetch high-quality cover art and genres.

### 4. Agent Skill: Library Validator
Agents can verify the current state of library metadata by calling:
```powershell
spacetime call alexxed-u3k4f validate_library_data
```
This procedure returns a summary of missing covers and genres, allowing agents to self-correct by triggering further enrichment if needed.

### 5. DuckDB Local Library (Offline Querying)
Agents can use local DuckDB skills to seed and query the game library without hitting external APIs.

- **Seed Database:** `node agent_skills/library-seed/seed.mjs`
- **Search Library:** `node agent_skills/library-query/query.mjs --search "term"`
- **List Tables:** `node agent_skills/library-query/query.mjs --list`

---

## Documentation Monitoring (Context Cleanup)

Agents and developers should monitor the line counts of `AGENTS.md` and `SKILL.md` files to ensure they remain concise (~100 lines).

- **Scan Repository:** `node agent_skills/context-cleanup-scan/scan.mjs`
- **Set Priority:** `node agent_skills/context-cleanup-scan/scan.mjs set <pattern> <high|medium|low>`
- **View Violation Queue:** `node agent_skills/context-cleanup-queue/queue.mjs`

Monitoring data is stored in `agent_skills/agents_monitoring.duckdb`. Files exceeding the 100-line threshold should be prioritized for compaction and modularization. Low-priority files (e.g., deprecated skills) are tracked but ignored in the primary violation count.

---

## SpacetimeDB Development

### Core Principles

1. **Backend-First Logic** — Place as much business logic as possible in the SpacetimeDB module. The frontend should be a thin UI layer that calls reducers and reacts to table updates.
2. **Direct Testing** — You are encouraged to call SpacetimeDB reducers and procedures directly via the CLI for rapid testing and verification (e.g., `spacetime call`).

**See comprehensive guides:**
- **[SpacetimeDB TypeScript Guide](domain_knowledge/spacetimedb-typescript-guide.md)** — Complete TypeScript SDK reference (common mistakes, tables, indexes, reducers, procedures, React integration)
- **[Backend Guidelines](spacetimedb/AGENTS.md)** — SpacetimeDB backend-specific rules

### Quick Reference — Core Principles

1. **Reducers are transactional** — they do not return data to callers
2. **Reducers must be deterministic** — no filesystem, network, timers, or random
3. **`ctx.sender` is the authenticated principal** — never trust identity args
4. **Indexes go in OPTIONS (1st arg)** — not in COLUMNS (2nd arg) of `table()`
5. **Use BigInt for u64/i64 fields** — `0n`, `1n`, not `0`, `1`
6. **Reducer calls use object syntax** — `{ param: 'value' }` not positional args

### Common Startup Errors

| Issue                             | Fix                                                |
| --------------------------------- | -------------------------------------------------- |
| "could not detect language"       | Add `package.json` to backend directory            |
| "TsconfigNotFound"                | Add `tsconfig.json` to backend directory           |
| "reading 'tag'" error             | Move `indexes` from columns to table options       |
| "Property 'id' is missing"        | Provide `id: 0n` for auto-increment fields         |
| ".insert() returns ROW, not ID"   | Use `const row = insert(...)` then `row.id`        |
| "Cannot read properties of undef" | Index name must match exactly (snake_case vs camelCase) |
