import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let cachedClient: SupabaseClient<Database, "public"> | null = null;

export const getSupabaseAdmin = () => {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = createClient<Database, "public">(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
};
