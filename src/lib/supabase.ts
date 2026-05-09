import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if keys are present to avoid "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
    console.warn("Supabase configuration missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY). Authentication features will be disabled.");
}
