import { createClient } from '@supabase/supabase-js';

// Credentials come from environment variables (see .env.example).
// Vite only exposes variables prefixed with VITE_ to the browser.
// The anon key is safe to ship to the client *only* because Row Level
// Security is enabled on every table (see supabase/schema.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env ' +
      'and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
