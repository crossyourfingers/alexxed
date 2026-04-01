# Constitution Compliance Gaps (summary)

This is a concise, LLM-friendly summary of the repository's constitution compliance gaps (derived from the original analysis, 2026-03-06).

## Snapshot

- **Overall:** Partial compliance (score ~7.0/10 in original analysis)
- **Strong:** SpacetimeDB-first architecture, type safety, real-time subscriptions
- **Needs improvement:** Test coverage, spec completeness, security implementation
- **Critical gaps:** Authentication security; insufficient tests for reducers, procedures, views, and key components

## High-priority Items

1. **Security:** Replace demo password hashing; adopt production-grade auth (SpacetimeAuth, bcrypt/Argon2), document model, add security tests.
2. **Testing:** Add reducer tests, procedure/view tests, component and integration tests for auth, messaging, channels, link preview.
3. **Specs:** Add retrospective or forward specs for implemented-but-unspecified features (e.g., link preview); ensure every feature has a concise spec before major implementation.

## Recommended Next Steps

- Create issues for critical security fixes and test coverage gaps.
- Draft short specs in `domain_knowledge/` for missing features (link preview, channel management verification).
- Track progress in PRs and update `domain_knowledge/` with final design and verification steps.

**Related:** `devstral-gaps.md` (detailed maintainability recommendations)
