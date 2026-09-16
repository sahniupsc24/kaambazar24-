import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mvfgnixsbbbrrquckgng.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZmduaXhzYmJicnJxdWNrZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0ODE3NjIsImV4cCI6MjEwNTA1Nzc2Mn0.bg2Z_4zYZi6WPO0tsSpNl2z9VPfVnMCoNSsgmyUNmSE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
