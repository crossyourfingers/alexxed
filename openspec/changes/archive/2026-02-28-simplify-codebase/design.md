# Design: Simplify Codebase

## 1. Consolidate AI Instruction Files

### Current State
Four separate files:
- `.github/copilot-instructions.md` (770 lines) – Copilot
- `AGENTS.md` (762 lines) – Generic agents
- `CLAUDE.md` (770 lines) – Claude
- `.windsurfrules` (770 lines) – Windsurf

### Target State
Keep `CLAUDE.md` as the canonical source (it's the most complete at 770 lines with migration notes).

Delete the others since GitHub Copilot will read `.github/copilot-instructions.md` which is already attached to context, and all major AI tools support reading from a single canonical file referenced in repo root.

Alternative: If tooling requires specific filenames, create `.github/copilot-instructions.md` as a symlink or single-line file that says "See CLAUDE.md".

### Decision
- Keep: `CLAUDE.md` (canonical source)
- Delete: `AGENTS.md`, `.windsurfrules`
- Update: `.github/copilot-instructions.md` to reference `CLAUDE.md` with a single include line

## 2. Extract Shared React Hook

### Current Pattern (Duplicated)
```tsx
// In CommunityPage.tsx, StreamPage.tsx, and App.tsx:
const [onlineUsers] = useTable(
  tables.user.where(r => r.online.eq(true)),
  {
    onInsert: user => {
      const name = user.name || user.identity.toHexString().substring(0, 8);
      setSystemMessages(prev => [...prev, {
        sender: Identity.zero(),
        text: `${name} has connected.`,
        sent: Timestamp.now(),
        channelId: 0n,
      }]);
    },
    onDelete: user => {
      const name = user.name || user.identity.toHexString().substring(0, 8);
      setSystemMessages(prev => [...prev, {
        sender: Identity.zero(),
        text: `${name} has disconnected.`,
        sent: Timestamp.now(),
        channelId: 0n,
      }]);
    },
  }
);
const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
const users = [...onlineUsers, ...offlineUsers];
```

### Target: New Shared Hook
Create `src/hooks/useOnlineUsers.ts`:

```tsx
import { useState } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import type * as Types from '../module_bindings/types';
import { Identity, Timestamp } from 'spacetimedb';

export function useOnlineUsers() {
  const [systemMessages, setSystemMessages] = useState<Types.Message[]>([]);

  const [onlineUsers] = useTable(
    tables.user.where(r => r.online.eq(true)),
    {
      onInsert: user => {
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [...prev, {
          sender: Identity.zero(),
          text: `${name} has connected.`,
          sent: Timestamp.now(),
          channelId: 0n,
        } as Types.Message]);
      },
      onDelete: user => {
        const name = user.name || user.identity.toHexString().substring(0, 8);
        setSystemMessages(prev => [...prev, {
          sender: Identity.zero(),
          text: `${name} has disconnected.`,
          sent: Timestamp.now(),
          channelId: 0n,
        } as Types.Message]);
      },
    }
  );

  const [offlineUsers] = useTable(tables.user.where(r => r.online.eq(false)));
  const allUsers = [...onlineUsers, ...offlineUsers];

  return { onlineUsers, offlineUsers, allUsers, systemMessages };
}
```

### Usage in Pages
```tsx
// CommunityPage.tsx, StreamPage.tsx, App.tsx:
const { onlineUsers, allUsers, systemMessages } = useOnlineUsers();
```

## 3. Fix Feature Flag Usage in App.tsx

### Current State
```tsx
// App.tsx line 12:
const ENABLE_MESSAGE_LIKES = true;  // Hardcoded!
```

### Target State
```tsx
import { ENABLE_MESSAGE_LIKES } from './config/featureFlags';
```

## 4. Consolidate PrettyMessage Type

### Current State
- `src/components/Chat/types.ts` defines `PrettyMessage`
- `src/App.tsx` defines its own `PrettyMessage` type

### Target State
`App.tsx` imports from `src/components/Chat/types.ts`:
```tsx
import { type PrettyMessage } from './components/Chat';
```

## 5. Remove Unused Files

### Files to Delete
1. `alex.excalidraw` – No imports or references found
2. `openspec/plans/add-user-session-metrics.md` – Working notes; change already exists at `openspec/changes/add-user-session-metrics/`

## File Changes Summary

| File | Action |
|------|--------|
| `CLAUDE.md` | Keep (canonical) |
| `AGENTS.md` | Delete |
| `.windsurfrules` | Delete |
| `.github/copilot-instructions.md` | Simplify to reference CLAUDE.md |
| `src/hooks/useOnlineUsers.ts` | Create (new shared hook) |
| `src/pages/CommunityPage.tsx` | Refactor to use hook |
| `src/pages/StreamPage.tsx` | Refactor to use hook |
| `src/App.tsx` | Refactor to use hook + import feature flag + import PrettyMessage type |
| `alex.excalidraw` | Delete |
| `openspec/plans/add-user-session-metrics.md` | Delete |

## Verification Steps

1. Run `npm run dev` and verify app loads
2. Run `npm test` to verify integration tests pass
3. Manual verification:
   - Online user connect/disconnect notifications work
   - Message likes work
   - All three pages (App, CommunityPage, StreamPage) function correctly
