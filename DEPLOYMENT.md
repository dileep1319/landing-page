# Deployment Checklist for Vercel

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup
Before deploying, ensure you have your Supabase credentials ready:

- **VITE_SUPABASE_URL**: Your Supabase project URL
  - Find it in: Supabase Dashboard → Project Settings → API → Project URL
  - Format: `https://xxxxx.supabase.co`

- **VITE_SUPABASE_ANON_KEY**: Your Supabase anonymous/public key
  - Find it in: Supabase Dashboard → Project Settings → API → anon/public key
  - This is safe to expose in frontend code (it's public)

### 2. Code Review
- ✅ No hardcoded secrets or API keys
- ✅ All environment variables use `import.meta.env.VITE_*`
- ✅ `.env` files are in `.gitignore`
- ✅ Build command works locally (`npm run build`)

### 3. Database Setup
- ✅ Run all SQL migrations in Supabase Dashboard
  - `supabase/games-bets.sql`
  - `supabase/users-table.sql`
  - `supabase/registrations.sql`
- ✅ Row Level Security (RLS) policies are enabled
- ✅ Test authentication flow locally

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Supabase integration and prepare for deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"

2. **Import Repository**
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Build Settings** (usually auto-detected)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   - **Name**: `VITE_SUPABASE_URL`
     **Value**: `https://your-project-ref.supabase.co`
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     **Value**: `your-anon-key-here`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### Step 3: Verify Deployment

1. **Check Build Logs**
   - Ensure build completed successfully
   - No errors about missing environment variables

2. **Test the Application**
   - Visit your Vercel URL
   - Test authentication (sign up/login)
   - Test game creation (admin dashboard)
   - Test betting flow (user dashboard)

3. **Check Browser Console**
   - Open DevTools → Console
   - Ensure no errors about Supabase connection

## 🔧 Troubleshooting

### Build Fails with "Missing Supabase environment variables"
- **Solution**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings

### App Works Locally but Not on Vercel
- **Check**: Environment variables are set correctly in Vercel
- **Check**: Supabase project allows requests from your Vercel domain
- **Check**: RLS policies allow public access where needed

### CORS Errors
- **Solution**: In Supabase Dashboard → Settings → API → CORS, add your Vercel domain

## 📝 Post-Deployment

1. **Update README.md** with your live URL
2. **Set up Custom Domain** (optional) in Vercel project settings
3. **Monitor** Vercel Analytics for errors
4. **Test** all features in production environment

## 🔐 Security Notes

- ✅ Never commit `.env` files (already in `.gitignore`)
- ✅ `VITE_SUPABASE_ANON_KEY` is safe to expose (it's public)
- ✅ RLS policies in Supabase protect your data
- ✅ Admin routes are protected by authentication checks


