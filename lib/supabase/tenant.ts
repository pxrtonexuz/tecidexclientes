import { createClient as createBrowserClient } from "@supabase/supabase-js";

export type TenantConfig = {
  id: string;
  company_name: string;
  supabase_url: string;
  supabase_anon_key: string;
};

/**
 * Creates a Supabase client connected to the tenant's own database.
 * Called from server components after resolving the tenant config.
 */
export function createTenantClient(config: TenantConfig) {
  return createBrowserClient(config.supabase_url, config.supabase_anon_key);
}

/**
 * Fetches the tenant config from the master Supabase based on the authenticated user id.
 */
export async function getTenantConfig(userId: string): Promise<TenantConfig | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, company_name, supabase_url, supabase_anon_key")
    .eq("owner_id", userId)
    .single();

  if (error || !data) return null;
  return data as TenantConfig;
}
