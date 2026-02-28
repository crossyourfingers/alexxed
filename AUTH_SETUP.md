# Authentication Setup Guide

This app uses SpacetimeAuth (OIDC) for authentication, with an abstraction layer that allows easy switching to other OAuth2 providers.

## SpacetimeAuth Setup (Current)

### 1. Create a SpacetimeAuth Project

1. Go to https://spacetimedb.com
2. Navigate to the Auth Dashboard
3. Click "Create Project"
4. Name your project (e.g., "Alexxed Chat")

### 2. Configure Your Client

1. In your project, go to the default client settings
2. Add redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production URL (e.g., `https://yourapp.azurestaticapps.net`)
3. Add post-logout redirect URIs (same URLs as above)
4. Copy your **Client ID**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Client ID:
   ```env
   VITE_SPACETIMEAUTH_CLIENT_ID=your_actual_client_id_here
   ```

### 4. Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Click "Sign In" - you'll be redirected to SpacetimeAuth
3. Create an account or sign in
4. You'll be redirected back to your app

### 5. View Users in Dashboard

- Go to https://spacetimedb.com
- Navigate to your Auth Dashboard
- You should see registered users in the "Users" tab

## Switching to Another OAuth2 Provider

The authentication is abstracted in `src/auth/authProvider.ts`. To switch providers:

### Option A: Auth0

1. Install Auth0 SDK if needed
2. Update `src/auth/authProvider.ts`:
   ```typescript
   export const ACTIVE_AUTH_CONFIG = AUTH0_CONFIG;
   ```
3. Set environment variables:
   ```env
   VITE_AUTH0_DOMAIN=your-tenant.auth0.com
   VITE_AUTH0_CLIENT_ID=your_client_id
   ```

### Option B: Clerk

1. Install Clerk SDK
2. Update `src/auth/authProvider.ts`:
   ```typescript
   export const ACTIVE_AUTH_CONFIG = CLERK_CONFIG;
   ```
3. Set environment variables

### Option C: Custom Provider

1. Add your provider config to `authProvider.ts`
2. Implement any provider-specific logic in `useAuth.tsx`
3. Update `ACTIVE_AUTH_CONFIG`

## Architecture

```
src/auth/
├── authProvider.ts   # Provider configurations and abstraction
└── useAuth.tsx       # Auth hook that wraps OIDC library

src/
├── main.tsx          # OIDC provider setup
└── LoginForm.tsx     # UI for authentication
```

The abstraction allows you to switch OAuth2 providers by changing one line in `authProvider.ts` and updating environment variables.

## Troubleshooting

**"Client ID is empty"**
- Make sure `.env` exists and has `VITE_SPACETIMEAUTH_CLIENT_ID`
- Restart your dev server after changing `.env`

**"Redirect URI mismatch"**
- Check that your redirect URIs in SpacetimeAuth dashboard match exactly
- Include both `http://localhost:5173` and production URL

**Users not appearing in dashboard**
- Make sure you're using the correct SpacetimeAuth project
- Check that `VITE_SPACETIMEAUTH_CLIENT_ID` matches your project's client ID
