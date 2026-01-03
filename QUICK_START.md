# Quick Start Guide - Real-time Bidding Setup

## ✅ What's Already Done

Your project now has:
- ✅ Supabase client installed and configured
- ✅ Real-time bidding between Farmers and FPOs
- ✅ Real-time sales offers between FPOs and Processors
- ✅ Complete database schema ready to deploy
- ✅ Fallback to local storage if Supabase not configured
- ✅ TypeScript types updated
- ✅ Build successful

## 🚀 3-Step Setup (5 minutes)

### Step 1: Create Supabase Tables (2 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL Editor
5. Click **Run** button
6. You should see "Success. No rows returned"

### Step 2: Enable Realtime (1 minute)

1. In Supabase, go to **Database** → **Replication**
2. Find these 4 tables and toggle them ON:
   - ✅ `farmer_listings`
   - ✅ `bids`
   - ✅ `fpo_sales_offers`
   - ✅ `processor_purchases`

### Step 3: Add Environment Variables to Vercel (2 minutes)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 2 variables (for Production, Preview, and Development):

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL (from Supabase → Settings → API)
   - Example: `https://xxxxx.supabase.co`

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (from Supabase → Settings → API)
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Click **Save**
5. Go to **Deployments** tab
6. Click the 3 dots on your latest deployment → **Redeploy**

## 🎉 That's It!

Your real-time bidding is now live! Test it:

### Test Real-time Bidding:

1. Open your deployed app in **2 different browsers** (or use incognito)
2. **Browser 1**: Login as Farmer
3. **Browser 2**: Login as FPO
4. **Farmer**: Create a new crop listing
5. **FPO**: Watch it appear instantly! (no refresh needed)
6. **FPO**: Place a bid
7. **Farmer**: Watch the bid appear instantly!
8. **Farmer**: Accept the bid
9. **FPO**: Watch status change to "accepted" instantly!

### Test Real-time Sales:

1. **Browser 1**: Login as FPO
2. **Browser 2**: Login as Processor
3. **FPO**: Go to "Sell to Processor" tab, create an offer
4. **Processor**: Watch it appear instantly!

## 📱 How to Find Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API**
5. Copy:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`

## 🔍 Troubleshooting

### "Real-time not working"
- Open browser console (F12)
- Look for "Supabase not configured" message
- Check that environment variables are set in Vercel
- Make sure you redeployed after adding env vars

### "Tables don't exist"
- Go to Supabase → Table Editor
- Check if tables exist: `farmer_listings`, `bids`, `fpo_sales_offers`
- If not, run the SQL schema again

### "Still not working"
- Check Supabase → Database → Replication
- Make sure all 4 tables have replication enabled
- Check browser console for errors
- Check Supabase → Logs for any errors

## 📚 More Information

- Full setup guide: `SUPABASE_SETUP.md`
- Implementation details: `REALTIME_IMPLEMENTATION_SUMMARY.md`
- Database schema: `supabase-schema.sql`

## 💡 Features

✅ **Instant Updates** - No page refresh needed
✅ **Multi-device** - Works across different devices/browsers  
✅ **Automatic Status** - Bids auto-update listing status
✅ **Fallback Mode** - Works without Supabase (local storage)
✅ **Production Ready** - Includes security policies and indexes

## 🎯 What Happens in Real-time

### Farmer creates listing
→ Saved to Supabase
→ FPOs see it instantly on their dashboard

### FPO places bid
→ Saved to Supabase
→ Farmer sees it instantly on their bidding page

### Farmer accepts bid
→ Bid status updated
→ Listing marked as "sold"
→ Other bids auto-rejected
→ FPO sees "accepted" status instantly

### FPO creates sales offer
→ Saved to Supabase
→ Processors see it instantly

All of this happens **without any page refresh**! 🚀
