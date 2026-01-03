# Supabase Real-time Setup Guide for KisanSetu

This guide will help you set up real-time bidding and sales offers between Farmers, FPOs, and Processors.

## Prerequisites

- A Supabase project (create one at https://supabase.com if you haven't)
- Your project is deployed on Vercel

## Step 1: Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL Editor and click **Run**

This will create:
- `farmer_listings` table - stores farmer crop listings
- `bids` table - stores FPO bids on farmer listings
- `fpo_sales_offers` table - stores FPO offers to processors
- `processor_purchases` table - stores processor purchases from FPOs
- Indexes for better performance
- Row Level Security policies
- Real-time subscriptions
- Automatic triggers for status updates

## Step 2: Enable Realtime in Supabase

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Make sure the following tables have replication enabled:
   - `farmer_listings`
   - `bids`
   - `fpo_sales_offers`
   - `processor_purchases`

## Step 3: Get Your Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key under "Project API keys")

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Click **Save**

## Step 5: Redeploy Your Application

1. Go to **Deployments** in Vercel
2. Click on the three dots next to your latest deployment
3. Click **Redeploy**

## How Real-time Works

### Farmer → FPO Bidding Flow

1. **Farmer creates a listing** on the Bidding page
   - Listing is saved to Supabase `farmer_listings` table
   - All FPOs see the new listing instantly via real-time subscription

2. **FPO places a bid** on the listing
   - Bid is saved to Supabase `bids` table
   - Farmer sees the new bid instantly on their Bidding page

3. **Farmer accepts/rejects bid**
   - Bid status is updated in Supabase
   - FPO sees the status change instantly
   - If accepted, listing status automatically changes to "sold"
   - Other bids are automatically rejected

### FPO → Processor Sales Flow

1. **FPO creates a sales offer** from their warehouse
   - Offer is saved to Supabase `fpo_sales_offers` table
   - All Processors see the new offer instantly

2. **Processor views and purchases** the offer
   - Purchase is recorded in `processor_purchases` table
   - FPO sees the purchase instantly
   - Offer status automatically updates to "sold"

## Testing Real-time Functionality

### Test Farmer-FPO Bidding:

1. Open the app in two different browsers (or incognito mode)
2. Login as **Farmer** in one browser
3. Login as **FPO** in another browser
4. **Farmer**: Create a new listing
5. **FPO**: You should see the listing appear immediately without refreshing
6. **FPO**: Place a bid on the listing
7. **Farmer**: You should see the bid appear immediately without refreshing
8. **Farmer**: Accept the bid
9. **FPO**: You should see the bid status change to "accepted" immediately

### Test FPO-Processor Sales:

1. Open the app in two different browsers
2. Login as **FPO** in one browser
3. Login as **Processor** in another browser
4. **FPO**: Go to "Sell to Processor" tab and create a sales offer
5. **Processor**: You should see the offer appear immediately
6. **Processor**: Purchase the offer
7. **FPO**: You should see the status change immediately

## Troubleshooting

### Real-time not working?

1. **Check Supabase connection**:
   - Open browser console (F12)
   - Look for messages like "Supabase not configured"
   - Verify environment variables are set correctly in Vercel

2. **Check Realtime is enabled**:
   - Go to Supabase Dashboard → Database → Replication
   - Ensure all tables have replication enabled

3. **Check browser console**:
   - Look for real-time subscription messages
   - Should see "Listing change detected" or "Bid change detected" when changes occur

4. **Verify data is being saved**:
   - Go to Supabase Dashboard → Table Editor
   - Check if data appears in the tables when you create listings/bids

### Fallback Mode

If Supabase is not configured, the app will work in **local storage mode**:
- Data is stored in browser memory
- No real-time updates between devices
- Data is lost on page refresh
- Useful for development/testing without Supabase

## Security Notes

The current setup uses **public access policies** for simplicity. For production:

1. Implement proper authentication (Supabase Auth)
2. Update RLS policies to restrict access based on user roles
3. Add user authentication to the app
4. Restrict operations based on user identity

Example secure policy:
```sql
-- Only allow farmers to create their own listings
CREATE POLICY "Farmers can create own listings" ON public.farmer_listings
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in Dashboard → Logs
3. Verify all environment variables are set correctly
4. Ensure the SQL schema was executed successfully
