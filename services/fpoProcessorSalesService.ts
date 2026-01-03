// Service for FPO to sell to processors
import { supabase } from "./supabaseClient";

export interface FPOSalesOffer {
  id: string;
  fpoId: string;
  fpoName: string;
  cropType: string;
  quantity: number; // in quintals
  quality: 'Organic' | 'Chemical Based';
  pricePerQuintal: number;
  totalValue: number;
  location: { lat: number; lng: number };
  warehouseId?: string;
  warehouseName?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  processorId?: string;
  processorName?: string;
  notes?: string;
}

// In-memory storage (fallback)
let salesOffers: FPOSalesOffer[] = [];

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && !url.includes('your-project') && !key.includes('your-anon-key');
};

// Create a new sales offer from FPO to processors
export const createFPOSalesOffer = async (offer: Omit<FPOSalesOffer, 'id' | 'createdAt' | 'status'>): Promise<FPOSalesOffer> => {
  const newOffer: FPOSalesOffer = {
    ...offer,
    id: `fpo_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  
  // Try to save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('fpo_sales_offers')
        .insert({
          id: newOffer.id,
          fpo_id: newOffer.fpoId,
          fpo_name: newOffer.fpoName,
          crop_type: newOffer.cropType,
          quantity: newOffer.quantity,
          price_per_quintal: newOffer.pricePerQuintal,
          quality: newOffer.quality,
          warehouse_id: newOffer.warehouseId || '',
          warehouse_name: newOffer.warehouseName || '',
          notes: newOffer.notes || null,
          status: 'available',
        })
        .select()
        .single();
      
      if (error) throw error;
      console.log('Sales offer saved to Supabase:', data);
    } catch (error) {
      console.error('Error saving sales offer to Supabase, using local storage:', error);
    }
  }
  
  // Always save to local storage as fallback
  salesOffers.push(newOffer);
  return newOffer;
};

// Get all sales offers (for processors to view)
export const getAllFPOSalesOffers = async (): Promise<FPOSalesOffer[]> => {
  // Try to fetch from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: offers, error } = await supabase
        .from('fpo_sales_offers')
        .select('*')
        .in('status', ['available', 'reserved'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedOffers = (offers || []).map(offer => ({
        id: offer.id,
        fpoId: offer.fpo_id,
        fpoName: offer.fpo_name,
        cropType: offer.crop_type,
        quantity: offer.quantity,
        pricePerQuintal: offer.price_per_quintal,
        quality: offer.quality,
        warehouseId: offer.warehouse_id,
        warehouseName: offer.warehouse_name,
        notes: offer.notes || '',
        status: offer.status === 'available' ? 'pending' : 'accepted',
        createdAt: offer.created_at,
        totalValue: offer.quantity * offer.price_per_quintal,
        location: { lat: 20.2961, lng: 85.8245 }, // Default location
      })) as FPOSalesOffer[];
      
      // Update local cache
      salesOffers = formattedOffers;
      return formattedOffers;
    } catch (error) {
      console.error('Error fetching sales offers from Supabase, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  return salesOffers.filter(offer => offer.status === 'pending' || offer.status === 'accepted');
};

// Get sales offers by FPO ID
export const getFPOSalesOffers = (fpoId: string): FPOSalesOffer[] => {
  return salesOffers.filter(offer => offer.fpoId === fpoId);
};

// Get sales offer by ID
export const getSalesOfferById = (offerId: string): FPOSalesOffer | undefined => {
  return salesOffers.find(offer => offer.id === offerId);
};

// Processor accepts an offer
export const acceptFPOSalesOffer = (offerId: string, processorId: string, processorName: string): FPOSalesOffer | null => {
  const offer = salesOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'pending') return null;
  
  offer.status = 'accepted';
  offer.processorId = processorId;
  offer.processorName = processorName;
  return offer;
};

// Processor rejects an offer
export const rejectFPOSalesOffer = (offerId: string): FPOSalesOffer | null => {
  const offer = salesOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'pending') return null;
  
  offer.status = 'rejected';
  return offer;
};

// Mark offer as completed
export const completeFPOSalesOffer = (offerId: string): FPOSalesOffer | null => {
  const offer = salesOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'accepted') return null;
  
  offer.status = 'completed';
  return offer;
};

// Delete an offer (FPO can delete their own pending offers)
export const deleteFPOSalesOffer = async (offerId: string, fpoId: string): Promise<boolean> => {
  // Try to delete from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('fpo_sales_offers')
        .delete()
        .eq('id', offerId)
        .eq('fpo_id', fpoId)
        .eq('status', 'available');
      
      if (error) throw error;
      console.log('Sales offer deleted from Supabase');
    } catch (error) {
      console.error('Error deleting sales offer from Supabase:', error);
    }
  }
  
  // Always delete from local storage
  const index = salesOffers.findIndex(o => o.id === offerId && o.fpoId === fpoId && o.status === 'pending');
  if (index === -1) return false;
  
  salesOffers.splice(index, 1);
  return true;
};

// Clear all sales offers for a specific FPO (for new account creation)
export const clearFPOSalesOffers = (fpoId: string): void => {
  salesOffers = salesOffers.filter(offer => offer.fpoId !== fpoId);
};

// Clear all sales offers (for complete data cleanup)
export const clearAllFPOSalesOffers = (): void => {
  salesOffers = [];
};




// Real-time subscription for FPO sales offers (for processors)
export const subscribeToSalesOffers = (callback: (offers: FPOSalesOffer[]) => void) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel('fpo_sales_offers_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fpo_sales_offers',
      },
      async (payload) => {
        console.log('Sales offer change detected:', payload);
        // Refresh all offers when any change occurs
        const offers = await getAllFPOSalesOffers();
        callback(offers);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Real-time subscription for a specific FPO's sales offers
export const subscribeToFPOSalesOffers = (fpoId: string, callback: (offers: FPOSalesOffer[]) => void) => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, real-time updates disabled');
    return () => {};
  }

  const channel = supabase
    .channel(`fpo_sales_${fpoId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fpo_sales_offers',
        filter: `fpo_id=eq.${fpoId}`,
      },
      async (payload) => {
        console.log('FPO sales offer change detected:', payload);
        // Fetch updated offers for this FPO
        const { data: offers, error } = await supabase
          .from('fpo_sales_offers')
          .select('*')
          .eq('fpo_id', fpoId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching FPO sales offers:', error);
          return;
        }
        
        const formattedOffers = (offers || []).map(offer => ({
          id: offer.id,
          fpoId: offer.fpo_id,
          fpoName: offer.fpo_name,
          cropType: offer.crop_type,
          quantity: offer.quantity,
          pricePerQuintal: offer.price_per_quintal,
          quality: offer.quality,
          warehouseId: offer.warehouse_id,
          warehouseName: offer.warehouse_name,
          notes: offer.notes || '',
          status: offer.status === 'available' ? 'pending' : offer.status === 'sold' ? 'completed' : 'accepted',
          createdAt: offer.created_at,
          totalValue: offer.quantity * offer.price_per_quintal,
          location: { lat: 20.2961, lng: 85.8245 },
        })) as FPOSalesOffer[];
        
        callback(formattedOffers);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
