import spacetimedb from "./db";

// Re-export spacetimedb as default (required for the module entry point)
export default spacetimedb;

// Export all modular components (reducers, procedures, views)
// This ensures they are registered with the spacetimedb instance
export * from "./reducers/auth";
export * from "./reducers/community";
export * from "./reducers/library";
export * from "./reducers/voting";
