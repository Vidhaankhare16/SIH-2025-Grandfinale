import { FarmerListing, Bid } from "../types";
import { supabase } from "./supabaseClient";

// In-memory storage (fallback if Supabase is not configured)
let farmerListings: FarmerListing[] = [];
let allBids: Map<string, Bid[]> = new Map(); // Map of listingId -> bids

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && !url.includes('your-project') && !key.includes('your-anon-key');
};

// Function to clear all bidding data (for new account creation)
export const clearAllBiddingData = (): void => {
  farmerListings = [];
  allBids.clear();
};

export const createFarmerListing = async (listing: Omit<FarmerListing, 'id' | 'createdAt' | 'bids' | 'status'>): Promise<FarmerListing> => {
  const newListing: FarmerListing = {
    ...listing,
    id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    bids: [],
    status: 'active',
  };
  
  // Try to save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('farmer_listings')
        .insert({
          id: newListing.id,
          farmer_id: newListing.farmerId,
          farmer_name: newListing.farmerName,
          crop_name: newListing.cropName,
          quantity: newListing.quantity,
          minimum_price: newListing.minimumPrice,
          quality: newListing.quality,
          location: newListing.location,
          expected_harvest_date: newListing.expectedHarvestDate,
          status: newListing.status,
        })
        .select()
        .single();
      
      if (error) throw error;
      console.log('Listing saved to Supabase:', data);
    } catch (error) {
      console.error('Error saving to Supabase, using local storage:', error);
    }
  }
  
  // Always save to local storage as fallback
  farmerListings.push(newListing);
  allBids.set(newListing.id, []);
  return newListing;
};

export const getAllListings = async (): Promise<FarmerListing[]> => {
  // Try to fetch from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: listings, error: listingsError } = await supabase
        .from('farmer_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (listingsError) throw listingsError;
      
      // Fetch bids for each listing
      const listingsWithBids = await Promise.all(
        (listings || []).map(async (listing) => {
          const { data: bids, error: bidsError } = await supabase
            .from('bids')
            .select('*')
            .eq('listing_id', listing.id)
            .order('created_at', { ascending: false });
          
          if (bidsError) console.error('Error fetching bids:', bidsError);
          
          return {
            id: listing.id,
            farmerId: listing.farmer_id,
            farmerName: listing.farmer_name,
            cropName: listing.crop_name,
            quantity: listing.quantity,
            minimumPrice: listing.minimum_price,
            quality: listing.quality,
            location: listing.location,
            expectedHarvestDate: listing.expected_harvest_date,
            status: listing.status,
            createdAt: listing.created_at,
            bids: (bids || []).map(bid => ({
              id: bid.id,
              fpoId: bid.fpo_id,
              fpoName: bid.fpo_name,
              bidPrice: bid.bid_price,
              quantity: bid.quantity,
              message: bid.message || '',
              status: bid.status,
              createdAt: bid.created_at,
            })),
          } as FarmerListing;
        })
      );
      
      // Update local cache
      farmerListings = listingsWithBids;
      return listingsWithBids;
    } catch (error) {
      console.error('Error fetching from Supabase, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  return farmerListings
    .filter(listing => listing.status === 'active')
    .map(listing => ({
      ...listing,
      bids: allBids.get(listing.id) || [],
    }));
};

export const getFarmerListings = (farmerId: string): FarmerListing[] => {
  return farmerListings
    .filter(listing => listing.farmerId === farmerId)
    .map(listing => ({
      ...listing,
      bids: allBids.get(listing.id) || [],
    }));
};

export const getListingById = (listingId: string): FarmerListing | null => {
  const listing = farmerListings.find(l => l.id === listingId);
  if (!listing) return null;
  
  return {
    ...listing,
    bids: allBids.get(listingId) || [],
  };
};

export const createBid = async (listingId: string, bid: Omit<Bid, 'id' | 'createdAt' | 'status'>): Promise<Bid> => {
  // Cap bid price at 25,000 per quintal
  const cappedBidPrice = Math.min(bid.bidPrice, 25000);
  
  const newBid: Bid = {
    id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...bid,
    bidPrice: cappedBidPrice,
  };
  
  // Try to save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bids')
        .insert({
          id: newBid.id,
          listing_id: listingId,
          fpo_id: newBid.fpoId,
          fpo_name: newBid.fpoName,
          bid_price: newBid.bidPrice,
          quantity: newBid.quantity,
          message: newBid.message || null,
          status: newBid.status,
        })
        .select()
        .single();
      
      if (error) throw error;
      console.log('Bid saved to Supabase:', data);
    } catch (error) {
      console.error('Error saving bid to Supabase, using local storage:', error);
    }
  }
  
  // Always save to local storage as fallback
  const listingBids = allBids.get(listingId) || [];
  listingBids.push(newBid);
  allBids.set(listingId, listingBids);
  
  // Update listing
  const listing = farmerListings.find(l => l.id === listingId);
  if (listing) {
    listing.bids = listingBids;
  }
  
  return newBid;
};

export const acceptBid = (listingId: string, bidId: string): boolean => {
  const listing = farmerListings.find(l => l.id === listingId);
  const listingBids = allBids.get(listingId) || [];
  const bid = listingBids.find(b => b.id === bidId);
  
  if (!listing || !bid) return false;
  
  // Accept the bid
  bid.status = 'accepted';
  
  // Reject other bids
  listingBids
    .filter(b => b.id !== bidId)
    .forEach(b => b.status = 'rejected');
  
  // Close the listing
  listing.status = 'sold';
  listing.bids = listingBids;
  
  return true;
};

export const rejectBid = (listingId: string, bidId: string): boolean => {
  const listingBids = allBids.get(listingId) || [];
  const bid = listingBids.find(b => b.id === bidId);
  if (!bid) return false;
  
  bid.status = 'rejected';
  const listing = farmerListings.find(l => l.id === listingId);
  if (listing) {
    listing.bids = listingBids;
  }
  
  return true;
};

export const getFPOBids = (fpoId: string): Bid[] => {
  const allBidsList: Bid[] = [];
  allBids.forEach((bids) => {
    allBidsList.push(...bids.filter(bid => bid.fpoId === fpoId));
  });
  return allBidsList;
};

export const closeListing = (listingId: string): boolean => {
  const listing = farmerListings.find(l => l.id === listingId);
  if (!listing) return false;
  
  listing.status = 'closed';
  return true;
};



// Real-time subscription for farmer listings
export const subscribeToListings = (callback: (listings: FarmerListing[]) => void) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel('farmer_listings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'farmer_listings',
      },
      async (payload) => {
        console.log('Listing change detected:', payload);
        // Refresh all listings when any change occurs
        const listings = await getAllListings();
        callback(listings);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Real-time subscription for bids on a specific listing
export const subscribeToBids = (listingId: string, callback: (bids: Bid[]) => void) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel(`bids_${listingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `listing_id=eq.${listingId}`,
      },
      async (payload) => {
        console.log('Bid change detected:', payload);
        // Fetch updated bids for this listing
        const { data: bids, error } = await supabase
          .from('bids')
          .select('*')
          .eq('listing_id', listingId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching bids:', error);
          return;
        }
        
        const formattedBids = (bids || []).map(bid => ({
          id: bid.id,
          fpoId: bid.fpo_id,
          fpoName: bid.fpo_name,
          bidPrice: bid.bid_price,
          quantity: bid.quantity,
          message: bid.message || '',
          status: bid.status,
          createdAt: bid.created_at,
        })) as Bid[];
        
        callback(formattedBids);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Real-time subscription for all bids (for FPO dashboard)
export const subscribeToAllBids = (callback: () => void) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel('all_bids_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bids',
      },
      (payload) => {
        console.log('Bid change detected (all):', payload);
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
