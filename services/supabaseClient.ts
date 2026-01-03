import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      farmer_listings: {
        Row: {
          id: string;
          farmer_id: string;
          farmer_name: string;
          crop_name: string;
          quantity: number;
          minimum_price: number;
          quality: 'Organic' | 'Chemical Based';
          location: string;
          expected_harvest_date: string;
          status: 'active' | 'sold' | 'closed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['farmer_listings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['farmer_listings']['Insert']>;
      };
      bids: {
        Row: {
          id: string;
          listing_id: string;
          fpo_id: string;
          fpo_name: string;
          bid_price: number;
          quantity: number;
          message: string | null;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bids']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bids']['Insert']>;
      };
    };
  };
}
