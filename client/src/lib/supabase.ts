import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://huiwxfrnxyzuibejdpfk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aXd4ZnJueHl6dWliZWpkcGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjM5ODMsImV4cCI6MjA4OTkzOTk4M30.z1li7sypDdLJvLHr0Wc0sEd31RrSAt5YTH18-PBtvwU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
