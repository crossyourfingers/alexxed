# Specifications & Proposals Guidelines

Parent: [../AGENTS.md](../AGENTS.md) | Constitution: [memory/constitution.md](memory/constitution.md)

---

## Purpose

This directory contains the project's institutional memory:

- **Proposals** — Feature ideas and enhancement requests
- **Memory** — Constitution, decisions, and long-term knowledge
- **Specs** — Formal specifications (when using Spec Kit)

---

## Workflow Policy

**Alex owns this project.** He can:

- Vibe code whenever he wants — no spec required
- Use Spec Kit for complex features if he prefers
- Switch between modes at any time

**Marty prefers spec-driven development.** When Marty is working:

- Use Spec Kit for formal proposals, specs, and tasks
- Follow the propose → specify → implement → archive workflow

**When in doubt:** Ask the user which mode they prefer before starting.

---

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md    # Core principles (authoritative)
├── proposals/
│   ├── game-voting-feature.md   # Next priority feature
│   └── devstral-gaps.md         # Tech debt analysis
└── specs/                 # Formal specs (Spec Kit)
```

---

## Current Proposals

### Game Voting Feature (NEXT PRIORITY)

**Attribution:** CyberBaroness, 2026-03-17, Dragon Age: Origins stream

Community votes on which games Alex should play next.

**Key aspects:**

- Game list from Google Sheets (Alex's owned games)
- Metadata enriched via Steam/IGDB APIs
- Desktop: grid/list with upvote/downvote
- Mobile: swipe right/left (dating app UX)
- Only logged-in users can vote
- Votes stored in SpacetimeDB

**Open questions:**

- How to sync Google Sheets → database?
- Rate limiting for external API calls?
- How to handle missing/inconsistent metadata?

See full proposal: [proposals/game-voting-feature.md](proposals/game-voting-feature.md)

---

### Tech Debt (devstral-gaps)

Analysis of maintainability improvements:

- Duplicated message display logic
- Inconsistent component architecture
- Mixed concerns in root components

Estimated effort: 14-24 hours

See: [proposals/devstral-gaps.md](proposals/devstral-gaps.md)

---

## Deprecated: OpenSpec

The `openspec` system in `/openspec` is **deprecated**. Do not use it for new work. Use Spec Kit instead.
