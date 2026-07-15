// SUMINO - Supabase Client Config & Initialization
// Automatically detects environment variables loaded by Vite

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== "your-supabase-url" &&
  supabaseUrl.trim() !== ""
);

export let supabase = null;

if (isSupabaseConfigured) {
  try {
    // Verify script loaded globally in index.html
    if (window.supabase) {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log("SUMINO: Connected to Supabase Production Backend.");
    } else {
      console.warn("SUMINO: Supabase SDK script not found on window object.");
    }
  } catch (error) {
    console.error("SUMINO: Failed to initialize Supabase client:", error);
  }
} else {
  console.log("SUMINO: Running in Local Offline Sandbox Mode (No API keys provided).");
}
