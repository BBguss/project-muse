import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://rmbqmcgmywqjobseklsi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oaL4EeN-KaGJWa-77ZhT8Q_llcp0-V0';

// Inisialisasi Client hanya jika credential ada
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Helper untuk mengecek status koneksi
export const isSupabaseConfigured = () => !!supabase;