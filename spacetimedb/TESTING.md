# SpacetimeDB Backend Testing Guide

This guide details how to exercise and verify the SpacetimeDB backend functions (reducers and procedures) using the `spacetime` CLI. Direct CLI testing is the fastest way to verify business logic independently of the frontend.

## Prerequisites

- SpacetimeDB CLI installed and logged in.
- The module must be published to a database (e.g., `alexxed-u3k4f`).

## Core Commands

- **Call a Reducer/Procedure:** `spacetime call <database> <function_name> [args...]`
- **Query Tables (SQL):** `spacetime sql <database> "SELECT * FROM <table_name>"`
- **View Logs:** `spacetime logs <database> --num-lines 100`

---

## 1. Game Voting Testing

### Exercise: Cast an Upvote
Casts an 'up' vote for a specific game ID. Using `--anonymous` generates a new ephemeral identity for each call.

```powershell
# Cast upvote for game ID 2002716
spacetime call alexxed-u3k4f cast_vote 2002716 up --anonymous
```

### Exercise: Update a Vote (Same Identity)
To test updating a vote, you must use the same identity. By default, the CLI uses your authenticated identity.

```powershell
# First, cast an upvote
spacetime call alexxed-u3k4f cast_vote 2002716 up

# Change it to a downvote (must be from the same identity to trigger update)
spacetime call alexxed-u3k4f cast_vote 2002716 down
```

### Exercise: Vote for Non-Existent Game
The backend should create a placeholder game row if the ID is not found.

```powershell
spacetime call alexxed-u3k4f cast_vote 999999 up --anonymous
```

### Verification: Check Votes
Verify that the votes are recorded and counts are aggregated.

```powershell
# Check individual user votes
spacetime sql alexxed-u3k4f "SELECT * FROM user_vote WHERE game_id = 2002716"

# Check aggregated counts
spacetime sql alexxed-u3k4f "SELECT * FROM game_vote_count WHERE game_id = 2002716"
```

---

## 2. Game Sync Testing

### Exercise: Trigger Manual Sync
Synchronizes the game list from the default Google Sheets URL.

```powershell
spacetime call alexxed-u3k4f sync_games_from_sheet ""
```

### Verification: Check Game Table
```powershell
spacetime sql alexxed-u3k4f "SELECT COUNT(*) FROM game"
spacetime sql alexxed-u3k4f "SELECT * FROM game LIMIT 5"
```

---

## 3. User & Social Testing

### Exercise: Set Display Name
```powershell
spacetime call alexxed-u3k4f set_name "Tester"
```

### Exercise: Send Chat Message
```powershell
# Assume channel ID 0 is 'general'
spacetime call alexxed-u3k4f send_message "Hello from the CLI!" 0
```

### Verification: Check Messages
```powershell
spacetime sql alexxed-u3k4f "SELECT * FROM message ORDER BY sent DESC LIMIT 5"
```

---

## Tips for Effective Testing

1. **Deterministic Arguments:** Reducers and procedures in the CLI use **positional arguments**. Pass them in the order they appear in the source code.
2. **Identity Isolation:** Use `--anonymous` to simulate a new user connecting for the first time.
3. **Transaction Inspection:** If a call fails with a "SenderError", check the message returned in the terminal. If it's a panic, check `spacetime logs`.
4. **Data Cleanup:** Use `--clear-database` during `spacetime publish` to reset all tables for a fresh test run.
