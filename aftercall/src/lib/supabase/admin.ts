import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServiceRoleEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServiceRoleEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
