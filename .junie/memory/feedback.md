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

