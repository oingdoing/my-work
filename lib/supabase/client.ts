import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database, "public">(supabaseUrl, supabaseAnonKey)
    : null;
