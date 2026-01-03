-- KisanSetu Real-time Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create farmer_listings table
CREATE TABLE IF NOT EXISTS public.farmer_listings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  crop_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  minimum_price NUMERIC NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('Organic', 'Chemical Based')),
  location TEXT NOT NULL,
  expected_harvest_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES public.farmer_listings(id) ON DELETE CASCADE,
  fpo_id TEXT NOT NULL,
  fpo_name TEXT NOT NULL,
  bid_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fpo_sales_offers table (for FPO to Processor sales)
CREATE TABLE IF NOT EXISTS public.fpo_sales_offers (
  id TEXT PRIMARY KEY,
  fpo_id TEXT NOT NULL,
  fpo_name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_quintal NUMERIC NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('Organic', 'Chemical Based')),
  warehouse_id TEXT NOT NULL,
  warehouse_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processor_purchases table (when processor buys from FPO)
CREATE TABLE IF NOT EXISTS public.processor_purchases (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES public.fpo_sales_offers(id) ON DELETE CASCADE,
  processor_id TEXT NOT NULL,
  processor_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  agreed_price NUMERIC NOT NULL,
  delivery_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_farmer_listings_farmer_id ON public.farmer_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_listings_status ON public.farmer_listings(status);
CREATE INDEX IF NOT EXISTS idx_farmer_listings_created_at ON public.farmer_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON public.bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_fpo_id ON public.bids(fpo_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fpo_sales_offers_fpo_id ON public.fpo_sales_offers(fpo_id);
CREATE INDEX IF NOT EXISTS idx_fpo_sales_offers_status ON public.fpo_sales_offers(status);
CREATE INDEX IF NOT EXISTS idx_fpo_sales_offers_created_at ON public.fpo_sales_offers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processor_purchases_offer_id ON public.processor_purchases(offer_id);
CREATE INDEX IF NOT EXISTS idx_processor_purchases_processor_id ON public.processor_purchases(processor_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.farmer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpo_sales_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processor_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allowing all operations for simplicity

-- Farmer Listings Policies
CREATE POLICY "Allow all to read farmer listings" ON public.farmer_listings
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert farmer listings" ON public.farmer_listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update farmer listings" ON public.farmer_listings
  FOR UPDATE USING (true);

-- Bids Policies
CREATE POLICY "Allow all to read bids" ON public.bids
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert bids" ON public.bids
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update bids" ON public.bids
  FOR UPDATE USING (true);

-- FPO Sales Offers Policies
CREATE POLICY "Allow all to read fpo sales offers" ON public.fpo_sales_offers
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert fpo sales offers" ON public.fpo_sales_offers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update fpo sales offers" ON public.fpo_sales_offers
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete fpo sales offers" ON public.fpo_sales_offers
  FOR DELETE USING (true);

-- Processor Purchases Policies
CREATE POLICY "Allow all to read processor purchases" ON public.processor_purchases
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert processor purchases" ON public.processor_purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update processor purchases" ON public.processor_purchases
  FOR UPDATE USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fpo_sales_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processor_purchases;

-- Create a function to automatically update listing status when bid is accepted
CREATE OR REPLACE FUNCTION update_listing_status_on_bid_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Update the listing status to 'sold'
    UPDATE public.farmer_listings
    SET status = 'sold'
    WHERE id = NEW.listing_id;
    
    -- Reject all other bids for this listing
    UPDATE public.bids
    SET status = 'rejected'
    WHERE listing_id = NEW.listing_id AND id != NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bid acceptance
DROP TRIGGER IF EXISTS trigger_update_listing_on_bid_accept ON public.bids;
CREATE TRIGGER trigger_update_listing_on_bid_accept
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_status_on_bid_accept();

-- Create a function to update offer status when processor purchases
CREATE OR REPLACE FUNCTION update_offer_status_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    -- Update the offer status to 'sold'
    UPDATE public.fpo_sales_offers
    SET status = 'sold'
    WHERE id = NEW.offer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processor purchase
DROP TRIGGER IF EXISTS trigger_update_offer_on_purchase ON public.processor_purchases;
CREATE TRIGGER trigger_update_offer_on_purchase
  AFTER UPDATE ON public.processor_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_offer_status_on_purchase();
