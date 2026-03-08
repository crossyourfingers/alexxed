# Implementation Plan: Alexxed Chat Platform - Level Set

**Branch**: `001-unified-minimal-ui` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification consolidating auth, chat, reactions, system messages, presence, and UI consistency

**Note**: This plan covers the "level set" for the Alexxed platform - validating and documenting existing implementation against consolidated spec.

## Summary

Alexxed is a real-time chat platform built on SpacetimeDB with SpacetimeAuth (OIDC) authentication, message likes, emoji reactions, system messages for connection events, user presence tracking with session metrics, and a unified green/black accessible UI theme. This plan validates existing implementation against the consolidated spec and identifies gaps.

## Technical Context

**Language/Version**: TypeScript 5.6, SpacetimeDB SDK 2.0.1  
**Primary Dependencies**: React 18.3.1, Vite 7.1.5, spacetimedb, oidc-client-ts 3.4.1, react-oidc-context  
**Storage**: SpacetimeDB (11 tables: user, message, message_like, message_reaction, system_message, user_session, channel, streamer_profile, stream_schedule_day, reported_message, channel_unread; legacy: credentials, link_preview)  
**Testing**: Vitest 3.2.4 with React Testing Library, jsdom  
**Target Platform**: Static site (Vite build) + SpacetimeDB maincloud backend  
**Project Type**: Web application (real-time chat)  
**Performance Goals**: <100ms message delivery, <500ms initial load, 60fps UI transitions  
**Constraints**: WCAG AAA contrast (7:1), CSS custom properties for theming, no external databases  
**Scale/Scope**: Community chat, ~100 concurrent users, 2 pages (Community, Stream)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. SpacetimeDB-First** | ✅ PASS | All data in SpacetimeDB tables; reducers for mutations; subscriptions for reads |
| **II. Code Clarity & Abstraction** | ✅ PASS | Components use hooks for abstraction; utilities in dedicated modules |
| **III. Real-Time Subscriptions** | ✅ PASS | `useTable()` for reactive data; no REST/polling |
| **IV. Spec-Driven Development** | ✅ PASS | Consolidated spec at `specs/001-unified-minimal-ui/spec.md` with user stories, FRs, SCs |
| **V. Type Safety & Codegen** | ✅ PASS | `spacetime generate` creates bindings; object syntax for reducers |
| **VI. Testing & Quality** | ⚠️ PARTIAL | 2 test files exist; gap analysis showed 3/10 coverage score - needs improvement |

**Gate Result**: PASS with noted gap (testing coverage to be addressed in implementation)

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-minimal-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output (below)
├── data-model.md        # Phase 1 output (below)
├── quickstart.md        # Phase 1 output (below)
├── contracts/           # Phase 1 output (API contracts)
│   └── reducers.md      # Reducer interface contracts
└── checklists/
    └── requirements.md  # Quality checklist (already created)
```

### Source Code (repository root)

```text
spacetimedb/                    # Backend module
├── package.json
├── tsconfig.json
└── src/
    └── index.ts               # Tables, reducers, lifecycle hooks

src/                            # Frontend
├── main.tsx                   # App entry, providers
├── App.tsx                    # Router, layout
├── LoginForm.tsx              # Auth UI
├── auth/
│   ├── authProvider.ts        # OIDC provider abstraction
│   └── useAuth.tsx            # Auth hook
├── components/
│   ├── Header.tsx             # Global header
│   ├── SessionWidget.tsx      # Session metrics display
│   ├── ThemeSwitcher.tsx      # Theme toggle
│   └── Chat/
│       ├── index.ts
│       ├── ChannelSidebar.tsx
│       ├── MessageInput.tsx
│       ├── MessageList.tsx
│       ├── MessageItem.tsx
│       ├── ReactionPicker.tsx
│       └── LinkPreview.tsx
├── config/
│   └── featureFlags.ts        # ENABLE_MESSAGE_LIKES, ENABLE_EMOJI_REACTIONS
├── hooks/
│   ├── useChannelByName.ts
│   ├── useChatMessages.ts
│   └── useOnlineUsers.ts
├── pages/
│   ├── CommunityPage.tsx
│   └── StreamPage.tsx
├── styles/
│   └── theme.css              # Design tokens, CSS custom properties
└── module_bindings/           # Generated (DO NOT EDIT)

tests/                          # Test files (to be expanded)
├── App.integration.test.tsx
└── useChatMessages.test.tsx
```

**Structure Decision**: Web application with SpacetimeDB backend module (`spacetimedb/`) and React frontend (`src/`). Static site output via Vite build.

## Complexity Tracking

No constitution violations requiring justification. Testing gap (Principle VI) will be addressed during implementation phase.

---

## Implementation Phases

### Phase 0: Research (Complete)

Research findings documented in [research.md](research.md).

### Phase 1: Design (Complete)

- Data model: [data-model.md](data-model.md)
- API contracts: [contracts/reducers.md](contracts/reducers.md)
- Quick start: [quickstart.md](quickstart.md)

### Phase 2: Tasks (Pending)

Run `/speckit.tasks` to generate implementation task breakdown.
