# Attribution
This proposal originated from CyberBaroness on 2026-3-17 during a Dragon Age: Origins stream.
# Proposal: Game Voting Feature for Alexxed

## Overview
Enable logged-in users to vote on which games Alex should play next. The list of games Alex owns is sourced from a public Google Sheets workbook, which serves as a reference for owned games only. To compile all required metadata (cover art, purchase links, etc.), integration with additional game APIs (e.g., Steam, IGDB, etc.) may be necessary. Voting UX is optimized for desktop (grid/list) and mobile (swipe gestures).

## Goals
- Let users vote for games Alex should play next
- Source game list and metadata from Google Sheets
- Display cover art, purchase link, title, and played status
- Desktop: grid/list voting UI
- Mobile: swipe right/left to vote (like dating apps)
- Only logged-in users can vote; votes are per-user, per-game


## Data Model
- Game: id, title, coverArtUrl, purchaseLink, played (bool), [other metadata]
- UserVote: userId, gameId, vote (enum: up/down/none)
- Games are referenced from Google Sheets (public workbook) for ownership, but full metadata may be sourced from external game APIs as needed.
- A database entry for a game is created as soon as a user interacts with (views, votes, etc.) a game listing, to track votes and further interactions.

## UX Design

**Desktop:**
  - Grid/list of games with cover art, title, purchase link, played status
  - Voting controls (e.g., upvote/downvote buttons)
**Mobile:**
  - Swipe right/left to vote (right = upvote, left = downvote/skip)
  - Consistent cover art sizing
Responsive and accessible

### Additional UX Considerations
- **Game Discovery & Loading States:**
  - Specify how users discover new games (pagination, infinite scroll, search/filter)
  - Define loading, error, and empty states (e.g., when metadata cannot be fetched or no games are available)
- **Voting Feedback:**
  - Provide clear feedback after voting (animation, confirmation, undo option)
  - Clarify voting mechanics: can users vote for multiple games, change their vote, or see their voting history?
- **Played Status:**
  - Define how and when the "played" status is updated (manual by Alex, automated, or user-reported)
- **Mobile Swipe UX Details:**
  - Specify what happens after a swipe (next game appears, animation, ability to go back)
  - Ensure accessibility for swipe actions (keyboard navigation, screen reader support)
- **Game Details Modal/Page:**
  - Allow users to view more details about a game (description, screenshots, reviews) before voting


## Integration Points

Backend: SpacetimeDB tables for games and votes
Reducers for voting actions
Google Sheets integration for game ownership reference (periodic sync or on-demand fetch)
Integration with external game APIs to fetch and enrich metadata (cover art, purchase links, etc.)
Client: subscribe to games/votes, render UI, handle voting actions

### Additional API Integration Considerations
- **Google Sheets Sync:**
  - Specify how updates to the sheet are handled (e.g., if Alex adds/removes games, how is this reflected?)
  - Handle duplicate or ambiguous game titles/IDs from the sheet
- **External Game APIs:**
  - Define how to handle API rate limits, failures, or missing data
  - Reconcile differences in game naming/IDs between the spreadsheet and external APIs
  - Specify which API is the source of truth for each metadata field
  - Define how metadata is cached or updated over time
- **Purchase Link Selection:**
  - Clarify how Alex’s preferred store is set or changed, and how to handle games available on multiple stores
- **Cover Art Hosting:**
  - Specify how cover art URLs are validated, resized, or cached for consistent display and performance
## Recommendations
- Add explicit UX flows for loading, error, and empty states.
- Clarify voting mechanics (limits, feedback, undo, history).
- Specify how and when “played” status is updated.
- Detail swipe UX (animations, accessibility, navigation).
- Define how game metadata is fetched, cached, and updated, and how to handle API failures or mismatches.
- Clarify how purchase links and cover art are selected, validated, and displayed.

## Authentication & Permissions
- Only logged-in users can vote
- Votes are tied to user identity (ctx.sender)

## Game Metadata Display
- Cover art (URL, consistent size)
- Purchase link (Alex’s preferred store per game)
- Title
- Played status (boolean)

## Future Extensions
- Add logic to pick best deal/store for purchase link
- More metadata (genre, release date, etc.)
- Leaderboards, comments, etc.

## Verification
- Proposal reviewed for completeness and clarity
- All sections present and actionable
- Aligns with SpacetimeDB coding guidelines (see AGENTS.md)
- UX sketches/wireframes included for both desktop and mobile (to be added)

## Decisions
- Mobile UX uses swipe gestures for voting; desktop uses grid/list
- Game ownership is referenced from Google Sheets; metadata may require additional API integrations
- Database entries for games are created on first user interaction (view, vote, etc.)
- Votes stored in SpacetimeDB, tied to logged-in users
