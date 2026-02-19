# OAuth "bad_oauth_state" Error Fix

## Problem
After clicking "Continue with Google" or "Continue with GitHub", you get redirected to:
```
http://localhost:5173/?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+not+found+or+expired
```

## Root Cause
The PKCE (Proof Key for Code Exchange) flow stores a temporary "code verifier" in your browser's localStorage. When this expires or gets lost, the OAuth flow fails with `bad_oauth_state`.

## Solutions

### 1. ✅ Configure Redirect URI in Supabase Dashboard (REQUIRED)

**Go to your Supabase Dashboard:**
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **eoqmldnhnymbkwewyaqd**
3. Go to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add these URLs (one per line):
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/*
   ```
5. Click **Save**

**For production (when deployed):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/*
```

### 2. ✅ Configure OAuth Providers

#### Google OAuth:
1. Go to **Authentication** → **Providers** → **Google**
2. Enable the Google provider
3. Add your Google Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/)
4. In Google Cloud Console → OAuth 2.0 Client IDs → Authorized redirect URIs, add:
   ```
   https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
   ```

#### GitHub OAuth:
1. Go to **Authentication** → **Providers** → **GitHub**
2. Enable the GitHub provider
3. Add your GitHub Client ID and Secret from [GitHub Settings](https://github.com/settings/developers)
4. In GitHub OAuth App settings → Authorization callback URL, add:
   ```
   https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
   ```

### 3. ✅ Browser Settings

Make sure your browser allows:
- **Cookies** (especially third-party cookies for OAuth)
- **Local Storage** (required for PKCE flow)
- **Pop-ups** (if OAuth opens in a popup)

**To check in Chrome:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Local Storage** → `http://localhost:5173`
4. You should see a key like `yourprompty-auth-token` or `sb-eoqmldnhnymbkwewyaqd-auth-token`

### 4. ✅ Clear Cache If Stuck

If you keep getting the error:
```bash
# Clear browser cache and localStorage
1. Open DevTools (F12)
2. Application → Local Storage → Right-click → Clear
3. Application → Session Storage → Right-click → Clear
4. Application → Cookies → Right-click → Clear
5. Refresh the page (Ctrl+R or Cmd+R)
```

## Updated Code Changes

### ✅ App.tsx
Now detects OAuth errors in query parameters:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const hasAuthError = urlParams.has('error') || urlParams.has('error_code');
```

### ✅ AuthCallback.tsx
- Checks for error query parameters before processing
- Provides detailed error messages for `bad_oauth_state`
- Logs full URL, hash, and search params for debugging
- Shows helpful troubleshooting tips on error screen

## Testing the Fix

1. **Clear your browser storage:**
   - DevTools (F12) → Application → Clear all storage
   
2. **Refresh the page:**
   - Close all browser tabs with your app
   - Open a fresh tab and go to `http://localhost:5173`
   
3. **Try OAuth sign-in:**
   - Click "Continue with Google" or "Continue with GitHub"
   - Complete the OAuth flow
   - You should be redirected back and see "Completing Sign In..."
   - Then redirected to home page with your profile loaded

## Still Having Issues?

### Check Console Logs
Open DevTools Console (F12) and look for:
```
Auth callback started
URL: http://localhost:5173/?error=...
Hash: #...
Search params: ?error=...
```

### Check Supabase Logs
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for failed authentication attempts
3. Check if the redirect URI matches what's configured

### Common Mistakes
- ❌ Redirect URI has trailing slash: `http://localhost:5173/auth/callback/` (should not have trailing /)
- ❌ Port mismatch: Using port 3000 instead of 5173
- ❌ HTTPS vs HTTP mismatch in local development
- ❌ OAuth provider credentials not configured in Supabase
- ❌ Google/GitHub OAuth app callback URL doesn't match Supabase URL

## Verification Checklist

- [ ] Redirect URIs configured in Supabase Dashboard
- [ ] Google OAuth provider enabled with valid credentials
- [ ] GitHub OAuth provider enabled with valid credentials
- [ ] Browser allows cookies and localStorage
- [ ] Dev server running on port 5173
- [ ] No typos in redirect URIs (check for trailing slashes)
- [ ] OAuth callback URL in Google/GitHub matches Supabase project URL

## Expected Flow

1. User clicks "Continue with Google"
2. Supabase generates PKCE code verifier → stores in localStorage
3. User redirected to Google OAuth consent screen
4. User approves → Google redirects back to `http://localhost:5173/auth/callback?code=...`
5. Supabase verifies PKCE code verifier from localStorage
6. Session created ✅
7. User redirected to home page

If step 5 fails → `bad_oauth_state` error

## Need More Help?

Check these resources:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [PKCE Flow Explanation](https://supabase.com/docs/guides/auth/server-side/pkce-flow)
