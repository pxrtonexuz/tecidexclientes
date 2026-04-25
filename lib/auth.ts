import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantConfig, type TenantConfig } from "@/lib/supabase/tenant";

export const getCurrentSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user };
});

export const requireCurrentSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user };
});

export const requireTenantSession = cache(async () => {
  const { user } = await requireCurrentSession();
  const tenant = await getTenantConfig(user.id);
  if (!tenant) redirect("/login?error=no_tenant");
  return { user, tenant: tenant as TenantConfig };
});
