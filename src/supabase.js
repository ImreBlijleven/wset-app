import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URLSUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_URLSUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)