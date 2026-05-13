import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('oss_demo_mode') === 'true';

if (!supabaseUrl || !supabaseAnonKey) {
    if (!isDemoMode) {
      console.warn("AVISO: Configuração do Supabase ausente. O sistema de autenticação cloud está desativado.");
      console.log("Para ativar: Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no menu 'Settings > Secrets' do AI Studio.");
    }
}

// Only initialize if keys are present to avoid "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
