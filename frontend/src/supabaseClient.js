import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dsnzxbtilooyuumpnyzv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbnp4YnRpbG9veXV1bXBueXp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA0OTA3MiwiZXhwIjoyMDk4NjI1MDcyfQ.q9XpUF_RGMYVFEN9YOcC3ivpCjw38clpZsePgyBPkpw';

export const supabase = createClient(supabaseUrl, supabaseKey);


