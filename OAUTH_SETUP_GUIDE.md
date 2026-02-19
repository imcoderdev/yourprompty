# 🔐 OAuth Configuration Guide

## Google OAuth Setup

### 1. Enable Google Provider in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** in the provider list
3. Click **Enable**
4. You'll need to set up Google OAuth credentials

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **YourPrompty**
   - Support email: Your email
   - Authorized domains: `supabase.co`
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **YourPrompty**
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     https://your-domain.com
     ```
   - Authorized redirect URIs:
     ```
     https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
     ```

### 3. Add Credentials to Supabase

1. Copy the **Client ID** and **Client Secret**
2. Go back to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
3. Paste:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`
4. **Redirect URL** (already set): `https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback`
5. Click **Save**

---

## GitHub OAuth Setup

### 1. Enable GitHub Provider in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **GitHub** in the provider list
3. Click **Enable**

### 2. Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   - **Application name**: `YourPrompty`
   - **Homepage URL**: `http://localhost:5173` (or your domain)
   - **Authorization callback URL**: 
     ```
     https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
     ```
4. Click **Register application**

### 3. Add Credentials to Supabase

1. Copy the **Client ID**
2. Click **Generate a new client secret** and copy it
3. Go back to **Supabase Dashboard** → **Authentication** → **Providers** → **GitHub**
4. Paste:
   - **Client ID**: `your-github-client-id`
   - **Client Secret**: `your-github-client-secret`
5. **Redirect URL** (already set): `https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback`
6. Click **Save**

---

## Testing OAuth Locally

### For Local Development (localhost:5173)

You need to add localhost to your OAuth apps:

**Google:**
- Add to Authorized JavaScript origins: `http://localhost:5173`
- Add to Authorized redirect URIs: `https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback`

**GitHub:**
- Authorization callback URL: `https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback`

### Test the Flow

1. Start your dev server: `npm run dev`
2. Open http://localhost:5173
3. Click "Sign Up" or "Sign In"
4. Click "Google" or "GitHub" button
5. Authorize the app in the OAuth popup
6. You'll be redirected back with authentication complete!

---

## How It Works

### OAuth Flow:

```
User clicks "Google" button
    ↓
signInWithGoogle() called
    ↓
Redirects to Google login
    ↓
User authorizes app
    ↓
Google redirects to: 
https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
    ↓
Supabase processes auth tokens
    ↓
Redirects to: http://localhost:5173/#access_token=...
    ↓
AuthCallback component handles tokens
    ↓
User is logged in!
```

### Profile Creation:

When a user signs in with Google/GitHub for the first time:

1. Supabase creates user in `auth.users`
2. **Trigger** `handle_new_user()` fires automatically
3. Creates profile in `profiles` table with:
   - `name` from Google/GitHub
   - `user_id` from email (e.g., `john` from `john@gmail.com`)
   - `email` from OAuth provider
4. User can update their profile later

---

## Customization

### Add More OAuth Providers

Supabase supports:
- ✅ Google (configured)
- ✅ GitHub (configured)  
- Azure
- Facebook
- Twitter
- Discord
- Slack
- ... and more!

To add more, just enable them in Supabase Dashboard and add buttons to AuthModal.

### Custom Scopes

If you need additional OAuth scopes:

```typescript
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'profile email' // Add more scopes
    }
  });
  return { data, error };
}
```

---

## Troubleshooting

### Error: "Redirect URI mismatch"
**Solution**: Make sure the callback URL in Google/GitHub matches exactly:
```
https://eoqmldnhnymbkwewyaqd.supabase.co/auth/v1/callback
```

### Error: "Invalid client ID"
**Solution**: Double-check the Client ID and Client Secret in Supabase Dashboard

### OAuth popup blocked
**Solution**: User needs to allow popups for your site

### Can't sign in with localhost
**Solution**: Add `http://localhost:5173` to authorized origins/URLs in Google/GitHub

### Profile not created after OAuth
**Solution**: Check if `handle_new_user()` trigger exists in database:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Production Deployment

When deploying to production:

1. Update authorized origins/URLs in Google/GitHub to your production domain
2. Update `redirectTo` in authService.ts if needed
3. Test OAuth flow in production environment
4. Monitor Supabase Auth logs for any errors

---

**🎉 OAuth Setup Complete!** Users can now sign in with Google or GitHub with one click!
