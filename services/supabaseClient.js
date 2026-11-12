import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { onConfigChange } from './settings/runtimeConfig.js';
dotenv.config();

let supabaseInstance = null;

// Rebuild the client after Admin -> System Settings changes the URL or key.
onConfigChange((changedKeys = []) => {
    if (changedKeys.some((k) => k === 'SUPABASE_URL' || k === 'SUPABASE_SERVICE_KEY')) supabaseInstance = null;
});

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
