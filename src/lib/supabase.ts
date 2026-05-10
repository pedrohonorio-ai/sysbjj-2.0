import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO CRÍTICO: Configuração do Supabase ausente!");
    console.log("VITE_SUPABASE_URL:", supabaseUrl ? 'Definido' : 'AUSENTE');
    console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? 'Definido' : 'AUSENTE');
}

// Only initialize if keys are present to avoid "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
