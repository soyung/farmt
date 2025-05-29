// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace with your values from Project Settings -> API
const supabaseUrl = 'https://sruqzkpvtccqrdyyewme.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydXF6a3B2dGNjcXJkeXlld21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNjI1NDQsImV4cCI6MjA1NjYzODU0NH0.HI-aDHzCTfF2_0dPHgKcz7KwJ7L1MulmIMJw0qRgu1M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);