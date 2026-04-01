# Game Voting Feature (proposal summary)

This file summarizes the Game Voting feature proposal and serves as the domain-oriented reference for designers and implementers.

## Overview

Let logged-in users vote on which games Alex should play next. The canonical game list is sourced from a public Google Sheets workbook (ownership reference); metadata (cover art, store links) is enriched via external game APIs (Steam, IGDB, etc.).

## Goals

- Users can upvote/downvote games Alex should play next
- Source owned-game list from Google Sheets
- Enrich metadata from external APIs for display
- Desktop: grid/list UI; Mobile: swipe gestures
- Votes are per-user, per-game and require authentication

## Data Model

- `Game`: `id`, `title`, `coverArtUrl`, `purchaseLink`, `played` (bool), metadata
- `UserVote`: `userId`, `gameId`, `vote` (enum: up/down/none)

## UX Notes

- Desktop: grid/list with voting controls and game metadata
- Mobile: swipe right/left for voting, with accessible alternatives
- Provide loading, empty, and error states; confirm and allow undo for votes

## Integration Points

- Backend: SpacetimeDB tables for `game` and `user_vote`, reducers for votes
- Sync: Google Sheets integration for ownership
- Enrichment: external APIs for metadata (cache & rate-limit handling required)

## Recommendations

- Specify sync strategy for Google Sheets (periodic or on-demand)
- Define caching and error strategies for external APIs
- Clarify "played" status ownership (streamer-managed vs automated)

**Related:** `constitution.md` | `index.md`
