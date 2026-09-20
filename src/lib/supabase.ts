import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

// Creator OS lives in its own schema ("creator_os") inside the shared "Nevorai Tools"
// Supabase project, not in "public" - so it never collides with tables other Nevorai
// apps add to that project. This must match the schema exposed in
// Project Settings -> API -> Exposed schemas.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  { db: { schema: 'creator_os' } },
)
