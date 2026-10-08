import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://njtwsuwlxbfxvzbmsrzr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHdzdXdseGJmeHZ6Ym1zcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzQ3NjYsImV4cCI6MjEwNjcxMDc2Nn0.x9SgIrKbm6Nt40rO8hIjRSqe3OuIPecX0pj97x1Jq7U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
