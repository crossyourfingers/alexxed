# Quick Start: Alexxed Development

## Prerequisites

- Node.js 18+ and pnpm
- SpacetimeDB CLI (`cargo install spacetimedb-cli`)
- SpacetimeAuth credentials (for OIDC login)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start SpacetimeDB Local Server

```bash
spacetime start
```

### 3. Publish Backend Module

```bash
# First time or after schema changes:
spacetime publish alexxed --clear-database -y --module-path spacetimedb

# Subsequent publishes (preserves data):
spacetime publish alexxed --module-path spacetimedb
```

### 4. Generate TypeScript Bindings

```bash
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
```

Or use the npm script:

```bash
pnpm spacetime:generate
```

### 5. Start Frontend Dev Server

```bash
pnpm dev
```

App available at `http://localhost:5173`

## Common Development Tasks

### Making Backend Changes

1. Edit `spacetimedb/src/index.ts`
2. Publish: `spacetime publish alexxed --clear-database -y --module-path spacetimedb`
3. Regenerate bindings: `pnpm spacetime:generate`
4. Update frontend code to use new bindings

### Adding a New Table

```typescript
// In spacetimedb/src/index.ts
const myNewTable = table(
  { 
    name: 'my_new_table',
    public: true,  // or false for private
    indexes: [{ name: 'my_new_table_column', algorithm: 'btree', columns: ['column'] }]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    column: t.string(),
    // ... more fields
  }
);

// Add to schema export
const spacetimedb = schema({ /* existing tables */, myNewTable });
```

### Adding a New Reducer

```typescript
// In spacetimedb/src/index.ts
export const my_reducer = spacetimedb.reducer(
  { param1: t.string(), param2: t.u64() },
  (ctx, { param1, param2 }) => {
    // Validation
    if (!param1) throw new SenderError('param1 required');
    
    // Database operations
    ctx.db.myTable.insert({ id: 0n, value: param1 });
  }
);
```

### Using Tables in Frontend

```tsx
import { useTable } from 'spacetimedb/react';
import { tables } from './module_bindings';

function MyComponent() {
  const [rows, isLoading] = useTable(tables.myNewTable);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ul>
      {rows.map(row => (
        <li key={row.id.toString()}>{row.column}</li>
      ))}
    </ul>
  );
}
```

### Calling Reducers

```tsx
import { useDbConnection } from './module_bindings';

function MyComponent() {
  const conn = useDbConnection();
  
  const handleClick = () => {
    // Object syntax required!
    conn.reducers.myReducer({ param1: 'value', param2: 123n });
  };
  
  return <button onClick={handleClick}>Do Thing</button>;
}
```

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test -- --watch
```

### Run Specific Test File

```bash
pnpm test src/hooks/useChatMessages.test.tsx
```

## Building for Production

### Build Static Site

```bash
pnpm build
```

Output in `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

### Deploy to Maincloud

```bash
# Publish backend
spacetime publish alexxed --module-path spacetimedb --server maincloud

# Build and deploy frontend to your static host
pnpm build
# Upload dist/ to your hosting provider
```

## Environment Configuration

Create `.env.local` for local overrides:

```bash
VITE_SPACETIMEDB_URI=ws://localhost:3000
VITE_DATABASE_NAME=alexxed
VITE_OIDC_AUTHORITY=https://auth.spacetimedb.com
VITE_OIDC_CLIENT_ID=your-client-id
```

## Troubleshooting

### "Connection failed"
- Is SpacetimeDB server running? (`spacetime start`)
- Is module published? (`spacetime publish ...`)
- Check console for CORS errors

### "Table not found" or Type Errors
- Regenerate bindings: `pnpm spacetime:generate`
- Check for TypeScript errors: `pnpm build`

### "Cannot read properties of undefined"
- Index name mismatch? Use exact snake_case from schema
- Check if using `.iter()` (avoid in views, use index lookups)

### Authentication Issues
- Verify OIDC configuration in `.env`
- Check SpacetimeAuth client ID and redirect URIs
- Look for OIDC errors in browser console

## Key Files

| File | Purpose |
|------|---------|
| `spacetimedb/src/index.ts` | Backend schema & reducers |
| `src/module_bindings/` | Generated types (DO NOT EDIT) |
| `src/main.tsx` | App entry, providers |
| `src/auth/authProvider.ts` | OIDC configuration |
| `src/styles/theme.css` | Design tokens |
| `src/config/featureFlags.ts` | Feature toggles |
