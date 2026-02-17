// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace with your values from Project Settings -> API
const supabaseUrl = 'https://xmysqbfuihialtvbsshb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhteXNxYmZ1aWhpYWx0dmJzc2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTk0MTEsImV4cCI6MjA4Njc3NTQxMX0.XObG3tb7agaKW7ZW63OrxR5a1GCX_SqQvQdFPzytues';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);