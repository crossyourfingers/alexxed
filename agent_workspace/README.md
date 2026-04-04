Agent Workspace
================

Purpose
-------
This folder is the sole location for ad-hoc, one-off, or ephemeral files created by automated agents. Examples: temporary scratch notes, extracted artifacts, debugging traces, or outputs that are not part of the project's source code.

Rules for agents
---------------
- Agents MUST create ad-hoc or one-off files only inside this folder.
- Agents MUST NOT create ad-hoc files elsewhere in the repository (for example: `src/`, `spacetimedb/`, `scripts/`, or other source directories).
- Long-lived source code or framework files must be added in their appropriate project folders and follow normal PR and review workflows.
- Do NOT store secrets or `.env` files here. Secret material is disallowed (see repository policy).

Machine-readable policy
-----------------------
See the repository root file `.agent-permissions.json` for the machine-readable allowed path(s) agents should check before creating files.

If you are an agent
-------------------
Check and honor `.agent-permissions.json` before writing. If a change requires committing to source, open a PR and do not write code-only files here.
