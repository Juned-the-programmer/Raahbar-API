import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure dotenv is loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase credentials missing in .env file');
  // We don't throw here to avoid crashing the server immediately, 
  // but operations will fail later if not configured.
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
  {
    auth: {
      persistSession: false,
    },
  }
);

// Constants for buckets
export const BUCKETS = {
  RAAHBAR: process.env.SUPABASE_RAAHBAR_BUCKET || 'Raahbar',
  QURAN: process.env.SUPABASE_RAAHBAR_BUCKET || 'Raahbar',
};
