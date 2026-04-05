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

