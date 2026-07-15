// SUMINO - Supabase Client Config & Initialization
// Automatically detects env variables or falls back to client-side LocalStorage credentials

// Check local storage for runtime configuration first (bypasses build-time inlining issues)
const runtimeUrl = localStorage.getItem("sumino_supabase_url");
const runtimeKey = localStorage.getItem("sumino_supabase_anon_key");

const supabaseUrl = runtimeUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = runtimeKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

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
