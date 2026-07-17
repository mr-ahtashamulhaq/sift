// Supabase client — only used for auth state listening (no direct DB calls from frontend)
// All data goes through our FastAPI backend which uses the service key

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mukpwanbaqwmfuiyzqev.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export { SUPABASE_URL, SUPABASE_ANON_KEY };
