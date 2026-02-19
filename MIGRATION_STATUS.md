# 🚀 Supabase Migration - Quick Start Guide

## ✅ What's Complete

### Step 1: Database & Types ✅
- [x] SQL schema created (`supabase-schema.sql`)
- [x] TypeScript types generated (`src/types/supabase-types.ts`)
- [x] All tables with RLS policies
- [x] Auto-triggers for profile creation and counters

### Step 2: Authentication ✅
- [x] Supabase client configured (`src/lib/supabase.ts`)
- [x] Auth context created (`src/contexts/AuthContext.tsx`)
- [x] Auth service functions (`src/services/authService.ts`)
- [x] AuthModal updated (Supabase-only)
- [x] App.tsx updated (removed JWT tokens)
- [x] Environment variables configured

## 🎯 How to Run

### 1. Run SQL Schema
```bash
# In Supabase Dashboard → SQL Editor:
# Copy and paste the entire contents of: supabase-schema.sql
# Click "Run" button
```

### 2. Verify Your .env.local
```bash
# File should have:
VITE_SUPABASE_URL=https://eoqmldnhnymbkwewyaqd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Authentication
1. Open http://localhost:5173
2. Click "Sign Up" - create account
3. Check email for verification link
4. Click verification link
5. Sign in with your credentials
6. You should be logged in!

## 📋 What Still Uses Backend

These features currently still call `http://localhost:4000`:

### PromptFeed (`App.tsx` line ~52)
```typescript
// ❌ Still using backend
fetch(`${baseUrl}/api/prompts`, { headers })
```

### PromptCard (`src/components/PromptCard.tsx` line ~95)
```typescript
// ❌ Still using backend for likes
fetch(`http://localhost:4000/api/prompts/${prompt.id}/like`)
```

### UserProfile (`src/components/UserProfile.tsx`)
```typescript
// ❌ Still using backend
fetch(`${baseUrl}/api/users/me/profile`)
```

### UploadPromptPage (`src/components/UploadPromptPage.tsx`)
```typescript
// ❌ Still using backend + Cloudinary
fetch(`${baseUrl}/api/prompts`, { method: 'POST', body: form })
```

## 🔄 Next Migration Steps

### Step 3: Prompts & Feed (High Priority)
Create `src/services/promptService.ts` with Supabase queries:
```typescript
// Fetch all prompts
export async function getPrompts(filters?: PromptFilters) {
  const query = supabase
    .from('prompts')
    .select(`
      *,
      profiles:user_id (name, user_id, profile_photo)
    `)
    .order('created_at', { ascending: false });
    
  const { data, error } = await query;
  return { data, error };
}

// Like/Unlike prompt
export async function toggleLike(promptId: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  
  // Check if already liked
  const { data: existing } = await supabase
    .from('prompt_likes')
    .select('id')
    .eq('prompt_id', promptId)
    .eq('user_id', user.id)
    .single();
    
  if (existing) {
    // Unlike
    await supabase.from('prompt_likes').delete().eq('id', existing.id);
  } else {
    // Like
    await supabase.from('prompt_likes').insert({
      prompt_id: promptId,
      user_id: user.id,
      user_email: user.email
    });
  }
}
```

### Step 4: Image Upload (Supabase Storage)
Create `src/services/storageService.ts`:
```typescript
export async function uploadPromptImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('prompt-images')
    .upload(fileName, file);
    
  if (error) return { data: null, error };
  
  const { data: { publicUrl } } = supabase.storage
    .from('prompt-images')
    .getPublicUrl(fileName);
    
  return { data: { path: fileName, url: publicUrl }, error: null };
}
```

### Step 5: Edge Functions (for AI)
Create Supabase Edge Function for chatbot:
```bash
supabase functions new chatbot
```

## 🔍 Current Architecture

```
Frontend (React + Vite)
  ├── Auth: Supabase Auth ✅
  ├── Prompts: Node.js Backend ❌
  ├── Images: Cloudinary ❌
  └── AI: Node.js Backend ❌

Target Architecture:
Frontend (React + Vite)
  ├── Auth: Supabase Auth ✅
  ├── Prompts: Supabase Database ⏳
  ├── Images: Supabase Storage ⏳
  └── AI: Edge Functions ⏳
```

## 🐛 Known Issues & Solutions

### Issue: Backend still running?
**Solution**: You can still run backend for now. Auth works independently. Other features will migrate in next steps.

### Issue: Auth working but prompts not loading?
**Expected**: Prompts still use backend. Run `npm run dev` in `server/` folder temporarily.

### Issue: TypeScript errors in components?
**Solution**: Some components may need updates for the new user object shape. Update as needed.

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Database tables & policies |
| `src/types/supabase-types.ts` | TypeScript interfaces |
| `src/lib/supabase.ts` | Supabase client |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/services/authService.ts` | Auth utilities |
| `.env.local` | Environment config |

## 💡 Tips

1. **Keep backend running** for now (prompts, images, etc.)
2. **Migration is incremental** - one feature at a time
3. **Test each feature** after migrating
4. **Check browser console** for any errors
5. **Use Supabase Dashboard** to view data

---

**🎉 Ready to test!** Authentication is fully migrated. Other features coming next!
