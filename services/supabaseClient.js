import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseInstance = null;

export const getSupabaseClient = () => {
    if (supabaseInstance) return supabaseInstance;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.warn("Supabase configuration missing in environment variables.");
        return null; // Return null gracefully so app doesn't crash on boot if missing
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    return supabaseInstance;
};
