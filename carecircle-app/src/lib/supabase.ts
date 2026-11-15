import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xuedgbtguelwqeorhtte.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JNtldLkNBtOrOX6ZMH5vVA_UpvME2YH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
