// src/utils/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// these MUST not be undefined or empty
if (!supabaseUrl)  throw new Error('VITE_SUPABASE_URL is required');
if (!supabaseKey)  throw new Error('VITE_SUPABASE_ANON_KEY is required');

export const supabase = createClient(supabaseUrl, supabaseKey);