import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If env vars aren't set (e.g. you haven't created a Supabase project yet),
// this stays null and getPhotos()/getPlaces() fall back to static data.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
