[2026-04-04 23:34] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Build type mismatches",
    "EXPECTATION": "The build should succeed with frontend types and accessors matching the generated SDK and backend schema.",
    "NEW INSTRUCTION": "WHEN backend schema or SDK accessors change THEN regenerate client and update TS usages before build"
}

[2026-04-04 23:37] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Build type mismatches",
    "EXPECTATION": "Frontend fields and reducer accessor names must exactly match the generated SpacetimeDB SDK types and casing so the project builds cleanly.",
    "NEW INSTRUCTION": "WHEN build shows missing SDK fields or accessors THEN regenerate SDK and align frontend names"
}

[2026-04-04 23:51] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Connection still broken",
    "EXPECTATION": "After OIDC consent, the app should establish and maintain a SpacetimeDB WebSocket connection in production without looping from 'Connecting...' to 'Disconnected'.",
    "NEW INSTRUCTION": "WHEN user shares disconnect console logs THEN request full console and Network HAR from production"
}

[2026-04-05 10:31] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Loading/routing mismatch",
    "EXPECTATION": "The diagnostic loading screen should remain until auth and DB connection are ready, without being replaced by the legacy 'community-loading' overlay or premature routing.",
    "NEW INSTRUCTION": "WHEN 'community-loading' appears during startup THEN remove it and gate routes on AuthGate readiness"
}

[2026-04-05 10:40] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Auth redirect failure",
    "EXPECTATION": "If already authenticated, load the home screen immediately; if not, automatically start and complete the SpacetimeAuth OIDC flow.",
    "NEW INSTRUCTION": "WHEN unauthenticated and not isLoading THEN call signinRedirect automatically"
}

[2026-04-05 10:47] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Post-auth connection hang",
    "EXPECTATION": "After successful authentication, the app should advance past the Connecting screen and load the home UI once the SpacetimeDB connection and identity are ready.",
    "NEW INSTRUCTION": "WHEN isAuthenticated is true but identity stays null THEN request console+Network HAR and verify HOST/DB_NAME"
}

[2026-04-05 11:04] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Post-auth connection hang",
    "EXPECTATION": "After authentication, the app should proceed past the Connecting screen and render the home UI once SpacetimeDB connection and identity are established.",
    "NEW INSTRUCTION": "WHEN user reports stuck on Connecting THEN Request console+Network HAR and confirm HOST and DB_NAME environment values"
}

[2026-04-05 11:05] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Post-auth connection hang",
    "EXPECTATION": "After authentication, the app should advance past Connecting and render the home UI.",
    "NEW INSTRUCTION": "WHEN user reports stuck on Connecting THEN request console+Network HAR and verify HOST and DB_NAME"
}

[2026-04-05 11:10] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Build failure - React import",
    "EXPECTATION": "The project should build cleanly; files that reference React.* must import React explicitly.",
    "NEW INSTRUCTION": "WHEN TS reports 'React refers to a UMD global' THEN add 'import React from \"react\"' to that file"
}

[2026-04-05 11:14] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Post-auth connection hang",
    "EXPECTATION": "After authentication and DB connect, identity should resolve and the app should proceed past Connecting.",
    "NEW INSTRUCTION": "WHEN connected true and isAuthenticated true but identity undefined THEN request console+Network HAR and verify HOST and DB_NAME"
}

[2026-04-05 11:14] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Post-auth identity missing",
    "EXPECTATION": "After authentication and DB connection, the user identity should resolve so the app proceeds past Connecting.",
    "NEW INSTRUCTION": "WHEN connected true and isAuthenticated true but identity undefined THEN request full console logs and Network HAR and verify HOST and DB_NAME"
}

[2026-04-05 11:18] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Auth scope clarification",
    "EXPECTATION": "Stick to SpacetimeAuth only and do not introduce a Guest/custom auth path; provide context for any auth-related proposals.",
    "NEW INSTRUCTION": "WHEN proposing auth workarounds like guest/bypass THEN do not implement; explain rationale using SpacetimeAuth only"
}

[2026-04-05 11:19] - Updated by Junie
{
    "TYPE": "positive",
    "CATEGORY": "Plan approval",
    "EXPECTATION": "The assistant should present a clear, contextual plan for changes and diagnostics.",
    "NEW INSTRUCTION": "WHEN proposing changes or diagnostics THEN explain purpose, scope, and rollback plan"
}

[2026-04-05 11:22] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Build type mismatches",
    "EXPECTATION": "The build should not reference methods that are not defined on the project's AuthProvider type.",
    "NEW INSTRUCTION": "WHEN TS reports 'Property does not exist on type AuthProvider' THEN update calls to match AuthProvider interface or implement the method consistently"
}

[2026-04-05 11:48] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Anonymous auth identity expectation",
    "EXPECTATION": "Even with SpacetimeAuth Anonymous, the app should still receive a SpacetimeDB identity; 'none' is not expected and should not block routing.",
    "NEW INSTRUCTION": "WHEN user mentions Anonymous Auth and identity is none THEN explain identity must exist and request console+HAR"
}

[2026-04-05 14:49] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Documentation and backend-first",
    "EXPECTATION": "Document in AGENTS.md how to call Spacetime methods directly for testing, and prioritize placing business logic in the backend.",
    "NEW INSTRUCTION": "WHEN adding developer docs THEN include how to call Spacetime methods directly for testing"
}

[2026-04-05 15:50] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Git workflow autonomy",
    "EXPECTATION": "The assistant may commit and push changes to GitHub without prior approval.",
    "NEW INSTRUCTION": "WHEN completing code changes or fixes THEN commit and push to GitHub proactively"
}

[2026-04-05 15:51] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Git workflow autonomy",
    "EXPECTATION": "The assistant may commit and push changes to GitHub without prior approval.",
    "NEW INSTRUCTION": "WHEN completing code changes or fixes THEN commit and push to GitHub proactively"
}

[2026-04-05 15:52] - Updated by Junie
{
    "TYPE": "preference",
    "CATEGORY": "Git workflow autonomy",
    "EXPECTATION": "The assistant may commit and push code changes to GitHub without prior approval.",
    "NEW INSTRUCTION": "WHEN completing code changes or fixes THEN commit and push to GitHub proactively"
}

[2026-04-05 15:55] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Admin-only action",
    "EXPECTATION": "Automatic sync should not execute for non-admin users; only an admin can trigger the games-from-sheet sync and normal users should never see a fatal permission error.",
    "NEW INSTRUCTION": "WHEN logs show 'Only admin can sync games from sheet' THEN disable auto-sync and gate sync to admins"
}

[2026-04-05 17:08] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Admin-only sync",
    "EXPECTATION": "Automatic sync must not run for non-admin users; normal users should never see an 'Only admin can sync games from sheet' fatal error.",
    "NEW INSTRUCTION": "WHEN logs show 'Only admin can sync games from sheet' THEN disable auto-sync and gate sync to admins"
}

[2026-04-05 18:02] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Desktop swipe behavior",
    "EXPECTATION": "Swipe gestures should only be active on mobile/touch devices; disable swipe on desktop.",
    "NEW INSTRUCTION": "WHEN device lacks touch support or viewport >= 768px THEN disable swipe interactions"
}

[2026-04-05 18:14] - Updated by Junie
{
    "TYPE": "correction",
    "CATEGORY": "Desktop gesture vs click",
    "EXPECTATION": "Only swipe gestures should be disabled on desktop; button clicks must continue to work.",
    "NEW INSTRUCTION": "WHEN disabling desktop swipe interactions THEN do not disable button click handlers"
}

[2026-04-05 20:51] - Updated by Junie
{
    "TYPE": "negative",
    "CATEGORY": "Auth redirect/routing",
    "EXPECTATION": "After completing SpacetimeAuth, the app should route back to the app’s redirect/callback URL and load the home screen when authenticated.",
    "NEW INSTRUCTION": "WHEN login completes but app stays stuck or blank THEN verify Redirect URIs and callback route handling"
}

