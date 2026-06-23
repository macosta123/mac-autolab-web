import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://yaulskpxxlgbnlpzkcll.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdWxza3B4eGxnYm5scHprY2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDA4MDQsImV4cCI6MjA5NjAxNjgwNH0.zAw1eS7tZWGNlXkcJQfEfevvHi98ozk1-s8Z8_9WcbY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
