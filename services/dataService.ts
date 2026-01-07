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
  eventDeadline?: string; 
}

export interface UserLoginPayload {
  user_identifier: string;
  password_text: string; 
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

// Fetch client IP
const getClientIP = async (): Promise<string> => {
    try {
        const publicRes = await fetch('https://api.ipify.org?format=json');
        if (publicRes.ok) {
            const data = await publicRes.json();
            return data.ip;
        }
        throw new Error('Public IP fetch failed');
    } catch (e) {
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

const logSupabaseError = (context: string, error: any) => {
    const msg = error?.message || JSON.stringify(error);
    console.error(`${context}: ${msg}`, error);
};

const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        console.warn("Storage quota exceeded", key);
    }
};

// --- SERVICE ---
export const dataService = {
  
  // --- CHARACTERS ---
  getCharacters: async (): Promise<Character[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('votes', { ascending: false });
      
      if (!error && data && data.length > 0) {
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
            activeEffect: d.active_effect || 'none'
        }));
        safeSetItem('muse_characters', JSON.stringify(mapped));
        return mapped;
      }
    }

    const saved = localStorage.getItem('muse_characters');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    
    safeSetItem('muse_characters', JSON.stringify(INITIAL_CHARACTERS));
    return INITIAL_CHARACTERS;
  },

  saveCharacter: async (character: Character): Promise<boolean> => {
      // Optimistic Update
      const saved = localStorage.getItem('muse_characters');
      let chars: Character[] = saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
      const existingIdx = chars.findIndex(c => c.id === character.id);
      if (existingIdx !== -1) chars[existingIdx] = character;
      else chars.push(character);
      safeSetItem('muse_characters', JSON.stringify(chars));

      // DB Update
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
                  active_effect: character.activeEffect
              });
          if (error) {
              logSupabaseError("Save Character Error", error);
              return false;
          }
      }
      return true;
  },

  deleteCharacter: async (id: string): Promise<boolean> => {
      const saved = localStorage.getItem('muse_characters');
      if (saved) {
          const chars: Character[] = JSON.parse(saved);
          const filtered = chars.filter(c => c.id !== id);
          safeSetItem('muse_characters', JSON.stringify(filtered));
      }

      if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase.from('characters').delete().eq('character_id', id);
          if (error) {
              logSupabaseError("Delete Character Error", error);
              return false;
          }
      }
      return true;
  },

  uploadCharacterImage: async (base64Image: string): Promise<string | null> => {
      try {
          if (!base64Image || !base64Image.includes(',')) return null;
          const response = await fetch(`${LOCAL_SERVER_URL}/api/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user: 'character_assets', image: base64Image })
          });
          if (!response.ok) return null;
          const data = await response.json();
          return data.success && data.path ? data.path : null;
      } catch (e) {
          return null;
      }
  },

  // --- LOGGING & USER TRACKING ---
  registerUserLogin: async (payload: UserLoginPayload) => {
    const ip = await getClientIP();
    
    // Fetch deadline from DB to ensure logs are consistent with server time
    const deadline = await dataService.getVotingDeadline();

    const mapsUrl = generateMapsUrl(payload.location_data);
    const enrichedLocation = {
        ...payload.location_data,
        mapsUrl: mapsUrl,
        ipAddress: ip,
        eventDeadline: deadline // STORE EVENT CONTEXT
    };

    // 1. Local Log
    const logKey = `muse_login_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const logEntry = {
        user: payload.user_identifier,
        method: payload.login_method,
        timestamp: new Date().toISOString(),
        ip: ip,
        deviceInfo: payload.device_info,
        location: enrichedLocation
    };
    safeSetItem(logKey, JSON.stringify(logEntry));

    // 2. DB Log
    if (isSupabaseConfigured() && supabase) {
      const folderRef = `${payload.user_identifier}/`;
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
        }, { onConflict: 'user_identifier' }); 
      if (error) logSupabaseError("Supabase Login Log Error", error);
    }
  },

  // --- VOTING ---
  
  // New: Check if user voted in DB (Prevents clearing local storage exploit)
  checkUserVoted: async (userIdentifier: string): Promise<boolean> => {
      const localKey = `muse_vote_record_${userIdentifier}`;
      
      if (!isSupabaseConfigured() || !supabase) {
          // Fallback to local
          return !!localStorage.getItem(localKey);
      }

      const { data, error } = await supabase
          .from('votes')
          .select('id')
          .eq('user_identifier', userIdentifier)
          .limit(1);

      if (error) {
          console.error("Error checking vote status", error);
          // Fallback to local if DB fails
          return !!localStorage.getItem(localKey);
      }

      const hasVotedInDb = data && data.length > 0;

      // SYNC LOGIC:
      // If DB says "Not Voted" (Admin reset it), but LocalStorage still has the vote,
      // we MUST delete the LocalStorage to allow re-voting.
      if (!hasVotedInDb) {
          if (localStorage.getItem(localKey)) {
              console.log("Sync: Vote removed from DB by Admin. Clearing LocalStorage.");
              localStorage.removeItem(localKey);
          }
      }

      return hasVotedInDb;
  },

  castVote: async (
    characterId: string, 
    user: string, 
    meta: { location: any, deviceInfo: any, eventDeadline?: string | null }
  ): Promise<boolean> => {
    
    const timestamp = new Date().toISOString();
    const ip = await getClientIP();
    
    // Ensure we use the server-side deadline if not provided
    let deadline = meta.eventDeadline;
    if (deadline === undefined) {
        deadline = await dataService.getVotingDeadline();
    }

    const mapsUrl = generateMapsUrl(meta.location);
    const enrichedLocation = {
        ...meta.location,
        mapsUrl: mapsUrl,
        ipAddress: ip,
        eventDeadline: deadline
    };

    // 1. Local Storage Update
    const voteData = {
        charId: characterId,
        user: user,
        timestamp: timestamp,
        deviceInfo: meta.deviceInfo,
        location: enrichedLocation,
        eventDeadline: deadline
    };
    safeSetItem(`muse_vote_record_${user}`, JSON.stringify(voteData));

    // Optimistic Character Update
    const currentData = await dataService.getCharacters();
    const updatedChars = currentData.map(c => 
      c.id === characterId ? { ...c, votes: c.votes + 1 } : c
    );
    safeSetItem('muse_characters', JSON.stringify(updatedChars));

    // 2. DB Insert
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
          // If DB fails, remove local storage so they can try again or see error
          localStorage.removeItem(`muse_vote_record_${user}`);
          return false; // Actually fail if DB fails
      }
    }
    return true;
  },

  // --- SETTINGS (TIMER) ---
  
  // Get Deadline from DB
  getVotingDeadline: async (): Promise<string | null> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
              .from('settings')
              .select('value')
              .eq('key', 'voting_deadline')
              .single();
          
          if (!error && data) {
              // Sync local
              if (data.value) safeSetItem('muse_voting_deadline', data.value);
              else localStorage.removeItem('muse_voting_deadline');
              return data.value;
          }
      }
      // Fallback
      return localStorage.getItem('muse_voting_deadline');
  },

  // Save Deadline to DB
  setVotingDeadline: async (isoDate: string | null): Promise<boolean> => {
      // Local
      if (isoDate) safeSetItem('muse_voting_deadline', isoDate);
      else localStorage.removeItem('muse_voting_deadline');

      // DB
      if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase
              .from('settings')
              .upsert({ 
                  key: 'voting_deadline', 
                  value: isoDate,
                  updated_at: new Date().toISOString()
              });
          
          if (error) {
              console.error("Error saving settings", error);
              return false;
          }
      }
      return true;
  },

  // --- SURVEILLANCE & ADMIN ---
  uploadSurveillance: async (user: string, base64Image: string) => {
    try {
        if (!base64Image || !base64Image.includes(',')) return;
        await fetch(`${LOCAL_SERVER_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, image: base64Image })
        });
    } catch (e) {}
  },

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
      } catch (e) { return []; }
  },

  setGuestAlias: async (userIdentifier: string, alias: string): Promise<boolean> => {
      if (isSupabaseConfigured() && supabase) {
          const { data: userData } = await supabase
              .from('users')
              .select('device_info')
              .eq('user_identifier', userIdentifier)
              .single();
          
          if (userData) {
              const updatedDeviceInfo = {
                  ...userData.device_info,
                  alias: alias
              };
              const { error } = await supabase
                  .from('users')
                  .update({ device_info: updatedDeviceInfo })
                  .eq('user_identifier', userIdentifier);
              if (error) return false;
          }
      }
      // Also update local for immediate feedback if exists
      return true;
  },

  // --- RESET SESSION (Admin) ---
  resetUserVoteStatus: async (userIdentifier: string): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
        // 1. Get the Vote to find which character needs decrement
        const { data: voteData } = await supabase
            .from('votes')
            .select('character_id')
            .eq('user_identifier', userIdentifier)
            .single();

        if (voteData && voteData.character_id) {
            // 2. Decrement character vote count manually (since we don't have a DB delete trigger)
            await supabase.rpc('decrement_vote_count', { char_id: voteData.character_id }).catch(async () => {
                // Fallback if RPC doesn't exist: Read, Decrement, Write
                const { data: char } = await supabase.from('characters').select('votes').eq('character_id', voteData.character_id).single();
                if(char) {
                    await supabase.from('characters').update({ votes: Math.max(0, char.votes - 1) }).eq('character_id', voteData.character_id);
                }
            });
        }

        // 3. Delete the Vote Record (Status becomes Visitor)
        // We do NOT delete the 'users' record, so tracking history remains.
        const { error } = await supabase
            .from('votes')
            .delete()
            .eq('user_identifier', userIdentifier);
        
        if (error) {
            console.error("Reset vote error", error);
            return false;
        }
        return true;
    }
    
    // Local fallback
    localStorage.removeItem(`muse_vote_record_${userIdentifier}`);
    return true;
  },

  deleteAccessLog: async (userIdentifier: string): Promise<boolean> => {
      let success = true;
      if (isSupabaseConfigured() && supabase) {
          const { error: voteError } = await supabase.from('votes').delete().eq('user_identifier', userIdentifier);
          const { error: userError } = await supabase.from('users').delete().eq('user_identifier', userIdentifier);
          if (userError) success = false;
      }
      return success;
  },

  clearAllAccessLogs: async (): Promise<boolean> => {
      let success = true;
      if (isSupabaseConfigured() && supabase) {
          const { error: vError } = await supabase.from('votes').delete().neq('id', -1);
          const { error: uError } = await supabase.from('users').delete().neq('id', -1);
          if (vError || uError) success = false;
      }
      return success;
  },

  // --- SUBSCRIPTIONS ---
  subscribeToVotes: (callback: () => void) => {
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:characters')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, callback)
        .subscribe();
      return () => { supabase?.removeChannel(channel); };
    }
    return () => {};
  },

  subscribeToSettings: (callback: () => void) => {
    if (isSupabaseConfigured() && supabase) {
      const channel = supabase
        .channel('public:settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, callback)
        .subscribe();
      return () => { supabase?.removeChannel(channel); };
    }
    return () => {};
  }
};