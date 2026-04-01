# Maintainability Gaps (Devstral Analysis)

This document captures the maintainability analysis and recommended improvements identified in the repository (analysis date: 2026-03-06).

## Executive Summary

- The codebase is generally functional but shows areas of duplicated logic, inconsistent component architecture, and missing tests.
- High-impact items: duplicated message formatting logic, mixed concerns in root components, fragmented authentication implementation, and insufficient test coverage.

## Key Findings

- **Duplicated Message Display Logic:** `App.tsx` and `StreamPage.tsx` duplicate message formatting and "PrettyMessage" creation.
- **Inconsistent Component Architecture:** Some pages use inline rendering while others use reusable components (`MessageList`, `MessageInput`).
- **Mixed Concerns in Root Components:** State management, data fetching, formatting, and UI are often intermingled.
- **Hardcoded Channel Logic:** Lookups like `channels.find(ch => ch.name === "general")` are scattered.
- **Authentication Complexity:** OIDC/auth logic is fragmented across multiple files.
- **Insufficient Test Coverage:** Missing reducer, procedure, view, component, and integration tests for several critical flows.

## Recommendations (prioritized)

1. Create shared hooks: `useChatMessages()`, `useChannelByName()`, `useCurrentUser()`, `useOnlineStatus()` (High impact).
2. Consolidate UI: standardize on `MessageList` and `MessageInput`; remove inline rendering (Medium).
3. Separate concerns: container hooks for data and presentation components for UI (Medium).
4. Centralize auth: consolidate OIDC logic or use SpacetimeDB auth patterns (Medium).
5. Expand tests: add reducer/unit/integration tests for auth, messaging, channels, link preview, and procedures (Critical).

## Expected Benefits

- 20–30% reduction in duplicative code
- Easier testing and clearer component boundaries
- Faster onboarding and fewer regressions

**See also:** `constitution.md` (project principles) and `index.md` (domain knowledge TOC).
